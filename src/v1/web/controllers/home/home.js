// model
const path = require('path');
const { ObjectId } = require('mongoose').Types;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// models
const {
  Product, Cart, Draw, Booking, Order, Quantity,
} = require('../../../models');

// helpers
const { validateAddToCart } = require('./home.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError, generateOrderId } = require('../../../../helpers/utils');
const { getAllProducts, getOrderData, getCartData } = require('./home.service');

module.exports = {

  getProducts: async (req, res, next) => {
    try {
      const [products] = await getAllProducts(req);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        products,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  createOrder: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { id } = user;
      const { data, drawId } = body;

      const currentDate = new Date();
      const { error } = validateAddToCart(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const getDraw = await commonService.findOneById(Draw, drawId);
      if (!getDraw) return respondFailure(res, req.__(localeKeys.product.DRAW_NOT_FOUND), StatusCode.NOT_FOUND);
      if (getDraw.date < currentDate) return respondFailure(res, req.__(localeKeys.product.DRAW_EXPIRED), StatusCode.FORBIDDEN);

      const productIdArray = data.map((elem) => elem.productId);
      const getProducts = await commonService.findAllByFields(Product, { _id: { $in: productIdArray } });
      if (getProducts.length !== productIdArray.length) return respondFailure(res, req.__(localeKeys.product.PRODUCT_NOT_FOUND), StatusCode.FORBIDDEN);

      const productCostMap = new Map();
      getProducts.forEach((product) => {
        productCostMap.set(String(product._id), product.cost);
      });

      const result = data.map((item) => {
        const productCost = productCostMap.get(item.productId);
        const itemsToCalculate = Math.floor(item.items.length / 3) * 2 + (item.items.length % 3); // Calculate price for 2 out of every 3 items
        return {
          productId: item.productId,
          quantity: item.items.length,
          stripeQuantity: itemsToCalculate,
          ticketNumbers: item.items,
          cost: productCost * itemsToCalculate,
        };
      });

      const totalCost = result.reduce((accumulator, item) => accumulator + item.cost, 0);
      await commonService.insertIfNotExists(Cart, { userId: id }, { $set: { drawId, products: result, totalCost } });
      return respondSuccess(
        res,
        req.__(localeKeys.product.ORDER_CREATED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getOrder: async (req, res, next) => {
    try {
      const { id } = req.user;
      const orderData = await getOrderData(id);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        orderData,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getDrawList: async (req, res, next) => {
    try {
      const drawList = await commonService.findAllByFields(Draw, { isCompleted: constValues.status.ACTIVE }, { _id: 1, name: { $concat: ['$drawName', ' ', '$drawNo'] } }, { date: -1 });
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        drawList,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  purchaseOrder: async (req, res, next) => {
    try {
      const { protocol, user } = req;
      const { id } = user;

      const [getUserCart] = await getCartData(id);
      if (!getUserCart) return respondFailure(res, req.__(localeKeys.product.CART_NOT_FOUND), StatusCode.NOT_FOUND);
      const { totalCost, _id, data } = getUserCart;
      const transactionId = generateOrderId();

      const bookingObj = {
        userId: id,
        totalPrice: totalCost,
        taxAmount: (5 / 100) * totalCost,
        transactionId,
      };

      const bookingData = await commonService.save(Booking, bookingObj);
      const session = await stripe.checkout.sessions.create({
        line_items: data,
        mode: 'payment',
        metadata: {
          cartId: String(_id),
          transactionId,
        },
        success_url: `${protocol}://${req.get('host')}/payment?id=${transactionId}`,
        cancel_url: `${protocol}://${req.get('host')}/payment?id=${transactionId}`,
      });
      bookingData.paymentIntent = session.id;
      await bookingData.save();
      const redirectUrl = session.url;

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        redirectUrl,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getPaymentStatus: async (req, res, next) => {
    try {
      const { query } = req;
      console.log(req.query, 'query');
      // eslint-disable-next-line camelcase
      const { id } = query;
      let file;

      const bookingData = await commonService.findOneByFields(Booking, { transactionId: id });
      console.log(bookingData);
      const { paymentStatus } = bookingData;
      const link = process.env.GETLUCKY_URL;
      switch (paymentStatus) {
        case 1:
          file = 'payment/success.ejs';
          break;
        case 0:
          file = 'payment/failed.ejs';
          break;
        default:
          file = 'payment/failed.ejs';
      }
      return res.render(path.join(__dirname, `../../../../templates/${file}`), { link });
    } catch (err) {
      return next(respondError(err.message, StatusCode.INTERNAL_SERVER_ERROR));
    }
  },

  webhooks: async (req, res) => {
    let event;
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(err, '⚠️  Webhook signature verification failed.');
      return respondFailure(res, '', constValues.StatusCode.BAD_REQUEST);
    }

    const dataObject = event.data.object;
    console.log('===========', event.type, '==============');
    console.log(dataObject);
    console.log('=========================================');

    switch (event.type) {
      case 'checkout.session.completed': {
        const bookingData = {};
        let { cartId } = dataObject.metadata;
        const { transactionId } = dataObject.metadata;
        const totalAmount = dataObject.amount_total;
        const paymentStatus = dataObject.status;
        if (paymentStatus !== 'complete') return true;
        cartId = ObjectId(cartId);
        console.log(cartId, transactionId);

        const cartData = await Cart.findOne({ _id: cartId }).lean();
        console.log(cartData);
        const { products } = cartData;

        const orderData = {
          userId: cartData.userId,
          drawId: cartData.drawId,
          totalCost: cartData.totalCost,
        };

        if (dataObject.payment_status === 'paid') {
          orderData.status = constValues.status.ACTIVE;
          bookingData.userPaid = totalAmount / 100;
          bookingData.paymentStatus = constValues.paymentStatus.SUCCESS;
          await Cart.deleteMany({ userId: cartData.userId });
        }

        const orderDetails = await new Order(orderData).save();
        const { _id, userId } = orderDetails;
        bookingData.orderId = _id;
        console.log(userId, transactionId);
        const updateData = await Booking.updateOne({ userId, transactionId }, { $set: bookingData });
        console.log(updateData);
        const quantityData = products.map((elem) => ({
          orderId: _id,
          productId: elem.productId,
          quantity: elem.quantity,
          cost: elem.cost,
          ticketNumbers: elem.ticketNumbers,
        }));

        await Quantity.insertMany(quantityData);
        break;
      }
      case 'charge.failed': {
        const failedIntent = dataObject.id;
        if (!failedIntent) break;
        await Booking.updateOne({ paymentIntent: failedIntent }, { paymentStatus: constValues.paymentStatus.FAILED });
        break;
      }
      case 'charge.expired': {
        const expiredIntent = dataObject.id;
        if (!expiredIntent) break;
        await Booking.updateOne({ paymentIntent: expiredIntent }, { paymentStatus: constValues.paymentStatus.FAILURE });
        break;
      }
      default:
        // eslint-disable-next-line no-console
        console.log('unhandled event...');
    }
    return respondSuccess(res, '', StatusCode.OK);
  },

};

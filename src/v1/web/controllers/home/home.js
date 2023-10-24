// model
const moment = require('moment');
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
const { getMessageFromValidationError } = require('../../../../helpers/utils');
const {
  getHomePage, getAllProducts, getOrderData, getCartData,
} = require('./home.service');

module.exports = {

  getHomePage: async (req, res, next) => {
    try {
      const homeDetails = await getHomePage(req);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        homeDetails,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

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
      if (getDraw.date <= currentDate) return respondFailure(res, req.__(localeKeys.product.DRAW_EXPIRED), StatusCode.FORBIDDEN);

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

  purchaseOrder: async (req, res, next) => {
    try {
      const { protocol, user } = req;
      const { id, email } = user;
      let stripeEmailObj = {};

      const [getUserCart] = await getCartData(id);
      if (!getUserCart) return respondFailure(res, req.__(localeKeys.product.CART_NOT_FOUND), StatusCode.NOT_FOUND);
      const {
        totalCost, _id, data, drawId,
      } = getUserCart;

      const currentDate = new Date();
      const getDraw = await commonService.findOneById(Draw, drawId);
      if (getDraw.date <= currentDate) return respondFailure(res, req.__(localeKeys.product.DRAW_EXPIRED), StatusCode.FORBIDDEN);

      if (email !== '') stripeEmailObj = { receipt_email: email };
      const bookingObj = {
        userId: id,
        date: currentDate,
        totalPrice: totalCost,
        taxAmount: (5 / 100) * totalCost,
      };

      const expireTime = moment().add(35, 'minutes');
      const sessionExpireDate = expireTime.unix();

      const bookingData = await commonService.save(Booking, bookingObj);
      const { transactionId } = bookingData;
      const session = await stripe.checkout.sessions.create({
        line_items: data,
        mode: 'payment',
        metadata: {
          cartId: String(_id),
          transactionId,
        },
        payment_intent_data: {
          setup_future_usage: 'off_session',
          ...stripeEmailObj,
        },
        expires_at: sessionExpireDate,
        success_url: `${protocol}://${req.get('host')}/ticket-view?id=${transactionId}`,
        cancel_url: `${protocol}://${req.get('host')}/ticket-view?id=${transactionId}`,
      });
      if (!session) return respondFailure(res, req.__(localeKeys.product.PAYMENT_ERROR), StatusCode.INTERNAL_SERVER_ERROR);
      await commonService.updateById(Booking, bookingData._id, { $set: { paymentIntent: session.id } });
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
        if (!cartData) return true;
        console.log(cartData);
        const { products } = cartData;

        if (dataObject.payment_status === 'paid') {
          const orderData = {
            userId: cartData.userId,
            drawId: cartData.drawId,
            date: new Date(),
            totalCost: cartData.totalCost,
          };
          const orderDetails = await new Order(orderData).save();
          const { _id, userId } = orderDetails;

          const quantityData = products.map((elem) => ({
            orderId: _id,
            productId: elem.productId,
            quantity: elem.quantity,
            cost: elem.cost,
            ticketNumbers: elem.ticketNumbers,
          }));
          await Quantity.insertMany(quantityData);

          bookingData.orderId = _id;
          bookingData.userPaid = totalAmount / 100;
          bookingData.paymentStatus = constValues.paymentStatus.SUCCESS;

          await Booking.updateOne({ userId, transactionId }, { $set: bookingData });
          await Cart.deleteMany({ userId: cartData.userId });
        }
        break;
      }
      case 'checkout.session.expired': {
        const failedIntent = dataObject.id;
        if (!failedIntent) break;
        await Booking.updateOne({ paymentIntent: failedIntent }, { paymentStatus: constValues.paymentStatus.FAILED });
        break;
      }
      default:
        console.log('unhandled event...');
    }
    return respondSuccess(res, '', StatusCode.OK);
  },

};

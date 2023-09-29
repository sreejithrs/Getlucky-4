// model
const path = require('path');
const {
  Product, Cart, Draw, Booking, Order, Quantity,
} = require('../../../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// helpers
const { validateAddToCart } = require('./home.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError } = require('../../../../helpers/utils');
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
      // const orderData = {
      //   userId: id,
      //   drawId,
      //   totalCost,
      // };

      await commonService.insertIfNotExists(Cart, { userId: id }, { $set: { drawId, products: result, totalCost } });
      // const quantityData = result.map((item) => ({
      //   ...item,
      //   cartId: cartDetails._id,
      // }));

      // await Quantity.create(quantityData);
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
      const { id } = req.user;

      const [getUserCart] = await getCartData(id);
      if (!getUserCart) return respondFailure(res, req.__(localeKeys.product.CART_NOT_FOUND), StatusCode.NOT_FOUND);
      const { totalCost, _id, data } = getUserCart;

      const bookingObj = {
        cartId: _id,
        userId: id,
        totalPrice: totalCost,
        taxAmount: (5 / totalCost) * 100,
      };

      await commonService.save(Booking, bookingObj);
      const session = await stripe.checkout.sessions.create({
        line_items: data,
        mode: 'payment',
        metadata: {
          cartId: String(_id),
        },
        success_url: `${process.env.GETLUCKY_URL}/payment`,
        cancel_url: `${process.env.GETLUCKY_URL}/payment`,
      });
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
      // eslint-disable-next-line camelcase
      const { session_id } = query;
      let file;

      const session = await stripe.checkout.sessions.retrieve(session_id);
      const paymentStatus = session.status;
      const link = process.env.GETLUCKY_URL;
      switch (paymentStatus) {
        case 'succeeded':
          file = 'payment/success.ejs';
          break;
        case 'requires_payment_method':
          file = 'payment/failed.ejs';
          break;
        default:
          file = 'payment/failed.ejs';
      }
      return res.render(path.join(__dirname, `../../../../templates/${file}`), { link });
    } catch (err) {
      return next(respondError(err.message, constValues.StatusCode.INTERNAL_SERVER_ERROR));
    }
  },

  webhooks: async (req, res) => {
    let event;
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err, '⚠️  Webhook signature verification failed.');
      return respondFailure(res, '', constValues.StatusCode.BAD_REQUEST);
    }

    const dataObject = event.data.object;
    // eslint-disable-next-line no-console
    console.log('===========', event.type, '==============');
    // eslint-disable-next-line no-console
    console.log(dataObject);
    // eslint-disable-next-line no-console
    console.log('=========================================');

    switch (event.type) {
      case 'checkout.session.completed': {
        const paymentIntent = dataObject.payment_intent;
        const { cartId } = dataObject.metadata;
        const totalAmount = dataObject.amount_total;
        const paymentStatus = dataObject.status;
        if (paymentStatus !== 'complete' || cartId) break;

        const cartData = await commonService.findOneAndDelete(Cart, { _id: cartId });

        const orderData = {
          userId: cartData.userId,
          drawId: cartData.drawId,
          totalCost: cartData.totalCost,
          status: constValues.status.ACTIVE,
        };

        const orderDetails = await commonService.save(Order, orderData);
        const { _id, userId } = orderDetails._id;
        const { products } = cartData;

        const quantityData = products.map((elem) => ({
          orderId: _id,
          productId: elem.productId,
          quantity: elem.quantity,
          cost: elem.cost,
          ticketNumbers: elem.ticketNumbers,
        }));

        await commonService.insertMany(Quantity, quantityData);
        const bookingData = {
          orderId: _id,
          userPaid: totalAmount,
          paymentStatus: constValues.paymentStatus.SUCCESS,
          paymentIntent,
        };
        await commonService.updateOneByFields(Booking, { userId, cartId }, { $set: bookingData });
        break;
      }
      case 'charge.failed': {
        const failedIntent = dataObject.payment_intent;
        if (!failedIntent) break;
        await Booking.updateOne(
          { paymentIntent: failedIntent },
          { status: true, paymentStatus: constValues.paymentStatus.FAILURE },
        );
        break;
      }
      case 'charge.expired': {
        const expiredIntent = dataObject.payment_intent;
        await Booking.updateOne(
          { paymentIntent: expiredIntent },
          { status: true, paymentStatus: constValues.paymentStatus.FAILURE },
        );
        break;
      }
      // case 'payment_intent.payment_failed':
      //   await cancelSubscriptionData(dataObject.id);
      //   break;
      default:
        // eslint-disable-next-line no-console
        console.log('unhandled event...');
    }
    return respondSuccess(res, '', constValues.StatusCode.OK);
  },

};

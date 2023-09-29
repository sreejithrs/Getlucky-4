// model
const {
  Product, Cart, Draw, Booking,
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

      const getUserCart = await getCartData(id);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: '{{PRICE_ID}}',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: process.env.PAYMENT_REDIRECT,
        cancel_url: process.env.PAYMENT_REDIRECT,
      });

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
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
      case 'charge.succeeded': {
        const paymentIntent = dataObject.payment_intent;
        const { cartId } = dataObject.metadata;
        if (!cartId) break;
        const cartData = await Cart.findByIdAndDelete(cartId);
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

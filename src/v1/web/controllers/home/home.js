// model
const { Product, Order, Quantity } = require('../../../models');

// helpers
const { validateCreateOrder } = require('./home.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const { getMessageFromValidationError } = require('../../../../helpers/utils');
const { getPlay } = require('./home.service');

module.exports = {

  getProducts: async (req, res, next) => {
    try {
      const [products] = await getPlay();
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

      const { error } = validateCreateOrder(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const productIdArray = data.map((elem) => elem.productId);
      const getProducts = await commonService.findAllByFields(Product, { _id: { $in: productIdArray } });
      if (getProducts.length !== productIdArray.length) return respondFailure(res, req.__(localeKeys.product.PRODUCT_NOT_FOUND), StatusCode.FORBIDDEN);

      const productCostMap = new Map();
      getProducts.forEach((product) => {
        productCostMap.set(String(product._id), product.cost);
      });

      const result = data.map((item) => {
        const productCost = productCostMap.get((item.productId));
        const cost = productCost * item.items.length;
        return {
          productId: item.productId,
          quantity: item.quantity,
          pin: item.items,
          cost,
        };
      });

      const totalCost = result.reduce((accumulator, item) => accumulator + item.cost, 0);
      const orderData = {
        userId: id,
        drawId,
        totalCost,
      };

      const orderDetails = await new Order(orderData).save();
      const quantityData = result.map((item) => ({
        ...item,
        orderId: orderDetails._id,
      }));

      await new Quantity(quantityData).save();
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

};

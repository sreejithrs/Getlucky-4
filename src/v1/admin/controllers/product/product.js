// model
const { Product } = require('../../../models');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const { validateAddProduct, validateUpdateProduct } = require('./product.validator');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const { getMessageFromValidationError, uploadFileCode, deleteFileFromS3 } = require('../../../../helpers/utils');

module.exports = {

  getAllProducts: async (req, res, next) => {
    try {
      const products = await commonService.findAllByFields(Product, {});
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, products);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  addProduct: async (req, res, next) => {
    try {
      const { files, body } = req;

      const { error } = validateAddProduct(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      if (!files || !files.image) return respondFailure(res, req.__(localeKeys.upload.PLEASE_UPLOAD_FILE), StatusCode.BAD_REQUEST);
      const uploadImage = await uploadFileCode(files.image, 'product');
      if (!uploadImage) return respondFailure(res, req.__(localeKeys.upload.FAILED_TO_UPLOAD_FILE), StatusCode.INTERNAL_SERVER_ERROR);

      body.image = uploadImage;
      await commonService.save(Product, body);
      return respondSuccess(res, req.__(localeKeys.global.ADDED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const { params } = req;
      const { productId } = params;

      const product = await commonService.findOneById(Product, productId);
      if (!product) return respondFailure(res, req.__(localeKeys.product.PRODUCT_NOT_FOUND), StatusCode.NOT_FOUND);

      await commonService.deleteOneByFields(Product, { _id: productId });
      process.nextTick(() => deleteFileFromS3(product.image));
      return respondSuccess(res, req.__(localeKeys.global.DELETED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const { params, body } = req;
      const { productId } = params;

      const { error } = validateUpdateProduct(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const product = await commonService.findOneById(Product, productId);
      if (!product) return respondFailure(res, req.__(localeKeys.product.PRODUCT_NOT_FOUND), StatusCode.NOT_FOUND);

      if (req.files) {
        const uploadImage = await uploadFileCode(req.files.image, 'product');
        if (!uploadImage) return respondFailure(res, req.__(localeKeys.upload.FAILED_TO_UPLOAD_FILE), StatusCode.INTERNAL_SERVER_ERROR);
        body.image = uploadImage;
        process.nextTick(() => deleteFileFromS3(product.image));
      }

      await commonService.updateById(Product, productId, body);
      return respondSuccess(res, req.__(localeKeys.global.UPDATED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};

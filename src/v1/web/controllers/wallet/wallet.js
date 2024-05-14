// modules
const moment = require('moment');

// models
const {
  User, WalletHistory, Bank, Draw, Booking, Cart, Order, Quantity,
} = require('../../../models');

// helpers
const { validateSendWithdrawRequest, validateUpdateSendWithdrawRequest, validateWalletTransactions } = require('./wallet.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError, uploadPDF } = require('../../../../helpers/utils');
const { getWalletTransactions } = require('./wallet.service');
const { generateInvoicePDF, getPDFInvoiceData, getTicketDetails } = require('../user/user.service');
const { sendMail } = require('../../../../helpers/notification');
const { sendTicket } = require('../../../../templates/emailTemplate');

module.exports = {

  getUserWallet: async (req, res, next) => {
    try {
      const { user } = req;
      const { wallet } = user;

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        { wallet },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  sendWithdrawRequest: async (req, res, next) => {
    try {
      const { user, body } = req;
      const { amount, paymentMethod, bankId } = body;
      const { id, wallet, isWesternUnionAdded } = user;

      const { error } = validateSendWithdrawRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      if (wallet < amount) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.PAYMENT_REQUIRED);
      if (paymentMethod === 'westernUnion' && !isWesternUnionAdded) return respondFailure(res, req.__(localeKeys.user.WESTERN_UNION_NOT_ADDED), StatusCode.NOT_FOUND);

      const bankCheck = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (paymentMethod === 'bank' && !bankCheck) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);
      const userData = await commonService.findOneAndUpdateFields(User, { _id: id }, { $inc: { wallet: -amount, amountOnHold: amount } });

      const withdrawData = {
        userId: id,
        amount,
        balance: userData.wallet,
        paymentMethod,
        date: new Date(),
        paymentStatus: constValues.paymentStatus.PENDING,
        type: constValues.paymentCategoryCode.WALLET_WITHDRAW,
      };

      if (bankId) withdrawData.bankId = bankId;
      await new WalletHistory(withdrawData).save();
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

  updateWalletRequest: async (req, res, next) => {
    try {
      const { user, body } = req;
      const {
        updateId, amount, paymentMethod, bankId,
      } = body;
      const { id, wallet } = user;
      let dataToSet = {};

      const { error } = validateUpdateSendWithdrawRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const walletData = await commonService.findOneById(WalletHistory, { _id: updateId, userId: id });
      if (!walletData) return respondFailure(res, req.__(localeKeys.global.NOT_FOUND), StatusCode.NOT_FOUND);
      if (walletData.paymentStatus !== constValues.paymentStatus.PENDING) return respondFailure(res, req.__(localeKeys.global.UPDATE_FAILED), StatusCode.BAD_REQUEST);

      const availableBalance = wallet + walletData.amount;
      if (amount > availableBalance) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.PAYMENT_REQUIRED);

      dataToSet = {
        paymentMethod,
        amount,
      };
      if (bankId) dataToSet.bankId = bankId;
      await commonService.updateById(WalletHistory, updateId, { $set: dataToSet });
      if (walletData.amount === amount) return respondSuccess(res, req.__(localeKeys.global.UPDATED_SUCCESSFULLY), StatusCode.OK);

      const setAmount = amount - walletData.amount;
      await commonService.updateById(User, id, { $inc: { wallet: -setAmount, amountOnHold: setAmount } });
      return respondSuccess(
        res,
        req.__(localeKeys.global.UPDATED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  deleteWalletRequest: async (req, res, next) => {
    try {
      const { user, params } = req;
      const { deleteId } = params;
      const { id } = user;

      const walletData = await commonService.findOneById(WalletHistory, { _id: deleteId, userId: id });
      if (!walletData) return respondFailure(res, req.__(localeKeys.global.NOT_FOUND), StatusCode.NOT_FOUND);
      if (walletData.paymentStatus !== constValues.paymentStatus.PENDING) return respondFailure(res, req.__(localeKeys.global.UPDATE_FAILED), StatusCode.BAD_REQUEST);

      const setAmount = walletData.amount;
      await commonService.updateById(User, id, { $inc: { wallet: setAmount, amountOnHold: -setAmount } });
      await commonService.deleteOneByFields(WalletHistory, { _id: deleteId });
      return respondSuccess(
        res,
        req.__(localeKeys.global.DELETED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  walletTransactions: async (req, res, next) => {
    try {
      const { query } = req;

      const { error } = validateWalletTransactions(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const data = await getWalletTransactions(req);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        data,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  walletPurchaseOrder: async (req, res, next) => {
    try {
      const { user, protocol } = req;
      const { id, email, wallet } = user;

      const cartData = await Cart.findOne({ userId: id }).lean();
      if (!cartData) return respondFailure(res, req.__(localeKeys.product.CART_NOT_FOUND), StatusCode.NOT_FOUND);
      const { products, totalActualCost, totalCost } = cartData;

      if (totalCost > wallet) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.BAD_REQUEST);

      const currentDate = new Date();
      const drawData = await commonService.findOneById(Draw, cartData.drawId);
      if (drawData.date <= currentDate) return respondFailure(res, req.__(localeKeys.product.DRAW_EXPIRED), StatusCode.FORBIDDEN);

      const orderData = {
        userId: cartData.userId,
        drawId: cartData.drawId,
        date: new Date(),
        totalCost: cartData.totalCost,
      };
      const orderDetails = await new Order(orderData).save();
      const { _id, ticketId } = orderDetails;

      const quantityData = products.map((elem) => ({
        orderId: _id,
        productId: elem.productId,
        quantity: elem.quantity,
        cost: elem.cost,
        actualCost: elem.actualCost,
        ticketNumbers: elem.ticketNumbers,
      }));
      await Quantity.insertMany(quantityData);

      const userData = await commonService.findOneAndUpdateFields(User, { _id: id }, { $inc: { wallet: -totalCost } });

      const bookingObj = {
        orderId: _id,
        userId: id,
        balance: userData.wallet,
        date: currentDate,
        userPaid: totalCost,
        paymentStatus: constValues.paymentStatus.SUCCESS,
        totalPrice: totalActualCost,
        discount: totalActualCost - totalCost,
        type: constValues.paymentCategoryCode.WALLET_PURCHASE,
        taxAmount: (5 / 100) * totalCost,
      };

      const bookingData = await commonService.save(Booking, bookingObj);
      const { transactionId } = bookingData;

      Promise.resolve().then(async () => {
        await Cart.deleteMany({ userId: id });
        const [bookingDetails] = await getTicketDetails(transactionId);
        bookingDetails.purchaseDate = moment(bookingDetails.purchaseDate).format('DD-MMM-YYYY');

        const dataToSend = {
          ...bookingDetails,
          link: process.env.GETLUCKY_URL,
          url: process.env.AWS_S3_URL,
          ticketDownload: `${process.env.GETLUCKY_URL}/download-ticket/${transactionId}`,
          pdfDownload: `${process.env.GETLUCKY_URL}/invoice/${transactionId}`,
        };

        const emailOptions = {
          email,
          ticketId,
          drawDate: moment(drawData.date).format('DD-MMM-YYYY'),
          dataToSend,
        };
        if (email !== '') process.nextTick(() => sendMail(sendTicket(emailOptions)));

        const [invoiceData] = await getPDFInvoiceData(transactionId);
        const pdfBuffer = await generateInvoicePDF(invoiceData);
        const date = moment().format('MM-YYYY');
        const fileName = `invoice-${date}/${invoiceData.invoiceId}`;
        uploadPDF(pdfBuffer, fileName);
      });

      const redirectUrl = `${protocol}://${req.get('host')}/ticket-view/${transactionId}`;
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
};

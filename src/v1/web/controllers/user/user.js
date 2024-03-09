// modules
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
// models
const {
  User, Cart, Booking, Quantity, Order, Winner, Bank,
} = require('../../../models');

// helpers
const {
  validateUpdateProfile, validateUpdatePassword, validateChangeEmail, validateUpdateEmail, validateAddBank,
  validateUpdateBank, validateAddWesternUnion,
} = require('./user.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError, generate4DigitOTP } = require('../../../../helpers/utils');
const { sendMail } = require('../../../../helpers/notification');
const { changeEmail } = require('../../../../templates/emailTemplate');
const {
  getUserTickets, getUserTransactions, getPDFInvoiceData, getTicketDetails, takeScreenShot, generateInvoicePDF,
} = require('./user.service');

module.exports = {

  getProfile: async (req, res, next) => {
    try {
      const { id } = req.user;
      const userData = await commonService.findOneById(User, id);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        _.pick(userData, ['email', 'name', 'phoneNumber', 'building', 'country', 'state', 'district']),
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updatePassword: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { oldPassword, password } = body;
      const { id } = user;

      const { error } = validateUpdatePassword(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userData = await commonService.includePasswordById(User, id);

      const checkPassword = await userData.comparePassword(oldPassword);
      if (!checkPassword) return respondFailure(res, req.__(localeKeys.auth.PASSWORD_NOT_MATCHED), StatusCode.FORBIDDEN);

      const checkSamePassword = await userData.comparePassword(password);
      if (checkSamePassword) return respondFailure(res, req.__(localeKeys.auth.SAME_PASSWORD), StatusCode.CONFLICT);

      userData.password = password;
      await userData.save();
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

  updateProfile: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { id } = user;

      const { error } = validateUpdateProfile(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      await commonService.updateById(User, id, { $set: body });
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

  deleteAccount: async (req, res, next) => {
    try {
      const { id } = req.user;
      await commonService.deleteOneByFields(User, { _id: id });
      await commonService.deleteOneByFields(Cart, { userId: id });
      await commonService.delete(Booking, { userId: id });
      await commonService.delete(Winner, { userId: id });

      const getAllOrders = await commonService.findAllByFields(Order, { userId: id });
      const orderIdArray = getAllOrders.map((elem) => elem._id);

      await commonService.delete(Quantity, { orderId: { $in: orderIdArray } });
      await commonService.delete(Order, { userId: id });
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

  changeEmailRequest: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { id, name } = user;
      const { email } = body;

      const { error } = validateChangeEmail(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const checkEmail = await commonService.findOneByFields(User, { email });
      if (checkEmail) return respondFailure(res, req.__(localeKeys.user.EMAIL_EXISTS), StatusCode.CONFLICT);

      const otp = generate4DigitOTP();
      const emailOptions = {
        email, otp, name,
      };

      await commonService.updateById(User, id, { $set: { isChangeEmail: constValues.status.ACTIVE, tempEmail: email, emailChangeOtp: otp } });
      if (process.env.NODE_ENV !== 'test') await sendMail(changeEmail(emailOptions));
      return respondSuccess(
        res,
        req.__(localeKeys.auth.EMAIL_SENT_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateEmail: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { id } = user;
      const { otp } = body;

      const { error } = validateUpdateEmail(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userData = await commonService.findOneById(User, id);
      if (!userData.isChangeEmail) return respondFailure(res, req.__(localeKeys.user.EMAIL_UPDATE_NOT_ALLOWED), StatusCode.BAD_REQUEST);
      if (userData.emailChangeOtp !== otp) return respondFailure(res, req.__(localeKeys.auth.WRONG_OTP), StatusCode.BAD_REQUEST);

      const checkEmail = await commonService.findOneByFields(User, { email: userData.tempEmail });
      if (checkEmail) return respondFailure(res, req.__(localeKeys.user.EMAIL_EXISTS), StatusCode.CONFLICT);

      await commonService.updateById(User, id, {
        $set: {
          email: userData.tempEmail, tempEmail: null, emailChangeOtp: null, isChangeEmail: constValues.status.DEACTIVE,
        },
      });
      return respondSuccess(
        res,
        req.__(localeKeys.auth.EMAIL_CHANGED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  userTickets: async (req, res, next) => {
    try {
      const userTickets = await getUserTickets(req);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        userTickets,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  userTransactions: async (req, res, next) => {
    try {
      const transactions = await getUserTransactions(req);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        transactions,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getTicketView: async (req, res, next) => {
    try {
      const { params } = req;
      const { id } = params;
      let file = 'views/404.ejs';
      const link = process.env.GETLUCKY_URL;
      let dataToSend = { link };

      const [bookingData] = await getTicketDetails(id);
      if (!bookingData) return res.render(path.join(__dirname, `../../../../templates/${file}`), { link });

      bookingData.purchaseDate = moment(bookingData.purchaseDate).format('DD-MMM-YYYY');
      const pdfDownload = `${process.env.GETLUCKY_URL}/invoice/${id}`;
      const ticketDownload = `${process.env.GETLUCKY_URL}/download-ticket/${id}`;
      const { paymentStatus } = bookingData;
      switch (paymentStatus) {
        case 1:
          file = 'views/invoice.ejs';
          dataToSend = {
            ...bookingData, link, url: process.env.AWS_S3_URL, pdfDownload, ticketDownload,
          };
          break;
        case 0:
          dataToSend.url = `${process.env.AWS_S3_URL}`;
          file = 'views/failed.ejs';
          break;
        default:
          dataToSend.url = `${process.env.AWS_S3_URL}`;
          file = 'views/failed.ejs';
      }

      return res.render(path.join(__dirname, `../../../../templates/${file}`), dataToSend);
    } catch (err) {
      return next(respondError(err.message, StatusCode.INTERNAL_SERVER_ERROR));
    }
  },

  // eslint-disable-next-line consistent-return
  downloadTicket: async (req, res) => {
    try {
      const { id } = req.params;
      const link = process.env.GETLUCKY_URL;

      const [bookingData] = await getTicketDetails(id);
      if (!bookingData) return res.render(path.join(__dirname, '../../../../templates/views/404.ejs'), { link });

      bookingData.purchaseDate = moment(bookingData.purchaseDate).format('DD-MMM-YYYY');
      const dataToSend = {
        ...bookingData, link, url: process.env.AWS_S3_URL, ticketDownload: '', pdfDownload: '',
      };
      const { ticketId } = bookingData;
      const fileName = ticketId.replace('#', '');

      const screenshot = await takeScreenShot(dataToSend);
      if (!screenshot) {
        console.error('Failed to download ticket, try again');
        return res.status(500).send('Failed to download ticket, try again');
      }
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename=Getlucky_${fileName}.jpeg`,
      });
      res.end(screenshot);
    } catch (error) {
      return res.status(500).send('Failed to download ticket, try again');
    }
  },

  // eslint-disable-next-line consistent-return
  generateInvoice: async (req, res) => {
    try {
      const { id } = req.params;

      const [invoiceData] = await getPDFInvoiceData(id);
      const pdfBuffer = await generateInvoicePDF(invoiceData);

      res.setHeader('Content-Disposition', `attachment; filename=${invoiceData.invoiceId}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).send('Failed to download invoice, try again');
    }
  },

  addBankAccount: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { iBan } = body;
      const { id } = user;

      const { error } = validateAddBank(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const bankData = await commonService.findAllByFields(Bank, { userId: id });
      if (bankData.length === 3) return respondFailure(res, req.__(localeKeys.user.MAXIMUM_BANKS_ADDED), StatusCode.NOT_FOUND);

      const bankFilter = bankData.filter((elem) => elem.iBan === iBan.trim());
      if (bankFilter.length) return respondFailure(res, req.__(localeKeys.user.BANK_ALREADY_ADDED), StatusCode.BAD_REQUEST);

      body.userId = id;
      await commonService.save(Bank, body);
      return respondSuccess(
        res,
        req.__(localeKeys.user.BANK_ADDED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateBankAccount: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { bankId, ...dataToSet } = body;
      const { id } = user;

      const { error } = validateUpdateBank(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const bankData = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (!bankData) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);

      const checkExists = await commonService.findOneByFields(Bank, { userId: id, iBan: body.iBan });
      if (checkExists) return respondFailure(res, req.__(localeKeys.user.BANK_ALREADY_ADDED), StatusCode.BAD_REQUEST);

      await commonService.deleteOneByFields(Bank, { _id: bankId });
      dataToSet._id = bankId;
      dataToSet.userId = id;
      await commonService.save(Bank, dataToSet);
      return respondSuccess(
        res,
        req.__(localeKeys.user.BANK_UPDATED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getBankAccounts: async (req, res, next) => {
    try {
      const { user } = req;
      const { id, westernUnion } = user;

      const unionBank = { fullName: '', phoneNumber: '' };
      const banks = await commonService.findAllByFields(Bank, { userId: id });
      const dataToSend = {
        banks,
        westernUnion: westernUnion || unionBank,
      };
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        dataToSend,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getABankAccount: async (req, res, next) => {
    try {
      const { user, params } = req;
      const { bankId } = params;
      const { id } = user;

      const bankData = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (!bankData) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        bankData,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  addWesternUnion: async (req, res, next) => {
    try {
      const { user, body } = req;
      const { id } = user;

      const { error } = validateAddWesternUnion(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      await commonService.updateById(User, id, { $set: { westernUnion: body } });
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
};

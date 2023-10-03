// model
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const ejs = require('ejs');
const PDFDocument = require('pdfkit');
// models
const {
  User, Cart, Booking, Quantity, Order, Winner,
} = require('../../../models');

// helpers
const { validateUpdateProfile, validateChangeEmail, validateUpdateEmail } = require('./user.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError } = require('../../../../helpers/utils');
const { sendMail } = require('../../../../helpers/notification');
const { changeEmail } = require('../../../../templates/emailTemplate');
const { getUserTickets, getUserTransactions, getPDFInvoiceData } = require('./user.service');

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

  updateProfile: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { id } = user;

      const { error } = validateUpdateProfile(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userData = await commonService.findOneById(User, id);
      if (body.password) {
        body.password = await userData.hashPassword(body.password);
      }

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
      const { body, language, user } = req;
      const { id, name } = user;
      const { email } = body;

      const { error } = validateChangeEmail(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const checkEmail = await commonService.findOneByFields(User, { email });
      if (checkEmail) return respondFailure(res, req.__(localeKeys.user.EMAIL_EXISTS), StatusCode.CONFLICT);

      const otp = 1234;
      const emailOptions = {
        email, otp, name, language,
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
      const { query } = req;
      const { id } = query;
      let file = 'payment/404.ejs';
      const link = process.env.GETLUCKY_URL;

      const bookingData = await commonService.findOneByFields(Booking, { transactionId: id });
      if (!bookingData) return res.render(path.join(__dirname, `../../../../templates/${file}`), { link });

      const { paymentStatus } = bookingData;
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

  getInvoice: async (req, res, next) => {
    try {
      const { id } = req.query;

      const invoiceData = await getPDFInvoiceData(id);
      console.log(JSON.stringify(invoiceData, null, 4));
      ejs.renderFile(path.join(__dirname, '../../../../templates/generatePDF.ejs'), invoiceData, (err, html) => {
        if (err) {
          console.error('Error rendering EJS template:', err);
          return;
        }

        // Create a PDF document
        const doc = new PDFDocument();

        // Pipe the PDF document to a writable stream (e.g., a file)
        const stream = fs.createWriteStream('invoice.pdf');
        doc.pipe(stream);

        // Embed the HTML content into the PDF
        doc.font('Helvetica').fontSize(12).text(html, { align: 'left' });

        // Finalize the PDF
        doc.end();

        console.log('PDF generated successfully.');
      });
      return res.render(path.join(__dirname, '../../../../templates/payment/404.html'));
    } catch (err) {
      return next(respondError(err.message, StatusCode.INTERNAL_SERVER_ERROR));
    }
  },
};

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const { emailSubject, emailContent } = require('../helpers/constants');

module.exports = {

  emailVerifcationTemplate: (emailOptions) => {
    const { email, verificationCode, language } = emailOptions;
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.emailVerification(language),
      content: emailContent.emailVerification(verificationCode, language),
    };
  },

  forgotPasswordEmail: (emailOptions) => {
    const {
      email, name, password, language,
    } = emailOptions;
    const file = {
      en: './emails/en/forgotPassword.ejs',
    };
    const filePath = path.join(__dirname, file[language]);
    const source = fs.readFileSync(filePath, 'utf8');
    const outputString = ejs.render(source, { name, password });
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.forgotPassword(language),
      content: outputString,
    };
  },

  changeEmail: (emailOptions) => {
    const {
      email, name, otp, language,
    } = emailOptions;
    const file = {
      en: './emails/en/changeEmail.ejs',
    };
    const filePath = path.join(__dirname, file[language]);
    const source = fs.readFileSync(filePath, 'utf8');
    const outputString = ejs.render(source, { name, otp });
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.changeEmail(language),
      content: outputString,
    };
  },

  passwordChangeEmail: (emailOptions) => {
    const { email, language } = emailOptions;
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.passwordChange(language),
      content: emailContent.passwordChange(language),
    };
  },
};

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

  emailTemporaryPassword: (emailOptions) => {
    const { email, verificationCode, language } = emailOptions;
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.emailVerification(language),
      content: emailContent.emailPassword(verificationCode, language),
    };
  },

  forgotPasswordEmail: (emailOptions) => {
    const { email, password, language } = emailOptions;
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.forgotPassword(language),
      content: emailContent.forgotPassword(password, language),
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

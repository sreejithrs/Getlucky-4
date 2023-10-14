const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const { emailSubject } = require('../helpers/constants');

module.exports = {

  forgotPasswordEmail: (emailOptions) => {
    const {
      email, name, password,
    } = emailOptions;
    const file = './emails/en/forgotPassword.ejs';
    const filePath = path.join(__dirname, file);
    const source = fs.readFileSync(filePath, 'utf8');
    const outputString = ejs.render(source, { name, password, url: process.env.AWS_S3_URL });
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.forgotPassword(),
      content: outputString,
    };
  },

  changeEmail: (emailOptions) => {
    const {
      email, name, otp,
    } = emailOptions;
    const file = './emails/en/changeEmail.ejs';

    const filePath = path.join(__dirname, file);
    const source = fs.readFileSync(filePath, 'utf8');
    const outputString = ejs.render(source, { name, otp, url: process.env.AWS_S3_URL });
    return {
      from: process.env.AWS_SES_FROM_EMAIL,
      to: email,
      subject: emailSubject.changeEmail(),
      content: outputString,
    };
  },

};

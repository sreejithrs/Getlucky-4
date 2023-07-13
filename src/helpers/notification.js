// modules
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

module.exports = {

  sendMail: (options) => {
    const transporter = nodemailer.createTransport({
      secure: true,
      requireTLS: true,
      port: 465,
      secured: true,
      SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: process.env.AWS_SES_REGION,
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      }),
    });
    const mailOptions = {
      from: options.from, to: options.to, subject: options.subject, html: options.content,
    };
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },
};

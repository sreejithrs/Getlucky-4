// modules
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

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

  sendSMS: (verificationCode, phoneNumber) => {
    client.messages
      .create({
        body: `Your OTP for Getlucky-4 is ${verificationCode}`,
        from: '+16184485340',
        to: phoneNumber,
      })
      // eslint-disable-next-line no-console
      .then((message) => console.log(message.sid)).catch((err) => console.error(err));
  },
};

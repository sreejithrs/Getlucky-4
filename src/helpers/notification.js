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
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
    });
    const mailOptions = {
      from: options.from, to: options.to, subject: options.subject, html: options.content,
    };
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log(err, 'awsSESErr');
          resolve(false);
        } else {
          console.log(data, 'Email sent successfully');
          resolve(true);
        }
      });
    });
  },

  sendSMS: async (smsOptions) => {
    AWS.config.update({
      region: process.env.AWS_SNS_REGION,
      accessKeyId: process.env.AWS_SMS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SMS_SECRET_ACCESS_KEY,
    });

    const { message, phoneNumber } = smsOptions;
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
    };

    try {
      const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
      const data = await sns.publish(params).promise();
      console.log(data, 'data');
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};

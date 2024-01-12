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
      transporter.sendMail(mailOptions, (err, _data) => {
        if (err) {
          console.log(err, 'awsSESErr');
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  sendSMS: async (smsOptions) => {
    AWS.config.update({
      region: process.env.AWS_SNS_REGION,
    });

    const { message, phoneNumber } = smsOptions;
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
    };

    try {
      const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
      await sns.publish(params).promise();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  // sendSMS: (smsOptions) => {
  //   const { message, phoneNumber } = smsOptions;
  //   const data = JSON.stringify({
  //     messages: [
  //       {
  //         channel: 'sms',
  //         recipients: [phoneNumber],
  //         content: message,
  //         msg_type: 'text',
  //         data_coding: 'text',
  //       },
  //     ],
  //   });

  //   const config = {
  //     method: 'post',
  //     url: 'https://api.d7networks.com/messages/v1/send',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Accept: 'application/json',
  //       Authorization: `Bearer ${process.env.SMS_API_KEY}`,
  //     },
  //     data: data,
  //   };

  //   axios(config)
  //     .then((response) => {
  //       console.log(JSON.stringify(response.data));
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // },

};

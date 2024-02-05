const AWS = require('aws-sdk');
const axios = require('axios');
const passwordGenerator = require('secure-random-password');
const EmailValidator = require('email-deep-validator');

const emailValidator = new EmailValidator();

const logger = require('../config/winston.config');

const s3bucket = new AWS.S3({
  region: process.env.AWS_SES_REGION,
  signatureVersion: 'v4',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateVerificationCode = () => {
  const timeStamp = Date.now();
  return 999999 - Number(timeStamp.toString().slice(7));
};

const generate4DigitOTP = () => Math.floor(Math.random() * 9000 + 1000);

const generateAccessCode = () => {
  const timeStamp = Date.now();
  const num = 999999 - Number(timeStamp.toString().slice(7));
  return `ACCCODE${num.toString()}`;
};

const generatePassword = () => passwordGenerator.randomPassword({
  characters: [
    { characters: passwordGenerator.upper, exactly: 2 },
    { characters: passwordGenerator.symbols, exactly: 1 },
    passwordGenerator.digits,
    passwordGenerator.lower,
  ],
  length: 8,
});

const checkEmailValidOrNot = async (email) => {
  const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);
  return !!(wellFormed === true && validDomain === true && validMailbox === true);
};

const getMessageFromValidationError = (error) => error.details[0].message.replace(/"/g, '');

// WORKS ON AWS S3
const uploadImage = async (file, bucketName, fileName, contentType) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `${bucketName}/${fileName}`,
    ContentType: contentType,
    Body: file.data,
    ACL: 'public-read',
  };
  return s3bucket
    .upload(s3Params)
    .promise()
    .then((data) => {
      console.log(data);
      return { status: true, data: data };
    })
    .catch((err) => {
      console.log(err);
      return { status: false, error: err.message };
    });
};

const uploadPDF = async (pdfBuffer, fileName) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET,
    Key: fileName,
    ContentType: 'application/pdf',
    Body: pdfBuffer,
    ACL: 'public-read',
  };
  return s3bucket
    .upload(s3Params)
    .promise()
    .then((data) => {
      console.log(data);
      return { status: true, data: data };
    })
    .catch((err) => {
      console.log(err);
      return { status: false, error: err.message };
    });
};

const uploadFileCode = async (mainImage, bucketFolder) => {
  let imageName = '';
  const refExt = mainImage.name && mainImage.name.substring(mainImage.name.lastIndexOf('.') + 1, mainImage.name.length);
  const filename = `${new Date().getTime()}.${refExt}`;
  try {
    const uploadRes = await module.exports.uploadImage(mainImage, bucketFolder, filename, mainImage.mimetype);
    if (uploadRes.status) {
      imageName = `${bucketFolder}/${filename}`;
    }
  } catch (err) {
    imageName = '';
  }
  return imageName;
};

const deleteFileFromS3 = async (key) => {
  const bucket = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_SES_REGION,
  });
  const s3Params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };
  return bucket.deleteObject(s3Params, (err, _data) => {
    if (err) {
      console.log(err, 'error');
    }
  });
};

const allCharactersAreSame = (str) => {
  for (let i = 1; i < str.length; i += 1) {
    if (str[i] !== str[0]) {
      return false;
    }
  }
  return true;
};

const getPermutations = (value) => {
  const permutations = [];
  if (allCharactersAreSame(value)) {
    return [value];
  }

  function generatePermutations(chars, currentPermutation = '') {
    if (chars.length === 0) {
      permutations.push(currentPermutation);
    } else {
      const usedChars = new Set();
      for (let i = 0; i < chars.length; i += 1) {
        if (!usedChars.has(chars[i])) {
          usedChars.add(chars[i]);
          const remainingChars = chars.slice(0, i) + chars.slice(i + 1);
          generatePermutations(remainingChars, currentPermutation + chars[i]);
        }
      }
    }
  }

  generatePermutations(value);
  return permutations.filter((item) => item !== value);
};

const monthDiffFn = (fromDate, toDate) => {
  let months;
  months = (toDate.getFullYear() - fromDate.getFullYear()) * 12;
  months -= fromDate.getUTCMonth();
  months += toDate.getUTCMonth();
  return months <= 0 ? 0 : months;
};

const generate3DigitId = (lastPayoutNumber) => `#${lastPayoutNumber.toString().padStart(3, '0')}`;
const generate6DigitId = (value, lastPayoutNumber) => `${value}${lastPayoutNumber.toString().padStart(6, '0')}`;

const makeRequest = (apiUrl, headers, data = {}) => new Promise((resolve, reject) => {
  axios.post(apiUrl, JSON.stringify(data), {
    headers,
  })
    .then((response) => {
      console.log('API call successful');
      resolve(response.data);
    })
    .catch((error) => {
      console.error('Error making API request:', error.response.data);
      reject(error.message);
    });
});

const getNetworkAccessToken = async () => {
  const apiUrl = 'https://api-gateway.ngenius-payments.com/identity/auth/access-token';
  const headers = {
    accept: 'application/vnd.ni-identity.v1+json',
    authorization: `Basic ${process.env.NETWORK_API_KEY}`,
    'content-type': 'application/vnd.ni-identity.v1+json',
  };

  return module.exports.makeRequest(apiUrl, headers)
    .then((response) => {
      if (response.access_token) {
        const token = response.access_token;
        return { status: true, token };
      }
      logger.log('error', `Failed to generate access token: ${response.errors[0].message}`);
      return { status: false };
    }).catch(() => ({ status: false }));
};

const createNetworkOrder = async (token, data) => {
  const apiUrl = `https://api-gateway.ngenius-payments.com/transactions/outlets/${process.env.NETWORK_OUTLET}/orders`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/vnd.ni-payment.v2+json',
    Accept: 'application/vnd.ni-payment.v2+json',
  };

  return module.exports.makeRequest(apiUrl, headers, data)
    .then((response) => {
      if (response._id) {
        // eslint-disable-next-line no-underscore-dangle
        return { status: true, data: response };
      }
      logger.log('error', `Failed to create order: ${response.errors[0].message}`);
      return { status: false };
    }).catch(() => ({ status: false }));
};

module.exports = {
  generateVerificationCode,
  generateAccessCode,
  generatePassword,
  checkEmailValidOrNot,
  getMessageFromValidationError,
  uploadImage,
  deleteFileFromS3,
  uploadFileCode,
  generate3DigitId,
  getPermutations,
  generate4DigitOTP,
  generate6DigitId,
  uploadPDF,
  monthDiffFn,
  makeRequest,
  getNetworkAccessToken,
  createNetworkOrder,
};

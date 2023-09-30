const AWS = require('aws-sdk');
const passwordGenerator = require('secure-random-password');
const EmailValidator = require('email-deep-validator');
const { v4: uuidv4 } = require('uuid');

const emailValidator = new EmailValidator();

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

const generate4DigitOTP = () => {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

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

const generateOrderId = () => `ORDER_${uuidv4()}`;

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

const generate3DigitId = (lastPayoutNumber) => `#${lastPayoutNumber.toString().padStart(3, '0')}`;

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
  generateOrderId,
  generate4DigitOTP,
};

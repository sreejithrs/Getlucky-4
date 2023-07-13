const AWS = require('aws-sdk');

const passwordGenerator = require('secure-random-password');
const EmailValidator = require('email-deep-validator');

const emailValidator = new EmailValidator();

const s3bucket = new AWS.S3({
  signatureVersion: 'v4',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateVerificationCode = () => {
  const timeStamp = Date.now();
  return 999999 - Number(timeStamp.toString().slice(7));
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

const getMessageFromValidationError = (error) => {
  return error.details[0].message.replace(/"/g, '');
};

// WORKS ON AWS S3
const uploadImage = async (file, bucketName, fileName, contentType) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `${bucketName}/${fileName}`,
    ContentType: contentType,
    Body: file.buffer,
    ACL: 'public-read',
  };
  return s3bucket
    .upload(s3Params)
    .promise()
    .then((data) => ({ status: true, data }))
    .catch((err) => ({ status: false, error: err.message }));
};

const uploadFileCode = async (mainImage, bucketFolder) => {
  let imageName = '';
  const refExt = mainImage.originalname && mainImage.originalname.substring(mainImage.originalname.lastIndexOf('.') + 1, mainImage.originalname.length);
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
    region: 'eu-central-1',
  });
  const s3Params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };
  return bucket.deleteObject(s3Params, (err, _data) => {
    if (err) {
      global.logger('error', err);
    }
  });
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
};

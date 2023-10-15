const allowedLanguages = ['en', 'de'];
const drawCategoryArray = ['straight', 'rumble', 'chance'];

module.exports = {
  allowedLanguages,

  drawCategoryArray,

  drawDetails: {
    drawName: 'Getlucky Draw',
  },

  priceAmount: {
    straight: 3000,
    rumble: 1000,
    chance: 100,
  },

  priceCategory: {
    STRAIGHT: 'straight',
    RUMBLE: 'rumble',
    CHANCE: 'chance',
  },

  paymentStatus: {
    FAILED: 0,
    SUCCESS: 1,
    PENDING: 2,
  },

  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  status: {
    ACTIVE: true,
    DEACTIVE: false,
  },

  userType: {
    USER: 1,
    SALES: 2,
    ADMIN: 3,
  },

  otpMax: {
    FIRST: 1,
    SECOND: 2,
  },

  smsVerifyContent: (otp) => `Your OTP for mobile number verification in Getlucky4 is ${otp}. Please use this 4-digit code within the next 3 minutes. For your security, do not share this code with anyone`,
  smsLoginContent: (otp) => `Your OTP for Getlucky4 login is ${otp}. For your security, do not share this code with anyone. If you not requested, please ignore this message`,

  emailSubject: {

    changeEmail: () => 'Update your Email',

    forgotPassword: () => 'New Password',

  },

};

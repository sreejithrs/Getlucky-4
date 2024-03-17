const allowedLanguages = ['en', 'de'];
const drawCategoryArray = ['straight', 'rumble', 'chance'];

module.exports = {
  allowedLanguages,

  drawCategoryArray,

  networkEvents: ['THREE_DS_NOT_AUTHENTICATED', 'DECLINED', 'PURCHASE_DECLINED', 'PURCHASE_FAILED',
    'CAPTURE_FAILED', 'CAPTURE_VOID_FAILED', 'CANCELLED', 'GATEWAY_RISK_PRE_AUTH_REJECTED',
    'PRE_AUTH_FRAUD_CHECK_REJECTED', 'POST_AUTH_FRAUD_CHECK_REJECTED'],

  drawDetails: {
    drawName: 'Getlucky Draw',
  },

  paymentCategory: {
    ORDER: 'Purchase',
    WALLET_WITHDRAW: 'Wallet Withdraw',
    WINNING_AMOUNT: 'Won Amount',
    WALLET_CREDIT: 'Top Up',
    WALLET_ORDER: 'Wallet Purchase',
  },

  paymentCategoryCode: {
    ORDER: 'ORDER',
    WALLET_WITHDRAW: 'WALLET_WITHDRAW',
    WINNING_AMOUNT: 'WINNING_AMOUNT',
    WALLET_CREDIT: 'WALLET_CREDIT',
    WALLET_ORDER: 'WALLET_ORDER',
  },

  priceAmount: {
    straight: 10000,
    rumble: 2500,
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

  withdrawRequest: {
    0: 'Rejected',
    1: 'Approved',
    2: 'Pending',
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

  smsVerifyContent: (otp) => `Your OTP for account verification in Getlucky4 is ${otp}. Please use this 4-digit code within the next 3 minutes. For your security, do not share this code with anyone`,
  smsLoginContent: (otp) => `Your OTP for Getlucky4 login is ${otp}. For your security, do not share this code with anyone. If you not requested, please ignore this message`,

  emailSubject: {

    changeEmail: () => 'Update your Email',

    forgotPassword: () => 'New Password',

    emailLogin: () => 'Getlucky4 Login OTP',

    emailRegister: () => 'Getlucky4 Account Verification',

    sendTicket: (ticketId, date) => `Getlucky4 ticket ${ticketId} for ${date} draw`,
  },

};

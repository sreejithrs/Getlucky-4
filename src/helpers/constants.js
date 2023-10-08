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

  smsContent: (otp) => `Your OTP for mobile number verification in Getlucky4 is ${otp}. Please use this 4-digit code within the next 3 minutes. For your security, do not share this code with anyone`,

  emailSubject: {

    emailVerification: (language) => {
      if (language === 'de') {
        return 'Bestätigung Code';
      }
      return 'Confirmation Code';
    },

    changeEmail: () => 'Update your Email',

    forgotPassword: () => 'New Password',

    passwordChange: () => 'Password Change',

  },

  emailContent: {

    emailVerification: (verificationCode, language) => {
      if (language === 'de') {
        return `
          <p>Hier ist dein Bestätigungs Code: <b>${verificationCode}</b> für Getlucky-4</p>
          <br/>
          <p>Grüße,</p>
          <p><b>Team Getlucky-4</b></p>
        `;
      }
      return `
          <p>Here is your Verification Code: <b>${verificationCode}</b> for Getlucky-4</p>
          <br/>
          <p>Regards,</p>
          <p><b>Team Getlucky-4</b></p>
        `;
    },

    forgotPassword: (password, language) => {
      if (language === 'de') {
        return `
          <p>Hier kommt dein neues Passwort: <b>${password}</b>. Es ist nur 1 x zu nutzen.</p>
          <br/>
          <p>Grüße,</p>
          <p><b>Team Getlucky-4</b></p>
        `;
      }
      return `
          <p>Here is your new password: <b>${password}</b>. It can only be used once.</p>
          <br/>
          <p>Regards,</p>
          <p><b>Team Getlucky-4</b></p>
        `;
    },

    passwordChange: (language) => {
      if (language === 'de') {
        return '<p>Ihr Passwort wurde erfolgreich geändert.</p><br/><p>Grüße,</p><p><b>Team Getlucky-4</b></p>';
      }
      return '<p>Your password has been changed successfully.</p><br/><p>Regards,</p><p><b>Team Getlucky-4</b></p>';
    },

  },

};

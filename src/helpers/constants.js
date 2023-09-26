const allowedLanguages = ['en', 'de'];

module.exports = {
  allowedLanguages,

  drawName: 'Getlucky Draw',

  priceAmount: {
    STRAIGHT: 3000,
    RUMBLE: 1000,
    CHANCE: 100,
  },

  priceCategory: {
    STRAIGHT: 'straight',
    REVERSE: 'reverse',
    RUMBLE: 'mix',
    CHANCE: 'chance',
  },

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

  emailSubject: {

    emailVerification: (language) => {
      if (language === 'de') {
        return 'Bestätigung Code';
      }
      return 'Confirmation Code';
    },

    forgotPassword: (language) => {
      if (language === 'de') {
        return 'Neues Passwort';
      }
      return 'New Password';
    },

    passwordChange: (language) => {
      if (language === 'de') {
        return 'Passwortänderung';
      }
      return 'Password Change';
    },

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

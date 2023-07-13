const allowedLanguages = ['en', 'de'];

module.exports = {
  allowedLanguages,

  status: {
    ACTIVE: true,
    DEACTIVE: false,
  },

  userType: {
    USER: 1,
    ADMIN: 2,
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

    emailPassword: (verificationCode, language) => {
      if (language === 'de') {
        return `
          <p>Hier ist Ihr temporäres Passwort: <b>${verificationCode}</b> für Getlucky-4</p>
          <br/>
          <p>Grüße,</p>
          <p><b>Team Getlucky-4</b></p>
        `;
      }
      return `
          <p>Here is your Temporary Password: <b>${verificationCode}</b> for Getlucky-4</p>
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

// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const countrySchema = new Schema(
  {
    name: { type: String },
    phone_code: { type: String },
    iso2: { type: String },
    states: [
      {
        id: { type: Number },
        name: { type: String },
      },
    ],
  },
);

module.exports = mongoose.model('Country', countrySchema);

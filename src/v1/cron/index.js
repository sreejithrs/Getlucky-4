// modules
const moment = require('moment');
const schedule = require('node-schedule');

const rule = new schedule.RecurrenceRule();
rule.tz = 'Etc/UTC';

// models
const { Draw } = require('../models/index');
// helpers
const constValues = require('../../helpers/constants');
const commonService = require('../services/common.service');

// Execute a cron job every day 7:00:00 am UTC
rule.hour = 3; // 7 am at UAE
rule.minute = 0;

schedule.scheduleJob(rule, async () => {
  await module.exports.createDraw();
});

module.exports = {

  createDraw: async () => {
    const currentDate = new Date();
    let nextDay = moment(currentDate).add(1, 'd').format('YYYY-MM-DD');
    let twoDaysAfter = moment(currentDate).add(2, 'd').format('YYYY-MM-DD');
    const getNextDayValues = moment(nextDay).day();
    const getTwoDayValue = moment(twoDaysAfter).day();

    const checkDraw = await commonService.findAllByFields(
      Draw,
      {
        $or: [
          { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, nextDay] } },
          { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, twoDaysAfter] } },
        ],
      },
    );
    console.log('----Cron Executed----', checkDraw);

    nextDay = new Date(new Date(nextDay).setUTCHours(17, 0, 0, 0));
    twoDaysAfter = new Date(new Date(twoDaysAfter).setUTCHours(17, 0, 0, 0));

    const dataToSave = {
      drawName: constValues.drawDetails.drawName,
      date: nextDay,
    };
    if (!checkDraw.length && getNextDayValues !== 0) await commonService.save(Draw, dataToSave);

    const getTwoDaysAfter = checkDraw.filter((elem) => String(elem.date) === String(twoDaysAfter));
    if (!getTwoDaysAfter.length && getTwoDayValue !== 0) {
      dataToSave.date = twoDaysAfter;
      await commonService.save(Draw, dataToSave);
    }
  },

};

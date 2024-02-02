// modules
const moment = require('moment');
const schedule = require('node-schedule');
const logger = require('../../config/winston.config');

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
    let dataToSave;

    const today = moment().startOf('day');
    // Calculate the days remaining until Wednesday and Saturday
    const daysUntilWednesday = (3 - today.isoWeekday() + 7) % 7;
    const daysUntilSaturday = (6 - today.isoWeekday() + 7) % 7;

    // Schedule draws for the upcoming Wednesday and Saturday
    let nextWednesday = moment(today).add(daysUntilWednesday, 'days').format('YYYY-MM-DD');
    let nextSaturday = moment(today).add(daysUntilSaturday, 'days').format('YYYY-MM-DD');
    const checkWednesdayDraw = await commonService.findOneByFields(Draw, { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, nextWednesday] } });
    const checkSaturdayDraw = await commonService.findOneByFields(Draw, { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, nextSaturday] } });

    nextWednesday = new Date(new Date(nextWednesday).setUTCHours(17, 0, 0, 0));
    nextSaturday = new Date(new Date(nextSaturday).setUTCHours(17, 0, 0, 0));
    if (!checkSaturdayDraw) {
      dataToSave = {
        drawName: constValues.drawDetails.drawName,
        date: nextSaturday,
      };
      await commonService.save(Draw, dataToSave);
    }
    if (!checkWednesdayDraw) {
      dataToSave = {
        drawName: constValues.drawDetails.drawName,
        date: nextWednesday,
      };
      await commonService.save(Draw, dataToSave);
    }
    logger.log('info', '----Cron Executed----');
  },

};

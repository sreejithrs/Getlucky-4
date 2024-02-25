/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
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
    const scheduleDraw = async (dayOfWeek) => {
      const today = moment().startOf('day');
      const daysUntilDraw = (dayOfWeek - today.isoWeekday() + 7) % 7;

      let nextDrawDate = moment(today).add(daysUntilDraw, 'days').format('YYYY-MM-DD');
      const checkDraw = await commonService.findOneByFields(Draw, { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, nextDrawDate] } });
      if (!checkDraw) {
        nextDrawDate = new Date(new Date(nextDrawDate).setUTCHours(17, 0, 0, 0));
        await commonService.save(Draw, {
          drawName: constValues.drawDetails.drawName,
          date: nextDrawDate,
        });
      }
    };

    // 1- Monday, 3 - Wednesday, 6 - Saturday
    const drawDays = [1, 3, 6];
    for (const dayOfWeek of drawDays) {
      await scheduleDraw(dayOfWeek);
    }
    logger.log('info', '----Cron Executed----');
  },

};

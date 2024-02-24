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

    // 3 corresponds to Wednesday, 6 corresponds to Saturday
    await Promise.all([3, 6].map(scheduleDraw));
    logger.log('info', '----Cron Executed----');
  },

};

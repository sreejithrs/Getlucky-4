// modules
const moment = require('moment');

// models
const { User, Booking } = require('../../../models/index');

// helpers
const constValues = require('../../../../helpers/constants');
const { monthDiffFn } = require('../../../../helpers/utils');

module.exports = {

  homeStatistics: async (query) => {
    let { startDate, endDate } = query;

    startDate = new Date(startDate);
    endDate = new Date(endDate);
    endDate.setUTCHours(23, 59, 0, 0);
    const [totalData] = await User.aggregate([
      {
        $lookup: {
          from: 'winners',
          pipeline: [
            {
              $match: {},
            },
          ],
          as: 'winners',
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalWinners: { $first: { $size: '$winners' } },
        },
      },
      {
        $lookup: {
          from: 'bookings',
          pipeline: [
            {
              $match: {
                paymentStatus: { $eq: constValues.paymentStatus.SUCCESS },
              },
            },
            {
              $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                userPaid: { $sum: '$userPaid' },
              },
            },
          ],
          as: 'bookings',
        },
      },
      {
        $unwind: { path: '$bookings', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $first: '$totalUsers' },
          totalWinners: { $first: '$totalWinners' },
          totalProfit: { $first: { $ifNull: ['$bookings.userPaid', 0] } },
          totalPurchases: { $sum: { $ifNull: ['$bookings.totalBookings', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    const graphAggregate = await Booking.aggregate([
      {
        $match: {
          paymentStatus: { $eq: constValues.paymentStatus.SUCCESS },
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          pipeline: [
            {
              $lookup: {
                from: 'quantities',
                localField: '_id',
                foreignField: 'orderId',
                as: 'tickets',
              },
            },
            {
              $unwind: { path: '$tickets', preserveNullAndEmptyArrays: true },
            },
            {
              $unwind: '$tickets.ticketNumbers',
            },
            {
              $group: {
                _id: null,
                totalTickets: { $sum: 1 },
              },
            },
          ],
          as: 'orders',
        },
      },
      {
        $unwind: { path: '$orders', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $first: '$orders.totalTickets' },
          month: { $first: { $month: '$date' } },
          year: { $first: { $year: '$date' } },
          date: { $first: '$date' },
          day: { $first: { $dateToString: { format: '%d', date: '$date' } } },
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          year: 1,
          date: 1,
          day: 1,
          count: 1,
        },
      },
    ]);

    const graphData = [];
    const monthsCount = monthDiffFn(startDate, endDate);
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (monthsCount === 0) {
      const existingData = {};
      graphAggregate.forEach((elem) => {
        const formattedDate = moment(elem.date).format('DD-MM-YYYY');
        existingData[formattedDate] = elem.count;
      });

      const filterStart = moment(startDate);
      const filterEnd = moment(endDate);
      while (filterStart.isSameOrBefore(filterEnd)) {
        const formattedDate = filterStart.format('DD-MM-YYYY');
        const day = filterStart.date();
        const month = filterStart.month();

        const totalTickets = existingData[formattedDate] || 0;
        graphData.push({
          date: `${day} ${monthNames[month]}`,
          totalTickets: totalTickets,
        });

        filterStart.add(1, 'day');
      }

      return { totalData, graphData };
    }

    for (let i = 0; i <= monthsCount; i += 1) {
      const year = Number(moment(startDate).format('Y'));
      const month = startDate.getMonth() + 1;
      let countValue = 0;

      graphAggregate.forEach((element) => {
        if (element.year === year && element.month === month) {
          countValue += element.count;
        }
      });

      if (month) {
        graphData.push({
          date: `${monthNames[month]} ${year}`,
          totalTickets: countValue,
        });
      }

      startDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
    }

    return { totalData, graphData };
  },

  getUserReports: async (query) => {
    let { startDate, endDate } = query;
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    endDate.setUTCHours(23, 59, 0, 0);
    await Booking.aggregate([
      {
        $match: {
          paymentStatus: constValues.paymentStatus.SUCCESS,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
              },
            },
            {
              $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
            },
            {
              $lookup: {
                from: 'quantities',
                localField: '_id',
                foreignField: 'orderId',
                as: 'tickets',
              },
            },
            {
              $unwind: { path: '$tickets', preserveNullAndEmptyArrays: true },
            },
            {
              $group: {
                _id: '$_id',
                ticketId: { $first: '$ticketId' },
                date: { $first: { $dateToString: { format: '%d-%m-%Y', date: '$date' } } },
                name: { $first: '$user.name' },
                state: { $first: '$user.state' },
                country: { $first: '$user.country' },
                mobile: { $first: { $concat: ['+', '$user.phoneNumber'] } },
              },
            },
          ],
          as: 'orders',
        },
      },
      {
        $unwind: { path: '$orders', preserveNullAndEmptyArrays: true },
      },
      {
        $replaceRoot: { newRoot: '$orders' }, // Flatten the results
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  },

};

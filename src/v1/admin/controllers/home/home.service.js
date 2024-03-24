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

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [totalData] = await User.aggregate([
      {
        $match: {
          userType: constValues.userType.USER,
          isVerified: constValues.status.ACTIVE,
        },
      },
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
              $addFields: {
                convertedDate: {
                  $dateFromString: {
                    dateString: {
                      $dateToString: {
                        format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        date: '$date',
                        timezone: 'Asia/Dubai',
                      },
                    },
                  },
                },
              },
            },
            {
              $match: {
                type: constValues.paymentCategoryCode.ORDER,
                paymentStatus: { $eq: constValues.paymentStatus.SUCCESS },
                convertedDate: {
                  $gte: todayStart,
                  $lte: todayEnd,
                },
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
          type: { $eq: constValues.paymentCategoryCode.ORDER },
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
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Dubai' } },
          count: { $sum: '$orders.totalTickets' },
          month: { $first: { $month: '$date' } },
          year: { $first: { $year: '$date' } },
          date: { $first: { $dateToString: { date: '$date', timezone: 'Asia/Dubai' } } },
          day: { $first: { $dateToString: { format: '%d', date: '$date', timezone: 'Asia/Dubai' } } },
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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (monthsCount === 0) {
      const existingData = {};
      graphAggregate.forEach((elem) => {
        const formattedDate = moment.utc(elem.date).format('DD-MM-YYYY');
        existingData[formattedDate] = elem.count;
      });

      const filterStart = moment.utc(startDate);
      const filterEnd = moment.utc(endDate);
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
          date: `${monthNames[month - 1]} ${year}`,
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
    return Booking.aggregate(
      [
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
                  from: 'draws',
                  localField: 'drawId',
                  foreignField: '_id',
                  as: 'drawData',
                },
              },
              {
                $unwind: { path: '$drawData', preserveNullAndEmptyArrays: true },
              },
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
                $unwind: { path: '$tickets.ticketNumbers', preserveNullAndEmptyArrays: true },
              },
              {
                $group: {
                  _id: '$_id',
                  drawNo: { $first: '$drawData.drawNo' },
                  ticketId: { $first: '$ticketId' },
                  userId: { $first: '$user._id' },
                  tickets: { $push: '$tickets.ticketNumbers' },
                  date: { $first: { $dateToString: { format: '%d-%m-%Y', date: '$date' } } },
                  name: { $first: '$user.name' },
                  mobile: { $first: { $concat: ['+', '$user.phoneNumber'] } },
                  state: { $first: '$user.state' },
                  country: { $first: '$user.country' },
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
          $sort: {
            'orders.drawNo': 1,
          },
        },
        {
          $project: {
            _id: 0,
            drawNo: '$orders.drawNo',
            ticket_id: '$orders.ticketId',
            purchase_date: { $dateToString: { format: '%d-%m-%Y', date: '$date' } },
            name: '$orders.name',
            mobile: '$orders.mobile',
            state: '$orders.state',
            country: '$orders.country',
            tickets: '$orders.tickets',
            amount_paid: '$userPaid',
          },
        },
      ],
    );
  },

};

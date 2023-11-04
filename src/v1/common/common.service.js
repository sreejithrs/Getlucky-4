// modules
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;

// models
const { Draw } = require('../models/index');

// helpers
const constValues = require('../../helpers/constants');

module.exports = {

  drawResult: async (drawId) => {
    const [drawResult] = await Draw.aggregate([
      {
        $match: {
          _id: ObjectId(drawId),
        },
      },
      module.exports.commonFormatDate,
      {
        $lookup: {
          from: 'winners',
          localField: '_id',
          foreignField: 'drawId',
          as: 'winnerData',
        },
      },
      {
        $unwind: { path: '$winnerData', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$winnerData.ticketNumbers', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $ifNull: ['$winnerData.matchOrder', null] },
          winnersCount: {
            $sum: {
              $cond: {
                if: { $eq: [{ $ifNull: ['$winnerData', null] }, null] },
                then: 0,
                else: 1,
              },
            },
          },
          drawName: { $first: '$drawName' },
          drawDate: { $first: '$formattedDate' },
          drawNo: { $first: '$drawNo' },
          wonTicket: { $first: '$wonTicket' },
          tickets: { $push: '$winnerData.ticketNumbers' },
          price: {
            $first: {
              $let: {
                vars: {
                  priceArray: {
                    $objectToArray: constValues.priceAmount,
                  },
                },
                in: {
                  $arrayElemAt: [
                    '$$priceArray.v',
                    {
                      $indexOfArray: ['$$priceArray.k', '$winnerData.matchOrder'],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          drawName: { $first: { $concat: ['$drawName', ' ', '$drawNo'] } },
          date: { $first: '$drawDate' },
          drawNo: { $first: '$drawNo' },
          wonTicket: { $first: '$wonTicket' },
          totalWinners: { $sum: '$winnersCount' },
          result: {
            $push: {
              $cond: {
                if: { $eq: ['$winnersCount', 0] },
                then: '$$REMOVE',
                else: {
                  category: '$_id',
                  winnersCount: '$winnersCount',
                  prices: '$price',
                  totalPrices: {
                    $multiply: ['$price', { $sum: { $size: '$tickets' } }],
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalWonPrice: { $sum: '$result.totalPrices' },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (!drawResult) {
      return {
        drawName: '', date: '', drawNo: '', wonTicket: '', totalWinners: 0, totalWonPrice: 0, result: [],
      };
    }

    const order = constValues.drawCategoryArray;
    drawResult.result.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    return drawResult;
  },

  getWinnersList: async (drawId) => Draw.aggregate([
    {
      $match: {
        _id: ObjectId(drawId),
      },
    },
    module.exports.commonFormatDate,
    {
      $lookup: {
        from: 'winners',
        localField: '_id',
        foreignField: 'drawId',
        pipeline: [
          {
            $unwind: { path: '$ticketNumbers', preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userData',
            },
          },
          {
            $unwind: { path: '$userData', preserveNullAndEmptyArrays: false },
          },
          {
            $group: {
              _id: {
                userId: '$userId',
                matchOrder: '$matchOrder',
              },
              name: { $first: '$userData.name' },
              nationality: { $first: '$userData.country' },
              state: { $first: '$userData.state' },
              matchOrder: { $first: '$matchOrder' },
              wonPrice: { $first: '$priceAmount' },
            },
          },
          {
            $sort: {
              matchOrder: -1,
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        as: 'winnerData',
      },
    },
    {
      $group: {
        _id: '$_id',
        drawName: { $first: { $concat: ['$drawName', ' ', '$drawNo'] } },
        isTicketAdded: { $first: '$isTicketAdded' },
        date: { $first: '$formattedDate' },
        wonTicket: { $first: '$wonTicket' },
        users: { $first: '$winnerData' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]),

  commonFormatDate: {
    $addFields: {
      formattedDate: {
        $concat: [
          { $dateToString: { format: '%d', date: '$date' } },
          '-',
          {
            $arrayElemAt: [
              constValues.months,
              { $subtract: [{ $month: '$date' }, 1] },
            ],
          },
          '-',
          { $toString: { $year: '$date' } },
        ],
      },
    },
  },

  commonDrawFind: () => {
    const currentDate = new Date();
    const currentDateFormat = moment(currentDate).format('YYYY-MM-DDTHH:mm:ss');
    return [
      {
        $lookup: {
          from: 'draws',
          pipeline: [
            {
              $addFields: {
                hourUTC: { $hour: { date: '$date' } },
                minuteUTC: { $minute: { date: '$date' } },
                secondUTC: { $second: { date: '$date' } },
              },
            },
            module.exports.commonFormatDate,
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $ne: [{ $dayOfWeek: { date: '$date' } }, 1],
                    },
                  },
                  { status: constValues.status.ACTIVE },
                  {
                    $or: [
                      {
                        $expr: {
                          $gte: [
                            { $dateToString: { format: '%Y-%m-%dT%H:%M:%S', date: '$date' } },
                            currentDateFormat,
                          ],
                        },
                      },
                      {
                        $expr: {
                          $gt: [
                            { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                            currentDateFormat,
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            },
            {
              $sort: {
                date: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: 'drawDetails',
        },
      },
      {
        $unwind: { path: '$drawDetails', preserveNullAndEmptyArrays: true },
      },
    ];
  },

};

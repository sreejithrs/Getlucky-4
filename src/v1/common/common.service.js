// modules
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
        $unwind: '$winnerData.ticketNumbers',
      },
      {
        $group: {
          _id: '$winnerData.matchOrder',
          winnersCount: { $sum: 1 },
          drawName: { $first: '$drawName' },
          drawDate: { $first: '$date' },
          drawNo: { $first: '$drawNo' },
          wonTicket: { $first: '$wonTicket' },
          tickets: { $push: '$winnerData.ticketNumbers' },
          ticketsToShow: { $addToSet: '$winnerData.ticketNumbers' },
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
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$drawDate' } } },
          drawNo: { $first: '$drawNo' },
          wonTicket: { $first: '$wonTicket' },
          totalWinners: { $sum: '$winnersCount' },
          result: {
            $push: {
              category: '$_id',
              winnersCount: '$winnersCount',
              prices: '$price',
              totalPrices: {
                $multiply: ['$price', { $sum: { $size: '$tickets' } }],
              },
              tickets: '$ticketsToShow',
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

    const order = constValues.drawCategoryArray;
    drawResult.result.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    return drawResult;
  },

};

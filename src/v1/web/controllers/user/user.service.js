// modules
const { ObjectId } = require('mongoose').Types;
// models
const { Order } = require('../../../models/index');
// helpers
// const constValues = require('../../../../helpers/constants');

module.exports = {

  getUserTickets: async (req) => {
    const { query, user } = req;
    const { skip, limit, year } = query;
    const { id } = user;
    let skipLimitQuery = [];

    if (skip && limit) {
      skipLimitQuery = [{ $skip: Number(skip) }, { $limit: Number(limit) }];
    }
    console.log(skipLimitQuery );

    return Order.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$date' }, Number(year)] },
              { $eq: ['$userId', ObjectId(id)] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'draws',
          localField: 'drawId',
          foreignField: '_id',
          as: 'drawDetails',
        },
      },
      {
        $unwind: { path: '$drawDetails', preserveNullAndEmptyArrays: true },
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
          ticketId: { $first: { $ifNull: ['$ticketId', ''] } },
          purchaseDate: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          sortDate: { $first: '$date' },
          drawName: { $first: { $concat: ['$drawDetails.drawName', ' ', '$drawDetails.drawNo', ' ', '(', { $dateToString: { format: '%Y-%m-%d', date: '$drawDetails.date' } }, ')'] } },
          products: {
            $push: {
              price: '$tickets.cost',
              quantity: '$tickets.quantity',
              tickets: '$tickets.ticketNumbers',
              raffleId: { $ifNull: ['$tickets.raffleId', ''] },
            },
          },
        },
      },
      {
        $sort: {
          sortDate: -1,
        },
      },
      {
        $project: {
          sortDate: 0,
        },
      },
      ...skipLimitQuery,
    ]);
  },

};

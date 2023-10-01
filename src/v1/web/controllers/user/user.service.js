// modules
const { ObjectId } = require('mongoose').Types;
// models
const { Order, Booking } = require('../../../models/index');
// helpers
const constValues = require('../../../../helpers/constants');

module.exports = {

  getUserTickets: async (req) => {
    const { query, user } = req;
    const { skip, limit, year } = query;
    const { id } = user;
    let skipLimitQuery = [];
    let currentYear = new Date().getFullYear();

    if (skip && limit) {
      skipLimitQuery = [{ $skip: Number(skip) }, { $limit: Number(limit) }];
    }
    if (year && year !== '') currentYear = Number(year);
    console.log(skipLimitQuery);

    return Order.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$date' }, currentYear] },
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

  getUserTransactions: (req) => {
    const { user } = req;
    const { id } = user;

    return Booking.aggregate([
      {
        $match: {
          userId: ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderData',
        },
      },
      {
        $unwind: { path: '$orderData', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$_id',
          transactionId: { $first: '$transactionId' },
          paymentStatus: {
            $first: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$paymentStatus', constValues.paymentStatus.SUCCESS] },
                    then: 'Complete',
                  },
                  {
                    case: { $eq: ['$paymentStatus', constValues.paymentStatus.PENDING] },
                    then: 'Pending',
                  },
                  {
                    case: { $eq: ['$paymentStatus', constValues.paymentStatus.FAILED] },
                    then: 'Failed',
                  },
                ],
                default: 'Not Available',
              },
            },
          },
          date: { $first: '$date' },
          amount: { $first: '$userPaid' },
          ticketId: { $first: '$orderData.ticketId' },
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ]);
  },

};

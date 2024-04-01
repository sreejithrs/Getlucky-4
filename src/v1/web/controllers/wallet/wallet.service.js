// modules
const { ObjectId } = require('mongoose').Types;
// models
const { WalletHistory } = require('../../../models/index');
// helpers
const constValues = require('../../../../helpers/constants');

module.exports = {

  getWalletTransactions: async (req) => {
    try {
      const { query, user } = req;
      const { id, wallet } = user;
      const { skip, limit, type } = query;

      const data = await WalletHistory.aggregate([
        {
          $match: {
            userId: ObjectId(id),
          },
        },
        {
          $project: {
            _id: 1,
            date: 1,
            amount: 1,
            balance: 1,
            paymentStatus: 1,
            type: 1,
            transactionId: 1,
          },
        },
        {
          $unionWith: {
            coll: 'bookings',
            pipeline: [
              {
                $match: {
                  userId: ObjectId(id),
                  type: constValues.paymentCategoryCode.WALLET_PURCHASE,
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
                $project: {
                  _id: 1,
                  date: 1,
                  amount: '$userPaid',
                  ticketId: '$orderData.ticketId',
                  balance: 1,
                  paymentStatus: 1,
                  type: 1,
                  transactionId: 1,
                },
              },
            ],
          },
        },
        {
          $sort: {
            date: -1,
          },
        },
        {
          $group: {
            _id: null,
            wallet: { $first: wallet },
            transactions: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            wallet: 1,
            transactions: 1,
          },
        },
      ]);

      const filterObj = {
        1: 'WALLET_CREDIT',
        2: 'WINNING_AMOUNT',
        3: 'WALLET_WITHDRAW',
        4: 'WALLET_PURCHASE',
      };

      if (!data.length || !data[0].transactions.length) return { wallet, totalCount: 0, transactions: [] };

      const result = data[0];
      if (type && type !== '') {
        result.transactions = result.transactions.filter((elem) => elem.type === filterObj[Number(type)]);
      }

      result.totalCount = result.transactions.length;
      result.transactions = result.transactions.slice(Number(skip), Number(skip) + Number(limit));
      return result;
    } catch (err) {
      return err;
    }
  },
};

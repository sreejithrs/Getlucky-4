// modules
const { ObjectId } = require('mongoose').Types;

// models
const { WalletHistory, Bank } = require('../../../models/index');

// helpers
const winston = require('../../../../config/winston.config');
const constValues = require('../../../../helpers/constants');
const commonService = require('../../../services/common.service');

module.exports = {

  getWithdrawRequests: async (query) => {
    try {
      const { skip, limit, status } = query;
      let payStatus = [Number(status)];
      if (!status || status === '') payStatus = [0, 1, 2];

      const requests = await WalletHistory.aggregate([
        {
          $match: {
            type: constValues.paymentCategoryCode.WALLET_WITHDRAW,
            paymentStatus: { $in: payStatus },
          },
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
          $unwind: { path: '$userData', preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$userData.name' },
            status: {
              $first: {
                $arrayElemAt: [
                  Object.values(constValues.withdrawRequest),
                  '$paymentStatus',
                ],
              },
            },
            paymentMethod: {
              $first: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$paymentMethod', 'bank'] },
                      then: 'Bank Transfer',
                    },
                    {
                      case: { $eq: ['$paymentMethod', 'westernUnion'] },
                      then: 'Western Union',
                    },
                  ],
                  default: '',
                },
              },
            },
            phoneNumber: { $first: '$userData.phoneNumber' },
            amount: { $first: '$amount' },
            date: { $first: '$date' },
          },
        },
        {
          $sort: {
            date: -1,
          },
        },
        {
          $skip: Number(skip),
        },
        {
          $limit: Number(limit),
        },
      ]);
      const totalCount = await commonService.count(WalletHistory, {
        type: constValues.paymentCategoryCode.WALLET_WITHDRAW,
        paymentStatus: { $in: payStatus },
      }) || 0;
      return { totalCount, requests };
    } catch (err) {
      winston.log('error -> withdrawList', err);
      return err;
    }
  },

  getWithdrawRequest: async (req) => {
    try {
      const { params } = req;
      const { id } = params;

      const [data] = await WalletHistory.aggregate([
        {
          $match: {
            _id: ObjectId(id),
          },
        },
        {
          $addFields: {
            type: {
              $cond: {
                if: { $eq: ['$paymentMethod', 'bank'] },
                then: 'bank',
                else: 'westernUnion',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'bankaccounts',
            localField: 'bankId',
            foreignField: '_id',
            as: 'bankInfo',
          },
        },
        {
          $unwind: { path: '$bankInfo', preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            info: {
              $cond: {
                if: { $eq: ['$paymentMethod', 'bank'] },
                then: {
                  bankId: '$bankInfo._id',
                  _id: '$_id',
                  amount: '$amount',
                  status: '$paymentStatus',
                  bankName: '$bankInfo.bankName',
                  country: '$bankInfo.country',
                  accountHolder: '$bankInfo.accountHolder',
                  iBan: '$bankInfo.iBan',
                  bic: '$bankInfo.bic',
                },
                else: {
                  _id: '$_id',
                  amount: '$amount',
                  firstName: '$userInfo.westernUnion.firstName',
                  lastName: '$userInfo.westernUnion.firstName',
                  country: '$userInfo.westernUnion.country',
                  phoneNumber: '$userInfo.westernUnion.phoneNumber',
                  status: '$paymentStatus',
                },
              },
            },
          },
        },
        {
          $replaceRoot: { newRoot: '$info' },
        },
      ]);

      if (!data) return {};
      let dataToSend = { ...data };

      if (data.bankName) {
        const { bankId, ...rest } = data;
        const bankData = await commonService.findOneById(Bank, bankId);
        dataToSend = { ...rest, iBan: bankData.iBan, bic: bankData.bic };
      }

      return dataToSend;
    } catch (err) {
      winston.log('error -> withdrawRequest', err);
      return err;
    }
  },
};

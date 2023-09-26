// modules
const { ObjectId } = require('mongoose').Types;

// models
const { Order } = require('../../../models/index');

// helpers
const constValues = require('../../../../helpers/constants');
const { reverseString, getPermutations } = require('../../../../helpers/utils');

module.exports = {

  getDrawResults: async (ticket, drawId) => {
    const straight = ticket;
    const reverse = reverseString(ticket);
    const mixNumbers = getPermutations(ticket);
    console.log(straight);
    console.log(reverse);

    const regexPattern = new RegExp(`${ticket.slice(-2)}$`);

    const rumbleQuery = { $in: mixNumbers };
    const chanceQuery = {
      $regex: regexPattern,
    };
    const filterChanceQuery = { $regexMatch: { input: '$$ticket', regex: regexPattern } };
    const filterRumbleQuery = { $in: ['$$ticket', mixNumbers] };

    const chanceObj = { query: chanceQuery, filterQuery: filterChanceQuery, type: constValues.priceCategory.CHANCE };
    const rumbleObj = { query: rumbleQuery, filterQuery: filterRumbleQuery, type: constValues.priceCategory.RUMBLE };

    const winnersChance = await module.exports.findWinner(drawId, chanceObj);
    const winnersRumble = await module.exports.findWinner(drawId, rumbleObj);
    console.log(winnersChance);
    console.log(winnersRumble);
  },

  findWinner: (drawId, data) => {
    const { query, filterQuery, type } = data;
    return Order.aggregate([
      {
        $match: {
          drawId: ObjectId(drawId),
          status: constValues.status.ACTIVE,
        },
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
        $lookup: {
          from: 'products',
          localField: 'tickets.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: { path: '$product', preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          'tickets.ticketNumber': query,
        },
      },
      {
        $addFields: {
          pin: {
            $filter: {
              input: '$tickets.ticketNumber',
              as: 'ticket',
              cond: filterQuery,
            },
          },
        },
      },
      {
        $group: {
          _id: '$userId',
          userId: { $first: '$userId' },
          productId: { $first: '$product._id' },
          ticketNumbers: { $first: '$pin' },
          category: { $first: '$product.name' },
          matchOrder: { $first: type },
          priceAmount: { $first: { $multiply: [constValues.priceAmount.CHANCE, { $size: '$pin' }] } },
        },
      },
    ]);
  },
};

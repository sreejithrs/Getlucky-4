// modules
const { ObjectId } = require('mongoose').Types;

// models
const { Order, Winner, Draw } = require('../../../models/index');

// helpers
const constValues = require('../../../../helpers/constants');
const { getPermutations } = require('../../../../helpers/utils');
const commonService = require('../../../services/common.service');

module.exports = {

  calculateDrawResult: async (ticket, drawId) => {
    const straight = [ticket];
    const mixNumbers = getPermutations(ticket);
    const regexPattern = new RegExp(`${ticket.slice(-2)}$`);

    const straightQuery = { $in: straight };
    const rumbleQuery = { $in: mixNumbers };
    const chanceQuery = {
      $regex: regexPattern,
    };

    const filterChanceQuery = { $regexMatch: { input: '$$ticket', regex: regexPattern } };
    const filterRumbleQuery = { $in: ['$$ticket', mixNumbers] };
    const filterStraightQuery = { $in: ['$$ticket', straight] };

    const chanceObj = {
      query: chanceQuery, filterQuery: filterChanceQuery, category: constValues.priceCategory.CHANCE, price: constValues.priceAmount.CHANCE,
    };
    const rumbleObj = {
      query: rumbleQuery, filterQuery: filterRumbleQuery, category: constValues.priceCategory.RUMBLE, price: constValues.priceAmount.RUMBLE,
    };
    const straightObj = {
      query: straightQuery, filterQuery: filterStraightQuery, category: constValues.priceCategory.STRAIGHT, price: constValues.priceAmount.STRAIGHT,
    };

    const winnersChance = await module.exports.findWinner(drawId, chanceObj);
    const winnersRumble = await module.exports.findWinner(drawId, rumbleObj);
    const straightRumble = await module.exports.findWinner(drawId, straightObj);
    const dateToSave = [...winnersChance, ...winnersRumble, ...straightRumble];

    console.log(dateToSave);
    const getWinners = await commonService.findAllByFields(Winner, { drawId });
    if (getWinners.length) await commonService.delete({ drawId });
    if (dateToSave.length) await commonService.insertMany(Winner, dateToSave);
  },

  findWinner: (drawId, data) => {
    const {
      query, filterQuery, category, price,
    } = data;
    return Order.aggregate([
      {
        $match: {
          drawId: ObjectId(drawId),
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
          'tickets.ticketNumbers': query,
        },
      },
      {
        $addFields: {
          pin: {
            $filter: {
              input: '$tickets.ticketNumbers',
              as: 'ticket',
              cond: filterQuery,
            },
          },
        },
      },
      {
        $unwind: { path: '$pin', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$_id',
          drawId: { $first: '$drawId' },
          userId: { $first: '$userId' },
          productId: { $first: '$product._id' },
          ticketNumbers: { $push: '$pin' },
          matchOrder: { $first: category },
        },
      },
      {
        $addFields: {
          priceAmount: { $multiply: [price, { $size: '$ticketNumbers' }] },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  },

  drawResult: async (drawId) => Draw.aggregate([
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
        as: 'winners',
      },
    },
    {
      $group: {
        _id: '$_id',
        drawName: { $first: '$drawName' },
        drawNo: { $first: '$drawNo' },
        date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        winners: { $first: '$winners' },
        straight: { $first: '$straight' },
        rumble: { $first: '$rumble' },
        chance: { $first: '$chance' },
      },
    },
  ]),
};

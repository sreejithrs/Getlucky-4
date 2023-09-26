// modules
const moment = require('moment');
// models
const { Product } = require('../../../models/index');

module.exports = {

  getPlay: async () => {
    const currentDate = new Date();
    const oneDayAdd = new Date(moment(currentDate, 'YYYY-MM-DD').add(1, 'days'));
    const twoDaysAdd = new Date(moment(currentDate, 'YYYY-MM-DD').add(2, 'days'));

    return Product.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'draws',
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    status: true,
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $expr: {
                              $gte: [
                                '$date',
                                currentDate,
                              ],
                            },
                          },
                          {
                            $expr: {
                              $lte: [
                                oneDayAdd,
                                '$date',
                              ],
                            },
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $expr: {
                              $gte: [
                                '$date',
                                currentDate,
                              ],
                            },
                          },
                          {
                            $expr: {
                              $lte: [
                                twoDaysAdd,
                                '$date',
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
          as: 'drawDetails',
        },
      },
      {
        $unwind: { path: '$drawDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: {
            $min: {
              $cond: [
                {
                  $eq: [
                    {
                      $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$drawDetails.date',
                      },
                    },
                    oneDayAdd,
                  ],
                },
                {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$drawDetails.date',
                  },
                },
                twoDaysAdd,
              ],
            },
          },
          drawId: { $first: { $ifNull: ['$drawDetails._id', ''] } },
          drawName: { $first: { $ifNull: [{ $concat: ['$drawDetails.drawName', ' ', '$drawDetails.drawNo'] }, ''] } },
          drawDate: { $first: { $ifNull: [{ $dateToString: { format: '%Y-%m-%d', date: '$drawDetails.date' } }, ''] } },
          products: {
            $push: {
              _id: '$_id',
              name: '$name',
              image: '$image',
              cost: '$cost',
              priceAmount: '$priceAmount',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  },
};

// modules
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;
// models
const { Product, Cart } = require('../../../models/index');

module.exports = {

  getAllProducts: async (req) => {
    const userId = req.user ? req.user.id : null;
    const currentDate = new Date();
    const oneDayAdd = new Date(moment(currentDate, 'YYYY-MM-DD').add(1, 'days'));
    const twoDaysAdd = new Date(moment(currentDate, 'YYYY-MM-DD').add(2, 'days'));

    return Product.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'carts',
          pipeline: [
            {
              $match: {
                userId: { $eq: ObjectId(userId) },
              },
            },
          ],
          as: 'cartData',
        },
      },
      {
        $unwind: { path: '$cartData', preserveNullAndEmptyArrays: true },
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
              image: `${process.env.AWS_S3_URL}/$image`,
              cost: '$cost',
              ticketNumbers: {
                $cond: {
                  if: {
                    $and: [
                      { $ifNull: ['$cartData', false] },
                      { $in: ['$_id', '$cartData.products.productId'] },
                    ],
                  },
                  then: {
                    $reduce: {
                      input: {
                        $filter: {
                          input: '$cartData.products',
                          as: 'cartProduct',
                          cond: { $eq: ['$$cartProduct.productId', '$_id'] },
                        },
                      },
                      initialValue: [],
                      in: { $concatArrays: ['$$value', '$$this.ticketNumbers'] },
                    },
                  },
                  else: [],
                },
              },
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

  getOrderData: async (id) => Cart.aggregate([
    {
      $match: {
        userId: ObjectId(id),
      },
    },
    {
      $unwind: { path: '$products', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productData',
      },
    },
    {
      $unwind: { path: '$productData', preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: null,
        totalCost: { $first: '$totalCost' },
        products: {
          $push: {
            _id: '$products.productId',
            name: '$productData.name',
            priceAmount: '$productData.priceAmount',
            ticketNumbers: '$products.ticketNumbers',
            quantity: '$products.quantity',
            actualCost: { $multiply: ['$productData.cost', { $size: '$products.ticketNumbers' }] },
            cost: '$products.cost',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]),

  getCartData: async (id) => Cart.aggregate([
    {
      $match: {
        userId: ObjectId(id),
      },
    },
    {
      $unwind: { path: '$products', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productData',
      },
    },
    {
      $unwind: { path: '$productData', preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: '$_id',
        totalCost: { $first: '$totalCost' },
        data: {
          $push: {
            price: '$productData.stripe_price',
            quantity: '$products.stripeQuantity',
          },
        },
      },
    },
  ]),
};

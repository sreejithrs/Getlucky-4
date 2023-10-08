// modules
const { ObjectId } = require('mongoose').Types;
// models
const { Product, Cart } = require('../../../models/index');
// helpers
const constValues = require('../../../../helpers/constants');
const { commonFormatDate, commonDrawFind } = require('../../../common/common.service');

module.exports = {

  getHomePage: async () => Product.aggregate([
    {
      $match: {},
    },
    ...commonDrawFind(),
    {
      $lookup: {
        from: 'draws',
        pipeline: [
          {
            $match: {
              isCompleted: constValues.status.ACTIVE,
            },
          },
          commonFormatDate,
          {
            $group: {
              _id: '$_id',
              date: { $first: '$date' },
              drawName: {
                $first: {
                  $concat: ['$formattedDate', ' Draw ', '$drawNo'],
                },
              },
              wonTicket: { $first: '$wonTicket' },
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $limit: 3,
          },
          {
            $project: {
              _id: 0,
              date: 0,
            },
          },
        ],
        as: 'pastDraws',
      },
    },
    {
      $group: {
        _id: '$drawDetails._id',
        drawName: { $first: { $ifNull: [{ $concat: ['$drawDetails.drawName', ' ', '$drawDetails.drawNo'] }, ''] } },
        drawDate: { $first: { $ifNull: ['$drawDetails.date', ''] } },
        pastDraws: { $first: '$pastDraws' },
        products: {
          $push: {
            name: '$name',
            image: { $concat: [process.env.AWS_S3_URL, '/', '$image'] },
            cost: '$cost',
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

  getAllProducts: async (req) => {
    const userId = req.user ? req.user.id : null;
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
      ...commonDrawFind(),
      {
        $group: {
          _id: '$drawDetails._id',
          drawId: { $first: { $ifNull: ['$drawDetails._id', ''] } },
          drawName: { $first: { $ifNull: [{ $concat: ['$drawDetails.drawName', ' ', '$drawDetails.drawNo'] }, ''] } },
          drawDate: { $first: { $ifNull: ['$drawDetails.formattedDate', ''] } },
          products: {
            $push: {
              _id: '$_id',
              name: '$name',
              image: { $concat: [process.env.AWS_S3_URL, '/', '$image'] },
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
            productCost: '$productData.cost',
            actualCost: { $multiply: ['$productData.cost', { $size: '$products.ticketNumbers' }] },
            finalCost: '$products.cost',
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

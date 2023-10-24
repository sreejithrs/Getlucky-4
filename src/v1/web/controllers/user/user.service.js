// modules
const { ObjectId } = require('mongoose').Types;
// models
const { Order, Booking } = require('../../../models/index');
// helpers
const constValues = require('../../../../helpers/constants');
const { commonFormatDate } = require('../../../common/common.service');

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
      commonFormatDate,
      {
        $lookup: {
          from: 'draws',
          localField: 'drawId',
          foreignField: '_id',
          pipeline: [
            commonFormatDate,
          ],
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
          purchaseDate: { $first: '$formattedDate' },
          sortDate: { $first: '$date' },
          drawName: { $first: { $concat: ['$drawDetails.drawName', ' ', '$drawDetails.drawNo', ' ', '(', '$drawDetails.formattedDate', ')'] } },
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
      commonFormatDate,
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
          date: { $first: '$formattedDate' },
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

  getPDFInvoiceData: (id) => Booking.aggregate([
    {
      $match: {
        transactionId: id,
      },
    },
    commonFormatDate,
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userData',
      },
    },
    {
      $unwind: { path: '$userData', preserveNullAndEmptyArrays: false },
    },
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        pipeline: [
          {
            $lookup: {
              from: 'quantities',
              localField: '_id',
              foreignField: 'orderId',
              pipeline: [
                {
                  $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productData',
                  },
                },
                {
                  $unwind: { path: '$productData', preserveNullAndEmptyArrays: true },
                },
              ],
              as: 'tickets',
            },
          },
          {
            $addFields: {
              sequenceNumber: {
                $add: [
                  { $indexOfArray: [['$$CURRENT'], '$$CURRENT'] },
                  1,
                ],
              },
            },
          },
          {
            $unwind: { path: '$tickets', preserveNullAndEmptyArrays: true },
          },
        ],
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
        invoiceId: { $first: '$invoiceId' },
        date: { $first: '$formattedDate' },
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
        name: { $first: '$userData.name' },
        email: { $first: { $ifNull: ['$userData.email', ''] } },
        building: { $first: { $ifNull: ['$userData.building', ''] } },
        district: { $first: { $ifNull: ['$userData.district', ''] } },
        state: { $first: '$userData.state' },
        country: { $first: '$userData.country' },
        totalAmount: { $first: '$userPaid' },
        products: {
          $push: {
            siNo: '$orderData.sequenceNumber',
            productName: '$orderData.tickets.productData.name',
            tickets: { $first: '$orderData.tickets.ticketNumbers' },
            quantity: '$orderData.tickets.quantity',
            cost: '$orderData.tickets.productData.cost',
            totalCost: '$orderData.tickets.cost',
          },
        },
      },
    },
  ]),

  getTicketDetails: (id) => Booking.aggregate([
    {
      $match: {
        transactionId: id,
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
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        pipeline: [
          {
            $lookup: {
              from: 'draws',
              localField: 'drawId',
              foreignField: '_id',
              as: 'drawData',
            },
          },
          {
            $unwind: { path: '$drawData', preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: 'quantities',
              localField: '_id',
              foreignField: 'orderId',
              pipeline: [
                {
                  $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productData',
                  },
                },
                {
                  $unwind: { path: '$productData', preserveNullAndEmptyArrays: true },
                },
              ],
              as: 'tickets',
            },
          },
          {
            $unwind: { path: '$tickets', preserveNullAndEmptyArrays: true },
          },
        ],
        as: 'orderData',
      },
    },
    {
      $unwind: { path: '$orderData', preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: '$_id',
        name: { $first: '$userData.name' },
        phoneNumber: { $first: '$userData.phoneNumber' },
        paymentStatus: { $first: '$paymentStatus' },
        purchaseDate: { $first: '$orderData.date' },
        drawName: { $first: { $concat: ['$orderData.drawData.drawName', ' ', '$orderData.drawData.drawNo'] } },
        ticketId: { $first: '$orderData.ticketId' },
        products: {
          $push: {
            productName: '$orderData.tickets.productData.name',
            tickets: '$orderData.tickets.ticketNumbers',
            quantity: '$orderData.tickets.quantity',
            raffleId: '$orderData.tickets.raffleId',
          },
        },
      },
    },
    {
      $addFields: {
        totalCount: { $size: '$products' },
      },
    },
  ]),

};

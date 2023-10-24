// modules
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  createStripeProduct: async (data) => {
    const { name, cost, url } = data;
    const product = await stripe.products.create({
      name,
      default_price_data: {
        currency: 'aed',
        unit_amount: cost,
        tax_behavior: 'inclusive',
      },
      images: [
        `${process.env.AWS_S3_URL}/${url}`,
      ],
    });
    const productId = product.id;
    const priceId = product.default_price;
    return { priceId, productId };
  },

  updateStripeProduct: async (data) => {
    const { name, cost, productId } = data;
    await stripe.products.update(
      productId,
      {
        default_price: cost,
        name,
      },
    );
  },
};

const stripe = require("../../src/config/stripe");

const mockStripe = () => {
  stripe.checkout.sessions.retrieve = vi.fn();
  stripe.checkout.sessions.create = vi.fn();
  stripe.paymentIntents.retrieve = vi.fn();
  stripe.paymentIntents.create = vi.fn();
  stripe.refunds.create = vi.fn();

  return stripe;
};

module.exports = {
  stripe,
  mockStripe,
};

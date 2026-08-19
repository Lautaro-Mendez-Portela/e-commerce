const { Prisma } = require("@prisma/client");

const toDecimal = (value) => new Prisma.Decimal(value);

const addMoney = (left, right) => toDecimal(left).plus(toDecimal(right));

const multiplyMoney = (amount, quantity) => {
  return toDecimal(amount).mul(quantity).toDecimalPlaces(2);
};

const toStripeAmount = (amount) => {
  return toDecimal(amount).mul(100).toDecimalPlaces(0).toNumber();
};

exports.toDecimal = toDecimal;
exports.addMoney = addMoney;
exports.multiplyMoney = multiplyMoney;
exports.toStripeAmount = toStripeAmount;

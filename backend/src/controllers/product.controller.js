const productService = require("../services/product.service");
const {
  getPaginationParams
} = require("../utils/pagination");

exports.createProduct = async (req, res, next) => {

  try {

    const product = await productService.createProduct(
      req.body
    );

    res.status(201).json(product);

  } catch (error) {
    next(error);

  }
};

exports.getProducts = async (req, res, next) => {

  try {
    const pagination = getPaginationParams(req.query);

    const products = await productService.getProducts({
      ...pagination,
      name: req.query.name,
      search: req.query.search,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      inStock: req.query.inStock,
      sort: req.query.sort,
    });

    res.json(products);

  } catch (error) {
    next(error);

  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product =
      await productService.updateProduct(
        req.params.id,
        req.body
      );

    res.json(product);

  } catch (error) {
    next(error);

  }
};

exports.deleteProduct = async (req, res, next) => {
  try {

    await productService.deleteProduct(
      req.params.id
    );

    res.status(204).send();

  } catch (error) {
    next(error);

  }
};

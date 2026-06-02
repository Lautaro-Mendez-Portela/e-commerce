const productService = require("../services/product.service");
const {
  getPaginationParams
} = require("../utils/pagination");

exports.createProduct = async (req, res) => {

  try {

    const product = await productService.createProduct(
      req.body
    );

    res.status(201).json(product);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getProducts = async (req, res) => {

  try {
    const pagination = getPaginationParams(req.query);

    const products = await productService.getProducts({
      ...pagination,
      name: req.query.name,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    });

    res.json(products);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product =
      await productService.updateProduct(
        req.params.id,
        req.body
      );

    res.json(product);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.deleteProduct = async (req, res) => {
  try {

    await productService.deleteProduct(
      req.params.id
    );

    res.status(204).send();

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

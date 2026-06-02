const productService = require("../services/product.service");

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

    const products = await productService.getProducts();

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
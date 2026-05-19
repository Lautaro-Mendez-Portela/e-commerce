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
const express = require("express");
const swaggerUi = require("swagger-ui-express");

const openApiDocument = require("./openapi");

const router = express.Router();

const swaggerOptions = {
  customSiteTitle: "E-Commerce API Docs",
  customCss: "",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "none",
    tagsSorter: "alpha",
    operationsSorter: "alpha",
  },
};

router.get("/docs.json", (req, res) => {
  res.json(openApiDocument);
});

router.get(
  ["/docs", "/docs/"],
  swaggerUi.setup(openApiDocument, swaggerOptions)
);

router.use("/docs", swaggerUi.serveFiles(openApiDocument, swaggerOptions));

module.exports = router;

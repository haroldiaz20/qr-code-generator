var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
  //res.status(200).json({ title: 'Express', data: [{ received: true }] });
});

/** GET health status. */
router.get("/health", (req, res) => {
  return res.send({
    status: "OK",
    env: process.env.NODE_ENV,
    urlValidation: process.env.URL_DOCUMENT_VALIDATION
  });
});

module.exports = router;

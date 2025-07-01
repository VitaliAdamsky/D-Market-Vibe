// routes/coins.router.js
const express = require("express"); // Import Express :contentReference[oaicite:2]{index=2}
const {
  getKlineDataController,
} = require("../controllers/kline.controller.js");

const {
  refreshKlineStoreController,
} = require("../controllers/kline.controller.js");

const router = express.Router();
router.get("/kline", getKlineDataController);
router.get("/kline/refresh", refreshKlineStoreController);

module.exports = router;

// routes/coins.router.js
const express = require("express"); // Import Express :contentReference[oaicite:2]{index=2}
const {
  getOpenInterestDataController,
  refreshOpenInterestStoreController,
} = require("@oi/controllers/oi.controller.js");

const router = express.Router();
router.get("/oi", getOpenInterestDataController);
router.get("/oi/refresh", refreshOpenInterestStoreController);

module.exports = router;

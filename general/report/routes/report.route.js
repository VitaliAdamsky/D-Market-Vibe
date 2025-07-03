const express = require("express");

const {
  getReportController,
} = require("@general/report/controllers/report.controller.js");

const {
  getFullUrlController,
} = require("@general/report/controllers/report.controller.js");
const {
  startSelfPingingController,
  stopSelfPingingController,
} = require("../controllers/report.controller");

const router = express.Router();
router.get("/report", getReportController);
router.get("/ping/start", startSelfPingingController);
router.get("/ping/stop", stopSelfPingingController);

module.exports = router;

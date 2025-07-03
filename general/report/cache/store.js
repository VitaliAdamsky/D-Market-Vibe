const NodeCache = require("node-cache");

const urlCache = new NodeCache({ stdTTL: 0 });

module.exports = { urlCache };

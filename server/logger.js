const log4js = require("log4js");
const logger = log4js.getLogger("server")
logger.level = "info";

module.exports = logger;
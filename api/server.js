const serverless = require('serverless-http');
const { app, start } = require('../index');

// For serverless platforms, export the handler
module.exports.handler = serverless(app);

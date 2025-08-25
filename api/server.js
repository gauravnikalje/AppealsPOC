const { app } = require('../index');

// Export the Express app directly for @vercel/node
// Vercel expects a default export that is a function/server
module.exports = app;

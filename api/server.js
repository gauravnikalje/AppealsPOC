const express = require('express');
const { app: coreApp } = require('../index');

// In Vercel, requests come in as /api/..., so mount our core Express app at /api
const server = express();
server.use('/api', coreApp);

module.exports = server;

// routes/search.js
const express = require('express');
const searchRouter = express.Router();
const { search, autocomplete, getTrendingTags } = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

searchRouter.get('/', optionalAuth, search);
searchRouter.get('/autocomplete', autocomplete);
searchRouter.get('/trending-tags', getTrendingTags);

module.exports = searchRouter;

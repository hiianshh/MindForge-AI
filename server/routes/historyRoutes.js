const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const isValidOwnerId = require('../utils/identity');

const router = express.Router();

router.get('/', async (req, res, next) => {
  const { ownerId } = req.query;
  if (!isValidOwnerId(ownerId)) return res.status(400).json({ error: 'A valid browser history identifier is required.' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Session history is unavailable until MongoDB is connected.' });
  try {
    const sessions = await Session.find({ ownerId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ sessions });
  } catch (error) { next(error); }
});

module.exports = router;
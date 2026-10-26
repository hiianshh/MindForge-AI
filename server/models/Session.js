const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, match: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i },
  category: { type: String, required: true, trim: true, maxlength: 120 },
  concept: { type: String, required: true, trim: true, maxlength: 160 },
  transcript: { type: String, required: true, maxlength: 12000 },
  recitationSeconds: { type: Number, min: 0, max: 7200, default: null },
  score: { type: Number, required: true, min: 0, max: 100 },
  evaluation: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true, versionKey: false });

sessionSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
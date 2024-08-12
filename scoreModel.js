const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  userId: String,
  scoreType: {
    type: String,
    enum: ['enterprise', 'individual', 'investor'],
    required: true
  },
  scores: {
    type: Map,
    of: Number
  },
  greenScore: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', ScoreSchema);
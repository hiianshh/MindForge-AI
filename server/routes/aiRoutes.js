const express = require('express');
const { generatePassage, expandPassage, transcribeAudio, evaluateRecitation } = require('../controllers/geminiController');

const router = express.Router();

router.post('/generate', generatePassage);
router.post('/expand', expandPassage);
router.post('/transcribe', transcribeAudio);
router.post('/evaluate', evaluateRecitation);

module.exports = router;
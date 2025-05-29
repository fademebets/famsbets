const express = require('express');
const router = express.Router();
const { fetchAllSportsOddsController    } = require('../controllers/scrapeController');

router.get('/oddstrader', fetchAllSportsOddsController   );

module.exports = router;

const express = require("express");
const router = express.Router();
const { getNBAStandings } = require("../controllers/standingsController");
const { getMLBStandings } = require("../controllers/standingsController");
const { getNCAAFTeamsData } = require("../controllers/standingsController");
const { getNCAAMTeamsData } = require("../controllers/standingsController");
const { getNFLTeamsData ,getNHLTeamsData} = require("../controllers/standingsController");

router.get("/nba-standings", getNBAStandings);
router.get('/mlb-standings', getMLBStandings);
router.get('/ncaaf-standings', getNCAAFTeamsData);
router.get('/ncaam-standings', getNCAAMTeamsData);
router.get('/nfl-standings', getNFLTeamsData);
router.get('/nhl-standings', getNHLTeamsData);

module.exports = router;

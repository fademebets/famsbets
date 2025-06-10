const express = require("express");
const router = express.Router();
const { getTeamOdds } = require("../controllers/oddsController");

// GET /api/odds/team
router.get("/team", getTeamOdds);

module.exports = router;

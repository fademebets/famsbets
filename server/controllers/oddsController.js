const axios = require("axios");
require("dotenv").config();

const ODDS_API_KEY = process.env.ODDS_API_KEY;

const getTeamOdds = async (req, res) => {
  try {
    // Step 1: Get all available sports
    const sportsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/`, {
      params: { apiKey: ODDS_API_KEY }
    });

    const sports = sportsResponse.data;

    if (!sports.length) {
      return res.status(404).json({
        success: false,
        message: "No sports available."
      });
    }

    // Step 2: Fetch odds for each sport (parallel requests)
    const oddsPromises = sports.map(async sport => {
      try {
        const oddsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport.key}/odds/`, {
          params: {
            apiKey: ODDS_API_KEY,
            regions: "us",
            markets: "h2h"
          }
        });
        return {
          sport: sport,
          odds: oddsResponse.data
        };
      } catch (error) {
        console.warn(`No odds found for sport: ${sport.title}`);
        return {
          sport: sport,
          odds: []
        };
      }
    });

    const allOddsResults = await Promise.all(oddsPromises);

    res.status(200).json({
      success: true,
      results: allOddsResults
    });

  } catch (error) {
    console.error("Error fetching odds:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch odds",
      error: error.response?.data || error.message
    });
  }
};

module.exports = { getTeamOdds };

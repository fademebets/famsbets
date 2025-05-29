const axios = require('axios');

const API_KEY = "d307f39d875da2dadab548b93da8cff2";

const fetchAllSportsOddsController = async (req, res) => {
  try {
    // Step 1: Get all sports
    const sportsResponse = await axios.get('https://api.the-odds-api.com/v4/sports', {
      params: { apiKey: API_KEY }
    });
    const sports = sportsResponse.data;

    // Step 2: Fetch odds for each sport in parallel
    const oddsPromises = sports.map(async (sport) => {
      try {
        const oddsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport.key}/odds`, {
          params: {
            apiKey: API_KEY,
            regions: 'us',
            markets: 'h2h,spreads,totals'
          }
        });
        return { sport: sport.key, data: oddsResponse.data };
      } catch (error) {
        // Handle errors per sport, but continue with others
        return { sport: sport.key, error: error.response ? error.response.data : error.message };
      }
    });

    const allOdds = await Promise.all(oddsPromises);

    // Step 3: Return combined data
    res.json({
      success: true,
      totalSports: sports.length,
      oddsData: allOdds
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response ? error.response.data : error.message
    });
  }
};

module.exports = { fetchAllSportsOddsController };

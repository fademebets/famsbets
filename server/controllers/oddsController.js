const axios = require("axios");
require("dotenv").config();

const RAPIDAPI_HOST = "sportsbook-api2.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Get advantages and extract valid event keys
const getTeamOdds = async (req, res) => {
  try {
    const advantagesResponse = await axios.get(`https://${RAPIDAPI_HOST}/v0/advantages/`, {
      params: { type: "ARBITRAGE" },
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    const advantages = advantagesResponse.data.advantages;

    const eventKeys = advantages
      .map(a => a.market?.event?.key)
      .filter(key => /^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/.test(key));

    if (!eventKeys.length) {
      return res.status(404).json({
        success: false,
        message: "No valid event keys found in advantages.",
      });
    }

    const oddsResponse = await axios.get(`https://${RAPIDAPI_HOST}/v0/events/`, {
      params: {
        eventKeys: eventKeys.join(","),
      },
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    res.status(200).json({
      success: true,
      data: oddsResponse.data,
    });

  } catch (error) {
    console.error("Error fetching team odds:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team odds",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { getTeamOdds };

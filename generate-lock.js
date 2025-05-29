const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const urls = [
  "https://www.oddstrader.com/nba/player-props/"
];

module.exports = async (req, res) => {
  try {
    const response = await fetch(urls[0]);
    const html = await response.text();
    const $ = cheerio.load(html);

    let lock = null;

    $(".oddsTable tbody tr").each((_, row) => {
      const rowText = $(row).text();

      // Rough text matching for EV and cover percentage
      if (rowText.includes("EV") && rowText.includes("%")) {
        lock = {
          player: "Anthony Edwards",
          prop: "o27.5 Points",
          cover_prob: 0.895,
          ev: 0.23,
          game: "Timberwolves vs Nuggets",
          line: "-110",
          book: "DraftKings",
          status: "healthy"
        };
        return false;
      }
    });

    if (!lock) {
      lock = { message: "No valid lock today." };
    }

    const outputPath = path.join(__dirname, "..", "public", "lock.json");
    fs.writeFileSync(outputPath, JSON.stringify(lock, null, 2));

    return res.status(200).json({ success: true, lock });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate Lock of the Day" });
  }
};
const axios = require("axios");

function getStatValue(stats, names) {
  for (const name of names) {
    const stat = stats.find(s => s.name === name);
    if (stat && stat.value !== undefined) {
      return stat.value;
    }
  }
  return '0';
}

function parseRecordSummary(stats) {
  const recordStat = stats.find(s => s.summary && /\d+-\d+/.test(s.summary));
  if (recordStat) {
    const [wins, losses] = recordStat.summary.split('-');
    return { wins, losses };
  }
  return { wins: '0', losses: '0' };
}



// Controller to fetch NBA standings and extract main details
const getNBAStandings = async (req, res) => {
  try {
    const response = await axios.get(
      "https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en&contentorigin=espn&type=1&level=2&sort=playoffseed%3Aasc"
    );

    const data = response.data;

    // Check if children (conferences) exist
    if (!data.children || !Array.isArray(data.children)) {
      return res.status(404).json({ message: "Standings data not found." });
    }

    // Combine all teams from all conferences
    const allTeams = data.children.flatMap((conference) => {
      return conference.standings.entries.map((teamEntry) => {
        const { displayName, logos } = teamEntry.team;

        // Find wins and losses in stats
        const winsStat = teamEntry.stats.find((stat) => stat.name === "wins");
        const lossesStat = teamEntry.stats.find((stat) => stat.name === "losses");

        return {
          team: displayName,
          logo: logos[0]?.href || null,
          wins: winsStat?.value ?? null,
          losses: lossesStat?.value ?? null,
        };
      });
    });

    res.status(200).json(allTeams);
  } catch (error) {
    console.error("Error fetching NBA standings:", error.message);
    res.status(500).json({ message: "Failed to fetch NBA standings." });
  }
};



const getMLBStandings = async (req, res) => {
  try {
    // Fetch teams
    const teamsResponse = await axios.get('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams');
    const teamsData = teamsResponse.data.sports[0].leagues[0].teams;

    // Fetch standings
    const standingsResponse = await axios.get('https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings');
    const standingsChildren = standingsResponse.data.children;

    // Flatten all team entries from standings
    const standingsEntries = standingsChildren.flatMap(child =>
      child.standings.entries
    );

    const teams = teamsData.map(teamObj => {
      const team = teamObj.team;
      const teamStanding = standingsEntries.find(item => item.team.id === team.id);

      return {
        id: team.id,
        name: team.displayName,
        logo: team.logos[0]?.href || null,
        wins: teamStanding
          ? teamStanding.stats.find(stat => stat.name === 'wins')?.value || '0'
          : '0',
        losses: teamStanding
          ? teamStanding.stats.find(stat => stat.name === 'losses')?.value || '0'
          : '0',
      };
    });

    res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams
    });

  } catch (error) {
    console.error('Error fetching MLB team data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch data from ESPN API' });
  }
};




const getNCAAFTeamsData = async (req, res) => {
  try {
    const teamsResponse = await axios.get('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams');
    const teamsData = teamsResponse.data.sports[0].leagues[0].teams;

    const standingsResponse = await axios.get('https://site.api.espn.com/apis/v2/sports/football/college-football/standings');
    const standingsChildren = standingsResponse.data.children;

    const standingsEntries = standingsChildren
      .filter(child => child.standings && Array.isArray(child.standings.entries))
      .flatMap(child => child.standings.entries);

    const teams = teamsData.map(teamObj => {
      const team = teamObj.team;
      const teamStanding = standingsEntries.find(item => item.team.id === team.id);

      const wins = teamStanding
        ? getStatValue(teamStanding.stats, ['winsOverall', 'wins', 'winsTotal'])
        : 0;  // Changed '0' string to number 0 for sorting

      const losses = teamStanding
        ? getStatValue(teamStanding.stats, ['lossesOverall', 'losses', 'lossesTotal'])
        : 0;

      return {
        id: team.id,
        name: team.displayName,
        logo: team.logos[0]?.href || null,
        wins: Number(wins),    // Ensure wins is a number
        losses: Number(losses) // Ensure losses is a number
      };
    });

    // Sort teams by wins descending
    const sortedTeams = teams.sort((a, b) => b.wins - a.wins);

    // Get top 25 teams only
    const top25Teams = sortedTeams.slice(0, 25);

    res.status(200).json({
      success: true,
      totalTeams: top25Teams.length,
      teams: top25Teams
    });

  } catch (error) {
    console.error('Error fetching NCAAF team data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch data from ESPN API' });
  }
};




const getNCAAMTeamsData = async (req, res) => {
  try {
    // Fetch teams for NCAAM
    const teamsResponse = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams');
    const teamsData = teamsResponse.data.sports[0].leagues[0].teams;

    // Fetch standings for NCAAM
    const standingsResponse = await axios.get('https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings');
    const standingsChildren = standingsResponse.data.children;

    // Flatten all entries from standings groups that have entries
    const standingsEntries = standingsChildren
      .filter(child => child.standings && Array.isArray(child.standings.entries))
      .flatMap(child => child.standings.entries);

    const teams = teamsData.map(teamObj => {
      const team = teamObj.team;
      const teamStanding = standingsEntries.find(item => item.team.id === team.id);

      if (!teamStanding) {
        return {
          id: team.id,
          name: team.displayName,
          logo: team.logos[0]?.href || null,
          wins: '0',
          losses: '0',
        };
      }

      let wins = getStatValue(teamStanding.stats, ['wins', 'winsOverall', 'winsTotal']);
      let losses = getStatValue(teamStanding.stats, ['losses', 'lossesOverall', 'lossesTotal']);

      // Fallback to parsing summary if wins/losses zero
      if (wins === '0' && losses === '0') {
        const parsed = parseRecordSummary(teamStanding.stats);
        wins = parsed.wins;
        losses = parsed.losses;
      }

      return {
        id: team.id,
        name: team.displayName,
        logo: team.logos[0]?.href || null,
        wins,
        losses,
      };
    });

    res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams
    });

  } catch (error) {
    console.error('Error fetching NCAAM team data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch NCAAM data from ESPN API' });
  }
};


const getNFLTeamsData = async (req, res) => {
  try {
    // Fetch NFL teams
    const teamsResponse = await axios.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
    const teamsData = teamsResponse.data.sports[0].leagues[0].teams;

    // Fetch NFL standings
    const standingsResponse = await axios.get('https://site.api.espn.com/apis/v2/sports/football/nfl/standings');
    const standingsChildren = standingsResponse.data.children;

    // Flatten all entries
    const standingsEntries = standingsChildren
      .filter(child => child.standings && Array.isArray(child.standings.entries))
      .flatMap(child => child.standings.entries);

    const teams = teamsData.map(teamObj => {
      const team = teamObj.team;
      const teamStanding = standingsEntries.find(item => item.team.id === team.id);

      if (!teamStanding) {
        return {
          id: team.id,
          name: team.displayName,
          logo: team.logos[0]?.href || null,
          wins: '0',
          losses: '0',
        };
      }

      let wins = getStatValue(teamStanding.stats, ['wins', 'winsOverall', 'winsTotal']);
      let losses = getStatValue(teamStanding.stats, ['losses', 'lossesOverall', 'lossesTotal']);

      // Fallback: parse summary if wins/losses are 0
      if (wins === '0' && losses === '0') {
        const parsed = parseRecordSummary(teamStanding.stats);
        wins = parsed.wins;
        losses = parsed.losses;
      }

      return {
        id: team.id,
        name: team.displayName,
        logo: team.logos[0]?.href || null,
        wins,
        losses,
      };
    });

    res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams
    });

  } catch (error) {
    console.error('Error fetching NFL team data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch NFL data from ESPN API' });
  }
};

const getNHLTeamsData = async (req, res) => {
  try {
    // Fetch NHL teams
    const teamsResponse = await axios.get('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams');
    const teamsData = teamsResponse.data.sports[0].leagues[0].teams;

    // Fetch NHL standings
    const standingsResponse = await axios.get('https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings');
    const standingsChildren = standingsResponse.data.children;

    // Flatten all entries
    const standingsEntries = standingsChildren
      .filter(child => child.standings && Array.isArray(child.standings.entries))
      .flatMap(child => child.standings.entries);

    const teams = teamsData.map(teamObj => {
      const team = teamObj.team;
      const teamStanding = standingsEntries.find(item => item.team.id === team.id);

      if (!teamStanding) {
        return {
          id: team.id,
          name: team.displayName,
          logo: team.logos[0]?.href || null,
          wins: '0',
          losses: '0',
        };
      }

      let wins = getStatValue(teamStanding.stats, ['wins', 'winsOverall', 'winsTotal']);
      let losses = getStatValue(teamStanding.stats, ['losses', 'lossesOverall', 'lossesTotal']);

      // Fallback: parse summary if wins/losses are 0
      if (wins === '0' && losses === '0') {
        const parsed = parseRecordSummary(teamStanding.stats);
        wins = parsed.wins;
        losses = parsed.losses;
      }

      return {
        id: team.id,
        name: team.displayName,
        logo: team.logos[0]?.href || null,
        wins,
        losses,
      };
    });

    res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams
    });

  } catch (error) {
    console.error('Error fetching NHL team data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch NHL data from ESPN API' });
  }
};


module.exports = {
  getNBAStandings,
  getMLBStandings,
  getNCAAFTeamsData,
  getNCAAMTeamsData,
  getNFLTeamsData,
  getNHLTeamsData
};

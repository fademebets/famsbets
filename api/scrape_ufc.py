import json
from bs4 import BeautifulSoup
import requests

def scrape():
    results = {}
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    base_urls = {"picks": "https://www.oddstrader.com/ufc/"}

    for key, url in base_urls.items():
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            data = []

            if key == "picks":
                for game_row in soup.select("div.odds-table-row"):
                    game = {
                        "teams": [],
                        "spread": "",
                        "total": ""
                    }

                    teams = game_row.select("div.matchup-teams span.team-name")
                    if teams and len(teams) == 2:
                        game["teams"] = [t.get_text(strip=True) for t in teams]

                    spread = game_row.select_one("div.odds-spread")
                    total = game_row.select_one("div.odds-total")

                    game["spread"] = spread.get_text(strip=True) if spread else ""
                    game["total"] = total.get_text(strip=True) if total else ""

                    data.append(game)

            elif key == "props":
                for prop_block in soup.select("div.player-prop-card"):
                    player = prop_block.select_one("div.player-name")
                    stat = prop_block.select_one("div.prop-type")
                    line = prop_block.select_one("div.prop-value")

                    if player and stat and line:
                        data.append({
                            "player": player.get_text(strip=True),
                            "stat": stat.get_text(strip=True),
                            "line": line.get_text(strip=True)
                        })

            results[key] = data

        except Exception as e:
            results[key] = {"error": str(e)}

    return results

def handler(request, response):
    try:
        data = scrape()
        return response.json(data)
    except Exception as e:
        return response.json({"status": "error", "message": str(e)})

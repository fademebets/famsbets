import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time

def scrape_oddstrader():
    try:
        # Headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # URLs to scrape
        picks_url = 'https://oddstrader.com/picks'
        props_url = 'https://oddstrader.com/player-props'
        
        # Initialize data structure
        ev_picks = {
            'timestamp': datetime.now().isoformat(),
            'picks': [],
            'player_props': []
        }
        
        # Scrape picks page
        picks_response = requests.get(picks_url, headers=headers)
        if picks_response.status_code == 200:
            soup = BeautifulSoup(picks_response.text, 'html.parser')
            picks = soup.find_all('div', class_='pick-card')  # Adjust class name based on actual HTML
            
            for pick in picks:
                try:
                    pick_data = {
                        'sport': pick.find('div', class_='sport').text.strip(),
                        'game': pick.find('div', class_='game').text.strip(),
                        'pick': pick.find('div', class_='pick').text.strip(),
                        'odds': pick.find('div', class_='odds').text.strip(),
                        'ev': pick.find('div', class_='ev').text.strip(),
                        'confidence': pick.find('div', class_='confidence').text.strip()
                    }
                    ev_picks['picks'].append(pick_data)
                except Exception as e:
                    print(f"Error parsing pick: {e}")
        
        # Scrape player props page
        props_response = requests.get(props_url, headers=headers)
        if props_response.status_code == 200:
            soup = BeautifulSoup(props_response.text, 'html.parser')
            props = soup.find_all('div', class_='prop-card')  # Adjust class name based on actual HTML
            
            for prop in props:
                try:
                    prop_data = {
                        'player': prop.find('div', class_='player').text.strip(),
                        'team': prop.find('div', class_='team').text.strip(),
                        'prop': prop.find('div', class_='prop').text.strip(),
                        'line': prop.find('div', class_='line').text.strip(),
                        'odds': prop.find('div', class_='odds').text.strip(),
                        'ev': prop.find('div', class_='ev').text.strip()
                    }
                    ev_picks['player_props'].append(prop_data)
                except Exception as e:
                    print(f"Error parsing prop: {e}")
        
        # Save to JSON file
        with open('ev_picks.json', 'w') as f:
            json.dump(ev_picks, f, indent=2)
        
        return ev_picks
        
    except Exception as e:
        print(f"Error scraping Oddstrader: {e}")
        return None

def handler(event, context):
    result = scrape_oddstrader()
    if result:
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    else:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to scrape Oddstrader'})
        } 
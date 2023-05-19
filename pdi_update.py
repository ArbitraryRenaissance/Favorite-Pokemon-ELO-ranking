import requests
import json
import os
from bs4 import BeautifulSoup

hisui_pokemon = []
next_url = "https://pokeapi.co/api/v2/pokemon?limit=10000"

while next_url:
    response = requests.get(next_url)
    data = response.json()

    for pkmn in data['results']:
        if "-hisui" in pkmn['name']:
            # Get the base form name
            base_name = pkmn['name'].replace("-hisui", "")
            
            # Make another request to get the pokemon species details
            print(base_name)
            species_response = requests.get(f"https://pokeapi.co/api/v2/pokemon/{base_name}")
            if not species_response:
                print(f"{base_name} not found")
                continue
            species_data = species_response.json()

            # The id in the Pokémon species data is the national Pokedex number
            id_number = str(species_data['id']).zfill(4)  # pad with zeroes to have 4 digits

            hisui_pokemon.append((id_number, pkmn['name']))

    next_url = data['next']

print(hisui_pokemon)




# Make sure to use your own path where you want to download the images
path_to_download_folder = "pkmnlist"

def download_file(url, filename):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)

for pkmn_id, pkmn_name in hisui_pokemon:
    base_name = pkmn_name.split("-hisui")[0]  # Get the base name
    
    capname = base_name.title() + "-Hisui"
    url = f"https://bulbapedia.bulbagarden.net/wiki/File:{pkmn_id.zfill(4)}{capname}.png"
    print(f"Retrieving file from {url}")

    response = requests.get(url)
    if not response:
        continue
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the URL of the image file
    img_url = soup.find("div", class_="fullImageLink").find("a").get('href')

    # Create the filename based on your naming scheme
    filename = f"{path_to_download_folder}/{pkmn_id}_{base_name.title()}/{pkmn_id}-hisui.png"

    # Make sure the directory exists, if not, create it
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    # Download the file
    download_file('https:' + img_url, filename)

    # Print log
    print(f"Successfully downloaded to {filename}")

print(f"All downloads successful.  Now updating pokemonData_init.json...")

# Read the existing data
with open('pokemonData_init.json', 'r') as f:
    data = json.load(f)

# Append the new data
for pkmn_id, pkmn_name in hisui_pokemon:
    base_name = pkmn_name.split("-hisui")[0]  # Get the base name
    if base_name == "farfetchd":
        base_name = "farfetch'd"
    if base_name == "mr-mime":
        base_name = "Mr. Mime"
    if base_name == "darmanitan-standard":
        base_name = "darmanitan"
    if base_name == "darmanitan-zen":
        continue
    if int(pkmn_id) > 1010:
        continue

    entry = {
        "name": f"Hisuian {base_name.title()}",
        "id": pkmn_id,
        "png": f"{path_to_download_folder}/{pkmn_id}_{base_name.title()}/{pkmn_id}-hisui.png",
        "elo": 1500,
        "RD": 350,
        "last_game": 0,
        "generation": 7,
        "variants": ["hisuian"],
        "isactive": True
    }

    data.append(entry)
    print(f"Hisuian {base_name.capitalize()} has been given an entry.")

# Write the data back to the file
with open('pokemonData_init.json', 'w') as f:
    json.dump(data, f, indent=4)


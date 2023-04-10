async function getPokemonData() {
    const response = await fetch('./pokemonData.json');
    const data = await response.json();
    return data;
}

async function updatePokemonData(pokemonData) {
    try {
        const response = await fetch('./update-pokemon-data', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(pokemonData)
        });
        if (!response.ok) {
        throw new Error('Failed to write to file');
        }
    } catch (error) {
        console.error(error);
    }
}

function calculate_elo_change(pokemon1, pokemon2, winner, competition_number){
    // Initialize the constants
    const t1 = competition_number - pokemon1.last_game;
    const t2 = competition_number - pokemon2.last_game;
    const r1 = pokemon1.elo;
    const r2 = pokemon2.elo;
    const c = 7.75;
    const s1 = winner ? 1 : 0; // superfluous, actually: winner is already 0 or 1
    const s2 = 1 - s1;

    // Update RDs for calculation
    const rd1 = Math.min(Math.sqrt(pokemon1.RD*pokemon1.RD + c*c*t1), 350);
    const rd2 = Math.min(Math.sqrt(pokemon2.RD*pokemon2.RD + c*c*t2), 350);

    /* Determine new ratings */
    // Establish constants
    const q = 0.00575646273;
    const pi = 3.1415926536;
    const g1 = Math.pow(1 + 3*(q*rd1/pi)*(q*rd1/pi), -0.5);
    const g2 = Math.pow(1 + 3*(q*rd2/pi)*(q*rd2/pi), -0.5);
    // establish expectation of 1 winning and 2 winning
    const e1 = 1/(1 + Math.pow(10, (g2*(r1-r2))*-0.0025));
    const e2 = 1/(1 + Math.pow(10, (g1*(r2-r1))*-0.0025));
    // another set of constants
    const d1 = q*q*g2*g2*e1*(1-e1);
    const d2 = q*q*g1*g1*e2*(1-e2);
    // calculate rating diff
    const dr1 = q/(1/(rd1*rd1) + d1) * (g2 * (s1 - e1));
    const dr2 = q/(1/(rd2*rd2) + d2) * (g1 * (s2 - e2));

    /* Determine new RD based on outcome */
    rd1 = Math.pow(1/(rd1*rd1) + d1, -0.5);
    rd2 = Math.pow(1/(rd2*rd2) + d2, -0.5);

    return [[dr1, rd1], [dr2, rd2]];
}

function getRandomPokemon(pokemonData) {
    const randomIndex = Math.floor(Math.random() * pokemonData.length);
    return pokemonData[randomIndex];
}

function getClosestPokemon(pokemon, pokemonData) {
    const shuffledPokemon = [...pokemonData]; // make a copy of the array
    for (let i = shuffledPokemon.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPokemon[i], shuffledPokemon[j]] = [shuffledPokemon[j], shuffledPokemon[i]];
    }
    const sortedPokemon = shuffledPokemon.sort((a, b) => {
        const diffA = Math.abs(a.elo - pokemon.elo);
        const diffB = Math.abs(b.elo - pokemon.elo);
        return diffA - diffB;
    });
    return sortedPokemon.slice(0, 20);
}

function getRandomPokemonFromArray(pokemonArray) {
    const randomIndex = Math.floor(Math.random() * pokemonArray.length);
    return pokemonArray[randomIndex];
}

function selectTwoPokemon(pokemonData) {
    let firstPokemon = getRandomPokemon(pokemonData);
    let closePokemon = getClosestPokemon(firstPokemon, pokemonData);
    let secondPokemon;
    if (Math.random() < 0.05) {
        do{
        secondPokemon = getRandomPokemon(pokemonData);
        } while (firstPokemon.name === secondPokemon.name)
    } else {
        do{
        secondPokemon = getRandomPokemonFromArray(closePokemon);
        } while (firstPokemon.name === secondPokemon.name);
    }
    return [firstPokemon, secondPokemon];
}

async function updateHTML() {
    const _pokemonData = await getPokemonData();
    const [pokemonA, pokemonB] = selectTwoPokemon(_pokemonData);

    // Get the HTML elements by their IDs
    const pokemon1Img = document.getElementById("pokemon1");
    const pokemon1Name = document.getElementById("pokemon1-name");
    const pokemon2Img = document.getElementById("pokemon2");
    const pokemon2Name = document.getElementById("pokemon2-name");

    // Generate two random Pokemon and update the HTML elements
    pokemon1Img.src = pokemonA.png;
    pokemon1Name.innerText = pokemonA.name;
    pokemon2Img.src = pokemonB.png;
    pokemon2Name.innerText = pokemonB.name;
}

document.addEventListener("DOMContentLoaded", function() {
    updateHTML();
  });
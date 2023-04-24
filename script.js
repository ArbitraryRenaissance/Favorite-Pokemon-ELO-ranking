let _pokemonData;
let _competitionData;
let _pokemon1;
let _pokemon2;
let _leaderboard;

async function getPokemonData() {
    try {
        const response = await fetch('./pokemonData.json');
        if (response.status === 404) {
            console.log('pokemonData.json not found. Generating new file...');
            const newData = await generatePokemonData();
            console.log('New pokemonData.json file generated successfully.');
            return newData;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getCompetitionData() {
    try {
        const response = await fetch('./competitions.json');
        if (response.status === 404) {
            console.log('competitions.json not found. Generating new file...');
            const newData = await generateCompetitionData();
            console.log('New competitions.json file generated successfully.');
            return newData;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getLeaderboard() {
    try {
        const response = await fetch('./leaderboard.json');
        if (response.status === 404) {
            console.log('leaderboard.json not found. Generating new file...');
            const newData = await generateLeaderboard(_pokemonData);
            console.log('New leaderboard.json file generated successfully.');
            return newData;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function generatePokemonData() {
    const response = await fetch('./pokemonData_init.json');
    const pokemonList = await response.json();
    await updatePokemonData(pokemonList);
    return pokemonList;
}

async function generateCompetitionData() {
    let competition_data = {
        competition_counter: 1,
        competition_history: []
    };
    await updateCompetitionData(competition_data);
    return competition_data;
}

async function generateLeaderboard(pokemonData) {
    const sortedPokemon = [...pokemonData].sort((a, b) => b.elo - a.elo); // Sort by ELO rating
    const topPokemon = sortedPokemon.slice(0, 10); // Get the top 10 pokemon

    const leaderboard = topPokemon.map((pokemon, index) => {
        return {
            rank: index + 1,
            name: pokemon.name,
            score: pokemon.elo,
            rd: pokemon.RD,
        };
    });

    await updateLeaderboard(leaderboard);
    return leaderboard;
}

async function updatePokemonData(pokemonData) {
    try {
        const response = await fetch('http://localhost:3000/update-pokemon-data', {
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

async function updateCompetitionData(competitionData) {
    try {
        const response = await fetch('http://localhost:3000/update-competition-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(competitionData)
        });
        if (!response.ok) {
            throw new Error('Failed to write to file');
        }
    } catch (error) {
        console.error(error);
    }
}

async function updateLeaderboard(leaderboard) {
    try {
        const response = await fetch('http://localhost:3000/update-leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leaderboard)
        });
        if (!response.ok) {
            throw new Error('Failed to write to file');
        }
    } catch (error) {
        console.error(error);
    }
}

function calculateEloChange(pokemon1, pokemon2, winner, competition_number) {
    // Initialize the constants
    const t1 = competition_number - pokemon1.last_game;
    const t2 = competition_number - pokemon2.last_game;
    const r1 = pokemon1.elo;
    const r2 = pokemon2.elo;
    const c = 7.75;
    const s1 = winner ? 1 : 0; // superfluous, actually: winner is already 0 or 1
    const s2 = 1 - s1;

    // Update RDs for calculation
    const rd1 = Math.min(Math.sqrt(pokemon1.RD * pokemon1.RD + c * c * t1), 350);
    const rd2 = Math.min(Math.sqrt(pokemon2.RD * pokemon2.RD + c * c * t2), 350);

    /* Determine new ratings */
    // Establish constants
    const q = 0.00575646273;
    const pi = 3.1415926536;
    const g1 = Math.pow(1 + 3 * (q * rd1 / pi) * (q * rd1 / pi), -0.5);
    const g2 = Math.pow(1 + 3 * (q * rd2 / pi) * (q * rd2 / pi), -0.5);
    // establish expectation of 1 winning and 2 winning
    const e1 = 1 / (1 + Math.pow(10, (g2 * (r1 - r2)) * -0.0025));
    const e2 = 1 / (1 + Math.pow(10, (g1 * (r2 - r1)) * -0.0025));
    // another set of constants
    const d1 = q * q * g2 * g2 * e1 * (1 - e1);
    const d2 = q * q * g1 * g1 * e2 * (1 - e2);
    // calculate rating diff
    const dr1 = q / (1 / (rd1 * rd1) + d1) * (g2 * (s1 - e1));
    const dr2 = q / (1 / (rd2 * rd2) + d2) * (g1 * (s2 - e2));

    /* Determine new RD based on outcome */
    const newrd1 = Math.pow(1 / (rd1 * rd1) + d1, -0.5);
    const newrd2 = Math.pow(1 / (rd2 * rd2) + d2, -0.5);

    return [[dr1, newrd1], [dr2, newrd2]];
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
        do {
            secondPokemon = getRandomPokemon(pokemonData);
        } while (firstPokemon.name === secondPokemon.name)
    } else {
        do {
            secondPokemon = getRandomPokemonFromArray(closePokemon);
        } while (firstPokemon.name === secondPokemon.name);
    }
    return [firstPokemon, secondPokemon];
}

async function updateHTML(pokemonA, pokemonB) {
    // Get the HTML elements by their IDs
    const pokemon1Img = document.getElementById("pokemon1-img");
    const pokemon1Name = document.getElementById("pokemon1-name");
    const pokemon2Img = document.getElementById("pokemon2-img");
    const pokemon2Name = document.getElementById("pokemon2-name");

    // Generate two random Pokemon and update the HTML elements
    pokemon1Img.src = pokemonA.png;
    pokemon1Name.innerText = pokemonA.name;
    pokemon2Img.src = pokemonB.png;
    pokemon2Name.innerText = pokemonB.name;
}

async function makeLeaderboard(leaderboard) {
    const tableBody = document.querySelector('#leaderboard-table tbody');
    tableBody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.classList.add('lb-entry');

        const rank = document.createElement('td');
        rank.classList.add('lb-rank');
        rank.textContent = index + 1;
        row.appendChild(rank);

        const name = document.createElement('td');
        name.classList.add('lb-name');
        name.textContent = entry.name;
        row.appendChild(name);

        const score = document.createElement('td');
        score.classList.add('lb-elo');
        score.textContent = `${entry.score} (±${entry.rd})`;
        row.appendChild(score);

        tableBody.appendChild(row);
    });
}

async function handlePokemonClick(event, winner, pokemon1, pokemon2,
    pokemonData, competitionData) {
    // Get competition number
    const competition_number = competitionData.competition_counter;

    // Obtain new ELO and RDs
    const elo_info = calculateEloChange(pokemon1, pokemon2, winner, competition_number);

    // Make a log of the competition
    const pokemon1Copy = { ...pokemon1 };
    const pokemon2Copy = { ...pokemon2 };
    const time = new Date(Date.now()).toLocaleString();
    const comp = {
        pokemon1: pokemon1Copy,
        pokemon2: pokemon2Copy,
        outcome: winner,
        timestamp: time
    };

    // Update the values
    pokemon1.elo += elo_info[0][0];
    pokemon1.RD = elo_info[0][1];
    pokemon1.last_game = competition_number;
    pokemon2.elo += elo_info[1][0];
    pokemon2.RD = elo_info[1][1];
    pokemon2.last_game = competition_number;
    pokemonData[parseInt(pokemon1.id) - 1] = pokemon1;
    pokemonData[parseInt(pokemon2.id) - 1] = pokemon2;
    competitionData.competition_counter += 1;
    competitionData.competition_history.push(comp);

    // Update the globals
    _pokemonData = pokemonData;
    _competitionData = competitionData;

    // Save the values
    await updatePokemonData(pokemonData);
    await updateCompetitionData(competitionData);

    // Add ELO change element to DOM and set its text content and position
    const eloPlus = Math.round(winner ? elo_info[0][0] : elo_info[1][0]);
    const eloChangeEl = document.createElement('div');
    eloChangeEl.id = 'elo-change';
    eloChangeEl.textContent = `+${eloPlus}`;
    eloChangeEl.style.top = `${event.clientY}px`;
    eloChangeEl.style.left = `${event.clientX}px`;
    document.body.appendChild(eloChangeEl);

    const opacityInterval = 10 / 1000;
    const translateInterval = event.clientY / 1000;
    let currentOpacity = 100;
    let currentTranslateY = 0;
    const intervalId = setInterval(() => {
        currentOpacity -= opacityInterval * 100;
        currentTranslateY -= translateInterval;
        eloChangeEl.style.opacity = currentOpacity / 100;
        eloChangeEl.style.transform = `translateY(${currentTranslateY}px)`;
        if (currentOpacity <= 0) {
            clearInterval(intervalId);
            document.body.removeChild(eloChangeEl);
        }
    }, 10);

    // Choose new Pokemon
    [_pokemon1, _pokemon2] = selectTwoPokemon(pokemonData);
    updateHTML(_pokemon1, _pokemon2);
}

document.addEventListener("DOMContentLoaded", async function () {
    _pokemonData = await getPokemonData();
    _competitionData = await getCompetitionData();
    _leaderboard = await getLeaderboard();
    [_pokemon1, _pokemon2] = selectTwoPokemon(_pokemonData);
    updateHTML(_pokemon1, _pokemon2);
    makeLeaderboard(_leaderboard);

    document.getElementById("pokemon1").addEventListener("mouseup", function (event) {
        handlePokemonClick(event, 1, _pokemon1, _pokemon2, _pokemonData, _competitionData);
    });
    document.getElementById("pokemon2").addEventListener("mouseup", function (event) {
        handlePokemonClick(event, 0, _pokemon1, _pokemon2, _pokemonData, _competitionData);
    });
});
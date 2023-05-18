import config from './config.js';
const { apiBaseUrl } = config;
const progressBarColors = [
    '#2ecc71', // Tier 0: Light Green
    '#00FFFF', // Tier 1: Cyan
    '#4141f4', // Tier 2: Rich Blue
    '#a34fed', // Tier 3: Lavender-Purple
    '#fa65d5', // Tier 4: Pastel Pink
    '#fc4040', // Tier 5: Red
    '#FFA500', // Tier 6: Orange
    '#fefe4e', // Tier 7: Yellow
    '#FFD700', // Tier 8: Gold
    '#FFD700'  // Tier 9: Gold
];

let _pokemonData;
let _competitionData;
let _pokemon1;
let _pokemon2;
let _leaderboard;
let _currentTier;
let _preloadQueue;
const imageCache = new Map();

async function getPokemonData() {
    try {
        const localData = localStorage.getItem('pokemonData');
        if (localData) {
            return JSON.parse(localData);
        }

        const response = await fetch(`${apiBaseUrl}/pokemon-data-init`);
        const data = await response.json();

        localStorage.setItem('pokemonData', JSON.stringify(data));

        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getCompetitionData() {
    try {
        const localData = localStorage.getItem('competitions');
        if (localData) {
            const data = JSON.parse(localData);
            if (data.competition_counter) { // Fix legacy datatype
                return data.competition_history;
            }
            return data;
        }
        let competition_data = [];
        localStorage.setItem('competitions', JSON.stringify(competition_data));

        return competition_data;
    } catch (error) {
        console.error(error);
    }
}

async function getPreloadQueue() {
    try {
        const localData = localStorage.getItem('preloadQueue');
        if (localData) {
            return JSON.parse(localData);
        }
        let preloadQueue = [];
        localStorage.setItem('preloadQueue', JSON.stringify(preloadQueue));

        return preloadQueue;
    } catch (error) {
        console.error(error);
    }
} 

async function getLeaderboard() {
    try {
        const localData = localStorage.getItem('leaderboard');
        if (localData) {
            return JSON.parse(localData);
        }

        const data = await generateLeaderboard(_pokemonData);

        localStorage.setItem('leaderboard', JSON.stringify(data));

        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getCurrentTier(competitionData) {
    // Define the tier thresholds
    const tierThresholds = [5, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // Retrieve the currentTier from localStorage or set it to -1 if not found
    let currentTier = parseInt(localStorage.getItem('currentTier')) || -1;

    // If currentTier is not found in localStorage, calculate it based on the length of _competitionData
    if (currentTier === -1) {
        currentTier = tierThresholds.findIndex(threshold => competitionData.length < threshold);
        localStorage.setItem('currentTier', currentTier);
    }

    // Check if the current tier was found, otherwise set it to the highest tier
    if (currentTier === -1) {
        currentTier = tierThresholds.length;
        localStorage.setItem('currentTier', currentTier);
    }
    return currentTier;
}

async function loadTierDescriptions(tier) {
    try {
        const response = await fetch(`${apiBaseUrl}/tier-descriptions?tier=${tier}`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const tierDescription = await response.json();
        return tierDescription;
    } catch (error) {
        console.error('Error fetching tier description:', error);
    }
}


async function updatePokemonData(pokemonData) {
    try {
        localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
    } catch (error) {
        console.error(error);
    }
}

async function updateCompetitionData(competitionData) {
    try {
        localStorage.setItem('competitions', JSON.stringify(competitionData));
    } catch (error) {
        console.error(error);
    }
}

async function updatePreloadQueue(preloadQueue) {
    try {
        localStorage.setItem('preloadQueue', JSON.stringify(preloadQueue));
    } catch (error) {
        console.error(error);
    } 
}

async function updateLeaderboard(leaderboard) {
    try {
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    } catch (error) {
        console.error(error);
    }
}

async function generateLeaderboard(pokemonData) {
    const sortedPokemon = [...pokemonData].sort((a, b) => b.elo - a.elo); // Sort by ELO rating

    const leaderboard = sortedPokemon.map((pokemon, index) => {
        return {
            rank: index + 1,
            name: pokemon.name,
            score: Math.round(pokemon.elo),
            rd: Math.round(pokemon.RD),
        };
    });
    return leaderboard;
}

function calculateEloChange(pokemon1, pokemon2, winner, competition_number) {
    // Initialize the constants
    const t1 = competition_number - pokemon1.last_game;
    const t2 = competition_number - pokemon2.last_game;
    const r1 = pokemon1.elo;
    const r2 = pokemon2.elo;
    const c = 1.1;
    const s1 = winner;
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
    // Select the first pokemon: 
    // choose two random pokemon and go with the one with smaller last_game
    let firstCandidate = getRandomPokemon(pokemonData);
    let secondCandidate = getRandomPokemon(pokemonData);

    let firstPokemon = firstCandidate.last_game < secondCandidate.last_game ? firstCandidate :
        secondCandidate.last_game < firstCandidate.last_game ? secondCandidate :
            Math.random() < 0.5 ? firstCandidate : secondCandidate;

    // Select the second pokemon:
    // 5% chance: choose completely randomly
    // 95% chance: choose randomly from 20 pokemon with closest elo
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
    preloadImage(pokemonA).then(() => {
        pokemon1Img.src = imageCache.get(`${apiBaseUrl}/${pokemonA.png}`);
        pokemon1Name.innerText = pokemonA.name;
    }).catch(error => {
        console.error(`Failed to load image for ${pokemonA.name}: ${error}`);
    });    
    
    preloadImage(pokemonB).then(() => {
        pokemon2Img.src = imageCache.get(`${apiBaseUrl}/${pokemonB.png}`);
        pokemon2Name.innerText = pokemonB.name;
    }).catch(error => {
        console.error(`Failed to load image for ${pokemonB.name}: ${error}`);
    });

    // Update the progress bar
    updateProgressBar(_competitionData.length);
}

async function undoLastMatch() {
    // Check if there is at least one completed competition
    if (_competitionData.length == 0) {
        return;
    }

    // Retrieve and remove the last competition from competitionData
    const lastCompetition = _competitionData.pop();

    // Retrieve the previous Pokemon
    const previousPokemon1 = lastCompetition.pokemon1;
    const previousPokemon2 = lastCompetition.pokemon2;

    // Update _pokemon1 and _pokemon2 variables
    _pokemon1 = previousPokemon1;
    _pokemon2 = previousPokemon2;

    // Add back the undone pair to the preloadQueue
    _preloadQueue.unshift({ pair: [_pokemon1, _pokemon2], preloaded: true });

    // update _pokemonData
    _pokemonData[parseInt(_pokemon1.id) - 1] = _pokemon1;
    _pokemonData[parseInt(_pokemon2.id) - 1] = _pokemon2;

    // regenerate the leaderboard
    _leaderboard = await generateLeaderboard(_pokemonData);

    // Save the values
    await updatePokemonData(_pokemonData);
    await updateCompetitionData(_competitionData);
    await updateLeaderboard(_leaderboard);
    await updatePreloadQueue(_preloadQueue);

    // Update the HTML
    makeLeaderboard(_leaderboard);
    updateHTML(previousPokemon1, previousPokemon2);
}

function getContainerCenter(containerId) {
    const container = document.getElementById(containerId);
    const rect = container.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return { x, y };
}

async function makeLeaderboard(leaderboard) {
    const topPokemon = leaderboard.slice(0, 10); // Get the top 10 pokemon
    const tableBody = document.querySelector('#leaderboard-table tbody');
    tableBody.innerHTML = '';
    topPokemon.forEach((entry, index) => {
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

function createCompetitionLogEntry(pokemon1, pokemon2, winner, competition_number) {
    const pokemon1Copy = { ...pokemon1 };
    const pokemon2Copy = { ...pokemon2 };
    const time = new Date(Date.now()).toLocaleString();
    const comp = {
        pokemon1: pokemon1Copy,
        pokemon2: pokemon2Copy,
        outcome: winner,
        timestamp: time
    };
    return comp;
}

async function updateGlobalData(pokemon1, pokemon2, elo_info, pokemonData, competitionData, comp) {
    // Update the values
    pokemon1.elo += elo_info[0][0];
    pokemon1.RD = elo_info[0][1];
    pokemon1.last_game = competitionData.length + 1;
    pokemon2.elo += elo_info[1][0];
    pokemon2.RD = elo_info[1][1];
    pokemon2.last_game = competitionData.length + 1;
    const index1 = pokemonData.findIndex(p => p.name === pokemon1.name);
    const index2 = pokemonData.findIndex(p => p.name === pokemon2.name);
    if (index1 !== -1) {
        pokemonData[index1] = pokemon1;
    }
    if (index2 !== -1) {
        pokemonData[index2] = pokemon2;
    }
    competitionData.push(comp);

    // Update the globals
    _pokemonData = pokemonData;
    _competitionData = competitionData;
    _preloadQueue.shift();
    managePreloadQueue();

    // Refresh the leaderboard
    _leaderboard = await generateLeaderboard(pokemonData);

    // Save the values
    await updatePokemonData(pokemonData);
    await updateCompetitionData(competitionData);
    await updateLeaderboard(_leaderboard);
    await updatePreloadQueue(_preloadQueue);
}

function handleEloChangeAnimation(x, y, eloPlus) {
    const eloChangeEl = document.createElement('div');
    eloChangeEl.id = 'elo-change';
    eloChangeEl.textContent = eloPlus ? `+${eloPlus}` : "=";
    eloChangeEl.style.top = `${y}px`;
    eloChangeEl.style.left = `${x}px`;
    document.body.appendChild(eloChangeEl);

    const opacityInterval = 10 / 1000;
    const translateInterval = y / 1000;
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
}

async function prepareNewCompetition(pokemonData) {
    const newPokemonPair = await getNextPair();
    updateHTML(newPokemonPair[0], newPokemonPair[1]);
    makeLeaderboard(await generateLeaderboard(pokemonData));
    return newPokemonPair;
}

async function handlePokemonClick(x, y, winner, pokemon1, pokemon2,
    pokemonData, competitionData) {
    const competition_number = competitionData.length + 1;
    const elo_info = calculateEloChange(pokemon1, pokemon2, winner, competition_number);

    const comp = createCompetitionLogEntry(pokemon1, pokemon2, winner, competition_number);
    updateGlobalData(pokemon1, pokemon2, elo_info, pokemonData, competitionData, comp);

    const eloPlus = Math.round(winner ? elo_info[0][0] : elo_info[1][0]);
    handleEloChangeAnimation(x, y, eloPlus);

    // Choose new Pokemon, update HTML
    const newPokemonPair = await prepareNewCompetition(pokemonData);
    _pokemon1 = newPokemonPair[0];
    _pokemon2 = newPokemonPair[1];
}

async function handleDraw(pokemon1, pokemon2, pokemonData, competitionData) {
    const competition_number = competitionData.length + 1;
    const elo_info = calculateEloChange(pokemon1, pokemon2, 0.5, competition_number);

    const comp = createCompetitionLogEntry(pokemon1, pokemon2, 0.5, competition_number);
    updateGlobalData(pokemon1, pokemon2, elo_info, pokemonData, competitionData, comp);

    const center1 = getContainerCenter('pokemon1');
    const center2 = getContainerCenter('pokemon2');
    const p1_elo_change = Math.round(elo_info[0][0]);
    const p2_elo_change = Math.round(elo_info[1][0]);

    if (p1_elo_change > p2_elo_change) {
        handleEloChangeAnimation(center1.x, center1.y, p1_elo_change);
    } else if (p1_elo_change < p2_elo_change) {
        handleEloChangeAnimation(center2.x, center2.y, p2_elo_change);
    } else {
        handleEloChangeAnimation(0.5 * (center1.x + center2.x), center1.y, 0);
    }

    // Choose new Pokemon, update HTML
    const newPokemonPair = await prepareNewCompetition(pokemonData);
    _pokemon1 = newPokemonPair[0];
    _pokemon2 = newPokemonPair[1];
}

function fixLastGame(pokemon, competition_history) {
    for (let i = competition_history.length - 1; i >= 0; i--) {
        const entry = competition_history[i];
        if (entry.pokemon1.name === pokemon.name || entry.pokemon2.name === pokemon.name) {
            pokemon.last_game = i + 1;
            break;
        }
    }
}

function showModal(title, description) {
    const tierModal = document.getElementById("tierModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");

    modalTitle.textContent = title;
    modalDescription.textContent = description;
    tierModal.style.display = "block";
}

function updateElementVisibility() {
    const lookupPageButton = document.getElementById('lookupPageButton');
    const leaderboardTable = document.getElementById('leaderboard-table');

    if (_currentTier >= 2) {
        lookupPageButton.classList.remove('hidden');
    } else {
        lookupPageButton.classList.add('hidden');
    }

    if (_currentTier >= 5) {
        leaderboardTable.classList.remove('hidden');
    } else {
        leaderboardTable.classList.add('hidden');
    }
}

async function updateProgressBar(currentCompleted) {
    // Define the tier thresholds
    const tierThresholds = [5, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // Update the current tier if a new one is reached
    if (currentCompleted >= tierThresholds[_currentTier]) {
        _currentTier++;
        document.getElementById('tier-text').innerText = `Tier ${_currentTier}`;
        const tier_text = await loadTierDescriptions(_currentTier);
        updateElementVisibility();
        showModal(tier_text.title, tier_text.description);
        localStorage.setItem('currentTier', _currentTier);
    }

    // Find the target for the next tier
    const targetForNextTier = tierThresholds[_currentTier];

    // Calculate the completion percentage
    const completionPercentage = (currentCompleted / targetForNextTier) * 100;

    // Update the progress bar's width and choose its color
    const progressBarFilled = document.querySelector(".progress-bar-filled");
    progressBarFilled.style.backgroundColor = progressBarColors[_currentTier];
    progressBarFilled.style.width = `${completionPercentage}%`;

    // Update the progress text
    const progressText = document.querySelector(".progress-text");
    progressText.textContent = `${currentCompleted}/${targetForNextTier}`;
}

function preloadImage(pokemon) {
    const imageUrl = `${apiBaseUrl}/${pokemon.png}`;

    // If image is already preloaded, return the Pokemon immediately
    if (imageCache.has(imageUrl)) {
        return Promise.resolve(pokemon);
    }

    return fetch(imageUrl, { cache: 'force-cache' })
        .then(response => response.blob())
        .then(blob => {
            const img = new Image();
            const blobUrl = URL.createObjectURL(blob);
            img.onload = () => URL.revokeObjectURL(blobUrl);  // release memory once the image is loaded

            imageCache.set(imageUrl, blobUrl);  // store the blobUrl in the map
            return pokemon;
        })
        .catch(error => {
            throw new Error(`Failed to load image for ${pokemon.name}: ${error}`);
        });
}

// This function manages the preload queue
async function managePreloadQueue() {
    // If there are less than 5 Pokemon pairs in the queue, add more
    while (_preloadQueue.length < 5) {
        const newPokemonPair = selectTwoPokemon(_pokemonData);
        _preloadQueue.push({
            pair: newPokemonPair,
            preloaded: false
        });
        updatePreloadQueue(_preloadQueue);
    }

    // Preload the image of the pairs that haven't been preloaded
    for (const pokemon of _preloadQueue) {
        if (!pokemon.preloaded) {
            await preloadImage(pokemon.pair[0]);
            await preloadImage(pokemon.pair[1]);
            pokemon.preloaded = true;
        }
    }
}

async function getNextPair() {
    // Wait until the first pair in the queue has been preloaded
    while (!_preloadQueue[0].preloaded) {
        // Add a delay here to avoid hogging the CPU
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Return the first pair from the queue without removing it
    return _preloadQueue[0].pair;
}

document.addEventListener("DOMContentLoaded", async function () {
    _pokemonData = await getPokemonData();
    _competitionData = await getCompetitionData();
    _currentTier = await getCurrentTier(_competitionData);
    updateElementVisibility();

    _leaderboard = await getLeaderboard();
    _preloadQueue = await getPreloadQueue();
    managePreloadQueue();
    [_pokemon1, _pokemon2] = await getNextPair();
    updateHTML(_pokemon1, _pokemon2);
    makeLeaderboard(_leaderboard);

    document.getElementById('tier-text').innerText = `Tier ${_currentTier}`;

    document.getElementById('lookupPageButton').addEventListener('click', () => {
        window.location.href = '/lookup';
    });
    document.getElementById("pokemon1").addEventListener("mouseup", function (event) {
        const x = event.clientX;
        const y = event.clientY;
        handlePokemonClick(x, y, 1, _pokemon1, _pokemon2, _pokemonData, _competitionData);
    });
    document.getElementById("pokemon2").addEventListener("mouseup", function (event) {
        const x = event.clientX;
        const y = event.clientY;
        handlePokemonClick(x, y, 0, _pokemon1, _pokemon2, _pokemonData, _competitionData);
    });
    document.getElementById('draw-button').addEventListener('mouseup', function () {
        handleDraw(_pokemon1, _pokemon2, _pokemonData, _competitionData);
    });
    document.getElementById('undoButton').addEventListener('mouseup', undoLastMatch);

    document.getElementById("modalCloseButton").onclick = function () {
        tierModal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === tierModal) {
            tierModal.style.display = "none";
        }
    };
});
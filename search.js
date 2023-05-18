import config from './config.js';
const { apiBaseUrl } = config;

const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
let highlightedIndex = -1;

document.getElementById('mainPageButton').addEventListener('click', () => {
    window.location.href = '/';
});

function validateSearchInput(searchInputValue) {
    if (!searchInputValue) {
        return 'Please enter a Pokemon name.';
    }
    return null;
}

function getStoredData() {
    const r_pokemonData = localStorage.getItem("pokemonData");
    const r_leaderboard = localStorage.getItem("leaderboard");
    const r_competitions = localStorage.getItem("competitions");

    if (r_pokemonData && r_leaderboard && r_competitions) {
        const pokemonData = JSON.parse(r_pokemonData);
        const leaderboard = JSON.parse(r_leaderboard);
        const competitions = JSON.parse(r_competitions);

        return {
            success: true,
            data: {
                pokemonData,
                leaderboard,
                competitions
            }
        };
    } else {
        return {
            success: false,
            errorMessage: 'You need to do at least one competition.'
        };
    }
}

function findPokemonData(searchInputValue, pokemonData, leaderboard) {
    const pokemon = pokemonData.find(p => p.name.toLowerCase() === searchInputValue.toLowerCase());
    const entry = leaderboard.find(p => p.name.toLowerCase() === searchInputValue.toLowerCase());
    
    if (pokemon && entry) {
        return { pokemon, entry };
    }
    return null;
}

function getMatchups(searchInputValue, competitions) {
    return competitions.filter(p =>
        p.pokemon1.name.toLowerCase() === searchInputValue.toLowerCase() ||
        p.pokemon2.name.toLowerCase() === searchInputValue.toLowerCase()
    );
}

function updatePokemonDisplay(pokemon, entry) {
    const pokemonInfoDiv = document.getElementById('search-info-wrapper');
    const pokemonImageDiv = document.getElementById('search-pokemon-image-container');
    const pokemonNameDiv = document.getElementById('search-pokemon-name-container');

    pokemonNameDiv.innerHTML = `
    <h2 id="pokemonName">${pokemon.name}</h2>
    `;
    pokemonImageDiv.innerHTML = `
    <img id="pokemonImage" src="${pokemon.png}" alt="${pokemon.name}" />
    `;
    pokemonInfoDiv.innerHTML = `
    <p id="pokemonElo">ELO Rating: ${Math.round(pokemon.elo)} (± ${Math.round(pokemon.RD)})</p>
    <p id="pokemonRanking">Current ranking: ${entry.rank}</p>
    `;
}

function populateCompetitionHistory(matchups, pokemon) {
    const competitionHistoryBody = document.getElementById('competitionHistoryBody');
    competitionHistoryBody.innerHTML = ''; // Clear existing table rows

    const competitionHistoryDiv = document.querySelector('.competition-history');
    competitionHistoryDiv.style.display = 'block';

    // Reverse the array to display in reverse chronological order
    const reversedMatchups = matchups.slice().reverse();

    reversedMatchups.forEach(matchup => {
        const row = document.createElement('tr');

        const isWin = (matchup.pokemon1.name === pokemon.name && matchup.outcome === 1) || 
            (matchup.pokemon2.name === pokemon.name && matchup.outcome === 0);
        const isDraw = matchup.outcome === 0.5;

        if (isDraw) {
            row.classList.add('draw');
        } else {
            row.classList.add(isWin ? 'win' : 'loss');
        }

        const outcomeCell = document.createElement('td');
        outcomeCell.textContent = isDraw ? 'Draw' : (isWin ? 'Win' : 'Loss');

        const pokemonCell = document.createElement('td');
        pokemonCell.textContent = pokemon.name;

        const opponentCell = document.createElement('td');
        opponentCell.textContent = matchup.pokemon1.name === pokemon.name ? 
            matchup.pokemon2.name : matchup.pokemon1.name;

        row.appendChild(pokemonCell);
        row.appendChild(opponentCell);
        row.appendChild(outcomeCell);

        competitionHistoryBody.appendChild(row);
    });
}

async function performSearch() {
    const searchInputValue = searchInput.value;

    const errorMessage = validateSearchInput(searchInputValue);
    if (errorMessage) {
        alert(errorMessage);
        return;
    }

    const storedData = getStoredData();
    if (!storedData.success) {
        alert(storedData.errorMessage);
        return;
    }
    const { pokemonData, leaderboard, competitions } = storedData.data;

    const result = findPokemonData(searchInputValue, pokemonData, leaderboard);
    if (!result) {
        alert('Pokemon not found');
        return;
    }
    const { pokemon, entry } = result;

    const matchups = getMatchups(searchInputValue, competitions);

    updatePokemonDisplay(pokemon, entry);
    populateCompetitionHistory(matchups, pokemon);
}

document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await performSearch();
});

// Autocomplete
searchInput.addEventListener('input', async (event) => {
    const searchTerm = event.target.value;

    if (!searchTerm) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/autocomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ term: searchTerm })
        });

        if (response.ok) {
            const suggestions = await response.json();
            displaySuggestions(suggestions);
        } else {
            suggestionsDiv.style.display = 'none';
        }
    } catch (error) {
        console.error('Error:', error);
    }
    highlightedIndex = -1;
});

searchInput.addEventListener('keydown', async (event) => {
    const listItems = suggestionsDiv.getElementsByTagName('li');

    // Arrow down
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (highlightedIndex < listItems.length - 1) {
            if (highlightedIndex > -1) {
                listItems[highlightedIndex].classList.remove('highlighted');
            }
            highlightedIndex++;
            listItems[highlightedIndex].classList.add('highlighted');
        }
    }
    // Arrow up
    else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (highlightedIndex > 0) {
            listItems[highlightedIndex].classList.remove('highlighted');
            highlightedIndex--;
            listItems[highlightedIndex].classList.add('highlighted');
        }
    }
    // Enter
    else if (event.key === 'Enter' && highlightedIndex > -1) {
        event.preventDefault();
        searchInput.value = listItems[highlightedIndex].textContent;
        suggestionsDiv.style.display = 'none';

        // Perform search
        await performSearch();
    }
});

function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    suggestionsDiv.style.display = 'block';
    const list = document.createElement('ul');
    suggestions.forEach(suggestion => {
        const listItem = document.createElement('li');
        listItem.textContent = suggestion;
        listItem.addEventListener('click', () => {
            searchInput.value = listItem.textContent;
            suggestionsDiv.style.display = 'none';
        });
        list.appendChild(listItem);
    });

    suggestionsDiv.innerHTML = '';
    suggestionsDiv.appendChild(list);
}

// Hide suggestions when clicked outside
document.addEventListener('click', (event) => {
    if (event.target !== searchInput) {
        suggestionsDiv.style.display = 'none';
    }
});
const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
let highlightedIndex = -1;

document.getElementById('mainPageButton').addEventListener('click', () => {
    window.location.href = 'main.html';
});


// Search function
async function performSearch() {
    const searchInputValue = searchInput.value;
    const pokemonInfoDiv = document.getElementById('search-info-wrapper');
    const pokemonImageDiv = document.getElementById('search-pokemon-image-container');
    const pokemonNameDiv = document.getElementById('search-pokemon-name-container');

    if (!searchInputValue) {
        alert('Please enter a Pokemon name.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: searchInputValue })
        });

        if (response.ok) {
            const pokemon = await response.json();
            pokemonNameDiv.innerHTML = `
            <h2 id="pokemonName">${pokemon.name}</h2>
            `;
            pokemonImageDiv.innerHTML = `
            <img id="pokemonImage" src="${pokemon.png}" alt="${pokemon.name}" />
            `;
            pokemonInfoDiv.innerHTML = `
            <p id="pokemonElo">ELO Rating: ${Math.round(pokemon.elo)} (± ${Math.round(pokemon.RD)})</p>
            <p id="pokemonRanking">Current ranking: ${pokemon.rank}</p>
            `;

            // Load competition history
            const competitionHistoryBody = document.getElementById('competitionHistoryBody');
            competitionHistoryBody.innerHTML = ''; // Clear existing table rows

            const competitionHistoryDiv = document.querySelector('.competition-history');
            competitionHistoryDiv.style.display = 'block';

            // Reverse the array to display in reverse chronological order
            const reversedMatchups = pokemon.matchups.slice().reverse();

            reversedMatchups.forEach(matchup => {
                const row = document.createElement('tr');
                
                const isWin = (matchup.pokemon1.name === pokemon.name && matchup.outcome === 1) || (matchup.pokemon2.name === pokemon.name && matchup.outcome === 0);
                
                row.classList.add(isWin ? 'win' : 'loss');

                const outcomeCell = document.createElement('td');
                outcomeCell.textContent = isWin ? 'Win' : 'Loss';

                const pokemonCell = document.createElement('td');
                pokemonCell.textContent = pokemon.name;

                const opponentCell = document.createElement('td');
                opponentCell.textContent = matchup.pokemon1.name === pokemon.name ? matchup.pokemon2.name : matchup.pokemon1.name;

                row.appendChild(pokemonCell);
                row.appendChild(opponentCell);
                row.appendChild(outcomeCell);

                competitionHistoryBody.appendChild(row);
            });
        } else {
            alert('Pokemon not found.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
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
        const response = await fetch('http://localhost:3000/autocomplete', {
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
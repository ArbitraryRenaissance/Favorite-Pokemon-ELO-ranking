const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
let highlightedIndex = -1;

document.getElementById('mainPageButton').addEventListener('click', () => {
    window.location.href = 'main.html';
});


// Search function
async function performSearch() {
    const searchInputValue = searchInput.value;
    const pokemonInfoDiv = document.getElementById('pokemonInfo');

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
            pokemonInfoDiv.innerHTML = `
            <div class="pokemon-name-container">
                <h2 id="pokemonName">${pokemon.name}</h2>
            </div>
            <div class="pokemon-details-container">
                <div class="pokemon-image-container">
                    <img id="pokemonImage" src="${pokemon.png}" alt="${pokemon.name}" />
                </div>
                <div class="pokemon-info-container">
                    <p id="pokemonElo">Rating: ${Math.round(pokemon.elo)} (± ${Math.round(pokemon.RD)})</p>
                    <!-- Add other info elements here -->
                </div>
            </div>
            `;
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
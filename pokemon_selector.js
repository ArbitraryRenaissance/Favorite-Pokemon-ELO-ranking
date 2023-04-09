async function getPokemonData() {
    const response = await fetch('./pokemonData.json');
    const data = await response.json();
    return data;
  }

function getRandomPokemon(pokemonData) {
    const randomIndex = Math.floor(Math.random() * pokemonData.length);
    return pokemonData[randomIndex];
}

function getClosestPokemon(pokemon, pokemonData) {
    const sortedPokemon = [...pokemonData].sort((a, b) => {
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
function competition(pokemon1, pokemon2, winner, competition_number){
    // Initialize the constants
    const t1 = competition_number - pokemon1.last_game;
    const t2 = competition_number - pokemon2.last_game;
    const r1 = pokemon1.elo;
    const r2 = pokemon2.elo;
    const c = 7.75;
    const s1 = winner ? 1 : 0;
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
    // update
    pokemon1.elo += dr1;
    pokemon2.elo += dr2;

    /* Determine new RD based on outcome */
    pokemon1.RD = Math.pow(1/(rd1*rd1) + d1, -0.5);
    pokemon2.RD = Math.pow(1/(rd2*rd2) + d2, -0.5);

    /* Update the last game played for each pokemon */
    pokemon1.last_game = competition_number;
    pokemon2.last_game = competition_number;
}

// Import required modules
const fs = require('fs');

// Define the main function
function main() {
  // Load the sample Pokémon data
  const pokemonData = JSON.parse(fs.readFileSync('pokemonData.json'));

  // Simulate some competitions between the Pokémon
  const bulbasaur = pokemonData[0];
  const ivysaur = pokemonData[1];
  const venusaur = pokemonData[2];
  competition(bulbasaur, ivysaur, 1, 1);
  // Print the updated ratings and ratings deviations of the Pokémon
  console.log(`${bulbasaur.name}: ELO ${bulbasaur.elo.toFixed(2)}, RD ${bulbasaur.RD.toFixed(2)}`);
  console.log(`${ivysaur.name}: ELO ${ivysaur.elo.toFixed(2)}, RD ${ivysaur.RD.toFixed(2)}`);
  console.log(`${venusaur.name}: ELO ${venusaur.elo.toFixed(2)}, RD ${venusaur.RD.toFixed(2)}`);
}

// Call the main function
main();
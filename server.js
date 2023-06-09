const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const oneDay = 86400000;

app.use(bodyParser.json({ limit: '50mb' })); // increase the limit to 50mb
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const cors = require('cors');
const allowedOrigins = ['http://localhost:8080', 'https://www.betterpokemon.app'];
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

const test_corsOptions = {
    origin: function (origin, callback) {
        callback(null, true);  // Allow all origins
    }
};
app.use(cors(corsOptions));

app.use(express.json());

app.use(express.static(path.join(__dirname), {
    maxAge: oneDay,
    setHeaders: function (res, path, stat) {
        res.set('Cache-Control', 'public, max-age=86400');
    }
}));

async function generatePokemonData() {
    return new Promise((resolve, reject) => {
        fs.readFile('pokemonData_init.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading pokemonData_init.json:', err);
                reject('Error generating pokemon data');
            } else {
                const pokemonList = JSON.parse(data);
                fs.writeFile('pokemonData.json', JSON.stringify(pokemonList), 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing pokemonData.json:', err);
                        reject('Error generating pokemon data');
                    } else {
                        resolve(pokemonList);
                    }
                });
            }
        });
    });
}

app.get('/pokemon-data-init', async (req, res) => {
    try {
        const newData = await generatePokemonData();
        res.json(newData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

app.get('/tier-descriptions', (req, res) => {
    const tier = parseInt(req.query.tier);
    fs.readFile('tier_descriptions.json', 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            res.status(500).send('Error reading JSON file');
            return;
        }
        const tierDescriptions = JSON.parse(data);
        if (tier >= 1 && tier <= tierDescriptions.length) {
            res.json(tierDescriptions[tier - 1]);
        } else {
            res.status(400).send('Invalid tier number');
        }
    });
});


app.post('/autocomplete', (req, res) => {
    const { term } = req.body;

    fs.readFile('pokemonData_init.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading pokemonData.json:', err);
            return res.status(500).send('Internal server error');
        }

        const pokemonData = JSON.parse(data);
        const suggestions = pokemonData
            .filter(p => p.name.toLowerCase().startsWith(term.toLowerCase()))
            .map(p => p.name)
            .slice(0, 5); // Limit the number of suggestions

        res.json(suggestions);
    });
});

/* Clean URLs */
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/lookup', function (req, res) {
    res.sendFile(path.join(__dirname + '/lookup.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
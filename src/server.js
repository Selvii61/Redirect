const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const authenticate = (req, res, next) => {
    let authHeader = process.env.TOKEN ;
    if (!authHeader) {
        res.status(401).send('Authentifizierung erforderlich');
        return;
    }
    if (authHeader) {
        next();
    }
};
app.get('/entries',authenticate, (req, res) => {
    fs.readFile('src/redirect.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Fehler beim Lesen der Datei');
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            res.status(500).send('Fehler beim Parsen der JSON-Daten');
            return;
        }
    });
}
);

app.delete('/entry/:slug', (req, res) => {
    let target = req.params.slug;

    fs.readFile('src/redirect.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Fehler beim Lesen der Datei');
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            res.status(500).send('Fehler beim Parsen der JSON-Daten');
            return;
        }

        if (jsonData[target]) {
            delete jsonData[target];
            fs.writeFile('src/redirect.json', JSON.stringify(jsonData), (writeErr) => {
                if (writeErr) {
                    res.status(500).send('Fehler beim Schreiben der Datei');
                    return;
                }

                res.status(200).send('Eintrag gelöscht');
            });
        } else {
            res.status(404).send('Schlüssel nicht gefunden');
        }
    });
});



app.get('/:slug', (req, res) => {
    let target = req.params.slug;

    fs.readFile('src/redirect.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Fehler beim Lesen der Datei');
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            res.status(500).send('Fehler beim Parsen der JSON-Daten');
            return;
        }

        if (jsonData[target]) {
            res.redirect(jsonData[target]);
        } else {
            res.status(404).send('Schlüssel nicht gefunden');
        }
    });
});

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

app.post('/entry',(req, res) => {
    console.log(req.body);
    let slug = req.body.slug;
    let url = req.body.url;
    if (slug == null) {
        slug = generateRandomString(5);
    }

    if (url == null) {
        res.status(400).send('URL fehlt');
        return;
    }

    fs.readFile('src/redirect.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Fehler beim Lesen der Datei');
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data); 
        } catch (parseErr) {
            res.status(500).send('Fehler beim Parsen der JSON-Daten');
            return;
        }
        if (jsonData[slug]) {
            res.status(409).send('Schlüssel existiert bereits');
            return;
        }

        jsonData[slug] = url;

        fs.writeFile('src/redirect.json', JSON.stringify(jsonData, null, 2), (writeErr) => {
            if (writeErr) {
                res.status(500).send('Fehler beim Schreiben der Datei');
                return;
            }

            res.send(`Neuer Eintrag: slug = ${slug}, url = ${url}`);
        });
    });
});







const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
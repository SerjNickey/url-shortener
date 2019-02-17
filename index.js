require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dns = require('dns');
const { MongoClient } = require('mongodb');
const nanoid = require('nanoid');

const databaseUrl = process.env.DATABASE;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

MongoClient.connect(databaseUrl, { useNewUrlParser: true })
  .then(client => {
    app.locals.db = client.db('url-shortener-117');
  })
  .catch(() => console.error('Failed to connect to the database'));

const shortenUrl = (db, url) => {
  const shortenedUrls = db.collection('shortenedUrls');
  return shortenedUrls.findOneAndUpdate({ original_url: url },
    {
      $setOnInsert: {
        original_url: url,
        short_id: nanoid(7)
      }
    },
    {
      returnOriginal: false,
      upsert: true
    }
  );
};

const checkIfShortIdExists = (db, code) => db.collection('shortenedUrls')
  .findOne({ short_id: code });

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(htmlPath);
});

app.post('/new', (req, res) =>{

  let originalUrl;

  try {
    originalUrl = new URL(req.body.url);
  } catch (err) {
    return res.status(400).send({ error: 'invalid URL' });
  }

  dns.lookup(originalUrl.hostname, (err) => {
    if (err) {
      return res.status(404).send({ error: 'Adress not found' })
    };

    const { db } = req.app.locals;
    shortenUrl(db, originalUrl.href)
      .then(result => {
        const doc = result.value;
        res.json({
          original_url: doc.original_url,
          short_id: doc.short_id
        });
      })
      .catch(console.error);
  });
});

app.get('/:short_id', (req, res) => {
  const shortId = req.params.short_id;

  const { db } = req.app.locals;
  checkIfShortIdExists(db, shortId)
    .then(doc => {
      if (doc === null) return res.send('We could not find a link at that URL');

      res.redirect(doc.original_url);
    })
    .catch(console.error);
});

app.set('port', process.env.PORT || 3000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running on port: ${server.address().port}`);
});

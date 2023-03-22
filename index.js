require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const url = require('url');

// Mongo and Schema setup
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  url: {type: String, required: true}
});

const URLs = mongoose.model("URLs", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Solution
app.use(express.urlencoded({ extended: true }));

app.post('/api/shorturl', (req, res) => {
  let newUrl = req.body.url;
  const checkUrl = url.parse(newUrl);
  if(checkUrl.protocol == "ftp:") {
    console.log(`error - protocol: ${checkUrl.protocol} hostname: ${checkUrl.hostname}`);
    res.json({ error: 'invalid url' });
  }
  else {
    dns.lookup(checkUrl.hostname, (err, address, family) => {
      if (err) return res.json({ error: 'invalid url' });
      else {
        console.log(`ok - protocol: ${checkUrl.protocol} hostname: ${checkUrl.hostname}`);
        const urlRecord = new URLs({url: newUrl});
        urlRecord.save((err, insertedUrl) => {
          if(err) return console.error(err);
          res.json({"original_url": insertedUrl.url,"short_url": insertedUrl.id});
        });
      }
    });
  }
});

app.get('/api/shorturl/:url', (req, res) => {
  let searchUrl = req.params.url;
  URLs.findById(searchUrl, (err, urlFound) => {
    if (err) return console.error(err);
    res.redirect(urlFound.url);
  });
});

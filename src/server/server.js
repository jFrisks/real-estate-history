const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const scraper = require('./mainScraper')();
const port = 3000;

//cross-origin handling
app.use(cors());

// Configuring body parser middleware and hooks http body and hooks to req.body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))

app.get('/', (req, res) => {
    res.send('Hello World, from express');
});

app.get('/getListing/*', async (req, res) => {
    //TODO: parse utl correctly back to normal (if :url is encoded)
    const url = req.params[0];

    //Starting mainParser and get listing
    const listingInfo = await scraper.getListings([url])
    res.status(200).json(listingInfo);
})
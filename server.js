"user strict";

require('dotenv').config();
//importing 3rd party libraries
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const {PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config');

//creates new express app
const app = express()

//log the http layer
app.use(morgan('common'));

//creates a static web server, servers static assets
app.use(express.static('public'));

//parse request body
app.use(express.json());

//Cross-Origin
app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

 app.get('/api/*', (req, res) => {
   res.json({ok: true});
 });

 app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

 module.exports = {app};

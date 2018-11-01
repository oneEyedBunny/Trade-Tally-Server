"use strict";

//importing 3rd party libraries
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwtAuth = require('../auth/jwt-auth');

var twilio = require('twilio');
const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN} = require('../config');

//Instantiate a REST client using your account sid and auth token
var client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Sends the text message
 router.post('/', jwtAuth,(req, res, next) => {
   console.log("req.body", req.body);
  client.messages
  .create({
    to: req.body.phone,
    from: '(858) 704-1238',
    body: `Hey ${req.body.firstName}, your friend ${req.body.userFullName} would like you to join Trade Tally, so you two can record trades together. Check us out at https://trade-tally-client.herokuapp.com/`
  })
  .then(message => res.json(message.sid))
  .catch(err => {
    console.error("err is", err);
    res.status(err.status).json({error: err});
  });
});

module.exports = router;

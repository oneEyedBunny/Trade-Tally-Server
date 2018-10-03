"use strict";

//importing 3rd party libraries
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const timestamps = require('mongoose-timestamp');

//Mongoose uses built in es6 promises
mongoose.Promise = global.Promise;

// Modularize routes
const {User, TradeRelationship, Trade} = require('../model');

//all open trades view >> GET all trades that contain the user id
router.get('/users/:id', (req, res) => {
  let id = req.params.id;
  console.log("I'm the user id", id);
  Trade
  .find({ user: id } )
  .then(trades => {
    console.log("I'm the trades", trades);
    res.json({
      trades: trades.map(trade =>
        trade.serialize()
      )});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'internal server error'});
    });
  });

//trade details view >> GET trade by trade id
router.get('/:id', (req, res) => {
  let tradeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(tradeId)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    }
  Trade
  .findOne( {_id: tradeId} )
  .then(trade => {
    console.log("I'm the trade", trade);
    res.json(trade.serialize());
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'internal server error'});
    });
  });

//all open trades view >> GET all trades
router.get('/', (req, res) => {
  Trade
  .find()
  //.populate('tradePartner')
  .then(trades => {
    res.json({
      trades: trades.map(trade =>
        trade.serialize()
      )});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'internal server error'});
    });
  });


  //post trade >> new trade relationship & trade
  //delete trade >> DELETE by trade id
  //update trade details >> PUT by trade id

module.exports = router;

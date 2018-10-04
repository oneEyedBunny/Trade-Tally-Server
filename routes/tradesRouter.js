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
const {User, Trade} = require('../model');
const jwtAuth = require('../auth/jwt-auth');

//all open trades view >> GET all trades that contain the user id
router.get('/user/:id', (req, res) => {
  let id = req.params.id;
  Trade
  .find({ user: id } )
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
router.post('/', jwtAuth, (req, res) => {
  const requiredFields =  ['user', 'tradePartner', 'date', 'serviceDescription', 'amount'];
  for(let i = 0; i < requiredFields.length; i++) {
    if(!(requiredFields[i] in req.body)) {
      const errorMessage = (`Missing \`${requiredFields[i]}\` in request body`);
      console.error(errorMessage);
      return res.status(400).send(errorMessage);
    }
  }
    Trade
    .create({
      user: req.body.user,
      tradePartner: req.body.tradePartner,
      date: req.body.date,
      serviceDescription: req.body.serviceDescription,
      amount: req.body.amount
    })
    .then(trade => {
        res.status(201).json({message: 'Your trade has been created'})
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'})
    });
});


//delete trade >> DELETE by trade id
router.delete('/:id', jwtAuth, (req, res) => {
  Trade
  .findByIdAndRemove(req.params.id)
  .then(trade => {
    console.log(`Deleted trade ${req.params.id}`);
    res.status(204).end();
  })
  .catch(err => {
    res.status(500).json({message: 'Internal server error'})
  })
});

//update trade details >> PUT by trade id
router.put('/:id', jwtAuth, (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  let updatedTrade = {};
  let updateableFields = ['date', 'serviceDescription', 'amount'];
  console.log('req.body=', req.body);
  updateableFields.forEach(field => {
    if(field in req.body) {
      updatedTrade[field] = req.body[field];
    }
  });
  Trade
  .findByIdAndUpdate(req.params.id, {$set:updatedTrade})
  .then(trade => {
    console.log(`Updating trade with id of ${req.params.id}`);
    res.status(204).end();
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({error: 'Something went wrong'});
  });
});


module.exports = router;

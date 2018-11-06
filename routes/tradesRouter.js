"use strict";

//importing 3rd party libraries
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const morgan = require('morgan');
const timestamps = require('mongoose-timestamp');

//Mongoose uses built in es6 promises
mongoose.Promise = global.Promise;

// Modularize routes
const {User, Trade} = require('../model');
const jwtAuth = require('../auth/jwt-auth');

//GET all trades that contain user id> checks both trade partner id & user id
router.get('/user/:id', jwtAuth, (req, res) => {
  let id = req.params.id;
  Trade
  .find({
    $or: [
     {tradePartner: id},
     {user: id},
    ],
  })
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

//GET a trade by trade id
router.get('/:id', jwtAuth, (req, res) => {
  let tradeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(tradeId)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    }
  Trade
  .findOne( {_id: tradeId} )
  .then(trade => {
    res.json(trade.serialize());
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'internal server error'});
    });
  });

//GET all trades
router.get('/', jwtAuth, (req, res) => {
  Trade
  .find()
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

//POST a new trade
router.post('/', jwtAuth, (req, res) => {
  const requiredFields =  ['userId', 'tradePartnerId', 'date', 'serviceDescription', 'amount'];
  for(let i = 0; i < requiredFields.length; i++) {
    if(!(requiredFields[i] in req.body)) {
      const errorMessage = (`Missing \`${requiredFields[i]}\` in request body`);
      console.error(errorMessage);
      return res.status(400).send(errorMessage);
    }
  }
    Trade
    .create({
      user: req.body.userId,
      tradePartner: req.body.tradePartnerId,
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


//DELETE trade by trade id
router.delete('/:id', jwtAuth, (req, res) => {
  Trade
  .findByIdAndRemove(req.params.id)
  .then(trade => {
    res.status(204).end();
  })
  .catch(err => {
    res.status(500).json({message: 'Internal server error'})
  })
});

//PUT (update) a trade by trade id
router.put('/:id', jwtAuth, (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  let updatedTrade = {};
  let updateableFields = ['date', 'serviceDescription', 'amount'];
  updateableFields.forEach(field => {
    if(field in req.body) {
      updatedTrade[field] = req.body[field];
    }
  });
  Trade
  .findByIdAndUpdate(req.params.id, {$set:updatedTrade})
  .then(trade => {
    res.status(204).end();
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({error: 'Something went wrong'});
  });
});

module.exports = router;

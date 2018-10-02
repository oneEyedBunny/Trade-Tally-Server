"use strict";

//importing 3rd party libraries
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

//Mongoose uses built in es6 promises
mongoose.Promise = global.Promise;

// Modularize routes
const {User} = require('../model');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');

//create a signed jwt
const createAuthToken = function (user) {
  return new Promise(function (resolve, reject) {
    jwt.sign({ user }, JWT_SECRET, { expiresIn: JWT_EXPIRY }, function (err, authToken) {
      if (err) {
        return reject(err);
      }
      resolve(authToken);
    });
  });
};

//called when a new user has created a profile
router.post('/', (req, res, next) => {
  const requiredFields = ['firstName', 'lastName', 'username', 'password', 'email', 'profession'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  const stringFields = ['firstName', 'lastName', 'username', 'password', 'email', 'profession'];
  const nonStringField = stringFields.find(field =>
    (field in req.body) && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }
  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(field =>
    req.body[field].trim() !== req.body[field]
  );
  const sizedFields = {
    username: {
      min: 3
    },
    password: {
      min: 10,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(field =>
    'min' in sizedFields[field] &&
    req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(field =>
    'max' in sizedFields[field] &&
    req.body[field].trim().length > sizedFields[field].max
  );
  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
      ? `Must be at least ${sizedFields[tooSmallField]
        .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
          location: tooSmallField || tooLargeField
        });
      }

      let {username, password, firstName = '', lastName = '', email = '', profession = ''} = req.body;
      // Username and password come in pre-trimmed, otherwise we throw an error before this
      firstName = firstName.trim();
      lastName = lastName.trim();
      email = email.trim();
      profession = profession.trim();

      return User.find({username})
      .count()
      .then(count => {
        if (count > 0) {
          // There is an existing user with the same username
          return Promise.reject({
            code: 422,
            reason: 'ValidationError',
            message: 'The username already exists',
            location: 'username'
          });
        }
        // If there is no existing user, hash the password
        return User.hashPassword(password);
      })
      .then(hash => {
        return User.create({
          username,
          password: hash,
          firstName,
          lastName,
          email,
          profession
        });
      })
      .then(user => {
        return createAuthToken(user)
        .then(authToken => {
          return res.status(201).json({
            authToken: authToken,
            userId: user._id,
            username: user.username
          })
       })
      })
      .catch(err => {
        // Forward validation errors on to the client, otherwise give a 500
        // error because something unexpected has happened
        if (err.reason === 'ValidationError') {
          return res.status(err.code).json(err);
        }
        res.status(500).json({code: 500, message: 'Internal server error- Hello'});
      });
    });

// Never expose all your users like below in a prod application, we're just
// this so we have a quick way to see if we're creating users.
router.get('/', (req, res) => {
  return User.find()
  .then(users =>
    res.json(users.map(user => user.serialize()))
   )
    .catch(err =>
      res.status(500).json({message: 'Internal server error'}));
});

module.exports = router;

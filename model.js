"use strict";

//import 3rd party libraries
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');

//Mongoose uses built in es6 promises
mongoose.Promise = global.Promise;

//defining schema for users
const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, minlength: 5, maxlength: 50 },
  password: { type: String, required: true , minlength: 10, maxlength: 200 },
  email: { type: String, required: true, unique: true, lowercase: true },
  profession: { type: String, required: true, lowercase: true }
});

//represents how the outside world sees our users
userSchema.methods.serialize = function() {
  return {
    id: this.id || '',
    username: this.username || '',
    firstName: this.firstName || '',
    lastName: this.lastName || '',
    profession: this.profession || ''
  };
};

//defining schema for trade relationships between 2 users
const tradeRelationshipSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tradePartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

//
// tradeRelationshipSchema.virtual('').get(() => {
//
// });

//defining schema for trades
const tradeSchema = mongoose.Schema({
  tradeRelationship: { type: mongoose.Schema.Types.ObjectId, ref: 'TradeRelationship', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tradePartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: {type: Date, required: true },
  serviceDescription: { type: String, required: true },
  amount: {type: Number, required: true}
});

//Mongoogse uses timestamps for createAt and updateAt for specified schemas
tradeRelationshipSchema.set('timestamps', true);
tradeSchema.set('timestamps', true);

//
tradeSchema.virtual('tradePartnerFullName').get(() => {
  return `${this.tradePartner.firstName} ${this.tradePartner.lastName}`.trim();
});

//represents how trades are represented outside our app via our api
tradeSchema.methods.serialize = function() {
  return {
    tradeRelationshipId: this.tradeRelationship._id,
    tradeId: this._id,
    userId: this.user._id,
    tradePartnerFullName: this.tradePartnerFullName,
    tradePartnerProfession: this.tradePartner.profession,
    date: this.date,
    serviceDescription: this.serviceDescription,
    amount: this.amount,
    created: this.createdAt.toDateString(),
  };
};

//Creates new Mongoose models (User, TradeRelationship, & Trade) off the users, tradeRelationships & trades collection in the DB using the Schema defined above
const User = mongoose.model('User', userSchema,);
const TradeRelationship = mongoose.model('TradeRelationship', tradeRelationshipSchema);
const Trade = mongoose.model('Trade', tradeSchema);

module.exports = {User, TradeRelationship, Trade};

"use strict";

//import dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer } = require('../server');
const { tearDownDb, get, seedAllData } = require('./database');

const { PORT, TEST_DATABASE_URL } = require('../config');

const { User } = require('../model');

//lets us use expect & should style syntax in tests
const expect = chai.expect;
const should = chai.should();

//lets us make http requests in tests
chai.use(chaiHttp);

//hooks to return promises
describe('Obtaining trades', function () {

  const username = "testing9090";
  const password = "testing0101";
  const firstName = "Terry";
  const lastName = "Tester";
  const email = "testing@yahoo.com";
  const profession = "hairstylist";

  let newUser= {
    username: "testing9090",
    password: "testing0101",
    firstName: "Terry",
    lastName: "Tester",
    email: "testing@yahoo.com",
    profession: "hairstylist",
  }

  before(function() {
    return runServer(TEST_DATABASE_URL, PORT);
  });

  beforeEach(function () {
    return seedAllData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe("POST /users", function () {

    it("Should create a new user", function () {
      let res;
      return chai
      .request(app)
      .post("/users")
      .send(newUser)
      .then(_res => {
        res = _res;
        expect(res).to.have.status(201);
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.all.keys("userId", "username", "authToken");
        expect(res.body.username).to.equal(newUser.username);
        return User.findOne({username: newUser.username });
      })
      .then(user => {
        console.log("user===", user);
        console.log("newUser", newUser)
        expect(user).to.exist;
        expect(user.id).to.equal(res.body.userId);
        expect(user.firstName).to.equal(newUser.firstName);
        expect(user.lastName).to.equal(newUser.lastName);
        expect(user.email).to.equal(newUser.email);
        expect(user.profession).to.equal(newUser.profession);
      })
    });

    it("Should reject users with missing first name", function () {
      return chai
      .request(app)
      .post("/users")
      .send(lastName, username, password, email, profession)

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Missing field");
      });
    });

    it("Should reject users with missing last name", function () {
      return chai
      .request(app)
      .post("/users")
      .send(firstName, username, password, email, profession)

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Missing field");
      });
    });

    it("Should reject users with missing email", function () {
      return chai
      .request(app)
      .post("/users")
      .send(firstName, lastName, username, password, profession)

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Missing field");
      });
    });
    it("Should reject users with missing profession", function () {
      return chai
      .request(app)
      .post("/users")
      .send(firstName, lastName, username, password, email)

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Missing field");
      });
    });

    it("Should reject users with non-string username", function () {
      return chai
      .request(app)
      .post("/users")
      .send({ username: 1234, firstName, lastName, password, email, profession})

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Incorrect field type: expected string");
      });
    });

    it("Should reject users with non-string password", function () {
      return chai
      .request(app)
      .post("/users")
      .send({ password: 1234, firstName, lastName, username, email, profession })

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Incorrect field type: expected string");
      });
    });

    it("Should trim firstName", function () {
      return chai
        .request(app)
        .post("/users")
        .send({ firstName: ` ${firstName} `, lastName, password, username , email, profession })
        .then(res => {
          expect(res).to.have.status(201);
          console.log("body", res.body);
          console.log("firstName", firstName);
          return User.findOne({ firstName });
        })
        .then(user => {
          console.log("user =", user);
          expect(user).to.not.be.null;
        });
    });

    it("Should reject users with password less than 10 characters", function () {
      return chai
      .request(app)
      .post("/users")
      .send({ password: "asdfghj", firstName, lastName, username, email, profession })

      .then(res => {
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal("Must be at least 10 characters long");
      });
    });

    // it("Should reject users with password greater than 72 characters", function () {
    //   return chai
    //   .request(app)
    //   .post("/users")
    //   .send({ password: new Array(73).fill("a").join(""),firstName, lastName, username, email, profession })
    //
    //   .then(res => {
    //     expect(res).to.have.status(422);
    //     expect(res.body.message).to.equal("Must be at most 72 characters long");
    //   });
    // });

    it("Should reject users with duplicate username", function () {
      return User
        .create({ firstName, lastName, username, password, email, profession })
        .then(() => {
          return chai
            .request(app)
            .post("/users")
            .send({ firstName, lastName, username, password, email, profession });
        })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal("The username already exists");
        });
      });

   }); //closes describe
  }); //closes hook

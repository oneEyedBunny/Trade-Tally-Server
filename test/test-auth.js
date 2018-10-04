"use strict"

//import dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { tearDownDb, get, seedAllData } = require('./database');

const { PORT, TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const { User } = require('../model');

//lets us use expect & should style syntax in tests
const expect = chai.expect;
const should = chai.should();

//lets us make http requests in tests
chai.use(chaiHttp);

//hooks to return promises
describe('login validation', function () {
  let user;

  const username = "Terrytesting";
  const password = "testing0101";
  const firstName = "Terry";
  const lastName = "Tester";
  const email = "testing@yahoo.com";
  const profession = "hairstylist";

  before(function() {
    return runServer(TEST_DATABASE_URL, PORT);
  });

  beforeEach(function () {
    return User.hashPassword(password)
    .then(password =>
      User.create({ firstName, lastName, username, password, email, profession })
    )
    .then(_user => {
        user = _user;
      });
  })

  afterEach(function () {
    return User.remove({});
  });

  after(function() {
    return closeServer();
  })


  describe('auth/login', function () {

  it("Should return 401 error 'Invalid credentials' at 'username' when sent an invalid 'username'", function () {
        return chai.request(app)
          .post("/auth/login")
          .send({ username: "wrongUsername", password })
          .then(res => {
            console.log("res.body =", res.body);
            expect(res).to.have.status(401);
            expect(res.body.message).to.equal("Invalid credentials");
            expect(res.body.location).to.equal("username");
          });
      });

    it("Should return 401 error 'Invalid credentials' at 'password' when sent an invalid 'password'", function () {
      return chai.request(app)
        .post("/auth/login")
        .send({ username, password: "wrongPassword" })
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("Invalid credentials");
          expect(res.body.location).to.equal("password");
        });
    });


context("When sent a valid username and password", function () {

      it("Should return 200 OK with a valid JWT in 'authToken'", function () {
        return chai.request(app)
          .post("/auth/login")
          .send({ username, password })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body.authToken).to.be.a("string");
            jwt.verify(res.body.authToken, JWT_SECRET);
          });
      });

      it("Should return a valid JWT with correct 'id', & 'username'", function () {
        return chai.request(app)
          .post("/auth/login")
          .send({ username, password })
          .then(res => {
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
            expect(payload.user._id).to.equal(user.id);
            expect(payload.user.username).to.equal(username);
          });
      });

      it("Should return a JWT that does not NOT contains a password", function () {
        return chai.request(app)
          .post("/auth/login")
          .send({ username, password })
          .then(res => {
            //console.log("res.body", res.body);
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
            //console.log("payload", payload.user);
            expect(payload).to.not.have.property("password");
          });
       });
    }); //////closes context

  describe("POST /auth/refresh", function () {
    it("Should reject requests when no 'Authorization' header is sent", function () {
      return chai.request(app)
        .post("/auth/refresh")
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("No 'Authorization' header found");
        });
     });

    it("Should reject request when 'Authorization' token type is NOT 'Bearer'", function () {
      const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "1m" });

      return chai.request(app)
        .post("/auth/refresh")
        .set("Authorization", `FooBar ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("No 'Bearer' token found");
        });
      });

    it("Should reject request when 'Authorization' with 'Bearer' type does NOT contain a token", function () {
      return chai.request(app)
        .post("/auth/refresh")
        .set("Authorization", "Bearer  ")
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("No 'Bearer' token found");
        });
     });

    it("Should reject request when JWT is signed with the WRONG secret key", function () {
      const user = { username };
      const token = jwt.sign({ user }, "INVALID", { subject: username, expiresIn: "1m" });

      return chai.request(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("Invalid JWT");
        });
    });

    it("Should reject request when JWT 'expiresIn' data has EXPIRED", function () {
      const user = { username };
      const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "0" });

      return chai.request(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal("Invalid JWT");
        });
    });
  });  //closes desc "POST /auth/refresh"

    context("When sent 'Authorization' header contains a valid JWT 'Bearer' token", function () {

      it("Should return 200 OK and a object with a 'authToken' property and a valid JWT", function () {
        const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "1m" });
        return chai.request(app)
          .post("/auth/refresh")
          .set("Authorization", `Bearer ${token}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body.authToken).to.be.a("string");
            jwt.verify(res.body.authToken, JWT_SECRET);
          });
      });

      it("Should return a valid JWT with correct 'id',& 'username'", function () {
        const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "1m" });
        return chai.request(app)
          .post("/auth/refresh")
          .set("Authorization", `Bearer ${token}`)
          .then(res => {
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
            expect(payload.user.username).to.equal(username);
          });
      });

      it("Should return a JWT that does not NOT contains a password", function () {
        const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "1m" });
        return chai.request(app)
          .post("/auth/refresh")
          .set("Authorization", `Bearer ${token}`)
          .then(res => {
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
            expect(payload).to.not.have.property("password");
          });
      });

      it("Should return a valid JWT with a newer 'expiresIn' date", function () {
        const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: "1m" });
        const decoded = jwt.decode(token);

        return chai.request(app)
          .post("/auth/refresh")
          .set("Authorization", `Bearer ${token}`)
          .then(res => {
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
            expect(payload.exp).to.be.greaterThan(decoded.exp);
          });
        });
     }); //closes context

 }); ////////////////////////////////Closes describe
}); ////////////closes hook



// it.only('Should reject requests with no credentials', function () {
//   console.log("Did I make it here");
//   return chai
//     .request(app)
//     .post('auth/login')
//     .send({})
//     .then(res => {
//       console.log("res.body=", res.body.message);
//         expect(res).to.have.status(400);
//         expect(res.body.message).to.equal("No credentials provided");
//     });
//  });

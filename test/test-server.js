const chai = require('chai');
const chaiHttp = require('chai-http');

const {app} = require('../server');

const should = chai.should();
chai.use(chaiHttp);

//verifies if someone enters an non existent endpoint that an error message is provided
describe('API', function() {

  it('should have 404 on GET requests', function() {
    return chai.request(app)
    .get('/api/fooooo')
    .then(function(res) {
      res.should.have.status(404);
      res.should.be.json;
    });
  });
});

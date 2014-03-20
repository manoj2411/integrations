var auth         = require('./auth.json')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var interakt = new integrations['Interakt']()
  , settings = auth['Interakt'];


describe('Interakt', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      interakt.enabled(new Track({
        userId: 'x',
        channel: 'server'
      })).should.be.ok;

      interakt.enabled(new Track({
        userId: 'x',
        channel: 'client'
      })).should.not.be.ok;

      interakt.enabled(new Track({
        userId: 'x'
      })).should.not.be.ok;
    });

    it('should require a userId', function () {
      interakt.enabled(new Track({
        channel : 'server'
      })).should.not.be.ok;

      interakt.enabled(new Track({
        userId: 'x',
        channel: 'server'
      })).should.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should not validate settings without a appId', function () {
      var identify = helpers.identify();
      interakt.validate(identify, { apiKey : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      interakt.validate(identify, { appId : 'x'}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(interakt.validate(identify, { appId : 'x', apiKey : 'x' }));
    });
  });

  describe('.identify()', function () {
    it('should be able to identify correctly', function (done) {
      var identify = helpers.identify();
      interakt.identify(identify, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      interakt.alias(alias, settings, done);
    });
  });
});

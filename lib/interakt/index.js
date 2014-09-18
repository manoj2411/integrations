
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration')
var Identify = require('segmentio-facade').Identify;
var object = require('obj-case');
var time = require('unix-time');
var isostring = require('isostring');
var hash = require('string-hash');
var extend = require('extend');
var Batch = require('batch');
var is = require('is');


/**
 * Expose `Interakt`
 */

var Interakt = module.exports = integration('Interakt')
  .endpoint('https://app.interakt.co/api/v1/members/')
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Interakt.prototype.enabled = function(message, settings){
  return !! (message.enabled(this.name)
    && 'server' == message.channel()
    && message.field('userId'));
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Interakt.prototype.validate = function (message, settings) {
  return this.ensure(settings.apiKey, 'apiKey')
    || this.ensure(settings.appId, 'appId');
};

/**
 * Identify a user in interakt
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Interakt.prototype.identify = function(identify, settings, fn){
  var self = this;
  this.sendUserData(identify, settings, function(err){
    if (err) return fn(err);
  });
};


/**
 * Send all user related data to interakt.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Interakt.prototype.sendUserData = function(identify, settings, fn){
  var traits = formatTraits(identify.traits());
  var active = identify.active();

  extend(traits, {
    user_id: identify.userId(),
    email: identify.email(),
    name: identify.name()
  });

  if (active) traits.last_seen = time(identify.timestamp());
  if (identify.created()) traits.created_at = time(identify.created());

  return this
    .post()
    .set(headers(identify, settings))
    .type('json')
    .send(traits)
    .end(this.handle(fn));
};

/**
 * Format all the traits which are dates for interakts format
 *
 * @param {Object} traits
 * @return {Object}
 * @api private
 */

function formatTraits (traits) {
  var output = {};

  Object.keys(traits).forEach(function (key) {
    var val = traits[key];
    if (isostring(val) || is.date(val)) {
      val = time(val);
      key = dateKey(key);
    }

    output[key] = val;
  });

  return output;
}

/**
 * Set up a key with the dates for interakts
 *
 * @param {String} key
 * @return {String}
 * @api private
 */

function dateKey (key) {
  if (endswith(key, '_at')) return key;
  if (endswith(key, ' at')) return key.substr(0, key.length - 3) + '_at';
  return key + '_at';
}

/**
 * Test whether a string ends with the suffix
 *
 * @param {String} str
 * @param {String} suffix
 * @return {String}
 * @api private
 */

function endswith (str, suffix) {
  str = str.toLowerCase();
  return str.substr(str.length - suffix.length) === suffix;
}

/**
 * Add headers
 *
 * @param {Facade} message
 * @return {Object}
 * @api private
 */

function headers (message, settings) {
  var buf = new Buffer(settings.appId + ':' + settings.apiKey);
  var auth = 'Basic ' + buf.toString('base64');
  return {
    'Authorization' : auth,
    'User-Agent'    : 'Segment.io/1.0.0'
  };
}

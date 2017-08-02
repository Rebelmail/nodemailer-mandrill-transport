'use strict';

var extend = require('extend');
var addressparser = require('addressparser');
var mandrill = require('mandrill-api/mandrill');

var packageData = require('../package.json');

function MandrillTransport(options) {
  this.name = 'Mandrill';
  this.version = packageData.version;

  options = options || {};

  var auth = options.auth || {};
  this.mandrillClient = new mandrill.Mandrill(auth.apiKey);
}

function isString(data) {
  return typeof data === 'string';
};

function toAddressObjects(input) {
  if (isString(input)) {
    // Run it through addressparser if it's a string
    return addressparser(input);
  } else if (Array.isArray(input)) {
    // If an array examine each element recursively
    return input
      .map(function (address) {
        return toAddressObjects(address);
      })
      .reduce(function (list, address) {
        return list.concat(address || []);
      }, [])
  } else if (typeof input === 'object' && input) {
    // Assume we have a valid address object if it's a POJO
    return [input];
  }
}

MandrillTransport.prototype.send = function(mail, callback) {
  var data = mail.data || {};
  var toAddrs = toAddressObjects(data.to);
  var ccAddrs = toAddressObjects(data.cc);
  var bccAddrs = toAddressObjects(data.bcc);
  var fromAddr = toAddressObjects(data.from)[0] || {};
  var mandrillOptions = data.mandrillOptions || {};

  var payload = extend(true, {
    async: true,
    message: {
      to: toAddrs.map(function(addr) {
        return {
          name: addr.name,
          email: addr.address
        };
      }).concat(
        ccAddrs.map(function(addr) {
          return {
            name: addr.name,
            email: addr.address,
            type: 'cc'
          };
        }),
        bccAddrs.map(function(addr) {
          return {
            name: addr.name,
            email: addr.address,
            type: 'bcc'
          };
        })
      ),
      from_name: fromAddr.name,
      from_email: fromAddr.address,
      subject: data.subject,
      headers: data.headers,
      text: data.text,
      html: data.html
    }
  }, mandrillOptions);

  var method = payload.template_name ? 'sendTemplate' : 'send';
  this.mandrillClient.messages[method](payload, function(results) {
    var accepted = [];
    var rejected = [];

    results.forEach(function(result) {
      if (['sent', 'queued', 'scheduled'].indexOf(result.status) > -1) {
        accepted.push(result);
      } else {
        rejected.push(result);
      }
    });

    return callback(null, {
      messageId: (results[0] || {})._id,
      accepted: accepted,
      rejected: rejected
    });
  }, callback);
};

module.exports = function(options) {
  return new MandrillTransport(options);
};

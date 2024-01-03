'use strict';

var extend = require('extend');
var addressparser = require('addressparser');
var mailchimp = require('@mailchimp/mailchimp_transactional');

var packageData = require('../package.json');

function addressObjectsParser(input) {
  if (typeof input === 'string') {
    return addressparser(input);
  } else if (Array.isArray(input)) {
    return input
      .reduce(function (list, address) {
        return list.concat(addressObjectsParser(address) || []).flat(Infinity);
      }, []);
  } else if (Object.prototype.toString.call(input) === '[object Object]') {
    return [input];
  }
}
Object.prototype.toString.call({});

function MandrillTransport(options) {
  this.name = 'Mandrill';
  this.version = packageData.version;

  options = options || {};

  var auth = options.auth || {};
  this.mandrillClient = mailchimp(auth.apiKey);
}

MandrillTransport.prototype.send = function(mail, callback) {
  var data = mail.data || {};
  var toAddrs = addressObjectsParser(data.to);
  var ccAddrs = addressObjectsParser(data.cc);
  var bccAddrs = addressObjectsParser(data.bcc);
  var fromAddr = addressObjectsParser(data.from)[0] || {};

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

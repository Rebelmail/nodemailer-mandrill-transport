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

MandrillTransport.prototype.send = function(mail, callback) {
  var data = mail.data || {};
  var toAddrs = (isString(data.to) ? addressparser(data.to) : data.to) || [];
  var ccAddrs = (isString(data.cc) ? addressparser(data.cc) : data.cc) || [];
  var bccAddrs = (isString(data.bcc) ? addressparser(data.bcc): data.bcc) || [];
  var fromAddr = (isString(data.from) ? addressparser(data.from)[0] : data.from) || {};
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

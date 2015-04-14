'use strict';

var addrs = require('email-addresses');
var mandrill = require('mandrill-api/mandrill');

var packageData = require('../package.json');

function MandrillTransport(options) {
  this.name = 'Mandrill';
  this.version = packageData.version;

  options = options || {};

  var auth = options.auth || {};
  this.template = options.template || packageData.name;
  this.mandrillClient = new mandrill.Mandrill(auth.apiKey);
}

MandrillTransport.prototype.send = function(mail, callback) {
  var data = mail.data || {};

  var toAddrs = addrs.parseAddressList(data.to) || [];
  var fromAddr = addrs.parseOneAddress(data.from) || {};

  this.mandrillClient.messages.send({
    message: {
      to: toAddrs.map(function(addr) {
        return {
          name: addr.name,
          email: addr.address
        };
      }),
      from_name: fromAddr.name,
      from_email: fromAddr.address,
      subject: data.subject,
      headers: data.headers,
      text: data.text,
      html: data.html
    }
  }, function(result) {
    var response = result[0] || {};

    if (['sent', 'queued'].indexOf(response.status) <= -1) {
      var err = new Error(response.reject_reason || 'unsent');
      err.result = result;
      callback(err);
    } else {
      callback(null, { messageId: response._id });
    }
  }, callback);
};

module.exports = function(options) {
  return new MandrillTransport(options);
};

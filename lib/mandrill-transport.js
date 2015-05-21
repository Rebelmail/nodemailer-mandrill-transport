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
  }, function(results) {

    var info = {accepted: [], rejected: []};
    results.forEach(function(result) {
      if (['sent', 'queued', 'scheduled'].indexOf(result.status) !== -1)
        info.accepted.push(result);
      else
        info.rejected.push(result);
    });
    return callback(null, info);
  }, callback);
};

module.exports = function(options) {
  return new MandrillTransport(options);
};

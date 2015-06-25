'use strict';

var addrs = require('email-addresses');
var mandrill = require('mandrill-api/mandrill');
var _ = require('underscore');

var packageData = require('../package.json');

function MandrillTransport(options) {
  this.name = 'Mandrill';
  this.version = packageData.version;

  options = options || {};

  this.async = options.async || false;
  this.tags = options.tags || [];
  this.metadata = options.metadata || {};
  this.recipient_metadata = options.recipient_metadata || [];
  this.preserve_recipients = options.preserve_recipients;
  if (this.preserve_recipients === undefined) {
    this.preserve_recipients = true;
  }

  var auth = options.auth || {};
  this.template = options.template || packageData.name;
  this.mandrillClient = new mandrill.Mandrill(auth.apiKey);
}

MandrillTransport.prototype.send = function(mail, callback) {
  var data = _.extend({
    tags: this.tags,
    metadata: this.metadata,
    recipient_metadata: this.recipient_metadata,
    preserve_recipients: this.preserve_recipients,
  }, mail.data);

  var toAddrs = addrs.parseAddressList(data.to) || [];
  var ccAddrs = addrs.parseAddressList(data.cc) || [];
  var bccAddrs = addrs.parseAddressList(data.bcc) || [];
  var fromAddr = addrs.parseOneAddress(data.from) || {};

  data = _.extend(data, {
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
          email: addr.address,
          type: 'bcc'
        };
      })
    ),
    from_name: fromAddr.name,
    from_email: fromAddr.address,
  });

  this.mandrillClient.messages.send({
    async: mail.data.async !== undefined ? mail.data.async : this.async,
    message: data
  }, function(results) {
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

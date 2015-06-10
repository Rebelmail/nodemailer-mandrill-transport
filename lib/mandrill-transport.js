'use strict';

var addrs = require('email-addresses');
var mandrill = require('mandrill-api/mandrill');

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
  var data = mail.data || {};

  var toAddrs = addrs.parseAddressList(data.to) || [];
  var ccAddrs = addrs.parseAddressList(data.cc) || [];
  var bccAddrs = addrs.parseAddressList(data.bcc) || [];
  var fromAddr = addrs.parseOneAddress(data.from) || {};

  var async = this.async;
  var tags = this.tags;
  var metadata = this.metadata;
  var recipient_metadata = this.recipient_metadata;
  var preserve_recipients = this.preserve_recipients;

  if (data.async !== undefined) {
    async = data.async;
  }
  if (data.tags !== undefined) {
    tags = data.tags;
  }
  if (data.metadata !== undefined) {
    metadata = data.metadata;
  }
  if (data.recipient_metadata !== undefined) {
    recipient_metadata = data.recipient_metadata;
  }
  if (data.preserve_recipients !== undefined) {
    preserve_recipients = data.preserve_recipients;
  }

  this.mandrillClient.messages.send({
    async: async,
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
      html: data.html,

      tags: tags,
      metadata: metadata,
      recipient_metadata: recipient_metadata,
      preserve_recipients: preserve_recipients
    }
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

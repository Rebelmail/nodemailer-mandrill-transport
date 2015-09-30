'use strict';

var addrs = require('email-addresses');
var mandrill = require('mandrill-api/mandrill');

var packageData = require('../package.json');

function MandrillTransport(options) {
  this.name = 'Mandrill';
  this.version = packageData.version;

  this.options = options || {};

  var auth = this.options.auth || {};

  this.mandrillClient = new mandrill.Mandrill(auth.apiKey);
}

MandrillTransport.prototype.useDefaults = function(params) {
  var defaults = this.options;

  params.async = params.async || defaults.async || false;
  params.message = params.message || {};
  params.message.important = params.message.important || defaults.important || false;
  params.message.track_opens = params.message.track_opens || defaults.track_opens || false;
  params.message.track_clicks = params.message.track_clicks || defaults.track_clicks || false;
  params.message.auto_text = params.message.auto_text || defaults.auto_text || false;
  params.message.auto_html = params.message.auto_html || defaults.auto_html || false;
  params.message.inline_css = params.message.inline_css || defaults.inline_css || false;
  params.message.url_strip_qs = params.message.url_strip_qs || defaults.url_strip_qs || false;
  params.message.preserve_recipients = params.message.preserve_recipients || defaults.preserve_recipients || false;
  params.message.view_content_link = params.message.view_content_link || defaults.view_content_link || false;
  params.message.merge = params.merge ||  params.message.merge || defaults.merge || false;

  return params;
};

MandrillTransport.prototype.send = function(mail, callback) {
  var data = this.useDefaults(mail.data || {});

  if (typeof data.to === 'string' || data.to === undefined) {
    data.to = addrs.parseAddressList(data.to) || [];
  }

  if (typeof data.cc === 'string' || data.cc === undefined) {
    data.cc = addrs.parseAddressList(data.cc) || [];
  }

  if (typeof data.bcc === 'string' || data.bcc === undefined) {
    data.bcc = addrs.parseAddressList(data.bcc) || [];
  }

  data.message.to = data.to.map(function(addr) {
    return {
      name: addr.name,
      email: addr.address || addr.email,
      type: addr.type || 'to'
    };
  }).concat(
    data.cc.map(function(addr) {
      return {
        name: addr.name,
        email: addr.address || addr.email,
        type: 'cc'
      };
    }),
    data.bcc.map(function(addr) {
      return {
        email: addr.address || addr.email,
        type: 'bcc'
      };
    })
  );

  delete data.to;
  delete data.cc;
  delete data.bcc;

  if (typeof data.from === 'string' || data.from === undefined) {
    data.from = addrs.parseOneAddress(data.from) || {};
  }

  data.message.from_email = data.from.address || data.from.email;
  data.message.from_name = data.from.name;
  delete data.from;

  data.message.subject = data.subject;
  data.message.text = data.text;
  data.message.html = data.html;

  delete data.subject;
  delete data.text;
  delete data.html;

  // Check for template parameters
  if (data.template_name) {
    data.template_content = data.template_content || [];
    this.mandrillClient.messages.sendTemplate(data, function (results) {
      callback && callback(null, callbackResult(results))}, callback);
  } else {
    this.mandrillClient.messages.send(data, function (results) {
      callback && callback(null, callbackResult(results))}, callback);
  }
};

function callbackResult(results) {
  var accepted = [];
  var rejected = [];
  results.forEach(function (result) {
    if (['sent', 'queued', 'scheduled'].indexOf(result.status) > -1) {
      accepted.push(result);
    } else {
      rejected.push(result);
    }
  });

  return {
    messageId: (results[0] || {})._id,
    accepted: accepted,
    rejected: rejected
  };
}

module.exports = function(options) {
  return new MandrillTransport(options);
};

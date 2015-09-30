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

MandrillTransport.prototype.send = function(params, callback) {
  var options = this.useDefaults(params || {});

  if (typeof params.to === 'string' || params.to === undefined) {
    params.to = addrs.parseAddressList(params.to) || [];
  }

  if (typeof params.cc === 'string' || params.cc === undefined) {
    params.cc = addrs.parseAddressList(params.cc) || [];
  }

  if (typeof params.bcc === 'string' || params.bcc === undefined) {
    params.bcc = addrs.parseAddressList(params.bcc) || [];
  }

  params.message.to = params.to.map(function(addr) {
    return {
      name: addr.name,
      email: addr.address || addr.email,
      type: addr.type || 'to'
    };
  }).concat(
    params.cc.map(function(addr) {
      return {
        name: addr.name,
        email: addr.address || addr.email,
        type: 'cc'
      };
    }),
    params.bcc.map(function(addr) {
      return {
        email: addr.address || addr.email,
        type: 'bcc'
      };
    })
  );

  delete params.to;
  delete params.cc;
  delete params.bcc;

  if (typeof params.from === 'string' || params.from === undefined) {
    params.from = addrs.parseOneAddress(params.from) || {};
  }

  params.message.from_email = params.from.address || params.from.email;
  params.message.from_name = params.from.name;
  delete params.from;

  params.message.subject = params.subject;
  params.message.text = params.text;
  params.message.html = params.html;

  delete params.subject;
  delete params.text;
  delete params.html;

  // Check for template parameters
  if (params.template_name) {
    params.template_content = params.template_content || [];
    this.mandrillClient.messages.sendTemplate(params, function (results) {
      callback && callback(null, callbackResult(results))}, callback);
  } else {
    this.mandrillClient.messages.send(params, function (results) {
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

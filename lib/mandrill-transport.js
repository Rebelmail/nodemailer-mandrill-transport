'use strict';

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
  params.message.track_opens = params.message.track_opens || defaults.trackOpens || false;
  params.message.track_clicks = params.message.track_clicks || defaults.trackClicks || false;
  params.message.auto_text = params.message.auto_text || defaults.autoText || false;
  params.message.auto_html = params.message.auto_html || defaults.autoHtml || false;
  params.message.inline_css = params.message.inline_css || defaults.inlineCss || false;
  params.message.url_strip_qs = params.message.url_strip_qs || defaults.urlStripQs || false;
  params.message.preserve_recipients = params.message.preserve_recipients || defaults.preserve_recipients || false;
  params.message.view_content_link = params.message.view_content_link || defaults.view_content_link || false;
  params.message.merge = params.merge ||  params.message.merge || defaults.merge || false;

  return params;
};

MandrillTransport.prototype.send = function(params, callback) {

  params = this.useDefaults(params || {});

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

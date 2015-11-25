# nodemailer-mandrill-transport

A Mandrill transport for Nodemailer.

[![Build Status](https://travis-ci.org/Rebelmail/nodemailer-mandrill-transport.svg?branch=sm-readme)](https://travis-ci.org/Rebelmail/nodemailer-mandrill-transport)
[![NPM version](https://badge.fury.io/js/nodemailer-mandrill-transport.png)](http://badge.fury.io/js/nodemailer-mandrill-transport)

## Example

```javascript
'use strict';

var nodemailer = require('nodemailer');

var mandrillTransport = require('nodemailer-mandrill-transport');

var transport = nodemailer.createTransport(mandrillTransport({
  auth: {
    apiKey: 'key'
  }
}));

transport.sendMail({
  from: 'sender@example.com',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>How are you?</p>'
}, function(err, info) {
  if (err) {
    console.error(err);
  } else {
    console.log(info);
  }
});
```

## Using Mandrill API options

It is possible to use any Messages Send Mandrill API option by passing it into
the `mandrillOptions` option. These will be deeply merged over the API call this
transport builds for you. For example, this transport enables the `async` option
by default. To disable this,

```javascript
transport.sendMail({
  mandrillOptions: {
    async: false
  }
}, /* ... */);
```

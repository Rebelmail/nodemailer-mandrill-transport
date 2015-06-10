# nodemailer-mandrill-transport

A Mandrill transport for Nodemailer.

[![Build Status](https://travis-ci.org/RebelMail/nodemailer-mandrill-transport.svg?branch=sm-readme)](https://travis-ci.org/RebelMail/nodemailer-mandrill-transport)
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

## Documentation

### `mandrillTransport`

```javascript
mandrillTransport(options);
```

#### Available options

+ `async`
+ `tags`
+ `metadata`
+ `recipient_metadata`
+ `preserve_recipients`

### `sendMail`

```javascript
transport.sendMail(options, function(err, info) {});
```

#### Available options

+ `to`
+ `cc`
+ `bcc`
+ `from`
+ `subject`
+ `headers`
+ `text`
+ `html`
+ `tags`
+ `metadata`
+ `recipient_metadata`
+ `preserve_recipients`
+ `async`



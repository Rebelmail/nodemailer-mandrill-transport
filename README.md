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

## Sending Images to Mandrill

To send images as attachments:

```javascript
transport.sendMail({
  mandrillOptions: {
    images: [
      'type': 'image/png',
      'name': 'IMAGECID',
      'content': 'ZXhhbXBsZSBmaWxl',
    ],
  }
}, /* ... */);
```

**name**: image cid:

Reference your attached image in your HTML:

```html
<img src="IMAGECID">
```

Make sure to use unique cids for your images!

**content**: a base64 representation of your image.

```javascript
var fs = require('fs');
var imgBuff = fs.readFileSync('path/to/file');

imgBuff.toString('base64');
```

## Using Mandrill Templates

To send email using templates stored on Mandrill:

```javascript
transport.sendMail({
  mandrillOptions: {
    template_name: 'MANDRILL_TEMPLATE_SLUG'
  }
}, /* ... */);
```

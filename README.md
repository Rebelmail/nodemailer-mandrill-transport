# nodemailer-mandrill-transport

A Mandrill transport for Nodemailer.

[![Build Status](https://travis-ci.org/Rebelmail/nodemailer-mandrill-transport.svg?branch=master)](https://travis-ci.org/Rebelmail/nodemailer-mandrill-transport)
[![Coverage Status](https://coveralls.io/repos/github/Rebelmail/nodemailer-mandrill-transport/badge.svg?branch=master)](https://coveralls.io/github/Rebelmail/nodemailer-mandrill-transport?branch=master)
[![npm version](https://badge.fury.io/js/nodemailer-mandrill-transport.svg)](https://badge.fury.io/js/nodemailer-mandrill-transport)
[![Dependency Status](https://david-dm.org/Rebelmail/nodemailer-mandrill-transport.svg)](https://david-dm.org/Rebelmail/nodemailer-mandrill-transport)
[![devDependency Status](https://david-dm.org/Rebelmail/nodemailer-mandrill-transport/dev-status.svg)](https://david-dm.org/Rebelmail/nodemailer-mandrill-transport?type=dev)

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
transport builds for you. See https://mandrillapp.com/api/docs/messages.nodejs.html for documentation.

For example, this transport enables the `async` option
by default. To disable this,

```javascript
transport.sendMail({
  mandrillOptions: {
    async: false
  }
}, /* ... */);
```

## Sending attachments with Mandrill
```javascript
transport.sendMail({
  /* from, to, etc. */
  mandrillOptions: {
    message: {
      attachments: [
        {
          type: 'text/plain',
          name: 'hello.txt',
          content: new Buffer('Hello World!').toString('base64')
        }
      ]
    }
  }
});
```

**type**: Content MIME-type:
'text/plain', 'image/jpeg', 'image/png' etc. 

**name**: Name of the file as it will be shown in the attachments in the sent email

**content**: Base64 encoded string. An easy way to do this is to use `Buffer` with `toString('base64')`. 

## Sending images with Mandrill

To send images as attachments:

```javascript
transport.sendMail({
  /* from, to, etc. */
  mandrillOptions: {
    message: {
      images: [
        {
          type: 'image/png',
          name: 'unique_identifier_reference',
          content: require('fs').readFileSync('path/to/image.png').toString('base64')
        }
      ]
    }
  }
});
```
**type**: Image MIME-type:
'image/jpg', 'image/png' etc.

**name**: A unique identifier which will be used to reference your attached image in your HTML. Notice the required `cid:` before the identifier:

```html
<img src="cid:unique_identifier_reference">
```

Make sure to use unique identifiers for your images!

**content**: a base64 representation of your image. An easy way to do this is to use `Buffer` with `toString('base64')`. 

```javascript
var fs = require('fs');
var imgBuff = fs.readFileSync('path/to/file');
imgBuff.toString('base64');
```

## Using Mandrill Templates

To send email using templates stored on Mandrill:

```javascript
transport.sendMail({
  /* from, to, etc. */
  mandrillOptions: {
    template_name: 'MANDRILL_TEMPLATE_SLUG'
  }
});
```

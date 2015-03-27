# nodemailer-mandrill-transport

A Mandrill transport for Nodemailer.

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

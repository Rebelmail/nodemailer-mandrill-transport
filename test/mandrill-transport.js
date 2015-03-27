'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

var mandrillTransport = require('../');

var packageData = require('../package.json');

describe('MandrillTransport', function() {
  it('should expose name and version', function() {
    var transport = mandrillTransport();
    expect(transport.name).to.equal('Mandrill');
    expect(transport.version).to.equal(packageData.version);
  });

  it('#send', function(done) {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var stub = sinon.stub(client.messages, 'send', function(data, resolve, reject) {
      var message = data.message;
      expect(message).to.exist;
      expect(message.to.length).to.equal(1);
      expect(message.to[0].name).to.equal('User');
      expect(message.to[0].email).to.equal('user@example.com');
      expect(message.from_name).to.equal('User');
      expect(message.from_email).to.equal('user@example.com');
      expect(message.subject).to.equal('Hello');
      expect(message.text).to.equal('How are you?');
      expect(message.html).to.equal('<p>How are you?</p>');
      resolve([{ _id: 'fake-id', status: 'sent' }]);
    });

    transport.send({
      data: {
        to: 'User <user@example.com>',
        from: 'User <user@example.com>',
        subject: 'Hello',
        text: 'How are you?',
        html: '<p>How are you?</p>'
      }
    }, function(err, info) {
      expect(stub.calledOnce).to.be.true;
      expect(err).to.not.exist;
      expect(info.messageId).to.equal('fake-id');
      done();
    });
  });
});

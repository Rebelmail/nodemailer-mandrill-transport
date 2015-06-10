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

  it('should expose preserve_recipients', function() {
    var transport = mandrillTransport();
    expect(transport.preserve_recipients).to.equal(true);
  });

  it('should expose async', function() {
    var transport = mandrillTransport();
    expect(transport.async).to.equal(false);
  });

  it('should expose metadata', function() {
    var transport = mandrillTransport();
    expect(transport.metadata).to.be.an.object;
    expect(transport.recipient_metadata).to.be.an.array;
  });

  it('can set options', function() {
    var transport = mandrillTransport({
      async: true,
      tags: [ 'password-resets' ],
      metadata: { website: 'www.example.com' },
      recipient_metadata: [
        {
          rcpt: 'recipient.email@example.com',
          values: {
            user_id: 123456
          }
        }
      ],
      preserve_recipients: false
    });

    expect(transport.async).to.equal(true);
    expect(transport.tags).to.deep.equal(['password-resets']);
    expect(transport.metadata).to.deep.equal({ website: 'www.example.com' });
    expect(transport.recipient_metadata).to.deep.equal(
      [
        {
          rcpt: 'recipient.email@example.com',
          values: {
            user_id: 123456
          }
        }
      ]
    )
    expect(transport.preserve_recipients).to.deep.equal(false);
  });

  it('can override settings via message payload', function(done) {
    var transport = mandrillTransport({
      async: true,
      tags: [ 'password-resets' ],
      metadata: { website: 'www.example.com' },
      recipient_metadata: [
        {
          rcpt: 'recipient.email@example.com',
          values: {
            user_id: 123456
          }
        }
      ],
      preserve_recipients: true
    });
    var client = transport.mandrillClient;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      expect(data.async).to.equal(false);

      var message = data.message;
      expect(message.tags).to.deep.equal(['other']);
      expect(message.metadata).to.deep.equal({website: 'youtube.com'});
      expect(message.recipient_metadata).to.deep.equal([{rcpt: 'other'}]);
      expect(message.preserve_recipients).to.equal(false);

      resolve([{ _id: 'fake-id', status: 'sent' }]);
    });

    var payload = {
      data: {
        async: false,
        tags: ['other'],
        metadata: { website: 'youtube.com' },
        recipient_metadata: [ { rcpt: 'other' } ],
        preserve_recipients: false
      }
    };

    transport.send(payload, done);
  });

  describe('#send', function(done) {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var payload = {
      data: {
        to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
        cc: 'Somefool Gettingcopied <somefool@example.com>, Also Copied <alsocopied@example.com>',
        bcc: 'silentcopy@example.com, alsosilent@example.com',
        from: 'Gary the Snail <gary@bikini.bottom>',
        subject: 'Meow...',
        text: 'Meow!',
        html: '<p>Meow!</p>'
      }
    };

    var status;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      expect(data.async).to.equal(false);

      var message = data.message;
      expect(message).to.exist;
      expect(message.to.length).to.equal(6);
      expect(message.to[0].name).to.equal('SpongeBob SquarePants');
      expect(message.to[0].email).to.equal('spongebob@bikini.bottom');
      expect(message.to[1].name).to.equal('Patrick Star');
      expect(message.to[1].email).to.equal('patrick@bikini.bottom');
      expect(message.to[2].name).to.equal('Somefool Gettingcopied');
      expect(message.to[2].email).to.equal('somefool@example.com');
      expect(message.to[2].type).to.equal('cc');
      expect(message.to[3].name).to.equal('Also Copied');
      expect(message.to[3].email).to.equal('alsocopied@example.com');
      expect(message.to[3].type).to.equal('cc');
      expect(message.to[4].email).to.equal('silentcopy@example.com');
      expect(message.to[4].type).to.equal('bcc');
      expect(message.to[5].email).to.equal('alsosilent@example.com');
      expect(message.to[5].type).to.equal('bcc');
      expect(message.from_name).to.equal('Gary the Snail');
      expect(message.from_email).to.equal('gary@bikini.bottom');
      expect(message.subject).to.equal('Meow...');
      expect(message.text).to.equal('Meow!');
      expect(message.html).to.equal('<p>Meow!</p>');

      expect(message.tags).to.be.an.array;
      expect(message.metadata).to.be.an.array;
      expect(message.recipient_metadata).to.be.an.array;
      expect(message.preserve_recipients).to.equal(true);

      resolve([{ _id: 'fake-id', status: status }]);
    });

    after(function() {
      stub.restore();
    });

    afterEach(function() {
      stub.reset();
    });

    it('sent response', function(done) {
      status = 'sent';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('queued response', function(done) {
      status = 'queued';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('scheduled response', function(done) {
      status = 'scheduled';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('invalid response', function(done) {
      status = 'invalid';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });
  });
});

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

  describe('#send', function(done) {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var payload = {
      data: {
        to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
        from: 'Gary the Snail <gary@bikini.bottom>',
        subject: 'Meow...',
        text: 'Meow!',
        html: '<p>Meow!</p>'
      }
    };

    var status;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      var message = data.message;
      expect(message).to.exist;
      expect(message.to.length).to.equal(2);
      expect(message.to[0].name).to.equal('SpongeBob SquarePants');
      expect(message.to[0].email).to.equal('spongebob@bikini.bottom');
      expect(message.to[1].name).to.equal('Patrick Star');
      expect(message.to[1].email).to.equal('patrick@bikini.bottom');
      expect(message.from_name).to.equal('Gary the Snail');
      expect(message.from_email).to.equal('gary@bikini.bottom');
      expect(message.subject).to.equal('Meow...');
      expect(message.text).to.equal('Meow!');
      expect(message.html).to.equal('<p>Meow!</p>');
      resolve([{ _id: 'fake-id', status: status }]);
    });

    after(function() {
      stub.restore();
    });

    afterEach(function() {
      stub.reset();
    });

    function successCallbackFactory(done) {
      return function successCallback(err, info) {
        expect(stub.calledOnce).to.be.true;
        expect(err).to.not.exist;
        expect(info.messageId).to.equal('fake-id');
        done();
      };
    }

    function errorCallbackFactory(done) {
      return function errorCallback(err) {
        expect(stub.calledOnce).to.be.true;
        expect(err).to.exist;
        done();
      };
    }

    it('sent response', function(done) {
      status = 'sent';
      transport.send(payload, successCallbackFactory(done));
    });

    it('queued response', function(done) {
      status = 'queued';
      transport.send(payload, successCallbackFactory(done));
    });

    it('scheduled response', function(done) {
      status = 'scheduled';
      transport.send(payload, errorCallbackFactory(done));
    });

    it('invalid response', function(done) {
      status = 'invalid';
      transport.send(payload, errorCallbackFactory(done));
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(payload, errorCallbackFactory(done));
    });
  });
});

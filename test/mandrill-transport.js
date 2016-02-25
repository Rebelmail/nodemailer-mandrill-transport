'use strict';

var sinon = require('sinon'),
  expect = require('chai').expect,
  mandrillTransport = require('../'),
  packageData = require('../package.json');

describe('MandrillTransport', function() {
  it('should expose name and version', function() {
    var transport = mandrillTransport();
    expect(transport.name).to.equal('Mandrill');
    expect(transport.version).to.equal(packageData.version);
  });

  describe('#send', function() {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var payload = {
      data: {
        to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
        cc: 'Squidward Tentacles <squidward@bikini.bottom>, Sandy Cheeks <sandy@bikini.bottom>',
        bcc: 'Mr. Krabs <krabs@bikini.bottom>, Plankton <plankton@bikini.bottom>',
        from: 'Gary the Snail <gary@bikini.bottom>',
        subject: 'Meow...',
        text: 'Meow!',
        html: '<p>Meow!</p>'
      }
    };

    var status;

    function messageSentCallback(data, resolve) {
      var message = data.message;
      expect(message).to.exist;
      expect(message.to.length).to.equal(6);
      expect(message.to[0].name).to.equal('SpongeBob SquarePants');
      expect(message.to[0].email).to.equal('spongebob@bikini.bottom');
      expect(message.to[1].name).to.equal('Patrick Star');
      expect(message.to[1].email).to.equal('patrick@bikini.bottom');
      expect(message.to[2].type).to.equal('cc');
      expect(message.to[2].name).to.equal('Squidward Tentacles');
      expect(message.to[2].email).to.equal('squidward@bikini.bottom');
      expect(message.to[3].type).to.equal('cc');
      expect(message.to[3].name).to.equal('Sandy Cheeks');
      expect(message.to[3].email).to.equal('sandy@bikini.bottom');
      expect(message.to[4].type).to.equal('bcc');
      expect(message.to[4].name).to.equal('Mr. Krabs');
      expect(message.to[4].email).to.equal('krabs@bikini.bottom');
      expect(message.to[5].type).to.equal('bcc');
      expect(message.to[5].name).to.equal('Plankton');
      expect(message.to[5].email).to.equal('plankton@bikini.bottom');
      expect(message.from_name).to.equal('Gary the Snail');
      expect(message.from_email).to.equal('gary@bikini.bottom');
      expect(message.subject).to.equal('Meow...');
      expect(message.text).to.equal('Meow!');
      expect(message.html).to.equal('<p>Meow!</p>');

      resolve([{ _id: 'fake-id', status: status }]);
    }

    var sendStub = sinon.stub(client.messages, 'send', messageSentCallback);
    var sendTemplateStub = sinon.stub(client.messages, 'sendTemplate', messageSentCallback);

    after(function() {
      sendStub.restore();
      sendTemplateStub.restore();
    });

    afterEach(function() {
      sendStub.reset();
      sendTemplateStub.reset();
    });

    it('sent response', function(done) {
      status = 'sent';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(sendStub.calledOnce).to.be.true;
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
        expect(sendStub.calledOnce).to.be.true;
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
        expect(sendStub.calledOnce).to.be.true;
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
        expect(sendStub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(sendStub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('can override Mandrill API options', function(done) {
      payload.data.mandrillOptions = {
        message: {
          preserve_recipients: true
        }
      };

      sendStub.restore();
      sendStub = sinon.stub(client.messages, 'send', function(data, resolve) {
        expect(data.message.preserve_recipients).to.be.true;
        resolve([{ _id: 'fake-id', status: 'sent' }]);
      });

      transport.send(payload, function(err) {
        expect(err).to.not.exist;
        expect(sendStub.calledOnce).to.be.true;
        done();
      });
    });

    it('use a mandrill template', function(done) {
      payload.data.mandrillOptions = {
        template_name: 'krusty-krab-newsletter'
      };

      transport.send(payload, function(err) {
        expect(err).to.not.exist;
        expect(sendStub.calledOnce).to.be.false;
        expect(sendTemplateStub.calledOnce).to.be.true;
        done();
      });
    });
  });

  describe('#send attachments usage', function() {
    var nodemailer = require('nodemailer'),
      transport = mandrillTransport(),
      client = transport.mandrillClient,
      wrappedTransport = nodemailer.createTransport(transport),
      sendOptions;

    before(function() {
      sinon.stub(client.messages, 'send', function(options, cb) {
        sendOptions = options;
        cb([]);
      });
    });

    beforeEach(function() {
      sendOptions = {};
    });

    after(function() {
      client.messages.send.restore();
    });

    it('attachment object', function(done) {
      wrappedTransport.sendMail({
        from: '"Sender Name" <sender@server.com>',
        to: ['a@b.com', 'c@d.com'],
        subject: 'subject',
        text: 'text',
        attachments: [
          {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'hello world!'
          },
          {   // binary buffer as an attachment
            filename: 'text2.txt',
            content: new Buffer('hello world!', 'utf-8')
          },
          {   // define custom content type for the attachment
            filename: 'text.bin',
            content: 'hello world!',
            contentType: 'text/csv'
          },
          {   // use URL as an attachment
            filename: 'license.txt',
            path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
          },
          {   // encoded string as an attachment
            filename: 'text64.txt',
            content: 'this will be encoded',
            encoding: 'base64'
          },
          {   // data uri as an attachment
            path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
          }
        ]
      }, function(err, what) {
        console.log(err, what);
        console.log(sendOptions);
        done();
      });
    });
  });
});

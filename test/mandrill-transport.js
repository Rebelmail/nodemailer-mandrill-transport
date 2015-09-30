'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var _ = require('underscore');

var mandrillTransport = require('../');

var packageData = require('../package.json');

describe('MandrillTransport', function() {
  it('should expose name and version', function() {
    var transport = mandrillTransport();
    expect(transport.name).to.equal('Mandrill');
    expect(transport.version).to.equal(packageData.version);
  });

  it('can set defaults options', function() {
    var transport = mandrillTransport({
      async: true,
      message: {
        important:true,
        track_opens: true,
        track_clicks: true,
        auto_text: false,
        auto_html: true,
        inline_css: true,
        url_strip_qs: true,
        preserve_recipients: false,
        view_content_link: true,
        merge: true
      }
    });
    var options = transport.options;
    expect(options.async).to.equal(true);
    var message = options.message;
    expect(message.track_opens).to.equal(true);
    expect(message.track_clicks).to.equal(true);
    expect(message.auto_text).to.equal(false);
    expect(message.auto_html).to.equal(true);
    expect(message.inline_css).to.equal(true);
    expect(message.url_strip_qs).to.equal(true);
    expect(message.preserve_recipients).to.equal(false);
    expect(message.view_content_link).to.equal(true);
    expect(message.merge).to.equal(true);
  });
  

  describe('prototype.useDefault', function() {
    it('override defaults options', function() {
      var transport = mandrillTransport({
        async: false,
        message: {
          important: false,
          track_opens: false,
          track_clicks: false,
          auto_text: false,
          auto_html: false,
          inline_css: false,
          url_strip_qs: false,
          preserve_recipients: false,
          view_content_link: false,
          merge: false
        }
      });

      var options =  {
        async: true,
        message: {
          important: true,
          track_opens: true,
          track_clicks: true,
          auto_text: true,
          auto_html: true,
          inline_css: true,
          url_strip_qs: true,
          preserve_recipients: true,
          view_content_link: true,
          merge: true
        }
      };
      var params = transport.useDefaults(options);
      expect(params.async).to.equal(true);
      var message = params.message;
      expect(message.track_opens).to.equal(true);
      expect(message.track_clicks).to.equal(true);
      expect(message.auto_text).to.equal(true);
      expect(message.auto_html).to.equal(true);
      expect(message.inline_css).to.equal(true);
      expect(message.url_strip_qs).to.equal(true);
      expect(message.preserve_recipients).to.equal(true);
      expect(message.view_content_link).to.equal(true);
      expect(message.merge).to.equal(true);
    });
  });

  it('can override settings via message payload', function(done) {
    var transport = mandrillTransport({
      async: false,
      message: {
        important: false
      }
    });
    var client = transport.mandrillClient;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      expect(data.async).to.equal(true);

      var message = data.message;
      expect(message.important).to.equal(true);

      resolve([{ _id: 'fake-id', status: 'sent' }]);
    });

    var payload = {
      async: true,
      message: {
        important: true
      }
    };

    transport.send(payload, done);
  });

  it('can add other settings via message payload', function(done) {
    var transport = mandrillTransport({
      async: false,
      message: {
        important: false
      }
    });
    var client = transport.mandrillClient;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      expect(data.async).to.equal(true);

      var message = data.message;
      expect(message.tags).to.deep.equal(['other']);
      expect(message.metadata).to.deep.equal({website: 'youtube.com'});
      expect(message.recipient_metadata).to.deep.equal([{rcpt: 'other'}]);
      expect(message.preserve_recipients).to.equal(false);

      resolve([{ _id: 'fake-id', status: 'sent' }]);
    });

    var payload = {
      async: true,
      message: {
        important: true,
        tags: ['other'],
        metadata: { website: 'youtube.com' },
        recipient_metadata: [ { rcpt: 'other' } ],
        preserve_recipients: false
      }
    };

    transport.send(payload, done);
  });

  describe('#send', function() {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var data = {
      to: [{name: 'SpongeBob SquarePants', email: 'spongebob@bikini.bottom'},
        {name: 'Patrick Star', email: 'patrick@bikini.bottom'},
        {name: 'Somefool Gettingcopied', email: 'somefool@example.com', type: 'cc'},
        {name: 'Also Copied', email: 'alsocopied@example.com', type: 'cc'},
        {email: 'silentcopy@example.com', type: 'bcc'}, {email: 'alsosilent@example.com', type: 'bcc'}],
      from: {email: 'gary@bikini.bottom', name: 'Gary the Snail'},
      subject: 'Meow...',
      text: 'Meow!',
      html: '<p>Meow!</p>'
    };

    var dataNotFormatted = {
      to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
        cc: 'Somefool Gettingcopied <somefool@example.com>, Also Copied <alsocopied@example.com>',
      bcc: 'silentcopy@example.com, alsosilent@example.com',
      from: 'Gary the Snail <gary@bikini.bottom>',
      subject: 'Meow...',
      text: 'Meow!',
      html: '<p>Meow!</p>'
    };

    var status;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      expect(data).to.exist;
      expect(data.async).to.equal(false);

      var message = data.message;
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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(_.clone(data), function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    describe('with data not formatted', function() {

      it('sent response', function (done) {
        status = 'sent';
        transport.send(_.clone(dataNotFormatted), function (err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
          expect(err).to.not.exist;
          expect(stub.calledOnce).to.be.true;
          expect(info.accepted.length).to.equal(0);
          expect(info.rejected.length).to.equal(1);
          done();
        });
      });

      it('rejected response', function(done) {
        status = 'rejected';
        transport.send(_.clone(dataNotFormatted), function(err, info) {
          expect(err).to.not.exist;
          expect(stub.calledOnce).to.be.true;
          expect(info.accepted.length).to.equal(0);
          expect(info.rejected.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#sendTemplate', function(done) {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var data = {
      template_name: 'a_template_name',
      template_content: [{
          "name": "Michael Knight",
          "content": "The knight Rider content"
      }],
      to: [{name: 'SpongeBob SquarePants', email: 'spongebob@bikini.bottom'},
        {name: 'Patrick Star', email: 'patrick@bikini.bottom'},
        {name: 'Somefool Gettingcopied', email: 'somefool@example.com', type: 'cc'},
        {name: 'Also Copied', email: 'alsocopied@example.com', type: 'cc'},
        {email: 'silentcopy@example.com', type: 'bcc'}, {email: 'alsosilent@example.com', type: 'bcc'}],
      from: {email: 'gary@bikini.bottom', name: 'Gary the Snail'},
      subject: 'Meow...',
      text: 'Meow!',
      html: '<p>Meow!</p>'
    };

    var dataNotFormatted = {
      template_name: 'a_template_name',
      template_content: [{
        "name": "Michael Knight",
        "content": "The knight Rider content"
      }],
      to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
      cc: 'Somefool Gettingcopied <somefool@example.com>, Also Copied <alsocopied@example.com>',
      bcc: 'silentcopy@example.com, alsosilent@example.com',
      from: 'Gary the Snail <gary@bikini.bottom>',
      subject: 'Meow...',
      text: 'Meow!',
      html: '<p>Meow!</p>'
    };

    var status;
    var stub = sinon.stub(client.messages, 'sendTemplate', function(data, resolve) {
      expect(data.async).to.equal(false);

      var template_name = data.template_name;
      expect(template_name).to.exist;
      expect(template_name).to.equal('a_template_name');

      var template_content = data.template_content;
      expect(template_content).to.exist;
      expect(template_content.length).to.equal(1);
      expect(template_content[0].name).to.equal('Michael Knight');
      expect(template_content[0].content).to.equal('The knight Rider content');

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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
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
      transport.send(_.clone(data), function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(_.clone(data), function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    describe('with data not formatted', function() {

      it('sent response', function (done) {
        status = 'sent';
        transport.send(_.clone(dataNotFormatted), function (err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
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
        transport.send(_.clone(dataNotFormatted), function(err, info) {
          expect(err).to.not.exist;
          expect(stub.calledOnce).to.be.true;
          expect(info.accepted.length).to.equal(0);
          expect(info.rejected.length).to.equal(1);
          done();
        });
      });

      it('rejected response', function(done) {
        status = 'rejected';
        transport.send(_.clone(dataNotFormatted), function(err, info) {
          expect(err).to.not.exist;
          expect(stub.calledOnce).to.be.true;
          expect(info.accepted.length).to.equal(0);
          expect(info.rejected.length).to.equal(1);
          done();
        });
      });
    });
  });
});

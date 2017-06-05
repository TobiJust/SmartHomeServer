'use strict';
var Alexa = require("alexa-sdk"),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  server = require('http').createServer(app),
  port = process.env.PORT || 8080,
  rcswitch = require('rcswitch');

rcswitch.enableTransmit(0);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Handles the route for echo apis
app.post('/alexa', function(req, res) {
  // Build the context manually, because Amazon Lambda is missing
  var context = {
    succeed: function(result) {
      console.log(result);
      res.json(result);
    },
    fail: function(error) {
      console.log(error);
    }
  };

  var alexa = Alexa.handler(req.body, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
});

app.post('/android/on', function(req, res) {
  console.log(req.body);

  var room = req.body.room;
  var number = parseInt(req.body.number);
  var code = ROOMS[room];

  rcswitch.switchOn(code, number);
  res.json({foo: 1});
});
app.post('/android/off', function(req, res) {
  console.log(req.body);

  var room = req.body.room;
  var number = parseInt(req.body.number);
  var code = ROOMS[room];

  rcswitch.switchOff(code, number);
  res.json({foo: 1});
});

var handlers = {
  'LaunchRequest': function() {
    this.emit('WelcomeMessage');
  },
  'WelcomeMessage': function() {
    this.emit(':ask', 'Willkommen bei Smart Home, du kannst Licht an- und ausschalten' +
      ' oder die Heizung steuern! Was möchtest du tun?');
  },
  'TurnSingleLightOnIntent': function() {
    var slots = this.event.request.intent.slots;
    var room = slots.Room.value;
    var number = parseInt(slots.Number.value);
    var code = ROOMS[room];

    console.log(room + " " + number);

    rcswitch.switchOn(code, number);
    this.emit(':tell', 'Licht ist an ' + room);
  },
  'TurnSingleLightOffIntent': function() {
    var slots = this.event.request.intent.slots;
    var room = slots.Room.value;
    var number = parseInt(slots.Number.value);
    var code = ROOMS[room];

    rcswitch.switchOff(code, number);
    this.emit(':tell', 'Licht ist aus!');
  },
  'TurnRoomLightOnIntent': function() {
    var slots = this.event.request.intent.slots;
    var room = slots.Room.value;
    var code = ROOMS[room];

    for (var i = 1; i < 5; i++) {
      rcswitch.switchOn(code, i);
    }

    var cardContent = 'Licht eingeschaltet';
    var cardTitle = 'Smart Home';
    // An intent object representing the intent sent to your skill.
    // You can use this property set or change slot values and confirmation status if necessary.
    var imageObj = {
      smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
      largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png'
    };

    this.emit(':tellWithCard', 'Licht im ' + room + ' ist an', cardTitle, cardContent, imageObj);
  },
  'TurnRoomLightOffIntent': function() {
    var slots = this.event.request.intent.slots;
    var room = slots.Room.value;
    var code = ROOMS[room];

    for (var i = 1; i < 5; i++) {
      rcswitch.switchOff(code, i);
    }
    this.emit(':tell', 'Licht im ' + room + ' ist aus');
  },
  'SetTemperatureIntent': function() {
    var slots = this.event.request.intent.slots;
    var room = slots.Room.value;
    var degrees = slots.Degrees.value;
    var code = ROOMS[room];
    this.emit(':tell', 'Temperatur eingestellt');
  },
  'AMAZON.HelpIntent': function() {
    this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', "Auf Wiedersehen");
  },
  'Unhandled': function() {
    this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
  }

};

// Creates the website server on the port #
server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

var HELP_MESSAGE = "Ich kann die Lichter an- und ausschalten oder die Temperatur der Heizung regeln." +
  " Sage mir einfach welche Lampe ich steuern oder welche Temperatur in welchem Raum eingestellt werden soll." +
  " Was möchtest du gerne tun?";

var ROOMS = {
  'wohnzimmer': '11111',
  'schlafzimmer': '11110'
};

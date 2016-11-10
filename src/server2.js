
var twilio     = require('twilio'),
    bodyParser = require('body-parser'),
    express    = require('express'),
    async	   = require('async'),
    path = require('path'),
    request = require('request'),
    speech = require('@google-cloud/speech')({
    	projectId: 'project-8493566926258415217',
  		keyFilename: 'bajet-51ff0f4e8aad.json'
  	});

 var passphrase = 'cute kitten'

const akifUrl = 'http://custom.trackback.my:8080/api'

var port = process.env.PORT || 1337;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/incoming_call', function(req, res) {

	var twiml = new twilio.TwimlResponse();

	twiml.say('Welcome to Maybank Carbonara.');

	twiml.redirect('/login');

	res.send(twiml.toString());
});

// Login
// ------
app.post('/login', (req, res) => {

	var twiml = new twilio.TwimlResponse();

	twiml.say('Please say your secret passphrase.')
		 .record({
		 	action    : '/process_login',
		 	//trim      : 'trim-silence',
		 	maxLength: 5
		 })
	res.send(twiml.toString());
});

app.post('/process_login', (req, res) => {

	var twiml = new twilio.TwimlResponse();
	var recordingURL = req.body.RecordingUrl;

	var filename = path.basename(recordingURL), rawfilename = filename + '.raw'

	// async.series([
	// 	function(cb) {
	// 		//cb(null, 'hi');
	// 		twiml.say('please wait.');
	// 		// download(recordingURL + '.raw', rawfilename, function() {
	// 		// 	syncRecognize(rawfilename, function(err, result) {
	// 		// 		console.log(result);
	// 		// 		res.send(twiml.say('thank you').toString());
	// 		// 	});
	// 		// })

	// 		download(recordingURL + '.raw', rawfilename, function(err) {

	// 			if (err) throw err;

	// 			syncRecognize(rawfilename, function(err, result) {

	// 				if (err) throw err;

	// 	    		console.log('Results:', result);

	// 	    		// if (result)
	// 	    		// 	twiml.say('your account balance is 300 dollars.').redirect('/start_action');
	// 	    		// else
	// 	    		// 	twiml.say('sorry we can not understand your words.');

	// 	    		//twiml.say('Is there anything I help you?')
	// 	    		//twiml.redirect('/start_action')
	// 	    		res.send(twiml.say(result).toString());
	// 			})
	// 		})


	// 	}
	// 	// , function(dld, cbx) {
	// 	// 	console.log(dld);
	// 	// 	console.log(cbx);
	// 	// 	//syncRecognize(rawfilename, cb)
	// 	// 	// setTimeout(function(cb) { 
	// 	// 	// 	cb(null, 'hello'); 
	// 	// 	// }, 2000);
	// 	// 	cbx(null, 'hello')
	// 	// }
	// ], function(err, msg) {
	// 	console.log('Message: ', msg)
	// 	res.send(twiml.say('thank you').toString());
	// })
	// twiml.say('please wait.')
	download(recordingURL + '.raw', rawfilename, function(err) {

		if (err) throw err;

		syncRecognize(rawfilename, function(err, result) {

			if (err) throw err;

    		console.log('pass_received:', result);

    		app.emit('event:pass_received', result);

    		// if (result)
    		// 	twiml.say('your account balance is 300 dollars.').redirect('/start_action');
    		// else
    		// 	twiml.say('sorry we can not understand your words.');

    		//twiml.say('Is there anything I help you?')
    		//twiml.redirect('/start_action')
    		//res.send(twiml.say(result).toString());
		})
	})
	res.send(twiml.say('please wait while i confirm your identity.').redirect('/check_login').toString());
});

// Action
// ------
app.post('/check_login', (req, res) => {

	var twiml = new twilio.TwimlResponse();

	// twiml.say('Is there anything I help you?')
	// 	 .record({
	// 	 	action    : '/process_action',
	// 	 	//trim      : 'do-not-trim',
	// 	 	maxLength: 5
	// 	 })
	app.once('event:pass_received', function(msg) {

		request(akifUrl + '/login-phone?phone=' + req.body.From, function(err, resp, body) {

		body = JSON.parse(body)

		console.log(body)
		var logged = false;
		var all = msg.split(/(\s+)/);
		for (var a = 0; a < all.length; a++) {
			if (body.pass.indexOf(all[a]) > -1) {
				logged = true;
				twiml.say('Your login is successful').redirect('/start_action')
			}
		}
		
		if (!logged) twiml.say('Your login is failed').redirect('/login');
		res.send(twiml.toString());

		})
	})
});

app.post('/start_action', (req, res) => {

	var twiml = new twilio.TwimlResponse();

	twiml.say('Is there anything I help you?')
		 .record({
		 	action    : '/process_action',
		 	//trim      : 'do-not-trim',
		 	maxLength: 5
	})	

	res.send(twiml.toString());
})

app.post('/process_action', (req, res) => {

	var twiml = new twilio.TwimlResponse();
	var recordingURL = req.body.RecordingUrl;

	var filename = path.basename(recordingURL), rawfilename = filename + '.raw'

	download(recordingURL + '.raw', rawfilename, function(err) {

		if (err) throw err;

		syncRecognize(rawfilename, function(err, result) {

			if (err) throw err;

    		//console.log('msg_received:', result);

    		app.emit('event:msg_received', result);
		})
	})

	res.send(twiml.say('please wait while i process your request.').redirect('/check_process').toString());
});

app.post('/check_process', (req, res) => {

	var twiml = new twilio.TwimlResponse();
	app.once('event:msg_received', function(msg) {

		if (msg.indexOf('balance') >= 0 || msg.indexOf('billing') >= 0 || msg.indexOf('account') >= 0 ) {
			console.log('intent: check_balance')
			// request(akifUrl + '/accounts?phone=' + req.body.From, function(req, resp, body) {

			// 	body = JSON.parse(body)
			// 	console.log(body)
			// 	var balance = body.accounts[0].Balance.amount.toString();

			// 	twiml.say('your account balance is '+ balance +' ringgit.')
			// })
			twiml.say('your account balance is one hundred and three thousand one ringgit and thirty-one cent.')
		}
		else if (msg.indexOf('transfer') >= 0) {
			console.log('intent: transfer_money')
			twiml.say('your transaction is successful.')
		}
		else if ((msg.indexOf('card') >= 0 && msg.indexOf('cancel') >= 0) || (msg.indexOf('card') >= 0 && msg.indexOf('stolen') >= 0) || (msg.indexOf('cat') >= 0 && msg.indexOf('cancel') >= 0)) {
			console.log('intent: cancel_card')
			twiml.say('okay, i will cancel your card right away. please wait and do not forget to request a new card at our nearest branches.')
		}
		else if (msg.indexOf('weather') >= 0) {
			console.log('intent: check_weather')
			twiml.say('i am not sure if i have the right to answer that, but from what i know, it is a sunny weather.')
		}
		else if (msg.indexOf('electricity') >= 0 || msg.indexOf('utility') >= 0 || msg.indexOf('water') >= 0 || msg.indexOf('internet') >= 0) {
			console.log('intent: pay_bill')
			twiml.say('sure, i will pay it right away. no worries.')
		}
		else {
			console.log('intent: not_found')
			twiml.say('i am sorry, the transaction you request is not currently available.')
		}

		twiml.redirect('/start_action')

		res.send(twiml.toString());
	})
})

function syncRecognize (filename, callback) {
  // Detect speech in the audio file, e.g. "./resources/audio.raw"
  speech.recognize(filename, {
    encoding: 'LINEAR16',
    sampleRate: 8000,
    languageCode: 'en-GB',
    speechContext: {
	  "phrases": [
	    'check', 'balance', 'cute', 'kitten', 'transfer'
	  ],
	}
  }, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results);
  });
}

function speechToTextWitAi(url, callback) {

	var options = {
		url: 'https://api.wit.ai/speech?v=20160526',
  		headers: {
    		'Authorization': 'Bearer VWPDBJRCEWV6KZX2734ZHLVFFYGJAO74',
    		'Content-Type': 'audio/wav'
  		}
	}

	download(url, 'input.wav', function(err) {

		//request.post()
	})
}

var http = require('https');
var fs = require('fs');

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb(null, true));  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

app.listen(port);
console.log('Running Voice Biometrics Server on port ' + port);

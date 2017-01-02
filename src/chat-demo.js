
require('dotenv').config();

var twilio     = require('twilio'),
    bodyParser = require('body-parser'),
    express    = require('express'),
    request = require('request'),
    speech = require('@google-cloud/speech')({
    	projectId: process.env.GCLOUD_PROJECT_ID,
  		keyFilename: process.env.GCLOUD_KEY_FILENAME
  	});

// Configure these settings based on the audio you're transcribing
const config = {
		encoding: 'LINEAR16',
		sampleRate: 8000,
		languageCode: 'en-GB'
	}

var port = process.env.PORT || 1337;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/incoming_call', (req, res) => {

	var twiml = new twilio.TwimlResponse();

	console.log('Receiving call: ' + req.body.From)

	twiml.say('Welcome to Twilio Echo. Please talk after each beep sound')
		.redirect('/start_chat');

	res.send(twiml.toString());
})

app.post('/start_chat', (req, res) => {

	var twiml = new twilio.TwimlResponse(),
		startCount = req.query.startCount || 0;

	twiml.record({
			action : '/transcribe',
			timeout: 2, // 1 is too soon
			maxLength: 15
		})

	// this will be executed if there is only silence otherwise ignored
	startCount++;
	if (startCount < 3)
		twiml.say('Hello? Are you there?').redirect('/start_chat?startCount=' + startCount)

	res.send(twiml.toString());
})

app.post('/transcribe', (req, res) => {

	var twiml = new twilio.TwimlResponse();
	var recordingURL = req.body.RecordingUrl;
	// todo // validate recording url availability first
	streamingRecognize(recordingURL, function(err, result) {

		if (err) console.error(err);
		else app.emit('event:transcribed', result);
	});

	// there is an awkward silence so lets put a dialog
	res.send(twiml.say('hold on').redirect('/reply_chat').toString());
})

app.post('/reply_chat', (req, res) => {

	var twiml = new twilio.TwimlResponse();
	var sessionId = req.body.From;

	app.once('event:transcribed', function(msg) {

		console.log('transcribed: ', msg);

		getReply(sessionId, msg, (err, reply) => {

	    	console.log('reply: ' + reply)

			if (err) twiml.say('Oops! Something went wrong. Please try again') 
			else twiml.say(reply) 

			twiml.redirect('/start_chat')

			res.send(twiml.toString());
		})
	})
})

function getReply(sessionId, msg, callback) {

	// sometimes it was silence but there is background noise so it is recorded anyway?
	if (msg.trim() == "")
		return callback(null, 'Sorry, can you say it again?')

	var apiai = require('apiai');

	var app = apiai(process.env.APIAI_ACCESS_TOKEN);

	var request = app.textRequest(msg, {
    	sessionId: sessionId
	});

	request.on('response', function(response) {
	    callback(null, response.result.fulfillment.speech)
	});

	request.on('error', function(error) {
	    callback(error)
	});

	request.end();
}

/* 
 * https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/speech
 * https://cloud.google.com/speech/docs/best-practices
 */

function syncRecognize (filename, callback) {
	speech.recognize(filename, config, callback);
}

function streamingRecognize(filename, callback) {

	const options = {
	    config: config,
		singleUtterance: true
	};

	const recognizeStream = speech.createRecognizeStream(options)
		.on('error', callback)
		.on('data', (data) => {
	  	// console.log('Data received: %j', data);
	  	if (data.endpointerType == speech.endpointerTypes.ENDPOINTER_EVENT_UNSPECIFIED)
	  		callback(null, data.results)
		});

	request(filename).pipe(recognizeStream)
}

app.listen(port);
console.log('Running Voice Chat Bot Server on port ' + port);

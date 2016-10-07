
var twilio     = require('twilio'),
    bodyParser = require('body-parser'),
    express    = require('express'),
    async	   = require('async'),
    voiceit    = require('./voiceit')();

var port = process.env.PORT || 1337;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/incoming_call', voiceit.userRequest, function(req, res) {

	var twiml = new twilio.TwimlResponse();

	twiml.say('Welcome to Maybank Echo.');

	async.waterfall([
		function(callback) {
			req.user.isExist(callback)
		},
		function(isExist, callback) {
			if (isExist)
				req.user.totalEnrollment(callback)
			else
				req.user.create(function(err) {
					if (err) callback(err)
					else {
						twiml.say('You will be asked to say a phrase 3 times, then you will be able to log in with that phrase.')
						callback(null, 0)
					}
				})
		}
	], function(err, enrollCount) {

		if (err) {
			twiml.say(err);
		} else if (enrollCount >= 3) {
			twiml.redirect('/authenticate');
		} else {
			twiml.redirect('/enroll?enrollCount=' + enrollCount);
		}
		res.send(twiml.toString());
	});
});

// Enrollments
// -----------
app.post('/enroll', voiceit.userRequest, function(req, res) {
  var enrollCount = req.query.enrollCount || 0;
  var twiml       = new twilio.TwimlResponse();

  twiml.say('Please say the following phrase to enroll.')
  	.pause(1).say(req.user.phrase)
  	.record({
	    action    : '/process_enrollment?enrollCount=' + enrollCount,
	    maxLength : 5,
	    trim      : 'do-not-trim'
	});

  res.send(twiml.toString());
});

app.post('/process_enrollment', voiceit.userRequest, function(req, res) {

	var enrollCount  = req.query.enrollCount;
	var recordingURL = req.body.RecordingUrl;
	var twiml = new twilio.TwimlResponse();

	req.user.enroll(recordingURL, function(err, success) {

		if (!err && success) {
			enrollCount++;
			if (enrollCount >= 3) {
				twiml.say('Thank you, recording received. You are now enrolled. You can log in.')
					.redirect('/authenticate');
			} else {
				twiml.say('Thank you, recording received. You will now be asked to record your phrase again.')
					.redirect('/enroll?enrollCount=' + enrollCount);
			}
		} else {
			twiml.say(err + '. Please try again.')
        		.redirect('/enroll?enrollCount=' + enrollCount);
		}

		res.send(twiml.toString());
	});
});

// Authenticate
// ------------
app.post('/authenticate', voiceit.userRequest, function(req, res) {
	var twiml = new twilio.TwimlResponse();

	twiml.say('Please say the following phrase to authenticate.')
		.pause(1).say(req.user.phrase)
		.record({
			action    : '/process_authentication',
			maxLength : 5,
			trim      : 'do-not-trim',
		});

  res.send(twiml.toString());
});

app.post('/process_authentication', voiceit.userRequest, function(req, res) {

	var twiml = new twilio.TwimlResponse();
	var recordingURL = req.body.RecordingUrl;

	req.user.auth(recordingURL, function(err, success) {

		if (err) {
			twiml.say(err);
		} else {
			if (success)
				twiml.say('Authentication is successful')
					.redirect('/start_action');
			else
				twiml.say('Passphrase is not clear. Please try again.')
					.redirect('/authenticate');
		}

		res.send(twiml.toString());
	});
});

// Action
// ------
app.post('/start_action', (req, res) => {

	var twiml = new twilio.TwimlResponse();

	twiml.say('How can I help you?')
		// .record({
		// 	action    : '/process_action',
		// 	maxLength : 5,
		// 	trim      : 'do-not-trim',
		// })
	res.send(twiml.toString());
});

app.listen(port);
console.log('Running Voice Biometrics Server on port ' + port);

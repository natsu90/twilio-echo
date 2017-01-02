
require('dotenv').config();

var speech = require('@google-cloud/speech')({
    	projectId: process.env.GCLOUD_PROJECT_ID,
  		keyFilename: process.env.GCLOUD_KEY_FILENAME
  	}),
	request = require('request')

// Configure these settings based on the audio you're transcribing
const config = {
		encoding: 'LINEAR16',
		sampleRate: 8000,
		languageCode: 'en-GB'
	}

var recordingURL = process.argv[2]

streamingRecognize(recordingURL, function(err, result) {

	if (err) throw err;
	else console.log(result);
})

/* 
 * https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/speech
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


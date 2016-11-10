
var http = require('https');
var fs = require('fs');
var request = require('request')
	path = require('path')
	speech = require('@google-cloud/speech')({
    	projectId: 'project-8493566926258415217',
  		keyFilename: 'bajet-51ff0f4e8aad.json'
  	})

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

var url = process.argv[2];
var filename = path.basename(url), rawfilename = filename + '.raw'

var options = {
		url: 'https://api.wit.ai/speech?v=20160526',
  		headers: {
    		'Authorization': 'Bearer VWPDBJRCEWV6KZX2734ZHLVFFYGJAO74',
    		'Content-Type': 'audio/wav'
  		},
  		encoding: null,
  		//body: new Buffer(dest, 'base64')
  		//body: fs.createReadStream(dest)
	}

download(url + '.raw', rawfilename, function(err) {

	if (err) throw err;

	// request.post(options, (err, resp, body) => {

	// 	if (err) throw err;

	// 	body = JSON.parse(body)

	// 	console.log(body);
	// })

	syncRecognize(rawfilename, function(err) {

		if (err) throw err;

		process.exit(0)
	})
})

function syncRecognize (filename, callback) {
  // Detect speech in the audio file, e.g. "./resources/audio.raw"
  speech.recognize(filename, {
    encoding: 'LINEAR16',
    sampleRate: 8000
  }, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    console.log('Results:', results);
    callback();
  });
}
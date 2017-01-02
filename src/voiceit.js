
require('dotenv').config();

const apiUrl = 'https://siv.voiceprintportal.com/sivservice/api'
var SHA256     = require('crypto-js/sha256'),
	request    = require('request');

var headers = {
    'VsitDeveloperId' : process.env.VOICEIT_DEV_ID,
    'PlatformID'      : '23'
}

function Voiceit() {

	return {
		userRequest: function(req, res, next) {
			userRequest(req, res, next);
		}
	};
}

function User(phoneNumber) {

	// todo // randomly choose from available phrases then assign to the phone number
	var data = {
		language : 'en-GB',
		phrase   : 'Never forget tomorrow is a new day.',
		number   : phoneNumber,
		headers	 : headers
   	};

   	data.headers.VsitEmail = phoneNumber + '@twiliobioauth.example.com';
   	data.headers.VsitPassword = SHA256(phoneNumber).toString();

   	return data;
}

function userRequest(req, res, next) {

	if (typeof req.body.From == 'undefined')
		return next();

	var user = User(req.body.From);

   	user.isExist = function(cb) {
   		isUserExist(user.number, cb);
   	}

   	user.totalEnrollment = function(cb) {
   		getTotalEnrollment(user.number, cb);
   	}

   	user.create = function(cb) {
   		createUser(user.number, cb)
   	}

   	user.enroll = function(url, cb) {
   		enrollUser(user.number, url, cb)
   	}

   	user.auth = function(url, cb) {
   		authUser(user.number, url, cb)
   	}

	req.user = user;
	next();
}

function isUserExist(phoneNumber, callback) {

	var user = User(phoneNumber),
		options = {
		    url: apiUrl + '/users',
		    headers: user.headers
		}
	
	request(options, function (error, response, body) {

		if (error) return callback(error)

		body = JSON.parse(body)

		switch(response.statusCode) {
			case 200:
				return callback(null, true);
			case 412:
				if (body.ResponseCode == 'UNF')
					return callback(null, false);
				return callback(body.Result);
			default:
				return callback(response.statusCode);
		}
	});
}

function getTotalEnrollment(phoneNumber, callback) {

	var user = User(phoneNumber),
		options = {
		    url: apiUrl + '/enrollments',
		    headers: user.headers
		}

	request(options, function (error, response, body) {

		if (error) return callback(error)

		body = JSON.parse(body)

		switch(response.statusCode) {
			case 200:
				return callback(null, body.Result.length);
			case 412:
				return callback(body.Result);
			default:
				return callback(response.statusCode);
		}
	});
}

function createUser(phoneNumber, callback) {

	var user = User(phoneNumber),
		options = {
		    url: apiUrl + '/users',
		    headers: user.headers
		};
	options.headers.VsitFirstName = 'First' + user.number
	options.headers.VsitLastName = 'Last' + user.number
	options.headers.VsitPhone1 = user.number

	request.post(options, function (error, response, body) {

		if (error) return callback(error)

		body = JSON.parse(body)

		switch(response.statusCode) {
			case 200:
				return callback(null, true);
			case 412:
				if (body.ResponseCode == 'UAE')
					return callback(null, false)
				return callback(body.Result);
			default:
				return callback(response.statusCode);
		}
	});
}

function enrollUser(phoneNumber, wavUrl, callback) {

	var user = User(phoneNumber),
		options = {
		    url: apiUrl + '/enrollments/bywavurl',
		    headers: user.headers
		};
	options.headers.VsitwavURL = wavUrl
	options.headers.ContentLanguage = user.language

	request.post(options, function (error, response, body) {

		if (error) return callback(error)

		body = JSON.parse(body)

		switch(response.statusCode) {
			case 200:
				if (body.ResponseCode == 'SUC')
					return callback(null, true);
				return callback(body.Result);
			case 412:
				return callback(body.Result);
			default:
				return callback(response.statusCode);
		}
	});
}

function authUser(phoneNumber, wavUrl, callback) {

	var user = User(phoneNumber),
		options = {
		    url: apiUrl + '/authentications/bywavurl',
		    headers: user.headers
		};
	options.headers.VsitwavURL = wavUrl
	options.headers.ContentLanguage = user.language
	options.headers.VsitConfidence = process.env.VOICEIT_CONFIDENCE

	request.post(options, function (error, response, body) {

		if (error) return callback(error)

		body = JSON.parse(body)

		switch(response.statusCode) {
			case 200:
				if (body.ResponseCode == 'SUC')
					return callback(null, true);
				else if (body.Result.indexOf('Not confident') >= 0)
					return callback(null, false);
				return callback(body.Result);
			case 412:
				return callback(body.Result);
			default:
				return callback(response.statusCode);
		}
	});
}

module.exports = Voiceit;


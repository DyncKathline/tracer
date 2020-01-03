"use strict";
const utils = require('./utils');
var util = require('util');
const path = require('path');
const settings = require('./settings').settings;

var noop = function () { };

var fwrap = function (fn) {
	return function (str) { return fn(str) };
};

// main log method
function logMain(config, level, title, format, filters, args) {
	//check level of global settings
	var gLevel = settings.level;
	if (typeof (gLevel) == 'string')
		gLevel = config.methods.indexOf(gLevel);
	if (level < gLevel) { return; }

	var data = {
		timestamp: utils.dateFormat(new Date(), config.dateformat),
		message: "",
		title: title,
		level: level,
		args: args
	};

	if (title == 'error') {
		const err = {
			message: util.format.apply(null, args)
		}

		// 源自V8引擎的Stack Trace API https://github.com/v8/v8/wiki/Stack-Trace-API
		Error.captureStackTrace(err, logMain);
		data.stack = err.stack + '\n';
	}

	config.preprocess(data);
	var msg = util.format.apply(config, data.args);
	data.message = msg;

	// call micro-template to ouput
	data.output = utils.tim(format, data);

	// save unprocessed output
	data.rawoutput = data.output;

	// process every filter method
	var len = filters.length;
	for (var i = 0; i < len; i += 1) {
		data.output = fwrap(filters[i])(data.output);
		if (!data.output)
			return data;
		// cancel next process if return a false(include null, undefined)
	}
	// trans the final result
	config.transport.forEach(function (tras) {
		tras(data);
	});
	return data;
}

module.exports = (function () {
	// default config
	var _config = {
		rootDir: '',
		format: "{{timestamp}} <{{title}}> {{message}}",
		dateformat: "yyyy-MM-dd hh:mm:ss,S",
		preprocess: function () {
		},
		transport: function (data) {
			if (data.level >= 4) { // warn and more critical
				console.error(data.output);
			} else {
				console.log(data.output);
			}
		},
		filters: [],
		level: 'log',
		methods: ['log', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'],
		stackIndex: 0,		// get the specified index of stack as file information. It is userful for development package.
		inspectOpt: {
			showHidden: false, //if true then the object's non-enumerable properties will be shown too. Defaults to false
			depth: 2 //tells inspect how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Defaults to 2. To make it recurse indefinitely pass null.
		},
		supportConsoleMethods: true
	};

	var userConfig = arguments;
	if (typeof userConfig[0] === 'string') {
		userConfig = [require(userConfig[0])];
	}

	// union user's config and default
	_config = utils.union(_config, userConfig);

	var _self = {};

	_config.format = Array.isArray(_config.format) ? _config.format
		: [_config.format];

	_config.filters = Array.isArray(_config.filters) ? _config.filters
		: [_config.filters];

	_config.transport = Array.isArray(_config.transport) ? _config.transport : [_config.transport];

	var fLen = _config.filters.length, lastFilter;
	if (fLen > 0)
		if (Object.prototype.toString.call(_config.filters[--fLen]) != '[object Function]') {
			lastFilter = _config.filters[fLen];
			_config.filters = _config.filters.slice(0, fLen);
		}

	if (typeof (_config.level) == 'string')
		_config.level = _config.methods.indexOf(_config.level);

	_config.methods.forEach(function (title, i) {
		if (i < _config.level)
			_self[title] = noop;
		else {
			var format = _config.format[0];
			if (_config.format.length === 2 && _config.format[1][title])
				format = _config.format[1][title];

			var filters;
			if (lastFilter && lastFilter[title])
				filters = Array.isArray(lastFilter[title]) ? lastFilter[title]
					: [lastFilter[title]];
			else
				filters = _config.filters;
			
			//open console log
			if (_config.supportConsoleMethods) {
				console[title] = function() {
					return logMain(_config, i, title, format, filters, arguments);
				}
			}
			// interface
			_self[title] = function () {
				return logMain(_config, i, title, format, filters, arguments);
			};
		}
	});

	// if (_config.supportConsoleMethods) {
	// 	Object.getOwnPropertyNames(console).forEach(function (title) {
	// 		if (!_self[title]) {
	// 			_self[title] = console[title];
	// 		}
	// 	});
	// }

	return _self;
});

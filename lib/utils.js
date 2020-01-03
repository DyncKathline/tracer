"use strict";
exports.union = function (obj, args) {
	for (var i = 0, len = args.length; i < len; i += 1) {
		var source = args[i];
		for (var prop in source) {
			obj[prop] = source[prop];
		}
	}
	return obj;
};

var formatRegExp = /%[sdjt]/g;
var util = require('util');
exports.format = function (f) {
	var inspectOpt = this.inspectOpt;
	var args = arguments;
	var i = 0;

	if (typeof f !== 'string') {
		var objects = [];
		for (; i < args.length; i++) {
			objects.push(util.inspect(args[i], inspectOpt));
		}
		return objects.join(' ');
	}

	i = 1;
	var str = String(f).replace(formatRegExp, function (x) {
		switch (x) {
			case '%s':
				return String(args[i++]);
			case '%d':
				return Number(args[i++]);
			case '%j':
				try {
					if (args[i] instanceof Error) {
						return JSON.stringify(args[i++], ['message', 'stack', 'type', 'name']);
					} else {
						return JSON.stringify(args[i++]);
					}
				} catch (e) {
					return '[Circular]';
				}
			case '%t':
				return util.inspect(args[i++], inspectOpt);
			default:
				return x;
		}
	});
	for (var len = args.length, x = args[i]; i < len; x = args[++i]) {
		if (x === null || typeof x !== 'object') {
			str += ' ' + x;
		} else {
			str += ' ' + util.inspect(x, inspectOpt);
		}
	}
	return str;
};

/**
 * 日期格式化
 * @param {Date} date 
 * @param {String} fmt 
 */
exports.dateFormat = function (date, fmt) {
	if (!(date instanceof Date)) {
		return '';
	}
	var o = {
		"M+": date.getMonth() + 1,                 //月份
		"d+": date.getDate(),                    //日
		"h+": date.getHours(),                   //小时
		"m+": date.getMinutes(),                 //分
		"s+": date.getSeconds(),                 //秒
		"q+": Math.floor((date.getMonth() + 3) / 3), //季度
		"S": date.getMilliseconds()             //毫秒
	};

	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	}

	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(
				RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}

	return fmt;
}


exports.tim = function(template, data) {
	var start = exports.start = "{{";
	var end = exports.end = "}}";
	var path = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
		undef;
	var pattern = new RegExp(exports.start + "\\s*(" + path + ")\\s*" + exports.end, "gi");

	// Merge data into the template string
	return template.replace(pattern, function (tag, token) {
		var path = token.split("."),
			len = path.length,
			lookup = data,
			i = 0;

		for (; i < len; i++) {
			lookup = lookup[path[i]];

			// Property not found
			if (lookup === undef) {
				throw new Error("tim: '" + path[i] + "' not found in " + tag);
			}

			// Return the required value
			if (i === len - 1) {
				return lookup;
			}
		}
	});
};
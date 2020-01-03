"use strict";
exports.console = require('./console');
//要使用color_console需要npm install colors
// exports.colorConsole = require('./color_console');
exports.dailyfile = require('./dailyfile');

//global settings
var settings = require('./settings');
exports.close = settings.close;
exports.setLevel = settings.setLevel;
exports.getLevel = settings.getLevel;

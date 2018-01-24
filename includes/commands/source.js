'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

exports.description = 'Links you to my source code';

exports.usage = `Use ${app.prefix}source to find my github page.`;

exports.main = function(msg,args) {
	common.sendMsg(msg,'My source code can be found here. Feel free to make a pull request or contact Seka if you want to contribute!\nhttps://github.com/Sheemap/Snazbot',false,15);

};
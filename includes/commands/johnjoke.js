'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

exports.description = 'Outputs a random one of John\'s many insightful statements.';

exports.main = function(msg,args){
	common.sendMsg(msg,'Do you remember when you were conceived?',false,15);
}
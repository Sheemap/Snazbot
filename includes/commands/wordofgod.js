'use strict'
const fs = require('fs');

const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

const christ = require('./christianserver.js');

exports.description = "Report bad words";

exports.usage = `Use ${app.prefix}wordofgod <word or phrase> to report a bad word and advance the word of god.`;

exports.main = function(msg,args){
	if(args.join(' ').length >= 3){
		christ.addBad(args.join(' '));
		common.sendMsg(msg,'Thank you for your contribution, brother.',false,15);
	}else{
		common.sendMsg(msg,'Words lower than 3 characters cannot be blocked because that would be stupid and we will not tolerate that.',false,15)
	}
}
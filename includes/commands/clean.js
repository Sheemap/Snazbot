'use strict'
const common = require('../common.js');
const app = require('../../app.js');

exports.description = "Cleans bot commands and responses.";

exports.usage = `Use "${app.prefix}clean" to delete many of the past snazbot command messages, as well as snazbot responses.`;

exports.main = function(msg,args){
	let msgs = common.msgs;
	let x = 0;
	for(let mess in msgs){
		if(typeof(msgs[mess]) !== 'undefined'){
			msgs[mess].delete();
			x++;
		}
	}
	common.msgs = [];
	common.sendMsg(msg,`Cleaned ${x} messages!`,false,5);
	logger.log('info',`Cleaned ${x} messages.`);
}
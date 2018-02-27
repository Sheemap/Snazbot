'use strict'
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

const ENABLED = false;

exports.description = "Cleans bot commands and responses.";

exports.usage = `Use "${app.prefix}clean" to delete many of the past snazbot command messages, as well as snazbot responses.`;

exports.main = function(msg,args){
	if(ENABLED){
		common.getMsg(callback);
		function callback(msgs){
			let x = 0;
			for(let mess in msgs){
				if(typeof(msgs[mess]) !== 'undefined'){
					msgs[mess].delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
					x++;
				}else{
					logger.log('warn','Entry in array is undefined!');
				}
			}
			common.reset();
			common.sendMsg(msg,`Cleaned ${x} messages!`,false,5);
			logger.log('info',`Cleaned ${x} messages.`);
		}
	}else{
		common.sendMsg(msg,'This command is currently disabled.'false,15);
	}
}
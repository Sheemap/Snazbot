'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js');

exports.description = 'Reload config';

exports.usage = `Admin command to reload configuration files.`;

exports.main = function(msg,args){
	if(!app.admins.includes(msg.author.id)){
		common.sendMsg(msg,`You are not authorized to execute this command.`);
		return;
	}

	app.loadConf();

	logger.log('info','Reloaded configuration file.');
	common.sendMsg(msg,`Reloaded configuration file.`);
}

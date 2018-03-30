'use strict'
const glob = require('glob');
const path = require('path');
const Discord = require('discord.js');
const sleep = require('sleep-promise');
const ini = require('ini');
const fs = require('fs');

const logger = require('./logger.js');
const app = require('../app.js');
const common = require('./common.js');

var comms = {};
var msg_functions = [];

//Load blacklist
const blacklist = ini.parse(fs.readFileSync('./config/blacklist.ini', 'utf-8'))

var blackcomms = blacklist.commands.split(',');
var blackchan = blacklist.channels.split(',');
var blackserv = blacklist.servers.split(',');
var blackuser = blacklist.users.split(',');

var blackall = blackuser.concat(blackchan.concat(blackserv.concat(blackcomms)));

//Load commands
var commcount = 0;
glob.sync('./includes/commands/**/*.js').forEach(function(file) {
	let name = file.replace('./includes/commands/','').replace('.js','');
	comms[name] = require(path.resolve(file));
	commcount++;
});

for(let c in comms){
	if(typeof(comms[c].msg) !== 'undefined'){
		msg_functions.push(comms[c].msg);
	} 
}

logger.log('info',`Loaded ${commcount} commands.`);

exports.parse = function(msg){
	let content = msg.content;
	let found = false;

	let authid = msg.author.id;
	let chanid = msg.channel.id;
	let servid = msg.guild.id;

	let comm = content.split(' ')[0].replace(app.prefix,'');
	let args = content.replace(app.prefix+comm+' ','').split(' ');


	if(blackall.indexOf(authid) != -1){
		logger.log('debug','User is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(servid) != -1){
		logger.log('debug','Server is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(chanid) != -1){
		logger.log('debug','Channel is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(comm) != -1){
		logger.log('debug','Command is blacklisted, not replying.');
		return;
	}

	if(msg.author.id == app.BOTID){
		logger.log('debug','Not responding to self')
		return;
	}


	logger.log('info',`Command from ${msg.author.username}: ${msg.content}`)

	for(let command in comms){
		if(comm == command){
			found = true;
			if(typeof(comms[command].main) !== 'undefined'){
				comms[command].main(msg,args)
			}else{
				logger.log('error',`User issued command "${command}", but theres no main function defined!`);
			}
		}
	}
	if(comm == 'help'){
		found = true;
		help(msg,args);
	}
	if(!found){
		common.sendMsg(msg,'Command not found! Try again.',false,30)
	}
}

exports.react = function(reaction,user,added){
	let content = reaction.message.content;
	let found = false;

	let authid = reaction.message.author.id;
	let chanid = reaction.message.channel.id;
	let servid = reaction.message.guild.id;

	let comm = content.split(' ')[0].replace(app.prefix,'');
	let args = content.replace(app.prefix+comm+' ','').split(' ');


	if(blackall.indexOf(authid) != -1){
		logger.log('debug','User is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(servid) != -1){
		logger.log('debug','Server is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(chanid) != -1){
		logger.log('debug','Channel is blacklisted, not replying.');
		return;
	}

	for(let c in comms){
		if(typeof(comms[c].reactions) !== 'undefined'){
			if(comms[c].reactions.split(',').includes(reaction.emoji.identifier) || comms[c].reactions.split(',').includes(reaction.emoji.toString())){
				if(typeof(comms[c].react) !== 'undefined'){
					comms[c].react(reaction,user,added)
				}else{
					logger.log('error',`Reaction recognized for "${c}", but command has no reaction function!`);
				}
			}
		}
	}
}

exports.msg = function(msg){
	let content = msg.content;
	let found = false;

	let authid = msg.author.id;
	let chanid = msg.channel.id;
	let servid = msg.guild.id;

	if(blackall.indexOf(authid) != -1){
		logger.log('debug','User is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(servid) != -1){
		logger.log('debug','Server is blacklisted, not replying.');
		return;
	}
	if(blackall.indexOf(chanid) != -1){
		logger.log('debug','Channel is blacklisted, not replying.');
		return;
	}

	if(msg.author.id == app.BOTID){
		logger.log('debug','Not responding to self')
		return;
	}


	// logger.log('info',`Command from ${msg.author.username}: ${msg.content}`)

	for(let i=0;i<msg_functions.length;i++){
		msg_functions[i](msg);
	}
}

function help(msg,args){
	if(args[0] == '!help' || args[0] == 'help'){
		let rich = new Discord.RichEmbed();
		rich.setTitle('List of commands')
		rich.setDescription(`Use ${app.prefix}help <command> for a more detailed description.`)
		for(let command in comms){
			let desc;
			if(typeof(comms[command].description)!== 'undefined'){
				desc = comms[command].description;
			}else{
				desc = 'No description profided';
			}
			rich.addField(app.prefix+command,`*${desc}*`,true);
		}
		common.sendMsg(msg,rich,false,30);
	}else{
		let found = false;
		let rich = new Discord.RichEmbed();
		for(let command in comms){
			let com = args[0].replace(app.prefix,'');
			if(com == command){
				found = true;
				if(typeof(comms[com].usage) !== 'undefined'){
					rich.setTitle(`Usage info for ${com}`);
					rich.setDescription(comms[com].usage);
					common.sendMsg(msg,rich,false,30);
				}else{
					common.sendMsg(msg,'No usage information supplied by this command.');
				}
			}
		}
		if(!found){
			common.sendMsg(msg,'Could not find a command that matches that! Please try again.',false,30)
		}
	}
}
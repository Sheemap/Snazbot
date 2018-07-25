'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js');

exports.description = 'Utilities for the Deceit game';

exports.usage = `Use ${app.prefix}deceit <on|off> enable/disable deceit mode on a channel.\n\nIf deceit mode is on and you are in that channel, you can use these single letter commands with no prefix:\n\n**s** - Start of a game, deafens everyone.\n**e** - End of a game, undeafens everyone.\n**d** - You have died, undeafens only you. ***ONLY USE IF DEAD IN THE GAME***`;

var enabled = {};

exports.main = function(msg,args){
	
	switch(args[0].toLowerCase()){

		case 'on':
			on(msg,args);
			break;

		case 'off':
			off(msg,args);
			break;

		default:
			common.sendMsg(msg,exports.usage);
	}

}

function on(msg){
	if(!app.deceitusers.includes(msg.author.id)){
		common.sendMsg(msg,`You are not authorized to use this command. Please contact your server admin if you think this is in error.`);
		return;
	}

	let vc = common.userVC(msg.author,msg.guild);
	if(typeof(vc) === 'undefined'){
		common.sendMsg(msg,`You must be in a voice channel to use this command!`);
		return;
	}

	for(let x in enabled){
		if(x !== vc.id){
			if(enabled[x].includes(msg.author.id)){
				
				common.sendMsg(msg,`You are already listed in another chat! You can only be in one deceit mode chat at a time.`);
				return;

			}
		}
	}

	if(vc.id in enabled){
		common.sendMsg(msg,`Refreshed users enabled in **${vc.name.replace(' [D]','')}**.`);
	}else{

		vc.setName(`${vc.name} [D]`);
		common.sendMsg(msg,`Enabled deceit mode for the channel **${vc.name.replace(' [D]','')}** and its current users. If other players join, please run this command again.`);
	}

	let members = [];
	let memarray = vc.members.array();
	for(let x in memarray){
		members.push(memarray[x].id)
	}


	enabled[vc.id] = members;
}

function off(msg){
	if(!app.deceitusers.includes(msg.author.id)){
		common.sendMsg(msg,`You are not authorized to use this command. Please contact your server admin if you think this is in error.`);
		return;
	}

	let vc = common.userVC(msg.author,msg.guild);
	if(typeof(vc) === 'undefined'){
		common.sendMsg(msg,`You must be in a voice channel to use this command!`);
		return;
	}

	if(typeof(enabled[vc.id]) === 'undefined'){
		if(vc.name.includes(' [D]'))
			vc.setName(vc.name.replace(' [D]',''))
		common.sendMsg(msg,`Deceit mode is already off in this chat.`)
		return;
	}
	vc.setName(`${vc.name.replace(' [D]','')}`);
	delete enabled[vc.id];
	common.sendMsg(msg,`Disabled deceit mode for the channel **${vc.name.replace(' [D]','')}**.`);
}

exports.msg = function(msg){
	//Check to see if any live games, if none, end.
	if(Object.keys(enabled).length === 0 && enabled.constructor === Object){
		return;
	}

	switch(msg.content.replace(' ','')){

		case 's':
		case 'start':
			setState(msg,true,false);
			break;

		case 'e':
		case 'end':
			setState(msg,false,false);
			break;

		case 'd':
		case 'dead':
			setState(msg,false,true);
			break;
	}

}

function setState(msg,start,dead){
	let vc = common.userVC(msg.author,msg.guild);
	let authid = msg.author.id;

	//If they arent in a voice chat, or the voice chat is not in deceit mode, return.
	if(typeof(vc) === 'undefined' || typeof(enabled[vc.id]) === 'undefined')
		return;

	if(enabled[vc.id].includes(authid)){

		if(dead){
			msg.member.setDeaf(false).catch(console.error)
			msg.member.setMute(false).catch(console.error)
		}else{
			let members = vc.members;
			members.forEach(function(user){
				user.setDeaf(start).catch(console.error)
				user.setMute(start).catch(console.error)
			})

			if(start){
				common.sendMsg(msg,`Starting game, deafening chat.`);
			}else{
				common.sendMsg(msg,`Ending game, undeafening chat.`);
			}
		}
	}

}
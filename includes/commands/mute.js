'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const sleep = require('sleep-promise');

const afk = require('./afk.js');


var duration = 60

exports.description = 'Calls a vote to mute';

exports.usage = `Use ${app.prefix}mute <user>  <duration> to call a vote to mute user for duration in seconds.\n\nUser needs to be in your same voice channel.\n\nIf no duration is set, will default to ${duration} seconds.`;


exports.main = function(msg,args){
	let vc = msg.member.voiceChannelID;
	let maxDuration = 600;
	let error = false;

	if(vc != null){
		if(args.length == 1 & args[0] == "!mute"){
			common.sendMsg(msg,"You need to specify someone to mute!",false,5);
			error = true;
			logger.log('info',msg.author.username+" did not specify anyone to mute");
		}
		if(afk.voting){
			common.sendMsg(msg,"Vote is already in progress, please wait.",false,5);
			error = true;
			logger.log('info',msg.author.username+" tried to call a mute while a vote was in progress")
		}
		if(!isNaN(args[1])){
			if(args[1] <= maxDuration){
				duration = args[1];
			}else{
				common.sendMsg(msg,"Your duration is too long. The max is "+maxDuration+" seconds.",false,5);
				error = true;
				logger.log('info',msg.author.username+" tried to call a mute with too long a duration");
			}

			if(args[1] >= 1){
				duration = args[1];
			}else{
				common.sendMsg(msg,"Your duration is too short. There must be at least 1 second.",false,5);
				error = true;
				logger.log('info',msg.author.username+" tried to call a mute with too short a duration");
			}
		}
		if(args.length > 1){
			if(isNaN(args[1])){
				common.sendMsg(msg,"Your duration is not a number!",false,5);
				error = true;
				logger.log('info',msg.author.username+" tried to call a mute without a correctly formatted duration")
			}
		}
		if(!error){
			let scrub = args[0].toLowerCase();
			let truscrub;
			afk.scrublist = msg.member.voiceChannel.members.array();
			let ascrub = [];
			for(let x=0;x<afk.scrublist.length;x++){
				var pscrub = afk.scrublist[x].displayName;
				afk.scrubnames.push(pscrub);
				if(pscrub.toLowerCase().includes(scrub)){
					truscrub = afk.scrublist[x];
					ascrub.push(pscrub)
				}
			}
			if(ascrub.length == 0){
				common.sendMsg(msg,"Could not find anyone in your voice channel matching that name. Try again!",false,5);
				error = true;
				logger.log('info',msg.author.username+" attempted to call a mute for '"+pscrub.toLowerCase()+"' but I couldnt find anyone matching that!");
			}
			if(ascrub.length > 1){
				common.sendMsg(msg,"Multiple people match that name, try a more specific name.",false,5);
				logger.log('info',msg.author.username+" attempted to call a mute for '"+pscrub.toLowerCase()+"' but there are multiple people matching that.");
				error = true;
			}
			if(!error){
				let cb = function(succ){
					if(succ){
						truscrub.setMute(true,"Voted for it");
						logger.log('info',"Vote succeeded to mute "+truscrub.user.username+" for "+duration);
						sleep(duration*1000).then(function(){
							truscrub.setMute(false,"Timed unmute");
							logger.log('info',truscrub.user.username+" has been unmuted");
						})
					}else{
						logger.log('info',"Vote failed to mute "+truscrub.user.username+" for "+duration);
					}
				} 
				let msgtxt = "Voting to mute "+ascrub[0]+" for "+duration+" seconds";
				afk.callVote(afk.scrublist.length,msgtxt,msg,cb);
			}
		}
	}else{
		common.sendMsg(msg,"You need to be in a voice channel to use this command!",false,5);
		logger.log('info',msg.author.username+" tried to vote mute, but is not in a voice channel.");
	}
}
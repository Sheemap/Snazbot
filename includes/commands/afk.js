'use strict'
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const sleep = require('sleep-promise');

var voting = exports.voting = false,
votecount = 0,
scrublist = exports.scrublist = [],
scrubnames = exports.scrubnames = [],
voters = [];

exports.description = 'Calls a vote to move to AFK';

exports.usage = `Use ${app.prefix}afk <user> to call a vote.\n\nUser needs to be in your same voice channel.`;

exports.main = function(msg,args) {
	let self = this;
	let vc = msg.member.voiceChannelID;
	let duration;
	let error = false;

	if(vc != null){
		if(args.length == 1 & args[0] == "!afk"){
			common.sendMsg(msg,"You need to specify someone to move!",false,15);
			error = true;
			logger.log('info',msg.author.username+" did not specify anyone to !afk");
		}
		if(voting){
			common.sendMsg(msg,"Vote is already in progress, please wait.",false,15);
			error = true;
			logger.log('info',msg.author.username+" tried to call an afk vote while a vote was in progress");
		}

		if(!error){
			let scrub = args[0].toLowerCase();
			let truscrub;
			scrublist = msg.member.voiceChannel.members.array();
			let ascrub = [];
			for(let x=0;x<scrublist.length;x++){
				var pscrub = scrublist[x].displayName;
				scrubnames.push(pscrub);
				if(pscrub.toLowerCase().includes(scrub)){
					truscrub = scrublist[x];
					ascrub.push(pscrub);
				}
			}
			if(ascrub.length == 0){
				common.sendMsg(msg,"Could not find anyone in your voice channel matching that name. Try again!",false,15);
				error = true;
				logger.log('info',msg.author.username+" attempted to call afk for '"+pscrub.toLowerCase()+"' but I couldnt find anyone matching that.");

			}
			if(ascrub.length > 1){
				common.sendMsg(msg,"Multiple people match that name, try a more specific name.",false,15);
				error = true;
				logger.log('info',msg.author.username+" attempted to call afk for '"+pscrub.toLowerCase()+"' but there are multiple people matching that.");
			}
			if(!error){
				let cb = function(succ){
					if(succ){
						truscrub.setVoiceChannel(truscrub.guild.afkChannel);
						logger.log('info',"Vote succeeded to move "+truscrub.user.username+" to afk");
					}else{
						logger.log('info',"Vote failed to move "+truscrub.user.username+" to afk");
					}
				} 
				let msgtxt = "Voting to move "+ascrub[0]+" to afk channel.";
				self.callVote(scrublist.length,msgtxt,msg,cb);
			}
		}
	}else{
		common.sendMsg(msg,"You need to be in a voice channel to use this command!",false,15);
		logger.log('info',msg.author.username+" tried to vote afk, but is not in a voice channel.");
	}
}

exports.callVote = function(usercount,msgtxt,msg,cb){
	let votesNeeded;
	let duration = 15;
	voters = [msg.author.username];
	votecount = 1;
	voting = true;
	if(usercount <= 4){
		votesNeeded = 2;
	}else{
		votesNeeded = Math.round((usercount)/2);
	}
	common.sendMsg(msg,msgtxt+"\n\nNeeded votes: "+votesNeeded+"\nTime to vote: "+duration+" seconds",false,30);
	let slip = duration*1000;
	sleep(slip).then(function(){
		voting = false;
		if(votecount >= votesNeeded){
			common.sendMsg(msg,"Vote succeeded! "+votecount+"/"+votesNeeded,false,15);
			exports.scrubnames = scrubnames = [];
			cb(true);
		}else{
			common.sendMsg(msg,"Vote failed! "+votecount+"/"+votesNeeded,false,15);
			exports.scrubnames = scrubnames = [];
			cb(false);
		}
	})
}

exports.voter = function(msg){
	let voted = false;
	if(voting){
		for(let x=0;x<scrubnames.length;x++){
			if(scrubnames[x].includes(msg.author.username)){
				for(let y=0;y<voters.length;y++){
					if(voters[y].includes(msg.author.username)){
						voted = true;
					}
				}
				if(!voted){
					votecount++;
					voters.push(msg.author.username);
					common.sendMsg(msg,"counted vote.",true);
					logger.log('info',msg.author.username+" has voted!");
				}else{
					logger.log('info',msg.author.username+" tried to vote, but has already done so!");
					common.sendMsg(msg," youve already voted!",true);
				}
			}
		}
	}
}
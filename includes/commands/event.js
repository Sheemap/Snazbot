'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

const sleep = require('sleep-promise');

exports.description = 'Auto scheduling';

exports.usage = `Use ${app.prefix}event to do things.`;



exports.reactions = "<:99_1am:416844243496075274>,<:98_2am:416844317966204939>,<:97_3am:416844328183267328>,<:96_4am:416844336685252608>,<:95_5am:416844348395618304>,<:94_6am:416844353701412881>,<:93_7am:416844359481294848>,<:92_8am:416844363876794388>,<:91_9am:416844368008183819>,<:90_10am:416844374849093642>,<:89_11am:416844380092104706>,<:88_12pm:416844385049903105>,<:87_1pm:416844391563395072>,<:86_2pm:416844397007732737>,<:85_3pm:416844406151446550>,<:84_4pm:416844412065153024>,<:83_5pm:416844419765895168>,<:82_6pm:416844430776205312>,<:81_7pm:416844438497918977>,<:80_8pm:416844447268208651>,<:79_9pm:416844454742458389>,<:78_10pm:416844460656295937>,<:77_11pm:416844466578653185>,<:76_12am:416844473453117440>";


// Database structure

// events (disNAM TEXT, disID TEXT, timestamp NUMERIC, name TEXT, 
// frequency TEXT, notify_day TEXT, notify_frequency TEXT, 
// default_times TEXT, invites TEXT, channelID TEXT, responses TEXT)


// 99_1am:416844243496075274
// 98_2am:416844317966204939
// 97_3am:416844328183267328
// 96_4am:416844336685252608
// 95_5am:416844348395618304
// 94_6am:416844353701412881
// 93_7am:416844359481294848
// 92_8am:416844363876794388
// 91_9am:416844368008183819
// 90_10am:416844374849093642
// 89_11am:416844380092104706
// 88_12pm:416844385049903105
// 87_1pm:416844391563395072
// 86_2pm:416844397007732737
// 85_3pm:416844406151446550
// 84_4pm:416844412065153024
// 83_5pm:416844419765895168
// 82_6pm:416844430776205312
// 81_7pm:416844438497918977
// 80_8pm:416844447268208651
// 79_9pm:416844454742458389
// 78_10pm:416844460656295937
// 77_11pm:416844466578653185
// 76_12am:416844473453117440

/*

	args:
		-n name
		-f frequency (one time, weekly)
		-i invitees (who to send invites to, cant be used with -c)
		-c channel id (where to send invites)
		-d default times (which emojis will be auto placed 1-24)
		-n notify day (when to first send invites)
		-w wait time between notifications (how long to wait before sending reminder invite)



*/



//exports.reactions = `%F0%9F%87%B8,%F0%9F%87%B2,%F0%9F%87%BA,%F0%9F%87%BC,%F0%9F%87%AD,%F0%9F%87%AB,%F0%9F%87%A6`;

//S %F0%9F%87%B8
//M %F0%9F%87%B2
//U %F0%9F%87%BA
//W %F0%9F%87%BC
//H %F0%9F%87%AD
//F %F0%9F%87%AB
//A %F0%9F%87%A6

exports.main = function(msg,args){
	switch(args[0]){
		case 'create':
			createEvent(msg,args);
			break;

		case '!sched':
			common.sendMsg(msg,`Usage: \n\n`+exports.usage,false,15);
			break
	}
	// common.sendMsg(msg,'Ayboi dis testerino.',false,15,cb);

	// function cb(message){
	// 	message.react("🇸");
	// 	message.react("🇲");
	// 	message.react("🇺");
	// 	message.react("🇼");
	// 	message.react("🇭");
	// 	message.react("🇫");
	// 	message.react("🇦");
	// }
}

exports.react = function(reaction,user,added){

}


// Database structure

// events (disNAM TEXT, disID TEXT, timestamp NUMERIC, name TEXT, 
// frequency TEXT, notify_day TEXT, notify_frequency TEXT, 
// default_times TEXT, invites TEXT, channelID TEXT, responses TEXT)


/*
	args:
		-t title/name
		-f frequency (one time, weekly)
		-i invitees (who to send invites to, cant be used with -c)
		-c channel id (where to send invites)
		-d default times (which emojis will be auto placed 1-24)
		-n notify day (when to first send invites)
		-w wait time between notifications (how long to wait before sending reminder invite)
*/
function createEvent(msg,oldargs){

	let inv_method = false;

	//parse msg content
	var args = msg.content.split('-');
	args.shift();

	var data = {
		error: '',
		disNAM: msg.author.username,
		disID: msg.author.id,
		timestamp: new Date() / 1000,
		name: '',
		frequency: ''
	}

	for(let i in args){
		let opt = args[i].split(' ');

		switch(opt[0]){
			// t stands for title
			case 't':
				argName(opt);
				break;

			case 'f':
				argFrequency(opt);
				break;

			case 'i':
				argInvites(opt);
				break;

			case 'c':
				argChannel(opt);
				break;

			case 'd':
				argDefaultTimes(opt);
				break;
		}
	}

	function argName(opt){
		if(typeof(opt[2]) !== 'undefined'){
			data.error += 'Event name cannot contain spaces!\n\n';
			return;
		}

		data.name = opt[1];
	}

	function argFrequency(opt){
		if(typeof(opt[2]) !== 'undefined'){
			data.error += 'Frequency cannot contain spaces!\n\n';
			return;
		}

		if(opt[1] == 'once' || opt[1] == 'one' || opt[1] == 'one-time'){
			data.frequency = 'one-time';
		}
		else if(opt[1] == 'weekly'){
			data.frequency = 'weekly';
		}
		else{
			data.error += `Unrecognized frequency "*${opt[1]}*". The options are 'weekly' or 'once'.\n\n`;
			return;
		}
	}

	function argInvites(opt){
		if(inv_method){
			data.error += `-i cannot be used with -c. Please select a single invite method.\n\n`;
			return;
		}
		inv_method = true;

		if(typeof(opt[2]) !== 'undefined'){
			data.error += 'Invite list cannot contain spaces! Please seperate with commas only.\n\n';
			return;
		}

		let invites = {};
		let invitelist = opt[1].split(',');
		let memberlist = msg.channel.guild.members.array();
		let disID,
			disNAM,
			count = 0;

		for(let i in invitelist){
			disID = '';
			disNAM = '';
			count = 0;
			for(let mem in memberlist){
				if(memberlist[mem].user.username.toLowerCase().includes(invitelist[i].toLowerCase())){
					count++;
					disID = memberlist[mem].user.id;
					disNAM = memberlist[mem].user.username;
				}
			}
			if(count <= 0){
				data.error += `No user found matching name "${invitelist[i]}"\n\n`
				return;
			}else if(count >= 2){
				data.error += `Multiple users found matching the name "${invitelist[i]}"\n\n`
				return;
			}

			if(disID == '' || disNAM == ''){
				logger.log('error',`Found a user matching name "${invitelist[i]}", but didnt set data. Unknown cause.`);
				data.error += `Unknown error! Report to <@104848260954357760> please.`
				return;
			}

			invites[disID] = {disNAM: disNAM};

			data.invites = invites;

		}
	}

	function argChannel(opt){
		if(inv_method){
			data.error += `-c cannot be used with -i. Please select a single invite method.\n\n`;
			return;
		}
		inv_method = true;


		if(isNaN(opt[1])){
			data.error += 'Channel must be an ID. Use command "**!id**" to get ID of current channel.\n\n';
			return;
		}

		if(typeof(opt[2]) !== 'undefined'){
			data.error += 'Channel ID cannot contain spaces! Please seperate with commas only.\n\n';
			return;
		}

		let chanlist = app.client.channels.array(),
			valid_chan = false,
			chanID;

		for(let i in chanlist){
			if(chanlist[i].id == opt[1]){
				valid_chan = true;
				chanID = chanlist[i].id;
			}
		}

		if(!valid_chan){
			data.error += `Channel ID is invalid!\n\n`;
			return;
		}

		data.channel = chanID;

	}

	
	console.log(data)
}
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

function createEvent(msg,args){

}
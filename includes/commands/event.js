'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const db = require('../db.js');

const sleep = require('sleep-promise');
const timestring = require('timestring');
const schedule = require('node-schedule');

exports.description = 'Auto scheduling';

exports.usage = `Use ${app.prefix}event to do things.`;



exports.reactions = "<:99_1am:416844243496075274>,<:98_2am:416844317966204939>,<:97_3am:416844328183267328>,<:96_4am:416844336685252608>,<:95_5am:416844348395618304>,<:94_6am:416844353701412881>,<:93_7am:416844359481294848>,<:92_8am:416844363876794388>,<:91_9am:416844368008183819>,<:90_10am:416844374849093642>,<:89_11am:416844380092104706>,<:88_12pm:416844385049903105>,<:87_1pm:416844391563395072>,<:86_2pm:416844397007732737>,<:85_3pm:416844406151446550>,<:84_4pm:416844412065153024>,<:83_5pm:416844419765895168>,<:82_6pm:416844430776205312>,<:81_7pm:416844438497918977>,<:80_8pm:416844447268208651>,<:79_9pm:416844454742458389>,<:78_10pm:416844460656295937>,<:77_11pm:416844466578653185>,<:76_12am:416844473453117440>";


const F_DEFAULT = 'one-time';
const ND_DEFAULT = 'sun';
const NT_DEFAULT = '12';
const NW_DEFAULT = '86400'; // 86400s is 24h


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
		-n title/name
		-f frequency (one time, weekly)
		-i invitees (who to send invites to, cant be used with -c)
		-c channel id (where to send invites)
		-s start date
		-dt default times (which emojis will be auto placed 1-24)
		-nd notify day (when to first send invites)
		-nt notify time (what time to send invites)
		-rn required num to consider a valid day
		-rp required attendees to consider valid day
		-nw wait time between notifications (how long to wait before sending reminder invite)
*/
function createEvent(msg,oldargs){

	//parse msg content
	var args = msg.content.split('-');
	args.shift();

	var date_select = false,
		req_people_list = [];

	var data = {
		error: '',
		disNAM: msg.author.username,
		disID: msg.author.id,
		timestamp: new Date() / 1000
	}

	db.all('SELECT * FROM events',function(err,rows){
		
		var current_events = rows;

		for(let i in args){
			let opt = args[i].split(' ');

			switch(opt[0]){
				// t stands for title
				case 'n':
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

				case 's':
					argStartDate(opt);
					break;

				case 'dt':
					argDefaultTimes(opt);
					break;

				case 'nd':
					argNotifyDay(opt);
					break;

				case 'nt':
					argNotifyTime(opt);
					break;

				case 'nw':
					argWait(opt);
					break;

				case 'rn':
					argRequiredNum(opt);
					break;

				case 'rp':
					argRequiredPerson(opt);
					break;
			}
		}

		function argName(opt){
			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
				data.error += 'Event name cannot contain spaces!\n\n';
				return;
			}

			for(let row in current_events){
				if(current_events[row].event_name == opt[1] && current_events[row].expired == 0){
					data.error += `There is already an event with this name!\n\n`;
					data.name = 'nil';
					return;
				}
			}
			

			data.name = opt[1];
		}

		function argFrequency(opt){
			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
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

			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
				data.error += 'Invite list cannot contain spaces! Please seperate with commas only.\n\n';
				return;
			}

			let memberlist = [];
			let memberids = [];
			let guilds = app.client.guilds.array();
			for(let i in guilds){
				let members = guilds[i].members.array();
				for(let w in members){
					if(memberids.indexOf(members[w].id) == -1){
						memberlist.push(members[w]);
						memberids.push(members[w].id);
					}
				}
			}

			let invites = {};
			let invitelist = opt[1].split(',');
			// let memberlist = msg.channel.guild.members.array();
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

			}

			invites[data.disID] = {disNAM: data.disNAM};
			data.invites = invites;
		}

		function argChannel(opt){

			if(isNaN(opt[1])){
				data.error += 'Channel must be an ID. Use command "**!id**" to get ID of current channel.\n\n';
				return;
			}

			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
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

		function argStartDate(opt){
			if(date_select){
				data.error += `-s cannot be used with -nd. Please use one or the other`;
				return;
			}
			date_select = true;

			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
				data.error += `Start date cannot contain spaces! Please use format "Month/Day" Ex: 2/27: Feb 27th, 11/13: November 13th.\n\n`;
				return;
			}

			let date = opt[1].split('/');

			if(typeof(date[1]) === 'undefined'){
				data.error += `Start date formatted incorrectly! Please use format "Month/Day" Ex: 2/27: Feb 27th, 11/13: November 13th.\n\n`;
				return;
			}

			if(date[0].length < 1 || date[0].length > 2 || date[1].length < 1 || date[1].length > 2){
				data.error += `Start date is invalid! Please use format "Month/Day" Ex: 2/27: Feb 27th, 11/13: November 13th.\n\n`;
				return;
			}

			if(isNaN(date[0]) || isNaN(date[1])){
				data.error += `Start date cannot contain text! Please use numbers only, in the format "Month/Day" Ex: 2/27: Feb 27th, 11/13: November 13th.\n\n`;
				return;
			}

			if(date[0] < 1 && date[0] > 12){
				data.error += `Start month is out of bounds! Make sure it is a valid month 1-12.\n\n`;
				return;
			}

			if(date[1] < 1 && date[1] > 31){
				data.error += `Start day is out of bounds! Make sure it is a valid day 1-31.\n\n`;
				return;
			}

			data.notify_date = date.join('/');
		}

		function argDefaultTimes(opt){
			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
				data.error += 'Time list cannot contain spaces! Please seperate with commas only.\n\n';
				return;
			}

			let timelist = opt[1].split(','),
				times = [],
				time;

			for(let i in timelist){
				time = timelist[i].replace(':','');

				if(isNaN(time)){
					data.error += `${timelist[i]} is formatted incorrectly! Times must be in 24HR format with 2 digits. No AM PM. Ex: 11, 13, 24, etc...\n\n`;
					return;
				}

				if(time.length < 1 || time.length > 2){
					data.error += `${timelist[i]} is formatted incorrectly! Times must be in 24HR format with 2 digits. No AM PM. Ex: 11, 13, 24, etc...\n\n`;
					return;
				}

				if(times.indexOf(time) != -1){
					data.error += `${timelist[i]} is a duplicate time. Please enter each hour only once.\n\n`;
					return;
				}

				times.push(time);
			}

			data.default_times = times;
		}

		function argNotifyDay(opt){
			if(date_select){
				data.error += `-nd cannot be used with -s. Please use one or the other`;
				return;
			}
			date_select = true;

			if(typeof(opt[2]) !== 'undefined' && opt[2] !== '' && opt[2] !== ''){
				data.error += 'There can only be one notify day! No spaces.\n\n';
				return;
			}

			let day;

			switch(opt[1]){
				case 'm': case 'mon': case 'monday':
					day = 'mon';
					break;

				case 'tu': case 'tue': case 'tuesday':
					day = 'tue';
					break;
					
				case 'w': case 'wed': case 'wednesday':
					day = 'wed';
					break;
					
				case 'th': case 'thu': case 'thursday':
					day = 'thu';
					break;
					
				case 'f': case 'fri': case 'friday':
					day = 'fri';
					break;
					
				case 'sa': case 'sat': case 'saturday':
					day = 'sat';
					break;
				
				case 'su': case 'sun': case 'sunday':
					day = 'sun';
					break;

				default:
					data.error += `Unrecognized day of week "${opt[1]}". Please use 3 letter format. Ex: Mon, Tue, Thu, Fri etc...\n\n`;
					return;
					break;
			}

			data.notify_day = day;
		}

		function argNotifyTime(opt){
			console.log('o',opt[2],'o')
			if(typeof(opt[2]) !== 'undefined' && opt[2] !== '' && opt[2] !== ''){
				data.error += 'There can only be one notify time! No spaces.\n\n';
				return;
			}

			let time = opt[1].replace(':','');

			if(isNaN(time)){
				data.error += `Notify time is formatted incorrectly! Time must be in 24HR format with 2 digits. No AM PM. Ex: 11, 13, 24, etc...\n\n`;
				return;
			}

			if(time.length > 2 || time.length < 1){
				data.error += `Notify time is formatted incorrectly! Time must be in 24HR format with 2 digits. No AM PM. Ex: 11, 13, 24, etc...\n\n`;
				return;
			}

			let int_time = parseInt(time);
			if(int_time < 0 || int_time > 24){
				data.error += `Notify time is invalid! Time must be between 0-24.\n\n`;
				return;
			}

			data.notify_time = int_time;

		}

		function argRequiredNum(opt){
			if(typeof(opt[2]) !== 'undefined' && opt[2] !== '' && opt[2] !== ''){
				data.error += 'Only one number. No spaces.\n\n';
				return;
			}

			if(isNaN(opt[1])){
				data.error += 'Required amount of people must be a number.\n\n';
				return;
			}

			let num = parseInt(opt[1]);

			data.required_num = num;
		}

		function argRequiredPerson(opt){

			if(typeof(opt[2]) !== 'undefined' && opt[2] !== ''){
				data.error += 'Required people list cannot contain spaces! Please seperate with commas only.\n\n';
				return;
			}

			let memberlist = [];
			let memberids = [];
			let guilds = app.client.guilds.array();
			for(let i in guilds){
				let members = guilds[i].members.array();
				for(let w in members){
					if(memberids.indexOf(members[w].id) == -1){
						memberlist.push(members[w]);
						memberids.push(members[w].id);
					}
				}
			}

			let required_people = [];
			let reqlist = opt[1].split(',');
			// let memberlist = msg.channel.guild.members.array();
			let disID,
				disNAM,
				count = 0;

			for(let i in reqlist){
				disID = '';
				disNAM = '';
				count = 0;
				for(let mem in memberlist){
					if(memberlist[mem].user.username.toLowerCase().includes(reqlist[i].toLowerCase())){
						count++;
						disID = memberlist[mem].user.id;
						disNAM = memberlist[mem].user.username;
					}
				}
				if(count <= 0){
					data.error += `No user found matching name "${reqlist[i]}"\n\n`
					return;
				}else if(count >= 2){
					data.error += `Multiple users found matching the name "${reqlist[i]}"\n\n`
					return;
				}

				if(disID == '' || disNAM == ''){
					logger.log('error',`Found a user matching name "${reqlist[i]}", but didnt set data. Unknown cause.`);
					data.error += `Unknown error! Report to <@104848260954357760> please.\n\n`
					return;
				}

				req_people_list.push(disNAM);
				required_people.push(disID);

			}

			data.required_people = required_people;

		}

		function argWait(opt){

			let newopt = opt
			newopt.shift();

			let time = timestring(newopt.join(' '));

			if(time == 0){
				data.error += `Notify delay format was incorrect! Please use format such as this "1d 3h 20m"\n\n`;
				return;
			}

			// 21600s = 6h
			if(time < 21600){
				data.error += `Notify delay has to be at least 6h.\n\n`;
				return;
			}

			data.notify_wait = time;

		}


		if(typeof(data.name) === 'undefined'){
			data.error += `Event name is required! Set it with -n\n\n`;
		}
		if(typeof(data.channel) === 'undefined' && typeof(data.invites) === 'undefined'){
			data.error += `Please select an invite method. Either -c or -i\n\n`;
		}
		

		if(data.error != ''){
			common.sendMsg(msg,`**Errors occured**\n${data.error}`);
			return;
		}


	//set defaults

		if(typeof(data.frequency) === 'undefined'){
			data.frequency = F_DEFAULT;
		}

		let notifday;
		if(typeof(data.notify_day) === 'undefined' && typeof(data.notify_date) === 'undefined'){
			data.notify_day = ND_DEFAULT;
			notifday = ND_DEFAULT;
		}else if(typeof(data.notify_day) === 'undefined'){
			notifday = data.notify_date;
		}else{
			notifday = data.notify_day;
		}

		if(typeof(data.notify_time) === 'undefined'){
			data.notify_time = NT_DEFAULT;
		}

		if(typeof(data.notify_wait) === 'undefined'){
			data.notify_wait = NW_DEFAULT;
		}

		let fullmsg = 'Do these options look correct to you? (y/n)\n\n';

		fullmsg += `Name: **${data.name}**\nFrequency: **${data.frequency}**\nNotification day: **${notifday}**\nNotification time: **${data.notify_time}**\nRecurring notify delay: **${(data.notify_wait/60/60).toFixed(2)}h**\n`;

		if(typeof(data.channel) !== 'undefined'){
			fullmsg += `Invite channel ID: **${data.channel}**\n`;
		}

		if(typeof(data.invites) !== 'undefined'){
			fullmsg += `Invited users: `
			for(let i in data.invites){
				fullmsg += `**${data.invites[i].disNAM}**, `;
			}
			fullmsg += `\n`;
		}

		if(typeof(data.default_times) !== 'undefined'){
			fullmsg += `Default start times: **${data.default_times.join(', ')}**\n`;
		}

		if(typeof(data.required_num) !== 'undefined'){
			fullmsg += `Required participants: **${data.required_num}**\n`
		}

		if(typeof(data.required_people) !== 'undefined'){
			fullmsg += `Required people: **${req_people_list.join(', ')}**\n`;
		}

		common.sendMsg(msg,fullmsg);

		const filter = m => (m.content.toLowerCase().startsWith('y') && m.author == msg.author || m.content.toLowerCase().startsWith('n') && m.author == msg.author);

		msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
	  		.then(collected => finish(collected))
	  		.catch(collected => common.sendMsg(msg,'No response recieved in 30 seconds. Cancelling event creation.'));

	  	function finish(res){
	  		res = res.first();

	  		if(res.content.toLowerCase().startsWith('y')){

	  			common.sendMsg(msg,'Would you like to send a notification now? (y/n)')


	  			msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
			  		.then(collected => initNotif(collected))
			  		.catch(collected => common.sendMsg(msg,'No response recieved in 30 seconds. Cancelling event creation.'));

	  		}else{
	  			common.sendMsg(msg,'Cancelling event creation. Try again soon!')
	  		}
	  	}

	  	function initNotif(res){
	  		let mes = res.first();
  			if(mes.content.toLowerCase().startsWith('y')){

  				data.initial_notif = true
  				db.runSecure(`INSERT INTO events VALUES (?,?,?,?,?,?)`, {
	  				1: data.disNAM,
	  				2: data.disID,
	  				3: data.timestamp,
	  				4: data.name,
	  				5: 0,
	  				6: JSON.stringify(data)
	  			})
				common.sendMsg(mes,'Event created, sending notification now!')

			}else{

				data.initial_notif = false
  				db.runSecure(`INSERT INTO events VALUES (?,?,?,?,?,?)`, {
	  				1: data.disNAM,
	  				2: data.disID,
	  				3: data.timestamp,
	  				4: data.name,
	  				5: 0,
	  				6: JSON.stringify(data)
	  			})
  				common.sendMsg(mes,`Event created! Will notify on **${notifday}**.`);

	  		}
	  		console.log(data)
	  	}

		
	})
}

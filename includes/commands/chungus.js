'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js');

const moment = require('moment');

exports.description = 'Claim yourself as chungus';

exports.usage = `Use "${app.prefix}chungus" to claim your chungus points.\n\nUse "${app.prefix}chungus top" to check leaderboard.\n\nUse "${app.prefix}chungus cd <user>" to check someones current cooldown. If you dont specify a person, it defaults to you.\n\nIf you're the chungus, use "${app.prefix}chungus color <#hex code>" to change your color, and "${app.prefix}chungus name <name>" to change your role title (Must include the word chungus).`;

// const app.chungusrole = app.chungusrole;
// const app.chunguschan.split(',') = app.chunguschan.split(',');
// var app.chunguscd = app.chunguscd; //43200seconds is 12hours

if(app.chunguschan.split(',') == ""){
	logger.log('error','Chungus channel is not configured! Chungus will not work without this setting.');
}
if(app.chungusrole == ""){
	logger.log('error','Chungus role is not configured! Chungus will not work without this setting.');
}

if(app.chunguscd == ""){
	app.chunguscd = 0;
	logger.log('info','No max chungus cooldown set.');
}





var lastcall,
	chungusmins;


exports.main = function(msg,args){

	logger.log('debug',`${args[0].toLowerCase()}`)
	switch(args[0].toLowerCase()){



		case 'tmp':
			checkLeader(msg,args);
			break;

		case 'top':
			top(msg,args);
			break;

		case 'color':
			changeColor(msg,args);
			break;

		case 'name':
			changeName(msg,args);
			break;

		case 'cooldown':
		case 'cd':
			checkCD(msg,args);
			break;

		case '!chungus':
			claim(msg,args);
			break;

		default:
			common.sendMsg(msg,`\`\`\`${exports.usage}\`\`\``)
			break;

	}
}

function changeName(msg,args){
	let role;
	let roles = msg.member.roles.array();
	let chungus = false;

	for(let i=0;i<roles.length;i++){

		if(roles[i].id == app.chungusrole){
			role = roles[i];
			chungus = true;
		}

	}

	if(chungus){

		let name = msg.content.toLowerCase().replace(`${app.prefix}chungus name `,'')

		if(name == app.prefix+"chungus name"){
			common.sendMsg(msg,`No name detected! Not changing.`);
			return;
		}

		if(typeof(name) !== 'undefined' && name !== '' && name.includes('chungus')){
			role.setName(name)
				.then(updated => common.sendMsg(msg,`Changed name to ${name}`))
				// .catch(common.sendMsg(msg,`Failed to change chungus color. Make sure you have a valid color!`))
		}else{
			common.sendMsg(msg,`Please enter a valid name. The name must contain "chungus" somewhere in it.`)
		}
	}else{
		common.sendMsg(msg,`You arent the chungus! You dont decide the name!`);
	}
}

function changeColor(msg,args){
	let role;
	let roles = msg.member.roles.array();
	let chungus = false;

	for(let i=0;i<roles.length;i++){

		if(roles[i].id == app.chungusrole){
			role = roles[i];
			chungus = true;
		}

	}

	if(chungus){
		if(typeof(args[1]) !== 'undefined'){
			role.setColor(args[1].toUpperCase())
				.then(updated => common.sendMsg(msg,`Changed chungus color to ${args[1]}`))
				// .catch(common.sendMsg(msg,`Failed to change chungus color. Make sure you have a valid color!`))
		}else{
			common.sendMsg(msg,`Please enter a valid hex code as the final argument.`)
		}
	}else{
		common.sendMsg(msg,`You arent the chungus! You dont decide the color!`);
	}
}

function top(msg,args){
	db.all("SELECT * FROM chungus WHERE disNAM != 'chungus' ORDER BY points DESC",function(err,rows){

		var content = 'Top chungus:\n';
		var user_display_name = '';

		for(let i=0;i<rows.length;i++){

			if(i>=10)
				break;

			user_display_name = rows[i].disNAM;
			common.findUser(rows[i].disID,function(user){
				user_display_name = user.displayName.replace(" [Wanking]","");
			})
			content += `${i+1}. ${user_display_name}: **${rows[i].points}**\n`;
		}

		common.sendMsg(msg,content);

	})
}

function claim(msg,args){

	if(!app.chunguschan.split(',').includes(msg.channel.id)){
		common.sendMsg(msg,`You may only chungus in the #botspam channel`);
		return;
	}

	// Cant claim chungus twice in a row
	// if(msg.author.id == lastcall){
	// 	common.sendMsg(msg,`You cant claim chungus twice in a row!`);
	// 	return;
	// }

	var seconds = new Date() / 1000;
	db.get("SELECT lastclaim FROM chungus WHERE disNAM='chungus'",function(err,row){
		var chungustime = Math.round((seconds - row.lastclaim)/60);
		

		// Logarithm
		// var chunguspoints = Math.round(Math.log(chungustime)*10);

		// Power of 2
		var chunguspoints = Math.round(Math.pow(chungustime,1.85)/70);
			db.get(`SELECT * FROM chungus WHERE disID="${msg.author.id}"`,function(err,row){

				var chungussecs = seconds;
				var cooldown = 0;
				if(typeof(row) !== 'undefined' && row.points != "0"){
					chungussecs = seconds-row.lastclaim;
					cooldown = row.points*15;
					if(cooldown > app.chunguscd && app.chunguscd !== 0){
						cooldown = app.chunguscd;
					}
				}
				//>
				if(chungussecs > cooldown){
					db.run(`UPDATE chungus SET lastclaim="${seconds}" WHERE disNAM="chungus"`,function(err,not_needed){
					if(typeof(row) === 'undefined'){
						db.runSecure(`INSERT INTO chungus VALUES (?,?,?,?,?)`,{
							1: msg.author.username,
							2: msg.author.id,
							3: seconds,
							4: chunguspoints,
							5: 0
						},function(err,row){
							checkLeader(msg);
						})

						var newpoints = chunguspoints;
					}else{

						var newpoints = Math.round(row.points + chunguspoints);
								
						db.run(`UPDATE chungus SET points="${newpoints}", lastclaim="${seconds}" WHERE disID="${msg.author.id}"`,function(err,row){
							checkLeader(msg);
						});

					}

					lastcall = msg.author.id;

					chungusmins = chungustime
					chungustime = moment.duration(chungustime,"minutes").humanize()

					const CALLTEXT = [
						`Congrats! Its been **${chungustime}** (${chungusmins} minutes) since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,
						`Woo wee! Its been **${chungustime}** (${chungusmins} minutes) since the last chungus call. You've just adopted **${chunguspoints}** chungus, that makes you the proud owner of **${newpoints}** chungus.`,
						`Hallelujah! Its been **${chungustime}** (${chungusmins} minutes) since the last chungus call. The lord has blessed you with **${chunguspoints}** additional chungus. Thank thine lord as you now hold **${newpoints}** chungus.`,
						`Youve been waiting for **${chungustime}** (${chungusmins} minutes). I hope it was worth it, as you just gained **${chunguspoints}** chungus. Thats just the right amount to put you at **${newpoints}** chungus.`,
						`You my friend, are going to the top! Its been **${chungustime}** (${chungusmins} minutes). You racked up **${chunguspoints}** chungus. This brings you to the perfect chungus count of **${newpoints}**.`
					]


					common.sendMsg(msg,`${CALLTEXT[Math.floor(Math.random()*CALLTEXT.length)]}`)
					// common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)
				});
				}else{
					let timeleft = moment.duration((cooldown -  chungussecs),'seconds').humanize()
					common.sendMsg(msg,`Sorry my dude! You're still on cooldown. You must wait **${timeleft}** to chungus again.`)
				}
				
			});
	});
}

function checkLeader(msg){
	let seconds = new Date() / 1000;

	var roles;
	var topmember;
	var roleset = false;
	var members = msg.guild.members.array();
	db.get("SELECT * FROM chungus ORDER BY points DESC, lastclaim ASC", function(err,row){

		for(let i=0;i<members.length;i++){
		
			if(members[i].id == row.disID){
				topmember = members[i];
			}

			roles = members[i].roles.array();
			for(let x=0;x<roles.length;x++){
 
				if(roles[x].id == app.chungusrole){
					if(members[i].id == row.disID){
						roleset = true;
					}else{
						members[i].removeRole(app.chungusrole);
					}
				}

			}

		}

		if(!roleset){
			if(typeof(topmember) !== 'undefined'){
				topmember.addRole(app.chungusrole);

				db.run(`UPDATE chungus SET lastchungus = "${seconds}" WHERE disID = "${topmember.id}"`);
			}
			
		}

	})
	
	// msg.member.addRole(app.chungusrole)
}

function checkCD(msg,args){
	let chungus_user = msg.author;
	if(typeof(args[1]) !== 'undefined'){
		chungus_user = common.findUser(args[1])
	}
	if(chungus_user == ''){
		common.sendMsg(msg,`Did not find a user with that name! Try again.`)
		return;
	}
	db.get(`SELECT * FROM chungus WHERE disID = "${chungus_user.id}"`,function(err,row){

		if(typeof(row) == 'undefined'){
			common.sendMsg(msg,`${chungus_user.displayName} has no cooldown!`)
			return
		}

		let seconds = new Date() / 1000;
		// let total_cooldown = (Math.log(row.points)*0.75)*60*60;
		let total_cooldown = row.points*15;
		if(total_cooldown > app.chunguscd && app.chunguscd !== 0){
			total_cooldown = app.chunguscd;
		}
		let time_since = seconds - row.lastclaim;
		
		if(total_cooldown > time_since){
			let cooldown = (total_cooldown - time_since)/60;
			let niceformat = ((cooldown*60) + seconds)*1000;

			if(chungus_user.id == msg.author.id){
				common.sendMsg(msg,`You will be able to chungus again **${moment(niceformat).fromNow()}** (${Math.round(cooldown)} minutes).`)
			}else{
				common.sendMsg(msg,`${chungus_user.displayName} will be able to chungus again **${moment(niceformat).fromNow()}** (${Math.round(cooldown)} minutes).`)
			}
			// common.sendMsg(msg,`You have **${cooldown.toFixed(2)}** minutes left on your cooldown.`);
		}else{
			if(chungus_user.id == msg.author.id){
				common.sendMsg(msg,`You have no cooldown! Happy chungusing!`);
			}else{
				common.sendMsg(msg,`${chungus_user.displayName} has no cooldown!`);
			}
			
		}

	})
}
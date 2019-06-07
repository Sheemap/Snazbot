'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js');

const moment = require('moment');

exports.description = 'Claim yourself as chungus';

exports.usage = `Use "${app.prefix}chungus" to claim your chungus points.\n\nUse "${app.prefix}chungus top" to check leaderboard.\n\nUse "${app.prefix}chungus cd <user>" to check someones current cooldown. If you dont specify a person, it defaults to you.\n\nIf you're the chungus, use "${app.prefix}chungus color <#hex code>" to change your color, and "${app.prefix}chungus name <name>" to change your role title (Must include the word chungus).`;

exports.db_scheme = `chungus (disNAM TEXT, disID TEXT, lastclaim TEXT, points NUMERIC, lastchungus TEXT)`

var seconds = new Date() / 1000;
exports.db_init = `INSERT INTO chungus VALUES ("chungus","000","${seconds}","0","0")`

var max_chungus_cd = app.config.chungus.maxcd;
var max_cd_factor = app.config.chungus.maxcdfactor;

// const app.chungusrole = app.chungusrole;
// const app.chunguschan.split(',') = app.chunguschan.split(',');
// var max_chungus_cd = max_chungus_cd; //43200seconds is 12hours

if(app.chunguschan.split(',') == ""){
	logger.log('error','Chungus channel is not configured! Chungus will not work without this setting.');
}
if(app.chungusrole == ""){
	logger.log('error','Chungus role is not configured! Chungus will not work without this setting.');
}

if(max_chungus_cd == ""){
	max_chungus_cd = 0;
	logger.log('info','No max chungus cooldown set.');
}





var lastcall,
	chungusmins;


exports.main = function(msg,args){

	if(msg.webhookID == 586396045328777226){
		webClaim(msg,args[0]);
		return
	}

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
				if(user != ''){
					user_display_name = user.displayName.replace(" [Wanking]","");
				}
			})
			content += `${i+1}. ${user_display_name}: **${rows[i].points}**\n`;
		}

		common.sendMsg(msg,content);

	})
}

function claimLogic(msg,chungee_id,callback){
	var seconds = new Date() / 1000;
	db.get("SELECT lastclaim FROM chungus WHERE disNAM='chungus'",function(err,row){
		var chungustime;
		if(typeof(row) === 'undefined'){
			logger.log('warn','Chungus was not initialized correctly. Attempting to fix now...')
			db.run(`INSERT INTO chungus VALUES ("chungus","000","${seconds}","0","0")`)
			chungustime = 0
		}else{
			chungustime = Math.round((seconds - row.lastclaim)/60);
		}
		
		var chunguspoints = Math.round(Math.pow(chungustime,1.85)/70);
		db.get(`SELECT * FROM chungus WHERE disID="${chungee_id}"`,function(err,row){

			calculateCD(row, function(current_cd_sec){
				if(current_cd_sec == 0){
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
								
						db.run(`UPDATE chungus SET points="${newpoints}", lastclaim="${seconds}" WHERE disID="${chungee_id}"`,function(err,row){
							checkLeader(msg);
						});

					}

					lastcall = chungee_id;
					callback({"no_cooldown":true,"chungus_mins":chungustime,"gained_points":chunguspoints,"total_points":newpoints})

				});
				}else{
					callback({"no_cooldown":false,"current_cd_sec":current_cd_sec,"seconds_now":seconds,"last_claim":row.lastclaim})
				}
			});
			
		});
	});
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

	claimLogic(msg,msg.author.id,function(return_data){
		if(return_data['no_cooldown']){
			let chungus_mins = return_data['chungus_mins']
			let gained_points = return_data['gained_points']
			let total_points = return_data['total_points']
			let human_chungus_mins = moment.duration(chungus_mins,"minutes").humanize()

			var CALLTEXT = [
				`Congrats! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. You have successfully claimed **${gained_points}** chungus, your new total is **${total_points}** chungus.`,
				`Woo wee! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. You've just adopted **${gained_points}** chungus, that makes you the proud owner of **${total_points}** chungus.`,
				`Hallelujah! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. The lord has blessed you with **${gained_points}** additional chungus. Thank thine lord as you now hold **${total_points}** chungus.`,
				`Youve been waiting for **${human_chungus_mins}** (${chungus_mins} minutes). I hope it was worth it, as you just gained **${gained_points}** chungus. Thats just the right amount to put you at **${total_points}** chungus.`,
				`You my friend, are going to the top! Its been **${human_chungus_mins}** (${chungus_mins} minutes). You racked up **${gained_points}** chungus. This brings you to the perfect chungus count of **${total_points}**.`
			]


			common.sendMsg(msg,`${CALLTEXT[Math.floor(Math.random()*CALLTEXT.length)]}`)
		}else{
			let min_left = Math.round(return_data['current_cd_sec']/60);
			let timeleft = moment.duration((return_data['current_cd_sec'] - (return_data['seconds_now'] - return_data['last_claim'])),'seconds').humanize()
			common.sendMsg(msg,`Sorry my dude! You're still on cooldown. You must wait **${timeleft}** (${min_left} minutes) to chungus again.`)
		}
	});
}

function webClaim(msg,chungee_id){
	claimLogic(msg,chungee_id,function(return_data){
		if(return_data['no_cooldown']){
			let chungus_mins = return_data['chungus_mins']
			let gained_points = return_data['gained_points']
			let total_points = return_data['total_points']
			let human_chungus_mins = moment.duration(chungus_mins,"minutes").humanize()

			var CALLTEXT = [
				`<@${chungee_id}> has called chungus with their Chungus Button! Congrats! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. They have successfully claimed **${gained_points}** chungus, their new total is **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Woo wee! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. They've just adopted **${gained_points}** chungus, that makes them the proud owner of **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Hallelujah! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. The lord has blessed them with **${gained_points}** additional chungus. Thank thine lord as they now hold **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Youve been waiting for **${human_chungus_mins}** (${chungus_mins} minutes). I hope it was worth it, as they just gained **${gained_points}** chungus. Thats just the right amount to put them at **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! You my friend, are going to the top! Its been **${human_chungus_mins}** (${chungus_mins} minutes). They racked up **${gained_points}** chungus. This brings them to the perfect chungus count of **${total_points}**.`
			]


			common.sendChannel(app.chunguschan.split(',')[0],`${CALLTEXT[Math.floor(Math.random()*CALLTEXT.length)]}`)
			// common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)
		}
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

// Takes database row of user and returns remaining cooldown in seconds
function calculateCD(row,callback){
	if(typeof(row) === 'undefined')
		return 0;

	let points = row.points;
	let last_claim = row.lastclaim;
	let now_seconds = new Date() / 1000;
	let total_cd,
		elapsed_seconds,
		current_cd,
		top_points,
		max_cd_threshold;

	elapsed_seconds = now_seconds - row.lastclaim;

	if(max_chungus_cd !== 0){
		db.get("SELECT * FROM chungus ORDER BY points DESC, lastclaim ASC",function(err,row){
			top_points = row.points;
			max_cd_threshold = top_points * max_cd_factor;

			// Total cooldown is a factor of how many points you have relative to the top chungus player.
			total_cd = max_chungus_cd * ( points / max_cd_threshold );

			if(total_cd > max_chungus_cd)
				total_cd = max_chungus_cd;

			if(total_cd <= elapsed_seconds){
				current_cd = 0;
			}else{
				current_cd = total_cd - elapsed_seconds;
			}

			callback(current_cd);
		})
	}else{
		total_cd = points*15;

		if(total_cd <= elapsed_seconds){
			current_cd = 0;
		}else{
			current_cd = total_cd - elapsed_seconds;
		}

		callback(current_cd);
	}
	
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

		calculateCD(row,function(current_cd_sec){
		
			if(current_cd_sec > 0){
				let current_cd_min = current_cd_sec/60;
				let niceformat = (current_cd_sec*1000) + new Date()*1;

				if(chungus_user.id == msg.author.id){
					common.sendMsg(msg,`You will be able to chungus again **${moment(niceformat).fromNow()}** (${Math.round(current_cd_min)} minutes).`)
				}else{
					common.sendMsg(msg,`${chungus_user.displayName} will be able to chungus again **${moment(niceformat).fromNow()}** (${Math.round(current_cd_min)} minutes).`)
				}
				// common.sendMsg(msg,`You have **${cooldown.toFixed(2)}** minutes left on your cooldown.`);
			}else{
				if(chungus_user.id == msg.author.id){
					common.sendMsg(msg,`You have no cooldown! Happy chungusing!`);
				}else{
					common.sendMsg(msg,`${chungus_user.displayName} has no cooldown!`);
				}
				
			}

		});

	})
}
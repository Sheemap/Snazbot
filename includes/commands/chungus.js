'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js')

exports.description = 'Claim yourself as chungus';

exports.usage = `Use "${app.prefix}chungus" to claim your chungus points.\n\nUse "${app.prefix}chungus top" to check leaderboard.\n\nIf you're the chungus, use "${app.prefix}chungus color <#hex code>" to change your color.`;

const CHUNGUSROLE = app.chungusrole;




var lastcall;


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

		if(roles[i].id == CHUNGUSROLE){
			role = roles[i];
			chungus = true;
		}

	}

	if(chungus){

		let name = msg.content.toLowerCase().replace(`${app.prefix}chungus name `,'')

		if(typeof(name) !== 'undefined' && name !== '' && name.includes('chungus')){
			role.setName(name)
				.then(updated => common.sendMsg(msg,`Changed name to ${name}`))
				// .catch(common.sendMsg(msg,`Failed to change chungus color. Make sure you have a valid color!`))
		}else{
			common.sendMsg(msg,`Please enter a valid name. The name must contain "chungus" somewhere in it.`)
		}
	}else{
		common.sendMsg(msg,`You arent the chungus! You dont decide the color!`);
	}
}

function changeColor(msg,args){
	let role;
	let roles = msg.member.roles.array();
	let chungus = false;

	for(let i=0;i<roles.length;i++){

		if(roles[i].id == CHUNGUSROLE){
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

		for(let i=0;i<rows.length;i++){

			if(i>=10)
				break;

			content += `${i+1}. ${rows[i].disNAM}: **${rows[i].points}**\n`;
		}

		common.sendMsg(msg,content);

	})
}

function claim(msg,args){

	if(msg.author.id == lastcall){
		common.sendMsg(msg,`You cant claim chungus twice in a row!`);
		return;
	}

	var seconds = new Date() / 1000;
	db.get("SELECT lastclaim FROM chungus WHERE disNAM='chungus'",function(err,row){
		var chungustime = Math.round((seconds - row.lastclaim)/60);
		var chungussecs = seconds-row.lastclaim

		// Logarithm
		// var chunguspoints = Math.round(Math.log(chungustime)*10);

		// Power of 2
		var chunguspoints = Math.round(Math.pow(chungustime,1.85)/70);
			db.get(`SELECT * FROM chungus WHERE disID="${msg.author.id}"`,function(err,row){

				var cooldown = 0;
				if(typeof(row) !== 'undefined' && row.points != "0"){
					cooldown = Math.log(row.points)*60*60;
				}
				//>
				if(chungussecs < cooldown){
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
								
						db.run(`UPDATE chungus SET points="${newpoints}" WHERE disID="${msg.author.id}"`,function(err,row){
							checkLeader(msg);
						});

					}

					lastcall = msg.author.id;

					const CALLTEXT = [
						`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,
						`Woo wee! Its been **${chungustime}** minutes since the last chungus call. You've just adopted **${chunguspoints}** chungus, that makes you the proud owner of **${newpoints}** chungus.`,
						`Hallelujah! Its been **${chungustime}** minutes since the last chungus call. The lord has blessed you with **${chunguspoints}** additional chungus. Thank thine lord as you now hold **${newpoints}** chungus.`,
						`I **${chungustime}** II **${chunguspoints}** II **${newpoints}** L`,
						`Youve been waiting for **${chungustime}** minutes. I hope it was worth it, as you just gained **${chunguspoints}** chungus. Thats just the right amount to put you at **${newpoints}** chungus.`,
						`You my friend, are going to the top! Its been **${chungustime}** minutes. You racked up **${chunguspoints}** chungus. This brings you to the perfect chungus count of **${newpoints}**.`
					]


					common.sendMsg(msg,`${CALLTEXT[Math.floor(Math.random()*CALLTEXT.length)]}`)
					// common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)
				});
				}else{
					let timeleft = ((cooldown -  chungussecs)/60).toFixed(2)
					common.sendMsg(msg,`Sorry my dude! You're still on cooldown. You must wait **${timeleft}** minutes to chungus again.`)
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
 
				if(roles[x].id == CHUNGUSROLE){
					if(members[i].id == row.disID){
						roleset = true;
					}else{
						members[i].removeRole(CHUNGUSROLE);
					}
				}

			}

		}

		if(!roleset){
			if(typeof(topmember) !== 'undefined'){
				topmember.addRole(CHUNGUSROLE);

				db.run(`UPDATE chungus SET lastchungus = "${seconds}" WHERE disID = "${topmember.id}"`);
			}
			
		}

	})
	
	// msg.member.addRole(CHUNGUSROLE)
}

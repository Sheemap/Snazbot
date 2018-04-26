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

		case '!chungus':
			claim(msg,args);
			break;

		default:
			common.sendMsg(msg,`\`\`\`${exports.usage}\`\`\``)
			break;

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
	}else{
		lastcall = msg.author.id;
	}

	var seconds = new Date() / 1000;
	db.get("SELECT lastclaim FROM chungus WHERE disNAM='chungus'",function(err,row){
		var chungustime = Math.round((seconds - row.lastclaim)/60);

		// Logarithm
		// var chunguspoints = Math.round(Math.log(chungustime)*10);

		// Power of 2
		var chunguspoints = Math.round(Math.pow(chungustime,2)/100);

		db.run(`UPDATE chungus SET lastclaim="${seconds}" WHERE disNAM="chungus"`,function(err,row){
			db.get(`SELECT points FROM chungus WHERE disID="${msg.author.id}"`,function(err,row){

				if(typeof(row) === 'undefined'){
					db.runSecure(`INSERT INTO chungus VALUES (?,?,?,?)`,{
						1: msg.author.username,
						2: msg.author.id,
						3: seconds,
						4: chunguspoints
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

				common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)
			
			});
		});
	});
}

function checkLeader(msg){
	console.log(msg.member.roles)

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
				topmember.addRole(CHUNGUSROLE);
			}

	})
	
	// msg.member.addRole(CHUNGUSROLE)
}
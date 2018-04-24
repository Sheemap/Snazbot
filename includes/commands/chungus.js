'use strict'
const logger = require('../logger.js');
const common = require('../common.js');
const app = require('../../app.js');
const db = require('../db.js')

exports.description = 'Claim yourself as chungus';

exports.usage = `Use "${app.prefix}chungus" to claim your chungus points.\n\nUse "${app.prefix}chungus top" to check leaderboard.`;


exports.main = function(msg,args){
	switch(args[0]){

		case 'top':
			top(msg,args);
			break;

		default:
			claim(msg,args);
			break;

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
					})

					var newpoints = chunguspoints;
				}else{

					var newpoints = Math.round(row.points + chunguspoints);
							
					db.run(`UPDATE chungus SET points="${newpoints}" WHERE disID="${msg.author.id}"`);

				}

				common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)

			
			});
		});
	});
}
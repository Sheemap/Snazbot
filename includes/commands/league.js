'use strict';
const fs = require('fs');
const LeagueJS = require('leaguejs');


const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const db = require('../db.js');

const APIKEY = app.config.league.key;
const leaguejs = new LeagueJS(APIKEY, {useV4: 'true'});

exports.description = 'League of Legends winners of the week';

exports.usage = `Use "${app.prefix}league register <summoner name>" to add yourself to the tracked users.`;

exports.main = function(msg,args){

	switch(args[0].toLowerCase()){
		case 'register':
				register(msg,args);
			break;
		default:
			common.sendMsg(msg,`\`\`\`${exports.usage}\`\`\``)
	}
}

function register(msg,args){
	let summoner = args[1].toLowerCase();
	let dupe = false;

	if(summoner.length > 16){
		logger.log('info',`${msg.author.username} tried to register invalid summoner name: ${summoner}`)
		common.sendMsg(msg,`Summoner name invalid! Please try again.`);
		return;
	}

	db.all('SELECT * FROM league',function(err,rows){
		for(let i in rows){
			if(rows[i].disID == msg.author.id){
				common.sendMsg(msg,'You\'ve already registered!');
				dupe = true;
			}

			if(JSON.parse(rows[i].summoner).name.toLowerCase() == summoner){
				common.sendMsg(msg,'That summoner name is already registered!');
				dupe = true;
			}
		}
	
		if(dupe){
			return;
		}

		leaguejs.Summoner
			.gettingByName(summoner)
			.then(data => {
				db.runSecure(`INSERT INTO league VALUES(?,?,?,?,?)`,
					{
						1: msg.author.username,
						2: msg.author.id,
						3: new Date() / 1000,
						4: JSON.stringify(data),
						5: ''
				})
				logger.log('info',data);
				common.sendMsg(msg,`Registered successfully! You will now be included in the weekly awards.`)
			})
			.catch(err => {
				logger.log('error',err);

				console.log(err.keys)

				common.sendMsg(msg,`Error occured! Please let Seka know.`)
			});
	})

}
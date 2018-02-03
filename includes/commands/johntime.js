'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const sleep = require('sleep-promise');
const db = require('../db.js');

exports.description = 'When will John REALLY be back?';

exports.usage = `Use "${app.prefix}johntime <duration of leave>" to find how long he will actually be gone.\n\nUse "${app.prefix}johntime report <time he claimed> <actual time late>" to report how long he was gone past his stated time.\n\nUse "${app.prefix}johntime confirm" to confirm a late time.`;

const REQUIRED = 1,
	  CONFIRMTIME = 15;

var progress = false,
	confirms = 0,
	authorid,
	confirmed;

exports.main = function(msg,args){
	switch(args[0]){

		case 'confirm':
			confirm(msg);
			break;

		case 'report':
			report(msg,args[1],args[2]);
			break;

		case '!johntime':
			common.sendMsg(msg,`Usage: \`\`\`${exports.usage}\`\`\``,false,15);
			break;

		default:
			howLong(msg,args);
			break;
	}
}

function confirm(msg){
	if(!progress){
		common.sendMsg(msg,`There is no report needing confirmation! If you want to report, please use \`\`\`${app.prefix}johntime report <time in minutes>\`\`\``)
	}else if(msg.author.id == authorid){
		common.sendMsg(msg,`You cant confirm your own report!`,true,15);
	}else if(confirmed.includes(authorid)){
		common.sendMsg(msg,`You cant confirm a report twice!`,true,15);
	}else{
		confirms++;
		confirmed.push(msg.author.id);
		common.sendMsg(msg,`Submitted your confirmation!`,true,15);
	}
}

function report(msg,claim,actual){
	if(typeof(claim) === 'undefined' || isNaN(parseInt(claim)) || typeof(actual) === 'undefined' || isNaN(parseInt(actual))){
		common.sendMsg(msg,`Incorrect time format. Make sure your durations are in *MINUTES*`,false,15);
	}else{
		if(progress){
			common.sendMsg(msg,`Theres already a report in progress. Please wait till it times out or is confirmed.`,false,15);
		}else{
			progress = true;
			confirms = 0;
			authorid = msg.author.id;
			confirmed = [];
			let finalclaim = claim;
			let finalactual = actual

			common.sendMsg(msg,`Report recieved!\n\nClaimed: ${claim}\nActual: ${actual}\nConfirmations required: ${REQUIRED}\nTime to confirm: ${CONFIRMTIME} seconds`)

			sleep(CONFIRMTIME*1000).then(function(){
				if(confirms >= REQUIRED){
					progress = false;

					db.run(`INSERT INTO johntime VALUES ("${msg.author.username}","${msg.author.id}","${Date.now()/1000}","${finalclaim}","${finalactual}")`)

					common.sendMsg(msg,`Passed with ${confirms}/${REQUIRED} confirmations. Added to database!`,false,15);
				}else{
					progress = false;
					common.sendMsg(msg,`Failed with ${confirms}/${REQUIRED} confirmations.`);
				}
			});
		}
		
	}
}

function howLong(msg,args){
	db.all(`SELECT * FROM johntime`,function(err,rows){
		if(isNaN(args[0])){
			common.sendMsg(msg,`Usage: \`\`\`${exports.usage}\`\`\``,false,15);
		}else{
			common.sendMsg(msg,`Johntime is disabled for now! Please submit as much data as you have so we can make it as great as possible. Use !help johntime`,false,15);
			// if(rows == ""){
			// 	common.sendMsg(msg,`No data collected on John's lateness.`,false,15);
			// }else{
			// 	let added = 0,
			// 		count = 0,
			// 		avg;
			// 	for(let u in rows){
			// 		count++;
			// 		added += parseFloat(rows[u].lateval)
			// 	}
			// 	avg = +((added/count).toFixed(2));

			// 	let newtime = avg+parseFloat(args[0])

			// 	common.sendMsg(msg,`John will actually be back in ~${newtime} minutes`,false,15);


			// }
		}
	})
}
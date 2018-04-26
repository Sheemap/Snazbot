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
	switch(args[0].toLowerCase()){

		case 'confirm':
			confirm(msg);
			break;

		case 'report':
			report(msg,args[1],args[2]);
			break;

		case '!johntime':
			common.sendMsg(msg,`Usage: \`\`\`${exports.usage}\`\`\``,false,15);
			break;

		case 'data':
			data(msg,args);
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

			// if(app.admins.includes(authorid)){

			progress = false;
			
			db.runSecure(`INSERT INTO johntime VALUES (?,?,?,?,?)`,{
				1: msg.author.username,
				2: msg.author.id,
				3: Date.now()/1000,
				4: finalclaim,
				5: finalactual
			},function(err,row){
				if(err){
					common.sendMsg(msg,`An error occured! Try again later.`);
					logger.log('error',`Failed to confirm a johntime.\n${err}`);
				}else{
					common.sendMsg(msg,`Confirmed report!\n\nClaimed: ${claim}\nActual: ${actual}`);
					logger.log('info',`Confirmed a johntime. Claimed: ${finalclaim} Actual: ${finalactual}`);
				}
			});
			

			// }else{
			// 	common.sendMsg(msg,`Report recieved!\n\nClaimed: ${claim} minutes\nActual: ${actual} minutes\nConfirmations required: ${REQUIRED}\nTime to confirm: ${CONFIRMTIME} seconds`);

			// 	sleep(CONFIRMTIME*1000).then(function(){
			// 		if(confirms >= REQUIRED){
			// 			progress = false;

			// 			db.run(`INSERT INTO johntime VALUES ("${msg.author.username}","${msg.author.id}","${Date.now()/1000}","${finalclaim}","${finalactual}")`)

			// 			common.sendMsg(msg,`Passed with ${confirms}/${REQUIRED} confirmations. Added to database!`,false,15);
			// 			logger.log('info',`Confirmed a johntime. Claimed: ${finalclaim} Actual: ${finalactual}`);
			// 		}else{
			// 			progress = false;
			// 			common.sendMsg(msg,`Failed with ${confirms}/${REQUIRED} confirmations.`);
			// 			logger.log('info','Vote failed to pass a johntime.')
			// 		}
			// 	});
			// }
		}
		
	}
}

function data(msg,args){
	db.all(`SELECT * FROM johntime`, function(err,rows){
		let x = 0,
		xx = 0,
		y = 0,
		yy = 0,
		xy = 0,
		n = 0,
		claim,
		actual,
		a,
		b,
		algo,
		points = '',
		req = parseFloat(args[0]);

	for(let u in rows){
		n++;

		claim = parseFloat(rows[u].claim);
		actual = parseFloat(rows[u].actual);

		x += claim;
		xx += Math.pow(claim,2);

		y += actual;
		yy += Math.pow(actual,2);

		xy += claim * actual;

		points += `(${claim},${actual}) : `;
	}
	
	points += 'END';
	points = points.replace(' : END','');

	a = ( ( y * xx ) - ( x * xy ) ) / ( ( n * xx ) - Math.pow(x,2) );

	b = ( ( n * xy ) - ( x * y ) ) / ( ( n * xx ) - Math.pow(x,2) );


	algo = `y = ${a.toFixed(2)} + ( m * ${b.toFixed(2)} )\n\nm = time requested\ny = time estimated`

	common.sendMsg(msg,`Currently using ${n} data points to calculate johntime.\n\nPoints: ${points}\n\nEquation derived from data: ${algo}`,false,15);
	})
}

function howLong(msg,args){
	db.all(`SELECT * FROM johntime`,function(err,rows){
		if(isNaN(args[0])){
			common.sendMsg(msg,`Usage: \`\`\`${exports.usage}\`\`\``,false,15);
		}else{
			if(rows == "" || rows.length <= 1){
				common.sendMsg(msg,`Insufficient data collected on John's lateness. If you have something to report, please do so!\n\n!johntime report <claimed arrival> <actual arrival>`,false,15);
			}else{
				// X = sum of claimed
				// Y = sum of actual
				// XX = sum of claims squared
				// YY = sum of actuals squared
				// XY = sum of each claim * actual
				// N = count of entries

				let x = 0,
					xx = 0,
					y = 0,
					yy = 0,
					xy = 0,
					n = 0,
					claim,
					actual,
					a,
					b,
					estimate,
					req = parseFloat(args[0]);

				for(let u in rows){
					n++;

					claim = parseFloat(rows[u].claim);
					actual = parseFloat(rows[u].actual);

					x += claim;
					xx += Math.pow(claim,2);

					y += actual;
					yy += Math.pow(actual,2);

					xy += claim * actual;
				}
				
				a = ( ( y * xx ) - ( x * xy ) ) / ( ( n * xx ) - Math.pow(x,2) );

				b = ( ( n * xy ) - ( x * y ) ) / ( ( n * xx ) - Math.pow(x,2) );


				estimate = (a + ( b * req )).toFixed(2);


				common.sendMsg(msg,`John will actually be back in ~${estimate} minutes`,false,15);
			}
		}
	})
}
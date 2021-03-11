// This script is meant to be run with crontab or other scheduling tool. There is nothing in the code base to automate running this
'use strict'
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/data.db');

//Hours they may be chungus before decay begins.
const THRESHOLD = 24;

//Decay percent every 6 hours
const DECAYPERCENT = 0.015

var oldpoints,
	newpoints,
	decay,
	ids = [];

function allDecay(){
	db.all('SELECT * FROM chungus WHERE disNAM != "chungus"',function(err,rows){
		var stmnt = `UPDATE chungus SET points = CASE disID `

		for(let i=0;i<rows.length;i++){

			oldpoints = rows[i].points;
			newpoints = Math.round(oldpoints*(1-DECAYPERCENT));
			decay = oldpoints-newpoints;

			if(isNaN(newpoints) || decay == 0 || newpoints <= 0){
				console.log(`Not running decay on ${rows[i].disNAM}`)
				
			}else{

				stmnt += `WHEN "${rows[i].disID}" THEN "${newpoints}" `

				console.log(`${rows[i].disNAM} had ${oldpoints} but now has ${newpoints}\nDecayed ${decay}\n\n`)
			}

		}

		stmnt += `END WHERE disNAM != 'chungus'`

		db.run(stmnt,function(err,row){
			if(err)
				console.log(err)
		})

	})
}

function chungusDecay(){
	db.get('SELECT * FROM chungus ORDER BY lastchungus DESC',function(err,row){
		var now = new Date() / 1000;
		var oldpoints = row.points;
		var decay;
		var newpoints;

		var chungushours = (now - row.lastchungus)/60/60;
		
		var decaytime = Math.round(chungushours - THRESHOLD);

		if(decaytime > 1){
			
			decay = Math.log(decaytime)

			newpoints = (oldpoints - decay).toFixed(2);

			db.run(`UPDATE chungus SET points = "${newpoints}" WHERE disID = "${row.disID}"`)
			console.log(`Decayed user ${row.disNAM} from ${oldpoints} to ${newpoints}\nLost ${decay}`)

		}else{
			console.log('Chungus within grace period. No decay.')
		}
	})
}

allDecay()

'use strict';
const fs = require('fs');
const LeagueJS = require('leaguejs')
const sqlite3 = require('sqlite3')
const ini = require('ini')

const db = new sqlite3.Database('./data/data.db');

var config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'))
const APIKEY = config.league.key;
const leaguejs = new LeagueJS(APIKEY, {useV4: 'true'});

function summonerUpdate(summoner){
	summoner = summoner.toLowerCase()
	db.all('SELECT * FROM league',function(err,rows){
		for(let i in rows){
			if(JSON.parse(rows[i].summoner).name.toLowerCase() == summoner){
				
				
				leaguejs.Match
					.gettingListByAccount(JSON.parse(rows[i].summoner).accountId)
					.then(data => {
						// console.log(data);


						db.all('SELECT * FROM league_matches',function(err,rows2){
							let already_saved = rows[i].data.split(',')
							let already_parsed = [];
							var to_parse = [];
							var to_save = [];
							for(let x in rows2){
								already_parsed.push(rows2[x].gameID);
							}

							for(let w in data.matches){
								let parsed = false;
								let saved = false;
								for(let y in already_parsed){
									if(data.matches[w].gameId == already_parsed[y]){
										parsed = true;
									}
								}

								for(let p in already_saved){
									if(data.matches[w].gameId == already_saved[p]){
										saved = true;
									}
								}


								if(!parsed)
									to_parse.push(data.matches[w].gameId)

								if(!saved)
									to_save.push(data.matches[w].gameId)

							}


							db.run(`UPDATE league SET data=? WHERE summoner=?`,
								{
									1:already_saved.concat(to_save),
									2:summoner
								})
							arrayParse(to_parse,function(num){
								console.log(`Parsed ${num} matches for ${summoner}`)
							});
							
						})
						

						

					})
					.catch(err => {
						console.log(err);
				});

			}
		}
	})
}

function bulkUpdate(){

}

function arrayParse(list){
	console.log('bep')
	leaguejs.Match
		.gettingById(list.shift())
		.then(data => {

			db.run('INSERT INTO league_matches VALUES(?,?,?,?)',
			{
				1:data.gameId,
				2:data.gameCreation,
				3:data.seasonId,
				4:JSON.stringify(data)
			},function(err){
				if(err){
					console.log(err)
				}else{
					console.log(`Parsed ${data.gameId}`)
					console.log(list.length)
					if(list.length > 0){
						arrayParse(list);
					}
				}
			})

			
			
		})
		.catch(err => {
			console.log(err);
	});
}


summonerUpdate('Thepolarpaladin')
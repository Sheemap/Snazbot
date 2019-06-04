'use strict'
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const db = require('../db.js');

const schedule = require('node-schedule');
const sleep = require('sleep-promise');
const request = require('request');

exports.description = 'Dota Utilities';

exports.usage = `Use "${app.prefix}dota register <Steam 32 ID>" to add yourself to the tracked users.\nUse "${app.prefix}dota join" to be added to awards chat, without account being registered.\nGo to <https://steamid.xyz> to get your Steam 32 ID`;

exports.db_scheme = `dota (disNAM TEXT, disID TEXT, timestamp NUMERIC, steamID TEXT, data TEXT)`

exports.main = function(msg,args){

	switch(args[0].toLowerCase()){

		case 'register':
			register(msg,args);
			break;

		case 'join':
			join(msg,args);
			break;

		default:
			tmp(msg)
			// common.sendMsg(msg,`\`\`\`${exports.usage}\`\`\``)
			break;

	}
}

function join(msg,args){
	msg.member.addRole(app.config.dota.role)
	common.sendMsg(msg,'You have been added to the dota weekly channel.')
}

function register(msg,args){

	db.all(`SELECT * FROM dota WHERE disID = ${msg.author.id}`,function(err,rows){

		if(rows.length > 0){
			common.sendMsg(msg,'Looks like you\'ve already registered! You can only add one account for dota weekly.')
			return
		}
	

		if(isNaN(args[1])){
			common.sendMsg(msg,'Your SteamID doesnt seem to be a number! Please go to <https://steamid.xyz> and provide your "Steam32 ID"')
			return
		}
		if(args[1].length != 9){
			common.sendMsg(msg,'Your SteamID seems to be incorrect! Please go to <https://steamid.xyz> and provide your "Steam32 ID"')
			return
		}



		api.call(`players/${args[1]}`,function(r,error){
			if(!r){
				common.sendMsg(msg,'An internal error occured. Please alert <@104848260954357760>')
				return
			}

			let data = JSON.parse(r)
			if(data["profile"] == undefined || data["error"] == "Internal Server Error"){
				common.sendMsg(msg,'Im having trouble loading your data. Please go to <https://steamid.xyz> and provide your "Steam32 ID"')
				return
			}

			db.all(`SELECT * FROM dota WHERE steamID = ${args[1]}`,function(err,rows){
				if(rows.length > 0){
					common.sendMsg(msg,'Looks like that ID is already claimed!')
					return
				}

				db.runSecure('INSERT INTO dota VALUES (?,?,?,?,?)',{
					1: msg.author.username,
					2: msg.author.id,
					3: (new Date).getTime(),
					4: args[1],
					5: '{}'
				},function(err,rows){
					msg.member.addRole(app.config.dota.role)
					common.sendMsg(msg,'You are now registered!')
				})
			})

		})

	})

}

class openDota {

	constructor(){

		this.base_url = "https://api.opendota.com/api/"
		this.enabled = true
		this.month_rate_limit = 50000
		this.minute_rate_limit = [60,(new Date).getTime()/1000]

		request(`${this.base_url}status`, function (error, r, body) {

			if(error){
				logger.log('error',`Encountered an error when contacting the OpenDota API. The dota module will be disabled.`)
				logger.log('error',error)
				this.enabled = false
			}

			logger.log('info','Initialized right')

		});

	}

	setRateLimit(headers){
		this.month_rate_limit = parseInt(headers['x-rate-limit-remaining-month'])
		this.minute_rate_limit = [parseInt(headers['x-rate-limit-remaining-minute']),(new Date).getTime()/1000]
	}

	checkRateLimit(){
		if(this.month_rate_limit < 50){
			logger.log('error',"Monthly rate limit reached!")
			return [false,'MONTHREACH']
		}

		if (((new Date).getTime()/1000 - this.minute_rate_limit[1]) >= 60)
			return [true]

		if (this.minute_rate_limit[0] > 20)
			return [true]

		if (this.minute_rate_limit[0] <= 0){
			logger.log('info',"Minute rate reached! Waiting full minute before calling.")
			return [false,60]
		}

		if (this.minute_rate_limit[0] <= 20){
			logger.log('info',"Minute rate limit close, waiting 3 seconds between calls.")
			return [false,3]
		}
	}

	call(url,callback){

		let within_rate_limit = this.checkRateLimit()
		if(!within_rate_limit[0]){
			if(within_rate_limit[1] == 'MONTHREACH'){
				callback(false,'Monthly limit reached')
			}
			console.log('within our sleeps',within_rate_limit[1]*1000)
			sleep(within_rate_limit[1]*1000).then(() => this).then(function(self){
				console.log('sleeped')
				execute(self,url)
			})
		}else{
			execute(this,url)
		}


		function execute(self,url){
			console.log(`Making call: `+self.base_url+url)
			request(self.base_url+url,function(error, r, body){

				self.setRateLimit(r.headers)

				if(error){
					logger.log('error',error)
					callback(false,error)
				}
				callback(body)

			})
		}

	}

}

// var weekly = schedule.scheduleJob('0 18 * * 1', function(fireDate){
function tmp(msg){
	var testEmbed = {
  "color": 16766720,
  "author": {
    "name": "Midas (GPM)",
    "icon_url": "https://yt3.ggpht.com/a/AGF-l79pzJmc_wgB0_tDO0_M1EsGb0g9D5ru1zwEJA=s900-mo-c-c0xffffffff-rj-k-no"
  },
  "fields": [
    {
      "name": "Smelted by **<User>**",
      "value": "**<User>** had an amazing **<gpm>** over **<match_count>** with a top score of **<max_gpm>**! ***WOW***"
    }
  ]
};
	var testEmbed2 = {
  "color": 16098851,
  "author": {
    "name": "Big Brain (XPM)",
    "icon_url": "https://liquipedia.net/commons/images/thumb/9/95/Tome_of_knowledge_hi_res.png/100px-Tome_of_knowledge_hi_res.png"
  },
  "fields": [
    {
      "name": "Thought by **<User>**",
      "value": "**<User>** had an incredible **<xpm>** over **<match_count>** with a top score of **<max_xpm>**! ***NEAT***"
    }
  ]
};

	common.sendMsg(msg,"**This weeks winners are in!**",false,false,function(msg){
		common.sendMsg(msg,{embed: testEmbed})
		common.sendMsg(msg,{embed: testEmbed2})
	})
	
	return
	let start_time = (new Date()).getTime();
	let results = {}
	logger.log('info','Starting weekly dota job at ' + new Date());

	db.all('SELECT * FROM dota',function(err,rows){
		console.log(rows)

		function parseUser(i,rows){
			if(i < rows.length){
				let user = rows[i].disID
				api.call(`players/${rows[i].steamID}/matches?date=7`,function(body,error){

					let data = JSON.parse(body);
					results[user] = {
						'gold':[],
						'xp':[],
						'damage':[],
						'cs':[],
						'kills':[],
						'deaths':[],
						'assists':[],
						'structure_damage':[],
						'healing':[],
						'obs_wards':[],
						'sent_wards':[]

					}
					function parseMatch(w,data){
						if(w < data.length){

							api.call(`matches/${data[w]['match_id']}`,function(body,error){

								let match_data = JSON.parse(body)
								let slot = data[w]['player_slot']
								let player;

								for(let x in match_data['players']){
									if(slot == match_data['players'][x]['player_slot']){
										player = match_data['players'][x]
										console.log('yeet')
									}
								}
								let obs_placed,sen_placed
								if(player['obs_placed']  == null){
									obs_placed = 0
								}else{
									obs_placed = player['obs_placed']
								}
								if(player['sen_placed'] == null){
									sen_placed = 0
								}else{
									sen_placed = player['sen_placed']
								}

								results[user]['gold'].push(player['gold_per_min'])
								results[user]['xp'].push(player['xp_per_min'])
								results[user]['damage'].push(player['hero_damage'])
								results[user]['cs'].push(player['last_hits'])
								results[user]['kills'].push(player['kills'])
								results[user]['deaths'].push(player['deaths'])
								results[user]['assists'].push(player['assists'])
								results[user]['structure_damage'].push(player['tower_damage'])
								results[user]['healing'].push(player['hero_healing'])
								results[user]['obs_wards'].push(obs_placed)
								results[user]['sent_wards'].push(sen_placed)

								parseMatch(w+1,data)
							})
							
							
							
							
						}else{
							parseUser(i+1,rows)
						}
					}

					parseMatch(0,data)

				})
			}else{
				console.log(results)
				console.log('Parsed all users, heres results and shit')
			}
			
		}
		parseUser(0,rows)
	})



}
// });

const api = new openDota();
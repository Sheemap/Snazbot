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

const base_adjectives = ['an awesome','a fantastic','a delicious','a delightful','a scrumptious','a boolin','a sick','a rad','a tubular','a cool','a nice','a super','a neato','an okayish','an alright','a fine','a decent','a mediocre','a chill','an amazing']
const base_exclamations = ['Wow!','***WOW!***','Waow.','Nice.','Neat.','Neato.','Cool.','Cool!','***RAD!***','Dope.','Dope!','Slick.','Chill.','Not bad.','Eh.','Super.']

var adjectives;
var exclamations;


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
		console.log(this.minute_rate_limit[0],this.month_rate_limit)
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
			
			request(self.base_url+url,function(error, r, body){

				self.setRateLimit(r.headers)
				console.log(`Making call: `+self.base_url+url)
				

				if(error){
					logger.log('error',error)
					callback(false,error)
				}
				callback(body)

			})
		}

	}

}

class award {

	constructor(name,color,icon_url,user,flavor_claim,avg,max,count){
		this.name = name;
		this.color = color;
		this.icon_url = icon_url;
		this.user_id = user.id;
		this.user_name = user.displayName;
		this.flavor_claim = flavor_claim;
		this.avg = avg;
		this.max = max;
		this.count = count;
	}

	adjective(){
		let random_index = Math.floor(Math.random() * Math.floor(adjectives.length))
		let item = adjectives[random_index];
		adjectives.splice(random_index);
		return item
	}

	exclamation(){
		let random_index = Math.floor(Math.random() * Math.floor(exclamations.length))
		let item = exclamations[random_index];
		exclamations.splice(random_index);
		return item
	}

	embed(){
		return {
				"color": this.color,
				"author": {
					"name": this.name,
					"icon_url": this.icon_url
				},
				"fields": [
				    {
				    	"name": `${this.flavor_claim} **${this.user_name}**`,
				    	"value": `<@${this.user_id}> had ${this.adjective()} **${this.avg}** average with a max of **${this.max}** over **${this.count}** games! ${this.exclamation()}`
				    }
				]
			};
	}
}

// var weekly = schedule.scheduleJob('0 18 * * 1', function(fireDate){
function tmp(msg){
	adjectives = base_adjectives;
	exclamations = base_exclamations;
	
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

				let victors = {
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
				for(let user in results){

					for(let stat in results[user]){
						let avg;
						let sum = 0;
						let max = 0;
						let count = 0;

						for(let game in results[user][stat]){
							sum += results[user][stat][game];
							count++;

							if(max < results[user][stat][game])
								max = results[user][stat][game];
						}

						avg = sum/count;

						if(victors[stat].length == 0 || victors[stat][1] < avg){
							victors[stat] = [user,avg,max,count];
						}

					}
				}

				let unique_victors = [];
				for(let stat in victors){
					if(!unique_victors.includes(victors[stat][0])){
						unique_victors.push(victors[stat][0])
					}
				}


				function matchUsers(i,unique_users){
					if(i < unique_users.length){
						common.findUser(unique_users[i],function(user){
							for(let stat in victors){
								if(victors[stat][0] == user.id){
									victors[stat][0] = user;
								}
							}

							matchUsers(i+1,unique_users,victors)
						})
					}else{

						// 'gold':[],
						// 'xp':[],
						// 'damage':[],
						// 'cs':[],
						// 'kills':[],
						// 'deaths':[],
						// 'assists':[],
						// 'structure_damage':[],
						// 'healing':[],
						// 'obs_wards':[],
						// 'sent_wards':[]

						// [user,avg,max,count];

						console.log(victors)
						var awards = [];
						awards.push(new award('Midas (GPM)', 16766720, 'https://yt3.ggpht.com/a/AGF-l79pzJmc_wgB0_tDO0_M1EsGb0g9D5ru1zwEJA=s900-mo-c-c0xffffffff-rj-k-no', victors['gold'][0], 'Smelted by', victors['gold'][1], victors['gold'][2], victors['gold'][3]).embed())
						awards.push(new award('Big Brain (XPM)', 16766720, 'https://yt3.ggpht.com/a/AGF-l79pzJmc_wgB0_tDO0_M1EsGb0g9D5ru1zwEJA=s900-mo-c-c0xffffffff-rj-k-no', victors['xp'][0], 'Smelted by', victors['xp'][1], victors['xp'][2], victors['xp'][3]).embed())

						for(let x in awards){
							common.sendMsg(msg,{embed: awards[x]})
						}

					}
					
				}

				matchUsers(0,unique_victors,victors)


				// common.findUser('104848260954357760',function(user){
				// 	var testEmbed = new award('Midas (GPM)', 16766720, 'https://yt3.ggpht.com/a/AGF-l79pzJmc_wgB0_tDO0_M1EsGb0g9D5ru1zwEJA=s900-mo-c-c0xffffffff-rj-k-no', user, 'Smelted by', 500, 1000, 13).embed()
				// 	common.sendMsg(msg,"**This weeks winners are in!**",false,false,function(msg){
				// 		common.sendMsg(msg,{embed: testEmbed})
				// 		// common.sendMsg(msg,{embed: testEmbed2})
				// 	})
				// })

			}
			
		}
		parseUser(0,rows)
	})



}
// });

const api = new openDota();
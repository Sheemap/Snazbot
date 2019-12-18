'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');
const imgur = require('imgur');
const sleep = require('sleep-promise')

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme. \n\nYou can roll multiple memes by using "${app.prefix}meme <number of memes> <seconds delay between memes>"\n\nUse "${app.prefix}meme status" to count the memes available.\n\nUse "${app.prefix}meme points" to see how many points your memes have gathered.\n\nUse "${app.prefix}meme points <username>" to see how many points other peoples memes have gathered.`;

exports.reactions = `%F0%9F%91%8D,%F0%9F%91%8E`;

exports.db_scheme = [`Meme (MemeId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
						   Url TEXT, 
						   UserId INTEGER,
						   DateCreated INTEGER,
						   FOREIGN KEY(UserId) REFERENCES User(UserId))`,
					`MemeVotes (MemeVotesId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
								MemeId INTEGER,
								IsUpvote INTEGER,
								UserId INTEGER,
								DateCreated INTEGER,
								MemeRollId INTEGER,
								FOREIGN KEY(MemeId) REFERENCES Meme(MemeId),
								FOREIGN KEY(UserId) REFERENCES User(UserId),
								FOREIGN KEY(MemeRollId) REFERENCES MemeRoll(MemeRollId))`,
					`MemeRoll (MemeRollId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
							   MessageId INTEGER,
							   MemeId INTEGER,
							   UserId INTEGER,
							   DateCreated INTEGER,
							   FOREIGN KEY(MemeId) REFERENCES Meme(MemeId),
							   FOREIGN KEY(UserId) REFERENCES User(UserId))`]

//%F0%9F%91%8D = thumbsup

//%F0%9F%91%8E = thumbsdown

// const app.bufferSIZE = 150;
// const app.buffer = app.buffer; //percentage
// const app.maxvote = app.maxvote;
// const app.startscore = app.startscore;
// const app.albumhash = app.albumhash;

var buffer = [];
var buffersize = 0;

const defaultdelay = 3;
const maxrolltime = 300;

exports.main = function(msg,args){
	switch(args[0].toLowerCase()){

		case 'status':
			checkStats(msg,args);
			break;

		case 'points':
			points(msg,args);
			break;

		default:
			roll(msg,args);
			break;
	}
}


exports.react = function(reaction,user,added){
	let val = 0;
	let meme = false;
	let currentvotes;
	let newvotes;
	let urlmeme;
	let attach = false;

	if(user.id == app.BOTID){
		return;
	}

	if(user.id != reaction.message.author.id){
		if(reaction.message.channel.id == app.rollchan){
			if(reaction.message.content.includes('http')){
				meme = true;
				urlmeme = reaction.message.content;
				attach = false;

				if(reaction.emoji.identifier == '%F0%9F%91%8D'){
					if(added){
						val = 1;
					}else{
						val = -1;
					}
				}else if(reaction.emoji.identifier == '%F0%9F%91%8E'){
					if(added){
						val = -1;
					}else{
						val = 1;
					}
				}

			}else if(reaction.message.attachments.array().length >= 1){
				meme = true;
				urlmeme = reaction.message.attachments.first().url;
				attach = true;



				if(reaction.emoji.identifier == '%F0%9F%91%8D'){
					if(added){
						val = 1;
					}else{
						val = -1;
					}
				}else if(reaction.emoji.identifier == '%F0%9F%91%8E'){
					if(added){
						val = -1;
					}else{
						val = 1;
					}
				}

			}

			if(meme){
				db.all(`SELECT url,votes FROM memes`,function(err,row){
					let trurow = false;
					if(err){
						logger.log('error',err)
					}else{
						if(attach){
							//split for old discord format
							for(let l in row){
								let image = row[l].url.split('/')[6];

								if(urlmeme.includes(image) && image != "" && image != " "){
									trurow = row[l];
									currentvotes = parseInt(row[l].votes)
								}
							}

							//split for imgur
							for(let l in row){
								if(row[l].url.includes('i.imgur')){
									let image = row[l].url.split('/')[3];

									if(urlmeme.includes(image) && image != "" && image != " "){
										trurow = row[l];
										currentvotes = parseInt(row[l].votes)
									}
								}
								
							}
						}else{
							for(let l in row){

								if(urlmeme == row[l].url){
									trurow = row[l];
									currentvotes = parseInt(row[l].votes)
								}

							}
						}

						if(trurow != false){
							newvotes = currentvotes + val;

							if(newvotes >= app.maxvote){
								newvotes = app.maxvote;
							}

							if(newvotes < 0){
								newvotes = 0;
							}

							db.run(`UPDATE memes SET votes="${newvotes}" WHERE url="${trurow.url}"`);
							logger.log('debug',`Counted a meme vote. ${val} to ${trurow.url}. New votes is ${newvotes}`);
						}else{
							logger.log('debug','Failed to count vote, no meme found')
						}
					}
					
				})
			}
		}
	}else{
		logger.log('debug',`${user.username} tried to vote on their own meme`)
	}

}

function saveMeme(meme, authorId){
	var seconds = new Date() / 1000;
	db.userIdByDiscordId(authorId, function(err, userId){
		console.log(userId)
		db.runSecure(`INSERT INTO Meme VALUES (?,?,?,?)`,{ 
			1: null,
			2: meme,
			3: userId,
			4: seconds,
		});
	});
}

exports.msg = function(msg) {
	if(msg.author.id != app.BOTID){

		if(msg.channel.id == app.memechan){
			let unique = true;
			var seconds = new Date() / 1000;

			if(msg.content.includes('http')){
				logger.log('info',`Saving meme sent by ${msg.author.username}`);
				saveMeme(msg.content, msg.author.id);
			}

			if(msg.attachments.array().length >= 1){

				// let memeimage = msg.attachments.first().url.split('/')[6];

				// for(let q in memes){
				// 	if(memes[q].includes(memeimage)){
				// 		unique = false;
				// 	}
				// }

				let attachments = msg.attachments.array()
				let newurl = '';
				for(let i=0;i<attachments.length;i++){

					logger.log('info',`Saving meme sent by ${msg.author.username}`);

					imgur.uploadUrl(attachments[i].url,app.albumhash)
						.then(function (json) {
							console.log(json.data)
							newurl = json.data.link;
							saveMeme(newurl, msg.author.id);
						})
						.catch(function (err) {
							logger.log('error',err.message);
						});

					

				}
				
			}
		}
  		
  	}

}


function checkStats(msg,args){
	db.all('SELECT * FROM memes', function(err, rows){
		let memelist = [];
		for(let w in rows){
			if(rows[w].votes > 0)
				memelist.push(rows[w].url);
		}
		var count = memelist.length;

		common.sendMsg(msg,`There are currently **${count}** memes in stock. The buffersize is set to **${app.buffer*100}%**.`,false,15);

	});
}

function points(msg,args){
	if(args.length >= 2){
		let members = msg.channel.guild.members.array();
		let count = 0;
		let disID;
		let name;
		for(let mem in members){
			if(members[mem].user.username.toLowerCase().includes(args[1].toLowerCase())){
				count++;
				disID = members[mem].user.id;
				name = members[mem].user.username;
			}
		}

		if(count > 1){
			common.sendMsg(msg,`Multiple users found by that name! Try something more specific.`,false,15);

		}else if(count == 0){
			common.sendMsg(msg,`No users found by that name! Try again!`,false,15);

		}else if(count == 1){

			checkPoints(disID,function(score,avg,memecount){
				common.sendMsg(msg,`${name} currently has **${score}** meme points.`,false,15);
			})

			
		}
	}else{

		checkPoints(msg.author.id,function(score,avg,memecount){
			common.sendMsg(msg,`You currently have **${score}** meme points.`,true,15);
		})
	}
}

function checkPoints(disID,callback){
	let score = 0;
	let memecount = 0;
	let avg = 0;
	db.all(`SELECT * FROM memes WHERE disID="${disID}"`, function(err, rows){
		
		for(let y in rows){
			score += parseInt(rows[y].votes) - app.startscore;
			memecount++;
		}
		if(!memecount == 0){
			avg = (score/memecount).toFixed(2);
		}

		callback(score,avg,memecount)
	})
	
}

function timeRoll(msg,num,delay){

	num += -1
	sleep(delay*1000).then(function(){
			if(num > 0){
				roll(msg,[])
				timeRoll(msg,num,delay)
			}
			
	})
}

function roll(msg,args){
	if(msg.channel.id != app.rollchan){
		common.sendMsg(msg,'This command only works in the #memeroll chat.',false,15);
	}else{

		let memequeue = 0;
		let memedelay = 3;
		if(!isNaN(args[0])){
			memequeue = parseInt(args[0]);

			if(!isNaN(args[1])){
				memedelay = parseInt(args[1]);
				if(memedelay < 1){
					memedelay = 1;
				}
			}else{
				memedelay = defaultdelay;
			}

			if(memequeue * memedelay > maxrolltime){
				common.sendMsg(msg,`Rolling ${memequeue} memes with a delay of ${memedelay} seconds would take over ${maxrolltime} seconds, which is not allowed. Rolling one meme instead.`);
			}else{
				logger.log('info',`Rolling ${memequeue} memes, will finish in ${memedelay*memequeue} seconds`)
				timeRoll(msg,memequeue,memedelay);
			}

		}


		db.all('SELECT url,votes FROM memes', function(err, rows){

			db.get(`SELECT data FROM data WHERE disID=${msg.guild.id}`,function(err,row){

				var data = JSON.parse(row.data);
				buffer = data.memebuffer;
				if( typeof(buffer) === 'undefined'){
					buffer = [];
				}

	    		var memelist = [];
	    		var memecount = 0;
	    		var meme,
	    			found = false;

	    		for(let w in rows){

	    			for(let x=0;x<=rows[w].votes;x++){
						memelist.push(rows[w].url);
	    			}

	    			if(rows[w].votes > 0)
	    				memecount++;

	    		}

	    		buffersize = Math.floor(memecount * app.buffer);

	    		logger.log('debug',`Buffer size is ${buffersize}, meme count is ${memecount}.`)

	    		for(let i=0;i<=50000;i++){
					meme = memelist[Math.floor(Math.random()*(memelist.length-1))];

					if(!buffer.includes(meme)){
						buffer.push(meme);


						while(buffer.length > buffersize){
							buffer.shift();
							if( buffer.length <= 0 && buffersize <= 0){
								break;
							}
						}

						if(meme.includes('cdn.discordapp.com') || meme.includes('i.imgur')){
							common.sendMsg(msg,{file:meme},false,15,callback);
						}else{
							common.sendMsg(msg,meme,false,15,callback);
						}
						found = true;

						async function callback(message){
							await message.react('👍');
							await message.react('👎');
						}

						break;
					}
				}
				if(!found){
					logger.log('warn','Failed to randomize a meme not in the buffer!');
				}
				data['memebuffer'] = buffer;

				db.runSecure(`UPDATE data SET data=? WHERE disID=?`,
				{
					1: JSON.stringify(data),
					2: msg.guild.id
				})
				
			});

		});
	}
}

// function changeYoutube(msg,args){
// 	if(args[1].toLowerCase() == 'on'){

// 		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
// 			if(typeof(row) === 'undefined'){
// 				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
// 					1: msg.author.username,
// 					2: msg.author.id,
// 					3: 1,
// 					4: 1
// 				})
// 			}else{
// 				db.run(`UPDATE users SET ytmemes="1" WHERE disID="${msg.author.id}"`);
// 			}

// 			common.sendMsg(msg,'YouTube memes have been enabled');
// 		})

// 	}else if(args[1].toLowerCase() == 'off'){

// 		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
// 			if(typeof(row) === 'undefined'){
// 				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
// 					1: msg.author.username,
// 					2: msg.author.id,
// 					3: 0,
// 					4: 1
// 				})
// 			}else{
// 				db.run(`UPDATE users SET ytmemes="0" WHERE disID="${msg.author.id}"`);
// 			}

// 			common.sendMsg(msg,'YouTube memes have been disabled');
// 		})

// 	}else{

// 		common.sendMsg(msg,`I dont understand what you mean by that! Please either use 'on' or 'off' to enable or disable YouTube memes.`);

// 	}
// }

// function changeScrape(msg,args){
// 	if(args[1].toLowerCase() == 'on'){

// 		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
// 			if(typeof(row) === 'undefined'){
// 				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
// 					1: msg.author.username,
// 					2: msg.author.id,
// 					3: 1,
// 					4: 1
// 				})
// 			}else{
// 				db.run(`UPDATE users SET memeroll="1" WHERE disID="${msg.author.id}"`);
// 			}

// 			common.sendMsg(msg,'Your memes will be saved');
// 		})

// 	}else if(args[1].toLowerCase() == 'off'){

// 		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
// 			if(typeof(row) === 'undefined'){
// 				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
// 				1: msg.author.username,
// 					2: msg.author.id,
// 					3: 1,
// 					4: 0
// 				})
// 			}else{
// 				db.run(`UPDATE users SET memeroll="0" WHERE disID="${msg.author.id}"`);
// 			}

// 			common.sendMsg(msg,'Your memes will no longer be saved');
// 		})

// 	}else{

// 		common.sendMsg(msg,`I dont understand what you mean by that! Please either use 'on' or 'off' to enable or disable adding your memes to memepool.`);

// 	}
// }	
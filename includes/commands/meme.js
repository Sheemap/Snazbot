'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');
const imgur = require('imgur');

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme.\n\nUse "${app.prefix}meme status" to count the memes available.\n\nUse "${app.prefix}meme points" to see how many points your memes have gathered.\n\nUse "${app.prefix}meme points <username>" to see how many points other peoples memes have gathered.\n\nUse "${app.prefix}meme youtube <on | off>" to enable/disble rolling youtube memes\n\nUse "${app.prefix}meme save <on | off>" to enable/disable the saving of your memes`;

exports.reactions = `%F0%9F%91%8D,%F0%9F%91%8E`;

//%F0%9F%91%8D = thumbsup

//%F0%9F%91%8E = thumbsdown

// const BUFFERSIZE = 150;
const BUFFER = app.buffer; //percentage
const MAXVOTE = app.maxvote;
const STARTSCORE = app.startscore;
const ALBUMHASH = app.albumhash;

var buffer = [];
var buffersize = 0;



exports.main = function(msg,args){
	switch(args[0]){

		case 'status':
			checkStats(msg,args);
			break;

		case 'points':
			points(msg,args);
			break;

		case 'youtube':
			changeYoutube(msg,args);
			break;

		case 'save':
			changeScrape(msg,args);
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
		if(reaction.message.channel.id == app.memechan || reaction.message.channel.id == app.rollchan){
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

							if(newvotes >= MAXVOTE){
								newvotes = MAXVOTE;
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

exports.msg = function(msg) {
	if(msg.author.id != app.BOTID){

		if(msg.channel.id == app.memechan || msg.channel.id == app.rollchan){

			db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){

				if(typeof(row) !== 'undefined' && row.memeroll == '0'){
					logger.log('debug',`Not saving meme, ${msg.author.username} has opted out.`)
				}else{

					db.all('SELECT url,votes FROM memes', function(err, rows){
						let memes = [];
						let unique = true;
						var seconds = new Date() / 1000;

						for(let u in rows){
							memes.push(rows[u].url)
						}

				  		if(msg.content.includes('http')){

				  			if(!memes.includes(msg.content)){
					  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

								db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.content}","${STARTSCORE}","placeholder")`);
							}else{
								logger.log('info','Not saving duplicate meme');
							}
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

				  				imgur.uploadUrl(attachments[i].url,ALBUMHASH)
									.then(function (json) {
								        newurl = json.data.link;

								        db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${newurl}","${STARTSCORE}","placeholder")`);
								    })
								    .catch(function (err) {
								        logger.log('error',err.message);
								    });

						  		

				  			}
				  			
				  		}
					})

				}
			});
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

		common.sendMsg(msg,`There are currently **${count}** memes in stock. The buffersize is set to **${BUFFER*100}%**.`,false,15);

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
			score += parseInt(rows[y].votes) - STARTSCORE;
			memecount++;
		}
		if(!memecount == 0){
			avg = (score/memecount).toFixed(2);
		}

		callback(score,avg,memecount)
	})
	
}

function roll(msg,args){
	if(msg.channel.id != app.rollchan){
		common.sendMsg(msg,'This command only works in the #memeroll chat.',false,15);
	}else{
		db.all('SELECT url,votes FROM memes', function(err, rows){
			db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
				var ytmemes = true;
	    		var memelist = [];
	    		var memecount = 0;
	    		var meme,
	    			wanted,
	    			found = false;

	    		if(typeof(row) !== 'undefined' && row.ytmemes == '0'){
					ytmemes = false;
				}

	    		for(let w in rows){

	    			for(let x=0;x<=rows[w].votes;x++){
						memelist.push(rows[w].url);
	    			}

	    			if(rows[w].votes > 0)
	    				memecount++;

	    		}

	    		buffersize = Math.floor(memecount * BUFFER);

	    		logger.log('debug',`Buffer size is ${buffersize}, meme count is ${memecount}.`)

	    		for(let i=0;i<=10000;i++){
					meme = memelist[Math.floor(Math.random()*(memelist.length-1))];
					wanted = true;

					if(meme.includes('youtu') && !ytmemes){
						wanted = false;
					}

					if(!buffer.includes(meme) && wanted){
						buffer.push(meme);


						if(buffer.length >= buffersize){
							buffer.shift();
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
			});
		});
	}
}

function changeYoutube(msg,args){
	if(args[1].toLowerCase() == 'on'){

		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
			if(typeof(row) === 'undefined'){
				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
					1: msg.author.username,
					2: msg.author.id,
					3: 1,
					4: 1
				})
			}else{
				db.run(`UPDATE users SET ytmemes="1" WHERE disID="${msg.author.id}"`);
			}

			common.sendMsg(msg,'YouTube memes have been enabled');
		})

	}else if(args[1].toLowerCase() == 'off'){

		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
			if(typeof(row) === 'undefined'){
				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
					1: msg.author.username,
					2: msg.author.id,
					3: 0,
					4: 1
				})
			}else{
				db.run(`UPDATE users SET ytmemes="0" WHERE disID="${msg.author.id}"`);
			}

			common.sendMsg(msg,'YouTube memes have been disabled');
		})

	}else{

		common.sendMsg(msg,`I dont understand what you mean by that! Please either use 'on' or 'off' to enable or disable YouTube memes.`);

	}
}

function changeScrape(msg,args){
	if(args[1].toLowerCase() == 'on'){

		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
			if(typeof(row) === 'undefined'){
				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
					1: msg.author.username,
					2: msg.author.id,
					3: 1,
					4: 1
				})
			}else{
				db.run(`UPDATE users SET memeroll="1" WHERE disID="${msg.author.id}"`);
			}

			common.sendMsg(msg,'Your memes will be saved');
		})

	}else if(args[1].toLowerCase() == 'off'){

		db.get(`SELECT * FROM users WHERE disID="${msg.author.id}"`,function(err,row){
			if(typeof(row) === 'undefined'){
				db.runSecure(`INSERT INTO users VALUES(?,?,?,?)`,{
					1: msg.author.username,
					2: msg.author.id,
					3: 1,
					4: 0
				})
			}else{
				db.run(`UPDATE users SET memeroll="0" WHERE disID="${msg.author.id}"`);
			}

			common.sendMsg(msg,'Your memes will no longer be saved');
		})

	}else{

		common.sendMsg(msg,`I dont understand what you mean by that! Please either use 'on' or 'off' to enable or disable adding your memes to memepool.`);

	}
}
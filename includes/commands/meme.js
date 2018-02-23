'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme.\n\nUse "${app.prefix}meme status" to count the memes available.\n\nUse "${app.prefix}meme points" to see how many points your memes have gathered.\n\nUse "${app.prefix}meme points <username>" to see how many points other peoples memes have gathered.`;

exports.reactions = `%F0%9F%91%8D,%F0%9F%91%8E`;

//%F0%9F%91%8D = thumbsup

//%F0%9F%91%8E = thumbsdown

const BUFFERSIZE = 150;
const MAXVOTE = 20;
const STARTSCORE = 5;

var buffer = [];

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

exports.main = function(msg,args){
	if(args.length >= 1 && args[0] == 'status'){
		db.all('SELECT * FROM memes', function(err, rows){
			let memelist = [];
			for(let w in rows){
				memelist.push(rows[w].url);
			}
			var count = memelist.length;

			common.sendMsg(msg,`There are currently **${count}** memes in stock.`,false,15);

		});
	}else if(args.length >= 1 && args[0] == 'points'){
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
					common.sendMsg(msg,`${name} currently has **${score}** meme points. They've posted **${memecount}** memes, which is an average of **${avg}** points per meme.`,false,15);
				})

				
			}
		}else{

			checkPoints(msg.author.id,function(score,avg,memecount){
				common.sendMsg(msg,`You currently have **${score}** meme points. You've posted **${memecount}** memes, which is an average of **${avg}** points per meme.`,true,15);
			})
		}
	}else{
		if(msg.channel != msg.guild.channels.find('id','301214003781173249')){
			common.sendMsg(msg,'This command only works in the #memes chat.',false,15);
		}else{
			db.all('SELECT url,votes FROM memes', function(err, rows){
	    		var memelist = [];
	    		var meme,
	    			found = false;

	    		for(let w in rows){

	    			for(let x=0;x<=rows[w].votes;x++){
	    				memelist.push(rows[w].url)
	    			}

	    		}

	    		for(let i=0;i<=10000;i++){
					meme = memelist[Math.floor(Math.random()*(memelist.length-1))];

					if(!buffer.includes(meme)){
						buffer.push(meme);

						if(buffer.length >= BUFFERSIZE){
							buffer.shift();
						}

						if(meme.includes('cdn.discordapp.com')){
							common.sendMsg(msg,{file:meme},false,15);
						}else{
							common.sendMsg(msg,meme,false,15);
						}
						found = true;
						break;
					}
				}
				if(!found){
					logger.log('warn','Failed to randomize a meme not in the buffer!');
				}

			});
		}
	}
}

exports.react = function(reaction,user,added){
	let val = 0;
	let meme = false;
	let currentvotes;
	let newvotes;
	let urlmeme;
	let attach = false;

	if(user.id != reaction.message.author.id){
		if(reaction.message.channel.id == '301214003781173249' || reaction.message.channel.id == '208298947997990912'){
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
							for(let l in row){
								let image = row[l].url.split('/')[6];

								if(urlmeme.includes(image) && image != "" && image != " "){
									trurow = row[l];
									currentvotes = parseInt(row[l].votes)
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

							db.run(`UPDATE memes SET votes="${newvotes}" WHERE url="${trurow.url}"`);
							logger.log('debug',`Counted a meme vote. ${val} to ${trurow.url}. New votes is ${newvotes}`);
						}
					}
					
				})
			}
		}
	}else{
		logger.log('debug',`${user.username} tried to vote on their own meme`)
	}

}

exports.scrape = function(msg) {
	if(msg.author.id != '208310407201423371'){

		if(msg.channel.id == '208298947997990912' || msg.channel.id == '301214003781173249'){


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

						db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.content}","${STARTSCORE}")`);
					}else{
						logger.log('info','Not saving duplicate meme');
					}
		  		}

		  		if(msg.attachments.array().length >= 1){

		  			let memeimage = msg.attachments.first().url.split('/')[6];

		  			for(let q in memes){
		  				if(memes[q].includes(memeimage)){
		  					unique = false;
		  				}
		  			}
		  			if(unique){
			  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

				  		db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.attachments.first().url}","${STARTSCORE}")`);
				  	}else{
				  		logger.log('info','Not saving duplicate meme');
				  	}
		  		}
			})
		}
  		
  	}

}

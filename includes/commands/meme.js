'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme.\n\nUse "${app.prefix}meme status" to count the memes available.`;

exports.reactions = `%F0%9F%91%8D,%F0%9F%91%8E`;

//%F0%9F%91%8D = thumbsup

//%F0%9F%91%8E = thumbsdown

var buffer = [];

exports.main = function(msg,args){
	if(args.length >= 1 && args[0] == 'status'){
		fs.readFile('data/memes.txt', function(err, f){
	    		var memelist = f.toString().split('\n');
				var count = memelist.length-1;

				common.sendMsg(msg,`There are currently **${count}** memes in stock.`,false,15);

			});
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

						if(buffer.length >= 50){
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

	if(reaction.message.channel.id == '301214003781173249'){
		if(reaction.message.content.includes('http')){
			meme = true;
			urlmeme = reaction.message.content;

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
			db.get(`SELECT url,votes FROM memes WHERE url="${urlmeme}"`,function(err,row){
				if(err){
					logger.log('error',err)
				}else{
					currentvotes = parseInt(row.votes)
					newvotes = currentvotes + val;
					db.run(`UPDATE memes SET votes="${newvotes}" WHERE url="${urlmeme}"`);
					logger.log('debug','Counted a meme vote.');
				}
				
			})
		}
	}

}

exports.scrape = function(msg) {
	if(msg.author.id != '208310407201423371'){

		db.all('SELECT url,votes FROM memes', function(err, rows){
			let memes = [];
			var seconds = new Date() / 1000;

			for(let u in rows){
				memes.push(rows[u].url)
			}

	  		if(msg.content.includes('http')){

	  			if(!memes.includes(msg.content)){
		  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

					db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.content}","5")`);
				}else{
					logger.log('info','Not saving duplicate meme');
				}
	  		}

	  		if(msg.attachments.array().length >= 1){

	  			if(!memes.includes(msg.attachments.first().url)){
		  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

			  		db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.attachments.first().url}","5")`);
			  	}else{
			  		logger.log('info','Not saving duplicate meme');
			  	}
	  		}
		})
  		
  	}

}

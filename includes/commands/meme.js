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
	let attach = false;

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
							if(urlmeme.includes(image)){
								trurow = row[l];
								currentvotes = parseInt(row[l].votes)
							}
						}
					}else{
						for(let l in row){

							if(urlmeme = row[l].url){
								trurow = row[l];
								currentvotes = parseInt(row[l].votes)
							}

						}
					}

					if(trurow != false){
						newvotes = currentvotes + val;

						if(newvotes >= 10){
							newvotes = 10;
						}

						db.run(`UPDATE memes SET votes="${newvotes}" WHERE url="${trurow.url}"`);
						logger.log('debug',`Counted a meme vote. ${val} to ${trurow.url}. New votes is ${newvotes}`);
					}
				}
				
			})
		}
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

						db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.content}","5")`);
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

				  		db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.attachments.first().url}","5")`);
				  	}else{
				  		logger.log('info','Not saving duplicate meme');
				  	}
		  		}
			})
		}
  		
  	}

}

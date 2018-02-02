'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme.\n\nUse "${app.prefix}meme status" to count the memes available.`;

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

exports.scrape = function(msg) {
	if(msg.author.id != '208310407201423371'){
		var seconds = new Date() / 1000;
  		if(msg.content.includes('http')){
  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

			db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.content}","5")`);
  		}

  		if(msg.attachments.array().length >= 1){
  			logger.log('info',`Saving meme sent by ${msg.author.username}`);

	  		db.run(`INSERT INTO memes VALUES ("${msg.author.username}","${msg.author.id}","${seconds}","${msg.attachments.first().url}","5")`);
  		}
  		
  	}

}

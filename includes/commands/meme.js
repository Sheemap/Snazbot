'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');

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
		if(msg.channel == msg.guild.channels.find('id','301214003781173249')){
			common.sendMsg(msg,'This command only works in the #memes chat.',false,15);
		}else{
			fs.readFile('data/memes.txt', function(err, f){
	    		var memelist = f.toString().split('\n');
	    		var meme;

	    		for(let i=0;i<=500;i++){
					meme = memelist[Math.floor(Math.random()*(memelist.length-1))];

					if(!buffer.includes(meme)){
						buffer.push(meme);

						if(buffer.length >= 11){
							buffer.shift();
						}

						if(meme.includes('cdn.discordapp.com')){
							common.sendMsg(msg,{file:meme},false,15);
						}else{
							common.sendMsg(msg,meme,false,15);
						}
						break;
					}
				}

			});
		}
	}
}

exports.scrape = function(msg) {
	if (fs.existsSync('data/memes.txt')) {

    	if(msg.author.id != '208310407201423371'){

	  		if(msg.content.includes('http')){
	  			logger.log('info',`Saving meme sent by ${msg.author.username}`);
		  		var memeStream = fs.createWriteStream('data/memes.txt', {'flags': 'a'});
				memeStream.write(msg.content);
				memeStream.end('\n');
	  		}

	  		if(msg.attachments.array().length >= 1){
	  			logger.log('info',`Saving meme sent by ${msg.author.username}`);
	  			var memeStream = fs.createWriteStream('data/memes.txt', {'flags': 'a'});
				memeStream.write(msg.attachments.first().url);
				memeStream.end('\n');
		  		
	  		}
	  		
	  	}

	}else{
		logger.log('warn','Meme file doesnt exist! Now creating...')
		msg.channel.fetchMessages({ limit: 100 })
  		.then(messages => handlemsg(messages))
  		.catch(console.error);
  		let o = 0;

  		function handlemsg(messages){
  			let msgs = messages.array()
  			var memeStream = fs.createWriteStream('data/memes.txt', {'flags': 'a'});
  			for(o in msgs){
	  			if(msgs[o].author.id != '208310407201423371'){
			  		if(msgs[o].content.includes('http')){
				  		memeStream.write(msgs[o].content+'\n');
			  		}
			  		if(msgs[o].attachments.array().length >= 1){
				  		memeStream.write(msgs[o].attachments.first().url+'\n');
			  		}
				}
		  	}

		  	memeStream.end();
  		}
	}
	
}
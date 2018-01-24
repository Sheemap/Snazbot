'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

exports.description = 'Rolls you a random meme';

exports.usage = `Use ${app.prefix}meme to fetch a meme.`;

exports.main = function(msg,args) {
	if(msg.channel != msg.guild.channels.find('id','301214003781173249')){
		common.sendMsg(msg,'This command only works in the #memes chat.',false,15);
	}else{
		msg.channel.fetchMessages({ limit: 100 })
  		.then(messages => handlemsg(messages))
  		.catch(console.error);

	  	function handlemsg(messages){
	  		let msgs = messages.array();
	  		let meme = false;
	  		let num;
	  		var i = 0;
	  		let att;

		  	while(!meme){
		  		num = Math.floor(Math.random() * (99 - 0) + 0);

		  		if(msgs[num].author.id != '208310407201423371'){
			  		if(msgs[num].content.includes('http')){
				  		meme = true;
				  		att = false;
			  		}
			  		if(msgs[num].attachments.array().length >= 1){
				  		meme = true;
				  		att = true;
			  		}
			  		if(i>=1000){
			  			meme = true;
			  		}
			  		i++;
			  	}
		  	}

		  	if(i>=1000){
		  		logger.log('info','Couldnt find any memes!')
		  		common.sendMsg(msg,'Sorry but I wasnt able to find any good memes :(',false,15);
		  	}else if(att){
		  		common.sendMsg(msg,{file:msgs[num].attachments.first().url},false,15);
		  	}else if(!att){
		  		common.sendMsg(msg,msgs[num].content,false,15);
		  	}
		  	
	  	}
	}
	
}
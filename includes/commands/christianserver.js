'use strict'
const fs = require('fs');

const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

var pure,
	profanity;

fs.readFile('data/profanity.txt', function(err, f){
	profanity = f.toString().split('\n');
	profanity.pop();
});

exports.description = "This is a christian server.";

exports.main = function(msg,args){
	if(msg.author.id == '104848260954357760'){
		app.christ = true;
		var christStream = fs.createWriteStream('data/christ.txt', {'flags': 'a'});
		christStream.write('its alive');
		christStream.end('\n');
		common.sendMsg(msg,`Christian mode has been activated! Bad words are now filtered.`)
	}else{
		common.sendMsg(msg,'Thou are not holy enough for this command.',false,15);
	}
}

exports.filter = function(msg){
	console.log(profanity)
	pure = purityCheck(msg.content);
	if(!pure[0]){
		msg.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
		common.sendMsg(msg,`***! ! ! R E M I N D E R ! ! !*** This is a christan server and "${pure[1]}" is a horrible word! Please speak to your local pastor and repent.`,true,15);
	}
}

exports.addBad = function(bad){
	var wordStream = fs.createWriteStream('data/profanity.txt', {'flags': 'a'});
	wordStream.write(bad);
	wordStream.end('\n');
	profanity.push(bad)
}

function purityCheck(message){
	message = message.replace(/\s+/g, '');
	for(let a=0;a<profanity.length;a++){
		console.log(profanity[a])
		if(message.includes(profanity[a].replace(/\s+/g, ''))){
			
			return [false,profanity[a]];
		}
	}
	return [true];
}
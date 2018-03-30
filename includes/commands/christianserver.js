'use strict'
const fs = require('fs');

const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');

var pure,
	profanity;


if(fs.existsSync('data/christ.txt')){
    init();
}

exports.description = "This is a christian server.";

exports.main = function(msg,args){
	if(msg.author.id == '104848260954357760'){
		app.christ = true;
		var christStream = fs.createWriteStream('data/christ.txt', {'flags': 'a'});
		christStream.write('its alive');
		christStream.end('\n');
		init();
		common.sendMsg(msg,`Christian mode has been activated! Bad words are now filtered.`)
	}else{
		common.sendMsg(msg,'Thou are not holy enough for this command.',false,15);
	}
}

exports.msg = function(msg){
	if(app.christ && msg.guild.id == '104981147770990592' && msg.author.id != BOTID && msg.channel.id == '406571477916319745'){
        filter(msg);
    }
}

function filter(msg){
	pure = purityCheck(msg.content);
	if(!pure[0]){
		msg.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
		if(msg.content.includes('@everyone')){
			common.sendMsg(msg,`***! ! ! R E M I N D E R ! ! !*** This is a christian channel and "<REDACTED>" is a horrible word! Please speak to your local pastor and repent.`,true,15)
		}else{
			common.sendMsg(msg,`***! ! ! R E M I N D E R ! ! !*** This is a christian channel and "${pure[1]}" is a horrible word! Please speak to your local pastor and repent.`,true,15);
		}
	}
}

exports.addBad = function(bad){
	var wordStream = fs.createWriteStream('data/profanity.txt', {'flags': 'a'});
	wordStream.write(bad);
	wordStream.end('\n');
	profanity.push(bad)
}

function purityCheck(message){
	message = message.replace(/\s+/g, '').toLowerCase();
	for(let a=0;a<profanity.length;a++){
		if(message.includes(profanity[a].replace(/\s+/g, '').toLowerCase())){
			
			return [false,profanity[a]];
		}
	}
	return [true];
}

function init(){
	fs.readFile('data/profanity.txt', function(err, f){
		profanity = f.toString().split('\n');
		profanity.pop();
	});
}
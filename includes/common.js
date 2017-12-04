'use strict'
const sleep = require('sleep-promise');

const logger = require('./logger.js');
const app = require('../app.js');

var msgs = exports.msgs = [];

exports.sendMsg = function(msg,content,reply,timeout){
    let sent;
    let push = true;
    if(reply){
		msg.reply(content).then(message => cb(message));//.then(message => sent=message);//
    }else{
		msg.channel.send(content).then(message => cb(message));//.then(message => sent=message);//
    }
    if(!isNaN(timeout) && app.autoclean == 'yes'){
    	push = false;
        sleep(timeout*1000).then(function(){
            sent.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
            msg.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
        })
    }
    function cb(message){
    	if(push){
	    	msgs.push(message);
	    	msgs.push(msg);
	    }
    }
}

exports.reset = function(){
	msgs = [];
}

exports.getMsg = function(cb){
	cb(msgs);
}
'use strict'
const sleep = require('sleep-promise');

const logger = require('./logger.js');

var msgs = exports.msgs = [];

exports.sendMsg = function(msg,content,reply,timeout){
    let sent;
    if(reply){
		msg.reply(content).then(message => cb(message));
    }else{
		msg.channel.send(content).then(message => cb(message));
    }
    if(!isNaN(timeout)){
        sleep(timeout*1000).then(function(){
            sent.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
            msg.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
        })
    }
    function cb(message){
    	sent = message;
    	msgs.push(message);
    	msgs.push(msg);
    }
}
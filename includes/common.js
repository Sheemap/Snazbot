'use strict'

exports.sendMsg = function(msg,content,reply,timeout){
    if(reply){
		msg.reply(content)
    }else{
		msg.channel.send(content)
    }
    if(!isNaN(timeout)){
	
    }
}
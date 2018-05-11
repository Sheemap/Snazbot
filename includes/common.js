'use strict'
const sleep = require('sleep-promise');

const logger = require('./logger.js');
const app = require('../app.js');

var msgs = exports.msgs = [];
var push = true;
var sent;

exports.sendMsg = function(msg,content,reply,timeout,callback){
    sent = null;
    push = true;

    if(typeof(callback) === 'undefined'){
        callback = '';
    }

    if(reply){
		msg.reply(content).then(message => cb(message,msg,callback));//.then(message => sent=message);//
    }else{
		msg.channel.send(content).then(message => cb(message,msg,callback));//.then(message => sent=message);//
    }
    if(!isNaN(timeout) && app.autoclean == 'yes'){
    	push = false;
        sleep(timeout*1000).then(function(){
            sent.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
            msg.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')});
        })
    }
    
}


exports.sendPM = function(user,content,callback){
    if(typeof(callback) === 'undefined'){
        callback = '';
    }    

    if(typeof(user.id) !== 'undefined'){
        user.send(content).then(message => cb(message,'',callback));
    }else{
        exports.findUser(user,function(foundUser){
            foundUser.send(content).then(message => cb(message,'',callback));
        })
    }
}


exports.findUser = function(user,callback){
    var finalUser = '';
    var guilds = app.client.guilds.array();
    var members = [];

    for(let i=0;i<guilds.length;i++){

        let tmp_mem = guilds[i].members.array();

        for(let x=0;x<tmp_mem.length;x++){

            if(!members.includes(tmp_mem[x]))
                members.push(tmp_mem[x]);

        }
    }
    if(isNaN(user)){
        for(let i=0;i<members.length;i++){
            if(members[i].displayName.toLowerCase().includes(user.toLowerCase())){
                if(finalUser.id !== members[i].id){
                    finalUser = members[i];
                }
            }
        }
    }else{
        for(let i=0;i<members.length;i++){
            if(members[i].id == user){
                if(finalUser.id !== members[i].id){
                    finalUser = members[i];
                }
            }
        }
    }

    if(typeof(callback) !== 'undefined'){
        callback(finalUser);
    }else{
        return finalUser;
    }

}

exports.reset = function(){
	msgs = [];
}

exports.getMsg = function(cb){
	cb(msgs);
}

function cb(message,msg,callback){
    if(push){
        msgs.push(message);
        msgs.push(msg);
    }

    if(callback !== ''){
        callback(message);
    }
}
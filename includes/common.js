'use strict'
const sleep = require('sleep-promise');

const logger = require('./logger.js');
const app = require('../app.js');

var msgs = exports.msgs = [];
var push = true;
var sent;

//Returns the voice chat that the user is in given a specific guild, if any.
exports.userVC = function(user, guild){
    if(typeof(guild) === 'undefined'){
        logger.log('warning','function userVC was not passed a correct guild!');
        return;
    }
    let userchan;
    let all_channels = guild.channels.array();
    for(let i=0; i<all_channels.length; i++){
        if(all_channels[i].type == 'voice'){

            let vcmem = all_channels[i].members;

            if(vcmem.has(user.id))
                userchan = all_channels[i];
        }
        
    }

    if(typeof(userchan) === 'undefined'){
        logger.log('debug','User passed to userVC was not in a voice chat.')
        return;
    }else{
        return userchan;
    }

}

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

exports.sendChannel = function(chan,content,timeout,callback){ 
    let sent; 
    let push = true; 
     
    let all_channels = app.client.channels.array(); 
    let channel = ''; 
 
    for(let c in all_channels){ 
        if(all_channels[c].id == chan){ 
            channel = all_channels[c]; 
        } 
    } 
 
    if(channel !== ''){ 
        channel.send(content).then(message => cb(message,'',callback));//.then(message => sent=message);// 
    }else{ 
        logger.log('error',`Attempted to send message to nonexistent channel! Channel: ${channel.id}`) 
    } 
     
    if(!isNaN(timeout) && app.autoclean == 'yes'){ 
        push = false; 
        sleep(timeout*1000).then(function(){ 
            sent.delete().catch(function(){logger.log('warn','Tried to delete a nonexistent message!')}); 
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

    if(callback !== '' && typeof(callback) !== 'undefined'){
        callback(message);
    }
}
//Packages
const Discord = require("discord.js");
const client = exports.client = new Discord.Client();
const ini = require('ini');
const fs = require('fs');
var token;

exports.loadConf = loadConf = function(){
    //Config

    let needrs = false;
    if(!fs.existsSync('./config/config.ini')){
        try{
            fs.copyFileSync('./config/example.config.ini','./config/config.ini')
            console.log("Copied the example config to 'config/config.ini' Please adjust all config values and restart the program.")
            needrs = true;
        }
        catch(error){
            if(error.code == "ENOENT"){
                console.log("No config exists, and no example config exists to copy! Please download the config file template from my github. https://github.com/Sheemap/Snazbot")
                needrs = true;
            }
        }
    }

    if(!fs.existsSync('./config/blacklist.ini')){
        try{
            fs.copyFileSync('./config/example.blacklist.ini','./config/blacklist.ini')
            console.log("Copied the example blacklist to 'config/blacklist.ini'")
        }
        catch(error){
            if(error.code == "ENOENT"){
                console.log("No blacklist exists, and no example blacklist exists to copy! Please download the blacklist file template from my github. https://github.com/Sheemap/Snazbot")
                needrs = true;
            }
        }
    }

    if(needrs)
        process.exit();


    exports.config = config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'))
   
    token = config.general.token;
    exports.prefix = prefix = config.general.commandprefix;
    exports.autoclean = autoclean = config.general.autoclean;
    exports.logdir = logdir = config.general.logdir;
    exports.loglevel = loglevel = config.general.loglevel;
    exports.admins = admins = config.general.admins.split(',');

    //Meme config
    exports.memechan = memechan = config.meme.memechan;
    exports.buffer = buffer = config.meme.buffer;
    exports.maxvote = maxvote = config.meme.maxvote;
    exports.startscore = startscore = config.meme.startscore;
    exports.rollchan = rollchan = config.meme.rollchan;
    exports.albumhash = albumhash = config.meme.albumhash;

    //Chungus config
    exports.chungusrole = chungusrole = config.chungus.chungusrole;
    exports.chunguschan = chunguschan = config.chungus.channel;
    exports.chunguscd = chunguscd = config.chungus.maxcd;

    //Deceit config
    exports.deceitusers = deceitusers = config.deceit.users.split(',');
}

//Load config
loadConf();


//Cusom Packages
const logger = require("./includes/logger.js");
var comm;
var voting;
var meme;
var filter;
//Import DB before most
const DBNAME = "data";
const db = require(`./includes/db.js`);

if (fs.existsSync(`data/${DBNAME}.db`)) {
    db.init(DBNAME,dbCallback);
}else{
    db.createNew(DBNAME,dbCallback);
}

function dbCallback(){
    comm = require("./includes/commandHandle.js");
    voting = require("./includes/commands/afk.js");
    meme = require("./includes/commands/meme.js");
    filter = require("./includes/commands/christianserver.js");
    commEvents = comm.events;


    if(fs.existsSync('data/christ.txt')){ // The appendix of Snazbot
        exports.christ = christ = true; // Test commit plz ignore, no appendix plz
    }else{
        exports.christ = christ = false;
    }



    if(autoclean == 'yes'){
        logger.log('info','Autocleaning messages is enabled.')
    }else{
        logger.log('info','Autocleaning messages is disabled.')
    }


    client.login(token);
}


client.on('ready', () => {
    exports.BOTID = BOTID = client.user.id;
    logger.log('info',`Logged in as ${client.user.tag}`);
});


client.on('message', msg => {
    if(msg.author.id == this.BOTID || typeof(msg.channel.guild) === 'undefined'){
        return;
    }
    db.storeUserData(msg.member, function(err, row){
        comm.msg(msg);
        if(msg.content.startsWith(prefix)){
            comm.parse(msg);
        }
        
        if(msg.guild !== null){
            if(!msg.content.toLowerCase().includes('jim') && msg.guild.id == '384946871103258626' && msg.author.id != BOTID){
                msg.delete();
                logger.log('info','Offending Jim message from '+msg.author.username);
            }
        }
    });
});

client.on('messageReactionAdd', (reaction,user) => {
    comm.react(reaction,user,true);
})
client.on('messageReactionRemove', (reaction,user) => {
    comm.react(reaction,user,false);
})

client.on('messageUpdate', (omsg,nmsg) => {
    if(nmsg.guild !== null){
        if(!nmsg.content.toLowerCase().includes('jim') && nmsg.guild.id == '384946871103258626' && nmsg.author.id != BOTID){
            nmsg.delete();
            logger.log('info','Offending Jim edit from '+nmsg.author.username);
        }
    }
})

client.on('guildMemberAdd', member => {
    if(member.guild.id == '384946871103258626'){
        let rollid = member.guild.roles.get('384948011106697216');
        member.addRole(rollid).catch(logger.log('error',`Failed to Jim ${member.user.username}!`));
        member.setNickname('Jim');
        logger.log('info',`Successfully Jimmed ${member.user.username}`);
    }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if(newMember.guild.id == "104981147770990592"){
        if(newMember.voiceChannelID == "359575807297060875"){
            newMember.addRole('360186010728005652')
            logger.log('debug',`Entered ${newMember.user.username} into the spankbank`)
        }else{
            newMember.removeRole('360186010728005652')
            logger.log('debug',`Removed ${newMember.user.username} from the spankbank`)
        }
    }
});

client.on('error', (err) => logger.log('error', err));
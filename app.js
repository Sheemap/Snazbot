//Packages
const Discord = require("discord.js");
const client = new Discord.Client();
const ini = require('ini');
const fs = require('fs');

//Config
const config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'))

const token = config.general.token;
exports.prefix = prefix = config.general.commandprefix;
exports.autoclean = autoclean = config.general.autoclean;
exports.logdir = logdir = config.general.logdir;


//Cusom Packages
const logger = require("./includes/logger.js");
const comm = require("./includes/commandHandle.js");
const voting = require("./includes/commands/afk.js");
const meme = require("./includes/commands/meme.js");
const filter = require("./includes/commands/christianserver.js");

const commEvents = comm.events;

if(fs.existsSync('data/christ.txt')){
    exports.christ = christ = true;
}else{
    exports.christ = christ = false;
}



if(autoclean == 'yes'){
    logger.log('info','Autocleaning messages is enabled.')
}else{
    logger.log('info','Autocleaning messages is disabled.')
}


client.on('ready', () => {
  logger.log('info',`Logged in as ${client.user.tag}`);
});


client.on('message', msg => {
    if(exports.christ && msg.guild.id == '104981147770990592' && msg.author.id != '208310407201423371' && msg.channel.id == '406571477916319745'){
        filter.filter(msg);
    }
    if(msg.content.startsWith(prefix)){
        comm.parse(msg);
    }else if(msg.channel.id == '301214003781173249'){
        meme.scrape(msg);
    }
    if(!msg.content.toLowerCase().includes('jim') && msg.guild.id == '384946871103258626' && msg.author.id != '208310407201423371'){
        msg.delete();
        logger.log('info','Offending Jim message from '+msg.author.username);
    }
    if(msg.content.toLowerCase().startsWith('y')){
        voting.voter(msg);
    }
});

client.on('messageUpdate', (omsg,nmsg) => {
    if(!nmsg.content.toLowerCase().includes('jim') && nmsg.guild.id == '384946871103258626' && nmsg.author.id != '208310407201423371'){
        nmsg.delete();
        logger.log('info','Offending Jim edit from '+nmsg.author.username);
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
    if(newMember.voiceChannelID == "359575807297060875"){
        newMember.addRole('360186010728005652')
        logger.log('info',`Entered ${newMember.user.username} into the spankbank`)
    }else{
        newMember.removeRole('360186010728005652')
        logger.log('info',`Removed ${newMember.user.username} from the spankbank`)
    }
});

client.login(token);
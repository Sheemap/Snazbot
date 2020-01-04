'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const fs = require('fs');
const db = require('../db.js');
const imgur = require('imgur');
const sleep = require('sleep-promise')

exports.description = 'Rolls you a random meme';

exports.usage = `Use "${app.prefix}meme" to fetch a meme. \n\nYou can roll multiple memes by using "${app.prefix}meme <number of memes> <seconds delay between memes>"\n\nUse "${app.prefix}meme status" to count the memes available.\n\nUse "${app.prefix}meme points" to see how many points your memes have gathered.\n\nUse "${app.prefix}meme points <username>" to see how many points other peoples memes have gathered.`;

exports.reactions = `%F0%9F%91%8D,%F0%9F%91%8E`;

exports.db_scheme = [`Meme (MemeId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
						   Url TEXT, 
						   UserId INTEGER,
						   DateCreated INTEGER,
						   FOREIGN KEY(UserId) REFERENCES User(UserId))`,
					`MemeVote (MemeVoteId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
								MemeId INTEGER,
								IsUpvote INTEGER,
								UserId INTEGER,
								DateCreated INTEGER,
								MemeRollId INTEGER,
								FOREIGN KEY(MemeId) REFERENCES Meme(MemeId),
								FOREIGN KEY(UserId) REFERENCES User(UserId),
								FOREIGN KEY(MemeRollId) REFERENCES MemeRoll(MemeRollId))`,
					`MemeRoll (MemeRollId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
							   MessageId INTEGER,
							   MemeId INTEGER,
							   UserId INTEGER,
							   DateCreated INTEGER,
							   FOREIGN KEY(MemeId) REFERENCES Meme(MemeId),
							   FOREIGN KEY(UserId) REFERENCES User(UserId))`]

//%F0%9F%91%8D = thumbsup

//%F0%9F%91%8E = thumbsdown

// const app.bufferSIZE = 150;
// const app.buffer = app.buffer; //percentage
// const app.maxvote = app.maxvote;
const startScore = parseInt(app.startscore);
// const app.albumhash = app.albumhash;

var buffer = [];
var buffersize = 0;

const defaultdelay = 3;
const maxrolltime = 300;
const minimumVoteCount = -5;

exports.main = function(msg,args){
	switch(args[0].toLowerCase()){

		case 'status':
			checkStats(msg,args);
			break;

		case 'points':
			points(msg,args);
			break;

		default:
			roll(msg,args);
			break;
	}
}


exports.react = function(reaction,user,added){
	let val = 0;
	let meme = false;
	let currentvotes;
	let newvotes;
	let urlmeme;
	let attach = false;

	if(user.id == app.BOTID){
		return;
	}

	if(reaction.message.channel.id == app.rollchan){
		let isUpvote = 0;
		db.all(`SELECT MemeId, MessageId, MemeRollId
				FROM MemeRoll mr`, 
			function(err,rows){
				let msgIds = rows.map(function(item){return item.MessageId})
				let index = msgIds.indexOf(parseInt(reaction.message.id));
				if(index != -1){
					if(reaction.emoji.identifier == '%F0%9F%91%8D'){
						if(added){
							isUpvote = 1;
						}else{
							isUpvote = 0;
						}
					}else if(reaction.emoji.identifier == '%F0%9F%91%8E'){
						if(added){
							isUpvote = 0;
						}else{
							isUpvote = 1;
						}
					}

					let row = rows.filter(x => x.MessageId == msgIds[index])[0];
					db.userIdByDiscordId(reaction.message.guild.id, user.id, function(err,userId){
						db.runSecure(`INSERT INTO MemeVote VALUES (null, ?, ?, ?, ?, ?)`, {
							1: row.MemeId, 
							2: isUpvote, 
							3: userId, 
							4: Math.floor(new Date() / 1000), 
							5: row.MemeRollId
						});
					})
				}
			});
		
	}

}

function saveMeme(meme, msg){
	var seconds = new Date() / 1000;
	db.userIdByMessage(msg, function(err, userId){
		db.runSecure(`INSERT INTO Meme VALUES (?,?,?,?)`,{ 
			1: null,
			2: meme,
			3: userId,
			4: seconds,
		});
	});
}

exports.msg = function(msg) {
	if(msg.author.id != app.BOTID){
		if(msg.channel.id == app.memechan){
			if(msg.content.includes('http')){
				logger.log('info',`Saving meme sent by ${msg.author.username}`);
				saveMeme(msg.content, msg);
			}

			if(msg.attachments.array().length >= 1){
				let attachments = msg.attachments.array()
				let newurl = '';
				for(let i=0;i<attachments.length;i++){
					logger.log('info',`Saving meme sent by ${msg.author.username}`);

					imgur.uploadUrl(attachments[i].url,app.albumhash)
						.then(function (json) {
							console.log(json.data)
							newurl = json.data.link;
							saveMeme(newurl, msg);
						})
						.catch(function (err) {
							logger.log('error',err.message);
						});
				}
			}
		}
  	}
}


function checkStats(msg,args){
	db.get(`SELECT COUNT(MemeId) AS MemeCount 
			FROM Meme m
			INNER JOIN User u ON m.UserId = u.UserId
			INNER JOIN Server s ON u.ServerId = s.ServerId
			WHERE s.DiscordId = '208298947997990912';`
		, function(err, row){

		common.sendMsg(msg,`There are currently **${row.MemeCount}** memes in stock. The buffersize is set to **${app.buffer*100}%**.`,false,15);

	});
}

function points(msg,args){
	if(args.length >= 2){
		let members = msg.channel.guild.members.array();
		let count = 0;
		let disID;
		let serverId;
		let name;
		for(let mem in members){
			if(members[mem].user.username.toLowerCase().includes(args[1].toLowerCase())){
				count++;
				disID = members[mem].user.id;
				name = members[mem].user.username;
				serverId = members[mem].guild.id
			}
		}

		if(count > 1){
			common.sendMsg(msg,`Multiple users found by that name! Try something more specific.`,false,15);

		}else if(count == 0){
			common.sendMsg(msg,`No users found by that name! Try again!`,false,15);

		}else if(count == 1){

			checkPoints(disID, serverId, function(score){
				common.sendMsg(msg,`${name} currently has **${score}** meme points.`,false,15);
			})

			
		}
	}else{

		checkPoints(msg.author.id, msg.channel.guild.id, function(score){
			common.sendMsg(msg,`You currently have **${score}** meme points.`,true,15);
		})
	}
}

function checkPoints(userId, serverId, callback){
	let score = 0;
	let memecount = 0;
	let avg = 0;
	db.all(`SELECT mv.IsUpvote
			FROM MemeVote mv
			INNER JOIN Meme m ON mv.MemeId = m.MemeId
			INNER JOIN User u ON m.UserId = u.UserId
			INNER JOIN Server s ON u.ServerId = s.ServerId
			WHERE s.DiscordId = ${serverId}
			AND u.DiscordId = ${userId}`
		, function(err, rows){
		
		for(let y of rows){
			console.log(y)
			score += y.IsUpvote || -1
		}

		callback(score)
	})
	
}

function timeRoll(msg,num,delay){

	num += -1
	sleep(delay*1000).then(function(){
			if(num > 0){
				roll(msg,[])
				timeRoll(msg,num,delay)
			}
			
	})
}

function roll(msg,args){
	if(msg.channel.id != app.rollchan){
		common.sendMsg(msg,'This command only works in the #memeroll chat.',false,15);
	}else{

		let memequeue = 0;
		let memedelay = 3;
		if(!isNaN(args[0])){
			memequeue = parseInt(args[0]);

			if(!isNaN(args[1])){
				memedelay = parseInt(args[1]);
				if(memedelay < 1){
					memedelay = 1;
				}
			}else{
				memedelay = defaultdelay;
			}

			if(memequeue * memedelay > maxrolltime){
				common.sendMsg(msg,`Rolling ${memequeue} memes with a delay of ${memedelay} seconds would take over ${maxrolltime} seconds, which is not allowed. Rolling one meme instead.`);
			}else{
				logger.log('info',`Rolling ${memequeue} memes, will finish in ${memedelay*memequeue} seconds`)
				timeRoll(msg,memequeue,memedelay);
			}
		}

		// Grabs the total count of memes for current server, and finds the buffer number
		db.get(`SELECT COUNT(MemeId) AS MemeCount 
				FROM Meme m
				INNER JOIN User u ON m.UserId = u.UserId
				INNER JOIN Server s ON u.ServerId = s.ServerId
				WHERE s.DiscordId = ${msg.guild.id}
				`, function(err, row){
			let bufferNumber = Math.floor(row.MemeCount * app.buffer);	

			// Selects $bufferNumber of the most recent MemeRolls, and selects memes that do not have a MemeRollId. Effectively only retrieving memes not in buffer
			db.all(`SELECT
					m.MemeId, 
					m.Url,
					SUM(IFNULL(mvUp.Upvotes, 0) - IFNULL(mvDown.Downvotes, 0)) AS Votes
					FROM Meme m
					LEFT JOIN (
						SELECT innermr.MemeRollId, innermr.MemeId
						FROM MemeRoll innermr
						INNER JOIN User u ON innermr.UserId = u.UserId
						INNER JOIN Server s ON u.ServerId = s.ServerId
						WHERE s.DiscordId = ${msg.guild.id}
						ORDER BY MemeRollId DESC
						LIMIT ${bufferNumber}
					) mr ON mr.MemeId = m.MemeId
					LEFT JOIN (
						SELECT mv.MemeId, 
							COUNT(*) AS UpVotes
						FROM MemeVote mv
						GROUP BY MemeId
						HAVING IsUpvote = 1
					) mvUp ON mvUp.MemeId = m.MemeId
					LEFT JOIN (
						SELECT mv.MemeId, 
							COUNT(*) AS DownVotes
						FROM MemeVote mv
						GROUP BY MemeId
						HAVING IsUpvote = 0
					) mvDown ON mvDown.MemeId = m.MemeId
					INNER JOIN User u ON m.UserId = u.UserId
					INNER JOIN Server s ON u.ServerId = s.ServerId
					WHERE s.DiscordId = ${msg.guild.id}
					AND mr.MemeRollId IS NULL
					GROUP BY m.MemeId
					HAVING Votes > ${minimumVoteCount};
					`,function(err,rows){

				// Adds a meme to the selection pool per vote it has
				let memePool = [];
				for(let item of rows){
					let tickets = startScore + item.Votes;
					for(let i=0; i < tickets; i++){
						memePool.push(item);
					}
				}

				let meme = memePool[Math.floor(Math.random()*(memePool.length))];

				if(meme.Url.includes('cdn.discordapp.com') || meme.Url.includes('i.imgur')){
					common.sendMsg(msg,{file:meme.Url},false,15,callback);
				}else{
					common.sendMsg(msg,meme.Url,false,15,callback);
				}

				async function callback(message){
					db.userIdByMessage(msg,function(err,userId){
						db.runSecure(`INSERT INTO MemeRoll VALUES (null, ?, ?, ?, ?)`, [message.id, meme.MemeId, userId, Math.floor(new Date() / 1000)]);
					});
					await message.react('👍');
					await message.react('👎');
				}
			});
		});
	}
}
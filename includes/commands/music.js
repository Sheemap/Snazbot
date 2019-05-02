'use strict';
const common = require('../common.js');
const app = require('../../app.js');
const logger = require('../logger.js');
const db = require('../db.js');

// Play streams using ytdl-core
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1 };

exports.description = 'Plays music from the #music chat';

exports.usage = `Use "${app.prefix}music" to display this message. \n\nUse "${app.prefix}music play" to start playback\n\nUse "${app.prefix}music pause" to pause playback\n\nUse "${app.prefix}music stop" to stop playback and leave chat\n\nUse "${app.prefix}music skip" to skip current track`;

exports.db_scheme = `music (disNAM TEXT, disID NUMERIC, timestamp NUMERIC, url TEXT)`

var queue = [];

exports.main = function(msg,args){

	if(queue.length == 0){
		db.all(`SELECT * FROM music`,function(err,rows){

			if(err){
				common.sendMsg(msg,'Error building the queue. Music module disabled for now.')
				logger.log('error',`Error building queue. Music module will not work.`)
			}else{
				for(let x in rows){
					queue.push(rows[x].url)
				}
				selectFunc(args[0].toLowerCase())
			}
		})
	}else{
		selectFunc(args[0].toLowerCase())
	}

	function selectFunc(selection){
		logger.log('debug',`${args[0].toLowerCase()}`)
		switch(selection){

			case 'play':
				play(msg,args);
				break;

			case 'pause':
				pause(msg,args);
				break;

			case 'stop':
				stop(msg,args);
				break;

			case 'skip':
				skip(msg,args);
				break;

			default:
				play(msg,args);
				// common.sendMsg(msg,`\`\`\`${exports.usage}\`\`\``)
				break;

		}
	}
}

function play(msg,args){
	if(app.client.voiceConnections.array().length == 0){
		let vc = common.userVC(msg.author,msg.guild)
		vc.join()
		  .then(connection => {
		  	console.log('Will play '+queue[0])
		  	const stream = ytdl('https://www.youtube.com/watch?v=XAWgeLF9EVQ', { filter : 'audioonly' });
		    const dispatcher = connection.playStream(stream, streamOptions);
		    console.log(dispatcher.paused)
		  })
		  .catch(console.error);
	}else{
		common.sendMsg(msg,`Already in a voice channel, please join me there.`)
	}
}

function pause(msg,args){

}

function stop(msg,args){

}

function skip(msg,args){

}
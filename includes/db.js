'use strict';
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger.js');
const fs = require('fs');

var db;

exports.createNew = function(name,callback){
    name += '.db'

    var db = new sqlite3.Database('./data/'+name);
    db.serialize(function() {
        db.run("CREATE TABLE johntime (disNAM TEXT, disID TEXT, timestamp NUMERIC, claim NUMERIC, actual NUMERIC)");
        db.run("CREATE TABLE memes (disNAM TEXT, disID NUMERIC, timestamp NUMERIC, url TEXT, votes NUMERIC, hash TEXT)");
        db.run("CREATE TABLE users (disNAM TEXT, disID NUMERIC, ytmemes INTEGER, memeroll INTEGER)");
        db.run("CREATE TABLE chungus (disNAM TEXT, disID TEXT, lastclaim TEXT, points NUMERIC, lastchungus TEXT)");

        var seconds = new Date() / 1000;
        db.run(`INSERT INTO chungus VALUES ("chungus","000","${seconds}","0","0")`);

        db.run("CREATE TABLE events (disNAM TEXT, disID TEXT, timestamp NUMERIC, event_name TEXT, expired INT, data TEXT)");

        /*

    event args:
        -n name
        -f frequency (one time, weekly)
        -i invitees (who to send invites to, cant be used with -c)
        -c channel id (where to send invites)
        -d default times (which emojis will be auto placed 1-24)
        -n notify day (when to first send invites)
        -w wait time between notifications (how long to wait before sending reminder invite)

        */




        // IMPORT PLAINTEXT MEMERS

        // fs.readFile('data/memes.txt', function(err, f){
        //     var memelist = f.toString().split('\n');
        //     var meme;
        //     for (let item in memelist) {
        //         db.run("INSERT INTO memes VALUES (?,?,?,?,?)",{
        //             1: 'Unknown',
        //             2: '000000000000000000',
        //             3: '0000000000',
        //             4: memelist[item],
        //             5: '5'
        //         });
        //     }
        // });

        
    })

    logger.log('info','Database created!')
    callback()
}

exports.init = function(name,callback){
    name += '.db';
    db = new sqlite3.Database('./data/'+name);
    logger.log('info','Database initialized!');
    callback();
}

exports.run = function(query,callback){
    db.run(query,callback2)
    function callback2(err,row){
        if(err){
            logger.log('error',err);
        }
        if(typeof callback != 'undefined'){
            callback(err,row)
        }
    }
}

exports.runSecure = function(query,values,callback){
    db.run(query,values,callback2)
    function callback2(err,row){
        if(err){
            logger.log('error',err);
        }
        if(typeof callback != 'undefined'){
            callback(err,row)
        }
    }
}

exports.get = function(query,callback){
    db.get(query,callback)
}

exports.all = function(query,callback){
    db.all(query,callback)
}

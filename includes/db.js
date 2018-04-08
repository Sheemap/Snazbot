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
        db.run("CREATE TABLE users (disNAM TEXT, disID NUMERIC, ytmemes INTEGER, memeroll INTEGER)")


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

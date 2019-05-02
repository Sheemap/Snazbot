'use strict';
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger.js');
const fs = require('fs');
const comm = require('./commandHandle.js')

const db_schemes = comm.db_schemes;
const db_inits = comm.db_inits;
var db;

console.log(db_schemes)

exports.createNew = function(name,callback){
    name += '.db'

    if(!fs.existsSync('./data')){
        fs.mkdirSync('./data');
    }

    db = new sqlite3.Database('./data/'+name);
    db.serialize(function() {
        db.run("CREATE TABLE data (disNAM TEXT, disID TEXT, data TEXT)");

        // Run each commands table creation
        for(let x in db_schemes){
            db.run(`CREATE TABLE ${db_schemes[x]}`)
        }

        // Run each commands initial commands
        for(let x in db_inits){
            db.run(db_inits[x])
        }


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

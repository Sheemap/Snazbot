'use strict';
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger.js');
const fs = require('fs');
const comm = require('./commandHandle.js')

const db_schemes = comm.db_schemes;
const db_inits = comm.db_inits;
var db;

exports.createNew = function(name,callback){
    name += '.db'

    if(!fs.existsSync('./data')){
        fs.mkdirSync('./data');
    }

    db = new sqlite3.Database('./data/'+name);
    db.serialize(function() {
        db.run("CREATE TABLE Server (ServerId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, DiscordId INTEGER, Name TEXT)");
        db.run("CREATE TABLE User (UserId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, DiscordId INTEGER, DisplayName TEXT, UserName TEXT, ServerId INTEGER, FOREIGN KEY(ServerId) REFERENCES Server(ServerId))");

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


function rebuildTable (error_message,query,values,callback){
    let table_name = error_message.message.split(': ')[2]
    logger.log('warn',`Table "${table_name}" does not exist. Attempting to create and try again...`)
    

    let init_command = [];
    for(let x in db_schemes){
        if(db_schemes[x].replace(/\s+/g, '').startsWith(table_name+'(')){
            db.run(`CREATE TABLE ${db_schemes[x]}`,function(err,row){

                if(err){
                    logger.log('error',`Something went wrong with executing "CREATE TABLE ${db_schemes[x]}"`)
                }else{
                    logger.log('info','Created, running original command again')

                    if(typeof(values) !== 'undefined'){
                        db.run(query,values,function (err,row){
                            if(err){
                                logger.log('error',err);
                                if(typeof callback != 'undefined'){
                                    callback(err,row)
                                }
                            }else{
                                logger.log('info','Success!')
                                if(typeof callback != 'undefined'){
                                    callback(err,row)
                                }
                            }
                        })
                    }else{
                        db.run(query,function (err,row){
                            if(err){
                                logger.log('error',err);
                                if(typeof callback != 'undefined'){
                                    callback(err,row)
                                }
                            }else{
                                logger.log('info','Success!')
                                if(typeof callback != 'undefined'){
                                    callback(err,row)
                                }
                            }
                        })
                    }
                }

            })
            

        }
    }
}


exports.run = function(query,callback){
    db.run(query,function(err,row){
        var rebuilding = false
        if(err){
            if(err.message.startsWith('SQLITE_ERROR: no such table:')){
                rebuilding = true;
                let values;
                rebuildTable(err,query,values,callback)

            }else{
                logger.log('error',err);
            }
            
            
        }
        if(!rebuilding & typeof callback != 'undefined'){
            callback(err,row)
        }
    })
}

exports.runSecure = function(query,values,callback){
    db.run(query,values,callback2)
    function callback2(err,row){
        var rebuilding = false
        if(err){
            if(err.message.startsWith('SQLITE_ERROR: no such table:')){
                rebuilding = true;
                rebuildTable(err,query,values,callback)

            }else{
                logger.log('error',err);
            }
            
            
        }
        if(!rebuilding & typeof callback != 'undefined'){
            callback(err,row)
        }
    }
}

exports.get = function(query,callback){
    db.get(query,function(err,row){
        var rebuilding = false
        if(err){
            if(err.message.startsWith('SQLITE_ERROR: no such table:')){
                rebuilding = true;
                let values;
                rebuildTable(err,query,values,callback)

            }else{
                logger.log('error',err);
            }
            
            
        }
        if(!rebuilding & typeof callback != 'undefined'){
            callback(err,row)
        }
    })
}

exports.all = function(query,callback){
    db.all(query,function(err,row){
        var rebuilding = false
        if(err){
            if(err.message.startsWith('SQLITE_ERROR: no such table:')){
                rebuilding = true;
                let values;
                rebuildTable(err,query,values,callback)

            }else{
                logger.log('error',err);
            }
            
            
        }
        if(!rebuilding & typeof callback != 'undefined'){
            callback(err,row)
        }
    })
}

exports.userIdByDiscordId = function(discordId, callback){
    db.get(`SELECT UserId FROM User WHERE DiscordId = ?`, [discordId], function(err, row){
        if(err){
            logger.log('error',err);
        }
        callback(err, row.UserId);
    })
};

exports.storeUserData = function (member, callback){
    db.get(`SELECT u.UserId, u.DisplayName, u.UserName 
            FROM User u
            INNER JOIN Server s ON s.ServerId = u.ServerId
            WHERE u.DiscordId = ${member.id} 
            AND s.DiscordId = ${member.guild.id}`, function(err, row){
        if(typeof(row) !== 'undefined'){
            if(member.displayName != row.DisplayName || member.user.username != row.UserName){
                logger.log('info','Updating user info');
                db.run(`UPDATE User SET DisplayName = ?, UserName = ? WHERE UserId = ?`, [member.displayName, member.user.username, row.UserId], callback);
            }else{
                callback();
            }
        }else{
            db.get(`SELECT ServerId, Name FROM Server WHERE DiscordId = ${member.guild.id}`, function(err, row){
                if(typeof(row) !== 'undefined'){
                    if(member.guild.name != row.name){
                        logger.log('info','Updating server info');
                        db.run(`UPDATE Server SET Name = ? WHERE ServerId = ?`, [member.guild.name, row.ServerId]);
                    }
                    logger.log('info','Inserting new user');
                    db.run(`INSERT INTO User VALUES (null, ?, ?, ?, ?)`, [member.id, member.displayName, member.user.username, row.ServerId], callback);
                }else{
                    logger.log('info','Inserting new server');
                    db.run(`INSERT INTO Server VALUES (null, ?, ?)`, [member.guild.id, member.guild.name], function(err){
                        db.get(`SELECT ServerId FROM Server WHERE DiscordId = ?`, [member.guild.id], function(err,row){
                            logger.log('info','Inserting new user');
                            db.run(`INSERT INTO User VALUES (null, ?, ?, ?, ?)`, [member.id, member.displayName, member.user.username, row.ServerId], callback);
                        });
                    })
                }
            })
        }
    })
}
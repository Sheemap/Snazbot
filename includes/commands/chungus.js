"use strict";
const Discord = require("discord.js");
const logger = require("../logger.js");
const common = require("../common.js");
const app = require("../../app.js");
const db = require("../db.js");

const schedule = require("node-schedule");
const moment = require("moment");

const BONUS_REWARDS = {
	"420": 69,
	"1337": 420,
	"6969": 31337
}

exports.description = "Claim yourself as chungus";

exports.usage = `Use "${app.prefix}chungus" to claim your chungus points.\n\nUse "${app.prefix}chungus top" to check leaderboard.\n\nUse "${app.prefix}chungus cd <user>" to check someones current cooldown. If you dont specify a person, it defaults to you.\n\nIf you're the chungus, use "${app.prefix}chungus color <#hex code>" to change your color, and "${app.prefix}chungus name <name>" to change your role title (Must include the word chungus).\n\nUse "${app.prefix}chungus total to see how long you've held the chungus over time."`;

exports.db_scheme = [
	`Chungus (ChungusId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
							  UserId INTEGER, 
							  DateCreated INTEGER, 
							  Color TEXT, 
							  Name NUMERIC, 
							  FOREIGN KEY(UserId) REFERENCES User(UserId))`,
	`ChungusPoints (ChungusPointsId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
									Points INTEGER,
									DurationSeconds INTEGER,
									BecameChungus INTEGER,
									UserId INTEGER,
									DateCreated INTEGER,
									FOREIGN KEY(UserId) REFERENCES User(UserId))`,
];

var seconds = new Date() / 1000;
exports.db_init = `INSERT INTO ChungusPoints VALUES (null, 0, 0, 0, 0, ${seconds})`;

var max_chungus_cd = app.config.chungus.maxcd;
var max_cd_factor = app.config.chungus.maxcdfactor;

const DECAYPERCENT = 0.025;

// const app.chungusrole = app.chungusrole;
// const app.chunguschan.split(',') = app.chunguschan.split(',');
// var max_chungus_cd = max_chungus_cd; //43200seconds is 12hours

if (app.chunguschan.split(",") == "") {
	logger.log(
		"error",
		"Chungus channel is not configured! Chungus will not work without this setting."
	);
}
if (app.chungusrole == "") {
	logger.log(
		"error",
		"Chungus role is not configured! Chungus will not work without this setting."
	);
}

if (max_chungus_cd == "") {
	max_chungus_cd = 0;
	logger.log("info", "No max chungus cooldown set.");
}

exports.main = function(msg, args) {
	if (msg.webhookID == 586396045328777226) {
		webClaim(msg, args[0]);
		return;
	}

	logger.log("debug", `${args[0].toLowerCase()}`);
	switch (args[0].toLowerCase()) {
		case "stats":
			stats(msg, args);
			break;

		case "total":
			checkHeldTime(msg, args);
			break;

		case "top":
			top(msg, args);
			break;

		case "color":
			changeColor(msg, args);
			break;

		case "name":
			changeName(msg, args);
			break;

		case "cooldown":
		case "cd":
			checkCD(msg, args);
			break;

		case "value":
			checkValue(msg, args);
			break;

		case "!chungus":
			claim(msg, args);
			break;

		default:
			common.sendMsg(msg, `\`\`\`${exports.usage}\`\`\``);
			break;
	}
};

function setChungusSettings(userId, name, color) {
	db.get(
		`SELECT ChungusId, Name, Color
			FROM Chungus
			WHERE UserId = ${userId}`,
		function(err, row) {
			if (typeof row !== "undefined") {
				db.runSecure(
					"UPDATE Chungus SET Name = ?, Color = ? WHERE ChungusId = ?",
					[name || row.Name, color || row.Color, row.ChungusId]
				);
			} else {
				db.runSecure("INSERT INTO Chungus VALUES (null, ?, ?, ?, ?)", [
					userId,
					new Date() / 1000,
					color,
					name,
				]);
			}
		}
	);
}

function changeName(msg, args) {
	let role;
	let roles = msg.member.roles.array();
	let chungus = false;
	for (let i = 0; i < roles.length; i++) {
		if (roles[i].id == app.chungusrole) {
			role = roles[i];
			chungus = true;
		}
	}

	if (chungus) {
		let name = msg.content
			.toLowerCase()
			.replace(`${app.prefix}chungus name `, "");

		if (name == app.prefix + "chungus name") {
			common.sendMsg(msg, `No name detected! Not changing.`);
			return;
		}

		if (typeof name !== "undefined" && name !== "") {
			role.setName(name).then(updated =>
				common.sendMsg(msg, `Changed name to ${name}`)
			);
			// .catch(common.sendMsg(msg,`Failed to change chungus color. Make sure you have a valid color!`))
			db.userIdByMessage(msg, function(err, userId) {
				setChungusSettings(userId, name, null);
			});
		} else {
			common.sendMsg(msg, `Please enter a valid name.`);
		}
	} else {
		common.sendMsg(msg, `You aren't the chungus! You don't decide the name!`);
	}
}

function changeColor(msg, args) {
	let role;
	let roles = msg.member.roles.array();
	let chungus = false;

	for (let i = 0; i < roles.length; i++) {
		if (roles[i].id == app.chungusrole) {
			role = roles[i];
			chungus = true;
		}
	}

	if (chungus) {
		if (typeof args[1] !== "undefined") {
			role.setColor(args[1].toUpperCase()).then(updated =>
				common.sendMsg(msg, `Changed chungus color to ${args[1]}`)
			);
			// .catch(common.sendMsg(msg,`Failed to change chungus color. Make sure you have a valid color!`))
			db.userIdByMessage(msg, function(err, userId) {
				setChungusSettings(userId, null, args[1].toUpperCase());
			});
		} else {
			common.sendMsg(
				msg,
				`Please enter a valid hex code as the final argument.`
			);
		}
	} else {
		common.sendMsg(
			msg,
			`You aren't the chungus! You don't decide the color!`
		);
	}
}

function top(msg, args) {
	db.all(
		`SELECT u.DisplayName, SUM(c.Points) AS Points
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			INNER JOIN Server s ON s.ServerId = u.ServerId
			WHERE u.UserId > 0
			AND s.DiscordId = ${msg.guild.id}
			GROUP BY u.UserId
			ORDER BY Points DESC
			LIMIT 5`,
		function(err, rows) {
			var content = "Top chungus:\n";
			let i = 1;
			for (let row of rows) {
				content += `${i}. ${row.DisplayName}: **${row.Points}**\n`;
				i++;
			}

			common.sendMsg(msg, content);
		}
	);
}

function getRewardAmount(row) {
	if (typeof row === "undefined") {
		return 0;
	}
	let seconds = new Date() / 1000 - row.DateCreated;
	let minutes = Math.round(seconds / 60);
	let bonus = 0;
	if (minutes in BONUS_REWARDS) {
		bonus = BONUS_REWARDS[minutes];
	}
	return Math.round(Math.pow(minutes, 1.85) / 70) + bonus;
}

function claimLogic(msg, chungee_id, callback) {
	var seconds = new Date() / 1000;
	db.get(
		`SELECT c.DateCreated
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			INNER JOIN Server s ON s.ServerId = u.ServerId
			WHERE s.DiscordId = ${msg.guild.id}
			AND c.Points >= 0
			ORDER BY c.DateCreated DESC
			LIMIT 1`,
		function(err, row) {
			var minutes;
			if (typeof row === "undefined") {
				logger.log(
					"warn",
					"Chungus was not initialized correctly. Attempting to fix now..."
				);
				db.run(
					`INSERT INTO ChungusPoints VALUES (null, 0, 0, 0, 0, ${seconds})`
				);
				minutes = 0;
			} else {
				minutes = (seconds - row.DateCreated) / 60;
			}

			var chunguspoints = getRewardAmount(row);

			db.userIdByMessage(msg, function(err, userId) {
				// Math.round(Math.pow(chungustime,1.85)/70);
				db.get(
					`SELECT Points, DateCreated
					FROM ChungusPoints
					WHERE UserId = ${userId}
					ORDER BY DateCreated DESC`,
					function(err, row) {
						calculateCD(userId, function(current_cd_sec) {
							if (current_cd_sec == 0) {
								db.runSecure(
									`INSERT INTO ChungusPoints VALUES (?,?,?,?,?,?)`,
									{
										1: null,
										2: chunguspoints,
										3: minutes * 60,
										4: 0,
										5: userId,
										6: new Date() / 1000,
									},
									function(err, row) {
										getTotalPoints(userId, function(
											newpoints
										) {
											callback({
												no_cooldown: true,
												chungus_mins: minutes,
												gained_points: chunguspoints,
												total_points: newpoints,
											});
											checkLeader(msg);
										});
									}
								);
							} else {
								callback({
									no_cooldown: false,
									current_cd_sec: current_cd_sec,
									seconds_now: seconds,
									last_claim: row.DateCreated,
								});
							}
						});
					}
				);
			});
		}
	);
}

function checkValue(msg, args) {
	db.get(
		`SELECT c.DateCreated
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			INNER JOIN Server s ON s.ServerId = u.ServerId
			WHERE c.Points >= 0
			AND s.DiscordId = ${msg.guild.id}
			ORDER BY c.DateCreated DESC
			LIMIT 1`,
		function(err, row) {
			let seconds = new Date() / 1000 - row.DateCreated;
			let minutes = Math.round(seconds / 60);
			let points = getRewardAmount(row);
			common.sendMsg(
				msg,
				`Chungus has been brewing for **${minutes} minutes**, and is currently worth **${points} points**.`
			);
		}
	);
}

function claim(msg, args) {
	if (!app.chunguschan.split(",").includes(msg.channel.id)) {
		common.sendMsg(msg, `You may only chungus in the #botspam channel`);
		return;
	}

	// Cant claim chungus twice in a row
	// if(msg.author.id == lastcall){
	// 	common.sendMsg(msg,`You cant claim chungus twice in a row!`);
	// 	return;
	// }

	claimLogic(msg, msg.author.id, function(return_data) {
		if (return_data["no_cooldown"]) {
			let chungus_mins = Math.round(return_data["chungus_mins"]);
			let gained_points = return_data["gained_points"];
			let total_points = return_data["total_points"];
			let human_chungus_mins = moment
				.duration(chungus_mins, "minutes")
				.humanize();

			var CALLTEXT = [
				`Congrats! It's been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. You have successfully claimed **${gained_points}** chungus, your new total is **${total_points}** chungus.`,
				`Woo wee! It's been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. You've just adopted **${gained_points}** chungus, that makes you the proud owner of **${total_points}** chungus.`,
				`Hallelujah! It's been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. The lord has blessed you with **${gained_points}** additional chungus. Thank thine lord as you now hold **${total_points}** chungus.`,
				`You've been waiting for **${human_chungus_mins}** (${chungus_mins} minutes). I hope it was worth it, as you just gained **${gained_points}** chungus. Thats just the right amount to put you at **${total_points}** chungus.`,
				`You my friend, are going to the top! Its been **${human_chungus_mins}** (${chungus_mins} minutes). You racked up **${gained_points}** chungus. This brings you to the perfect chungus count of **${total_points}**.`,
			];
			if (chungus_mins in BONUS_REWARDS){
				let bonus = BONUS_REWARDS[chungus_mins];
				common.sendMsg(msg, `Holy H*ckers buddy! It's been **${chungus_mins}** minutes since the last person claimed chungus. Congratulations on your righteous claim! Normally, you would have gained a measly **${gained_points-bonus}** points, but for being so awesome, you get an extra **${bonus}** points--giving a new point gain of **${gained_points}**. This brings you to a new total of **${total_points}** chungus!`);
			} else {
				common.sendMsg(
					msg,
					`${CALLTEXT[Math.floor(Math.random() * CALLTEXT.length)]}`
				);

			}

		} else {
			let min_left = Math.round(return_data["current_cd_sec"] / 60);
			let timeleft = moment
				.duration(return_data["current_cd_sec"], "seconds")
				.humanize();
			common.sendMsg(
				msg,
				`Sorry my dude! You're still on cooldown. You must wait **${timeleft}** (${min_left} minutes) to chungus again.`
			);
		}
	});
}

function webClaim(msg, chungee_id) {
	claimLogic(msg, chungee_id, function(return_data) {
		if (return_data["no_cooldown"]) {
			let chungus_mins = return_data["chungus_mins"];
			let gained_points = return_data["gained_points"];
			let total_points = return_data["total_points"];
			let human_chungus_mins = moment
				.duration(chungus_mins, "minutes")
				.humanize();

			var CALLTEXT = [
				`<@${chungee_id}> has called chungus with their Chungus Button! Congrats! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. They have successfully claimed **${gained_points}** chungus, their new total is **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Woo wee! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. They've just adopted **${gained_points}** chungus, that makes them the proud owner of **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Hallelujah! Its been **${human_chungus_mins}** (${chungus_mins} minutes) since the last chungus call. The lord has blessed them with **${gained_points}** additional chungus. Thank thine lord as they now hold **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! They've been waiting for **${human_chungus_mins}** (${chungus_mins} minutes). I hope it was worth it, as they just gained **${gained_points}** chungus. Thats just the right amount to put them at **${total_points}** chungus.`,
				`<@${chungee_id}> has called chungus with their Chungus Button! Looks like they are going to the top! Its been **${human_chungus_mins}** (${chungus_mins} minutes). They racked up **${gained_points}** chungus. This brings them to the perfect chungus count of **${total_points}**.`,
			];

			common.sendChannel(
				app.chunguschan.split(",")[0],
				`${CALLTEXT[Math.floor(Math.random() * CALLTEXT.length)]}`
			);
			// common.sendMsg(msg,`Congrats! Its been **${chungustime}** minutes since the last chungus call. You have successfully claimed **${chunguspoints}** chungus, your new total is **${newpoints}** chungus.`,true)
		}
	});
}

function checkLeader(msg) {
	let seconds = new Date() / 1000;

	var roles;
	var topmember;
	var roleset = false;
	var old_chungus;
	var members = msg.guild.members.array();
	db.get(
		`SELECT u.DiscordId, SUM(c.Points) AS TotalPoints
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			INNER JOIN Server s ON s.ServerId = u.ServerId
			WHERE s.DiscordId = ${msg.guild.id}
			GROUP BY u.UserId
			ORDER BY TotalPoints DESC, DateCreated ASC`,
		function(err, row) {
			for (let i = 0; i < members.length; i++) {
				if (members[i].id == row.DiscordId) {
					topmember = members[i];
				}

				roles = members[i].roles.array();
				for (let x = 0; x < roles.length; x++) {
					if (roles[x].id == app.chungusrole) {
						if (members[i].id == row.DiscordId) {
							roleset = true;
						} else {
							old_chungus = members[i];
							members[i].removeRole(app.chungusrole);
						}
					}
				}
			}

			if (!roleset) {
				if (typeof topmember !== "undefined") {
					topmember.addRole(app.chungusrole).then(updated => {
						common.sendMsg(
							msg,
							`Congrats <@${topmember.id}>! You are the new chungus.\n<@${old_chungus.id}> has lost it.`
						);

						db.userIdByMessage(msg, function(err, userId) {
							db.run(`UPDATE ChungusPoints
									SET BecameChungus = 1
									WHERE ChungusPointsId IN (
										SELECT ChungusPointsId
										FROM ChungusPoints
										WHERE UserId = ${userId}
										ORDER BY ChungusPointsId DESC
										LIMIT 1
									)`);
							initChungus(topmember, old_chungus);
						});
					});
				}
			}
		}
	);

	// msg.member.addRole(app.chungusrole)
}

function initChungus(new_chungus, old_chungus) {
	let role;
	let roles = new_chungus.roles.array();

	for (let i = 0; i < roles.length; i++) {
		if (roles[i].id == app.chungusrole) {
			role = roles[i];
		}
	}

	db.userIdByDiscordId(new_chungus.guild.id, new_chungus.id, function(
		err,
		userId
	) {
		db.get(
			`SELECT Name, Color FROM Chungus WHERE UserId = ${userId}`,
			function(err, row) {
				if (
					typeof row !== "undefined" &&
					typeof row.Color !== "undefined"
				) {
					role.setColor(row.Color).then(updated => {
						if (typeof row.Name !== "undefined") {
							role.setName(row.Name);
						}
					});
				} else if (
					typeof row !== "undefined" &&
					typeof row.Name !== "undefined"
				) {
					role.setName(row.Name);
				}
			}
		);
	});
}

// Takes database row of user and returns remaining cooldown in seconds
function calculateCD(userId, callback) {
	db.get(
		`SELECT lastClaim.DateCreated, SUM(Points) AS Points
			FROM ChungusPoints
			CROSS JOIN (
				SELECT MAX(DateCreated) AS DateCreated
				FROM ChungusPoints
				WHERE UserId = ${userId}
				AND Points > 0
				) lastClaim
			WHERE UserId = ${userId}`,
		function(err, row) {
			if (
				typeof row === "undefined" ||
				row.Points == "0" ||
				isNaN(row.Points) ||
				isNaN(row.DateCreated)
			) {
				callback(0);
				return;
			}

			let points = row.Points;
			let last_claim = row.DateCreated;
			let now_seconds = new Date() / 1000;
			let total_cd,
				elapsed_seconds,
				current_cd,
				top_points,
				max_cd_threshold;

			elapsed_seconds = now_seconds - row.DateCreated;

			if (max_chungus_cd !== 0) {
				db.get(
					`SELECT SUM(c.Points) AS TotalPoints
							FROM ChungusPoints c
							INNER JOIN User u ON u.UserId = c.UserId
							INNER JOIN Server s ON s.ServerId = u.ServerId
							WHERE s.DiscordId = (SELECT Server.DiscordId FROM Server INNER JOIN User ON User.ServerId = Server.ServerId AND User.UserId = ${userId})
							GROUP BY u.UserId
							ORDER BY TotalPoints DESC
							LIMIT 1`,
					function(err, row) {
						top_points = row.TotalPoints;
						max_cd_threshold = top_points * max_cd_factor;

						// Total cooldown is a factor of how many points you have relative to the top chungus player.
						total_cd = max_chungus_cd * (points / max_cd_threshold);

						if (total_cd > max_chungus_cd)
							total_cd = max_chungus_cd;

						if (total_cd <= elapsed_seconds) {
							current_cd = 0;
						} else {
							current_cd = total_cd - elapsed_seconds;
						}

						callback(current_cd);
					}
				);
			} else {
				total_cd = points * 15;

				if (total_cd <= elapsed_seconds) {
					current_cd = 0;
				} else {
					current_cd = total_cd - elapsed_seconds;
				}

				callback(current_cd);
			}
		}
	);
}

function checkCD(msg, args) {
	let chungus_user = msg.author;
	if (typeof args[1] !== "undefined") {
		chungus_user = common.findUser(args[1]);
	}
	if (chungus_user == "") {
		common.sendMsg(msg, `Did not find a user with that name! Try again.`);
		return;
	}
	db.userIdByDiscordId(msg.guild.id, chungus_user.id, function(err, userId) {
		calculateCD(userId, function(current_cd_sec) {
			if (current_cd_sec > 0) {
				let current_cd_min = current_cd_sec / 60;
				let niceformat = current_cd_sec * 1000 + new Date() * 1;

				if (chungus_user.id == msg.author.id) {
					common.sendMsg(
						msg,
						`You will be able to chungus again **${moment(
							niceformat
						).fromNow()}** (${Math.round(current_cd_min)} minutes).`
					);
				} else {
					common.sendMsg(
						msg,
						`${
							chungus_user.displayName
						} will be able to chungus again **${moment(
							niceformat
						).fromNow()}** (${Math.round(current_cd_min)} minutes).`
					);
				}
				// common.sendMsg(msg,`You have **${cooldown.toFixed(2)}** minutes left on your cooldown.`);
			} else {
				if (chungus_user.id == msg.author.id) {
					common.sendMsg(
						msg,
						`You have no cooldown! Happy chungusing!`
					);
				} else {
					common.sendMsg(
						msg,
						`${chungus_user.displayName} has no cooldown!`
					);
				}
			}
		});
	});
}

function secondsAsChungus(userId, callback) {
	db.all(
		`SELECT u.UserId, c.DateCreated
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			WHERE u.ServerId = (SELECT ServerId FROM User WHERE UserId = ${userId})
			ORDER BY DateCreated ASC`,
		function(err, rows) {
			let seconds_as_chungus = 0;
			let periodStart = 0;
			for (let row of rows) {
				if (row.UserId == userId && periodStart == 0) {
					periodStart = row.DateCreated;
				} else if (row.UserId != userId && periodStart > 0) {
					seconds_as_chungus += row.DateCreated - periodStart;
					periodStart = 0;
				}
			}
			if (periodStart > 0) {
				seconds_as_chungus += new Date() / 1000 - periodStart;
			}

			callback(seconds_as_chungus);
		}
	);
}

function getTotalPoints(userId, callback) {
	db.get(
		`SELECT SUM(Points) AS TotalPoints
			FROM ChungusPoints
			WHERE UserId = ${userId}`,
		function(err, row) {
			if (typeof row === "undefined") {
				callback(0);
			} else {
				callback(row.TotalPoints);
			}
		}
	);
}

function checkHeldTime(msg, args) {
	let chungus_user = msg.author;
	if (typeof args[1] !== "undefined") {
		chungus_user = common.findUser(args[1]);
	}
	if (chungus_user == "") {
		common.sendMsg(msg, `Did not find a user with that name! Try again.`);
		return;
	}

	db.userIdByDiscordId(msg.guild.id, chungus_user.id, function(err, userId) {
		secondsAsChungus(userId, function(seconds_as_chungus) {
			let moment_time = moment
				.duration(seconds_as_chungus, "seconds")
				.humanize();

			if (chungus_user.id == msg.author.id) {
				common.sendMsg(
					msg,
					`You have held chungus for a total of **${moment_time}**! (${Math.round(
						seconds_as_chungus / 60
					)} minutes)`
				);
			} else {
				common.sendMsg(
					msg,
					`${
						chungus_user.displayName
					} has held chungus for a total of **${moment_time}**! (${Math.round(
						seconds_as_chungus / 60
					)} minutes)`
				);
			}
		});
	});
}

function longestChungusHeld(userId, callback) {
	db.all(
		`SELECT u.UserId, c.DateCreated, c.BecameChungus
			FROM ChungusPoints c
			INNER JOIN User u ON u.UserId = c.UserId
			WHERE u.ServerId = (SELECT ServerId FROM User WHERE UserId = ${userId})
			ORDER BY DateCreated ASC`,
		function(err, rows) {
			let longestChungus = 0;
			let periodStart = 0;
			for (let row of rows) {
				if (
					row.UserId == userId &&
					periodStart == 0 &&
					row.BecameChungus == 1
				) {
					periodStart = row.DateCreated;
				} else if (
					row.UserId != userId &&
					periodStart > 0 &&
					row.BecameChungus == 1
				) {
					let periodLength = row.DateCreated - periodStart;
					if (periodLength > longestChungus) {
						longestChungus = periodLength;
					}
					periodStart = 0;
				}
			}

			if (periodStart > 0) {
				let periodLength = new Date() / 1000 - periodStart;
				if (periodLength > longestChungus) {
					longestChungus = periodLength;
				}
			}

			callback(longestChungus);
		}
	);
}

function stats(msg, args) {
	let chungus_user = msg.author;
	if (typeof args[1] !== "undefined") {
		chungus_user = common.findUser(args[1]);
	}
	if (chungus_user == "") {
		common.sendMsg(msg, `Did not find a user with that name! Try again.`);
		return;
	}

	db.userIdByDiscordId(msg.guild.id, chungus_user.id, function(err, userId) {
		getTotalPoints(userId, function(points) {
			longestChungusHeld(userId, function(longestchung) {
				secondsAsChungus(userId, function(totalchung) {
					var embed = new Discord.RichEmbed({
						thumbnail: {
							url: chungus_user.avatarURL,
						},
						fields: [
							{
								name: "**Current Points**",
								value: `**${points}**`,
							},
							{
								name: "**Total duration**",
								value: `**${moment
									.duration(totalchung, "seconds")
									.humanize()}** (${Math.round(
									totalchung / 60
								)} minutes)`,
								inline: true,
							},
							{
								name: "**Longest streak**",
								value: `**${moment
									.duration(longestchung, "seconds")
									.humanize()}** (${Math.round(
									longestchung / 60
								)} minutes)`,
								inline: true,
							},
						],
					});
					// TODO: Re-implement embed showing color
					// embed.setColor(data['chungus_color']);

					common.sendMsg(msg, { embed: embed });
				});
			});
		});
	});
}

// Decay
schedule.scheduleJob("0 */6 * * *", function(fireDate) {
	logger.log("debug", `Processing chungus decay...`);
	db.all(
		`SELECT UserId, SUM(Points) AS TotalPoints
			FROM ChungusPoints
			WHERE UserId > 0
			GROUP BY UserId
			HAVING TotalPoints > 0`,
		function(err, rows) {
			for (let row of rows) {
				db.runSecure(
					`INSERT INTO ChungusPoints VALUES (null, ?, ?, ?, ?, ?)`,
					{
						1: Math.ceil(row.TotalPoints * DECAYPERCENT) * -1,
						2: 0,
						3: 0,
						4: row.UserId,
						5: new Date() / 1000,
					}
				);
			}
		}
	);
});

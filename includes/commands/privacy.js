"use strict";
const common = require("../common.js");
const app = require("../../app.js");
const logger = require("../logger.js");
const fs = require("fs");

exports.description = "Toggles privacy mode";
exports.usage = `Use "${app.prefix}privacy" to toggle privacy mode.`;

const flagPath = "data/PrivacyModeEnabled";

// Global var so we dont have to check the FS every message
var privacyMode = null;

// Main function triggers whenever the !privacy command is called. The command name is determined by file name
exports.main = function (msg, args) {
	if (!msg.member.permissions.has("MANAGE_GUILD")) {
		common.sendMsg(
			msg,
			"Missing required permissions to toggle privacy mode T_T"
		);
		return;
	}

	togglePrivacy()
		.then((privacyState) => {
			logger.log(
				"info",
				`${msg.author.username} toggled privacy mode ${
					privacyState ? "ON" : "OFF"
				}!`
			);

			common.sendMsg(
				msg,
				`Toggled privacy mode ${privacyState ? "ON" : "OFF"}!`
			);
		})
		.catch((err) => {
			logger.log(
				"error",
				`Error encountered while toggling privacy mode! Error: ${err}`
			);

			common.sendMsg(
				msg,
				`Error occurred! Please try again, and if the error persists contact an admin.`
			);
		});
};

// This is called everytime a message is sent in a place the bot can read
exports.msg = function (msg) {
	privacyModeEnabled().then((enabled) => {
		// If privacyMode is disabled, or sending user is bot, just return
		if (!enabled || msg.author.bot) {
			return;
		}

		common.sendMsg(msg, msg.content);
		msg.delete();
	});
};

// This just returns the `privacyMode` global var, unless its unset
// Then it checks the filesystem for the current value
function privacyModeEnabled() {
	return new Promise((resolve, reject) => {
		if (privacyMode !== null) {
			resolve(privacyMode);
		}

		checkFileExistence().then((exist) => {
			privacyMode = exist;
			resolve(exist);
		});
	});
}

// Toggles the `privacyMode` setting
// It writes or removes the file on the hard disk to persist between restarts
function togglePrivacy() {
	return new Promise((resolve, reject) => {
		checkFileExistence().then((exists) => {
			if (exists) {
				fs.unlink(flagPath, (err) => {
					if (!err) {
						privacyMode = false;
						resolve(privacyMode);
					} else {
						reject(err);
					}
				});
			} else {
				fs.writeFile(
					flagPath,
					"This file's existence determines whether privacy mode is enabled or not",
					(err) => {
						if (!err) {
							privacyMode = true;
							resolve(privacyMode);
						} else {
							reject(err);
						}
					}
				);
			}
		});
	});
}

// Checks if the file exists, and therefore privacy mode enabled
function checkFileExistence() {
	// Using the existence of a file is definitely not the greatest way to do this lol
	// But its for an april fools gag and wont be in service long, so should be fine
	return new Promise((resolve, reject) => {
		fs.access(flagPath, fs.constants.F_OK, (err) => {
			resolve(!err);
		});
	});
}

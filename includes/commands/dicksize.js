const seedrandom = require('seedrandom');
const app = require('../../app.js');

exports.description = "How big stick?";

exports.usage = `Use "${app.prefix}dicksize to get your dick size.`;

exports.main = function(msg,args){
	let time = Math.floor(new Date().getTime() / 1000 / 60 / 60 / 24);
	let seedString = `${msg.author.id}${time}`;
	let seededRandom = seedrandom(seedString)();

	let dickIndex = [
		3,
		4,
		5,
		6,
		7,
		8,
		9, 9,
		10, 10, 10, 10, 10, 10, 10,
		11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
		12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 
		13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 
		14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 
		15, 15, 15, 15, 15, 15, 15, 15, 15,
		16, 16, 16,
		17,
		18,
		19,
		20,
		21,
		22,
		23,
		24,
		25,
		26,
		27,
		28,
		29,
		30
	];

	let inchLength = dickIndex[Math.floor(seededRandom * dickIndex.length)] * 0.3937008;

	msg.reply(`your dick is **${inchLength}** inches!`);
}
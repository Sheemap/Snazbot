var imgur = require('imgur');
const sqlite3 = require('sqlite3').verbose();

db = new sqlite3.Database('./data/data.db');


 



// imgur.createAlbum()
//     .then(function(json) {
//         console.log(json);
//     })
//     .catch(function (err) {
//         console.error(err.message);
//     });

//{ data: { id: 'eO8km', deletehash: 'IQOHJQyrw8jzJNI' },
//  success: true,
//  status: 200 }


// TEST ALBUM DEL: FrkJIdh5zI59o5U ID: pw6hc

var memes = [];
var newurl = '';
var url ='';

db.all('SELECT * FROM memes',function(err,rows){

	for(i in rows){
		url = rows[i].url;
		if(url.includes('discordapp.com') || url.includes('imgur.com')){
			memes.push(rows[i].url)
		}
	}

	for(let w=0;w<memes.length;w++){
		imgur.uploadUrl(memes[w],'FrkJIdh5zI59o5U')
			.then(function (json) {
		        newurl = json.data.link;

		        db.run(`UPDATE memes SET url="${newurl}" WHERE url="${memes[w]}"`)
		    })
		    .catch(function (err) {
		        console.error(err.message);
		    });
	}

})
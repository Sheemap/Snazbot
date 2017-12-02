const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const request = require('request');

const logger = require('../logger.js');
const app = require('../../app.js');

exports.description = "Gets a direct link to any v.reddit video";

exports.usage = `Use "${app.prefix}direct <link>" with any v.reddit link. I will return the direct link.`;

exports.main = function(msg){
	var redir;
	var found = false;
	let link = msg.content.split(' ');
	for(i in link){
		if(link[i].includes('v.redd.it/')){
			link = link[i];
		}
	}
	logger.log('info','Getting direct video for '+link)

	if(link.includes('http')){
		if(link.includes('https')){
			//contains https
			https.get(link, function (response) {
				response.on('data', function (chunk) {
					if(!found && typeof(response.responseUrl) != 'undefined'){
				    	redir = response.responseUrl
				    	found = true;
				    	callback(redir)
					}
				});

				
			}).on('error', function (err) {
			    logger.log('error',err);
			});

			
		}else{
			//contains http
			http.get(link, function (response) {
				response.on('data', function (chunk) {
					if(!found && typeof(response.responseUrl) != 'undefined'){
				    	redir = response.responseUrl
				    	found = true;
				    	callback(redir)
					}
				});

				
			}).on('error', function (err) {
			    logger.log('error',err);
			});
		}
	}else{
		//contains none
		link = "https://"+link;
		https.get(link, function (response) {
			response.on('data', function (chunk) {
				if(!found && typeof(response.responseUrl) != 'undefined'){
			    	redir = response.responseUrl
			    	found = true;
			    	callback(redir)
				}
			});

			
		}).on('error', function (err) {
		    logger.log('error',err);
		});
	}

	function callback(redir){

		redir += '.json'
		// redir = 'https://www.reddit.com/r/redditdev/.json?count=25&after=t3_10omtd/'
		request({
		    url: redir,
		    headers: {'User-agent': 'v.reddit direct link bot'},
		    json: false
		}, function (error, response, body) {

		    if (!error && response.statusCode === 200) {
		        // console.log(body) // Print the json response
		        let sev = body.split(' ');
		        let fallback = sev[sev.indexOf('{"fallback_url":')+1].slice(1).replace('",','');
		      	logger.log('info','Direct link grabbed. '+fallback)
		        msg.channel.send("Heres your direct link!\n"+ fallback)
		    }
		})

	}
}
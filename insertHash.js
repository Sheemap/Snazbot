var fs = require('fs');

var lines = fs.readFileSync('./tmp/hashes').toString().split('\n')


for(line in lines){
	console.log(lines[line])
}
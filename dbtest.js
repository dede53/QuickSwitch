var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('def.db');
var async = require("async");

// function bla(callback){
	var query = "SELECT time,temp FROM sensor_values;";
	var devices = new Array;
	db.all(query, function(err, row){
		if(err){
			console.log(err);
		}else{
			console.log(row);
			var bla = new Array;
			row.forEach(function(data){
				//console.log(data);
				//console.log(data.time + ":" + data.temp);
				// var uff = new Array;
				var time = data.time;
				var temp = data.temp;
				//console.log(data.time);
				var asd = new Array;
				asd.push(data.time * 1000);
				asd.push(parseFloat(data.temp));
				// var uff = [];
				// uff.push(asd);
                // uff[time] = temp;
				bla.push(asd);
			});
			console.log(bla);
		}
	});




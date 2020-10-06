process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const app = require('express')();
const request = require('request');
const bodyParser = require('body-parser');
const async = require('async');

const PORT = 3004;

//mysql setting
//const mysql = require('mysql');
//we uses async mysql
const mysql = require('mysql2');
var db; (async () => { const db__ = await mysql.createPool({ host	: process.env['DBHOST'], user	: process.env['DBID'], password: process.env['DBPW'], database: 'softapp' }); db = db__.promise(); })(); 

//express setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next){
	res.setHeader("content-Type", "application/json");
	next();
});

//async wrapper setting. It enables async routers
const wrapper = asyncFn => {
	return (async (req, res, next) => {
		try {
			return await asyncFn(req, res, next);
		} catch (error) {
			return SEND(req, res, 400, error, false);
		}
	});
};

const SEND = async (req, res, status, body, issuccess)=>{
	try{
		console.log();
		console.log(`from ${req.headers['x-real-ip']} GET`);
		console.log(req.params);
		console.log();
	} catch(err){
		console.log('A Fatal Error Occured : '+err);
	} finally{
		return res.status(status).send(body);
	}
};

app.get('/get_bike_station_counts', wrapper( async (req, res, next) =>{
	var [row, fields] = await db.execute("SELECT count(*) from bike_station_info");
	return SEND(req, res, 200, row ,true);
}));

app.get('/get_bike_station_info', wrapper( async (req, res, next) =>{
	var [row, fields] = await db.execute("SELECT * from bike_station_info");
	return SEND(req, res, 200, row ,true);
}));

app.get('/get_bike/:single', wrapper( async (req, res, next) =>{
	var single = parseInt(req.params.single);
	if(single<0)
		single = Math.round(Date.now()/1000) + single + 1;
	var [row, fields] = await db.execute("SELECT * from bike_log WHERE timestamp>=? limit 1", [single]);
	if(row.length == 0)
		var [row, fields] = await db.execute("SELECT * from bike_log WHERE timestamp<? order by timestamp desc limit 1", [single]);
	return SEND(req, res, 200, row ,true);
}));

app.get('/get_bikes/:from/:to', wrapper( async (req, res, next) =>{
	var from = parseInt(req.params.from);
	var to = parseInt(req.params.to);
	if(from<0)
		from = Math.round(Date.now()/1000) + from + 1;
	if(to<0)
		to = Math.round(Date.now()/1000) + to + 1;

	var [row, fields] = await db.execute("SELECT * from bike_log WHERE timestamp>? and timestamp<?", [from-1, to+1]);
	return SEND(req, res, 200, row ,true);
}));

app.listen(PORT, () => {
	console.log(`port ${PORT} open!\n`);
});

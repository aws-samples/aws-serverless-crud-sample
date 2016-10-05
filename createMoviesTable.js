/**
 * confirmOrCreateTable - This async function runs at initialization of the lambda
 * function and ensures that the table exists.
 * 
 * 
 * 
 */


//Module dependencies.
var async = require('async');
var AWS = require('aws-sdk');
var fs = require('fs');

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

AWS.config.update({
	region : config.region,
	endpoint : config.endpoint,
	accessKeyId : config.accessKeyId,
	secretAccessKey : config.secretAccessKey
});
//create a client object for dynamoDB
var dynamodb = new AWS.DynamoDB();

var docClient = new AWS.DynamoDB.DocumentClient();


async.series([ function createMoviesTable(callback) {
	// console.log('createTable');
	var params = {
			// TableName : "Movies",
			TableName : config.tableName,
			KeySchema : [ {
				AttributeName : "year",
				KeyType : "HASH"
			}, // Partition key
			{
				AttributeName : "title",
				KeyType : "RANGE"
			} // Sort key
			],
			AttributeDefinitions : [ {
				AttributeName : "year",
				AttributeType : "N"
			}, {
				AttributeName : "title",
				AttributeType : "S"
			} ],
			ProvisionedThroughput : {
				ReadCapacityUnits : 100,
				WriteCapacityUnits : 100
			}
	};

	console.log('Checking if table exists: ' + config.tableName + ' in '
			+ AWS.config.region);
	dynamodb.createTable(params, callback);
} ], function(err, results) {
	if (err) {
		if (err.message.indexOf('Table already exists') != -1) {
			// console.log('table found!');
			console.log(err.message);
			// console.log(err.message);
		} else {
			// console.log(err);
			throw err;
		}
	} else {
		console.log('Database initialization complete.');
	}
});
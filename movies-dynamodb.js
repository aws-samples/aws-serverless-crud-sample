/**
 * movies-dynamodb - this program shows how to use the AWS API Gateway to make
 * simple calls to AWS DynamoDB using AWS lambda. This lambda function provides
 * several resposes, based on the incoming api call. We check if a given table
 * exists, creating it if not, and then show how to create, remove, update and
 * delete an item. We also show how to prform basic queries and scans on the DB.
 * 
 * 
 * Author:
 * 
 * @danaus
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

var responseData = null;


//these are test records of the input from the api gateway
var testItem1 = '{ "title": "Godzilla vs. Dynamo", "year": "2016", "info": "New from AWS Films, starring Andy Jassy."}';

var testItem2 = '{"title": "Love and Friendship", "year": "2016", "info": "Amazon Studios presents a romantic Jane Austen novella starring Kate Beckinsale."}';

var testContext = '{ \
	"callbackWaitsForEmptyEventLoop": false, \
	"logGroupName": "/aws/lambda/parseArgs", \
	"logStreamName": "2016/07/16/[$LATEST]58a5cfd3923a44b883db61447b36bce3", \
	"functionName": "parseArgs", \
	"memoryLimitInMB": "128", \
	"functionVersion": "$LATEST",  \
	"invokeid": "15dfd08c-4b8d-11e6-b08a-f39bcf123bca", \
	"awsRequestId": "15dfd08c-4b8d-11e6-b08a-f39bcf123bca", \
	"invokedFunctionArn": "arn:aws:lambda:us-west-2:302097553606:function:parseArgs" \
	}';

var testAddItem11Event = '{ \
	"method": "POST", \
	"body" : { "title": "Godzilla vs. Dynamo", "year": "2016", "info": "New from AWS Films, starring Andy Jassy."}, \
	"headers": { \
	}, \
	"queryParams": { \
	}, \
	"pathParams": { \
	},  \
	"resourcePath": "/add-movie" \
	}';

var testAddItem2Event = '{ \
	"method": "POST", \
	"body" : {"title": "Love and Friendship", "year": "2016", "info": "Amazon Studios presents a romantic Jane Austen novella starring Kate Beckinsale."}, \
	"headers": { \
	}, \
	"queryParams": { \
	}, \
	"pathParams": { \
	},  \
	"resourcePath": "/add-movie" \
	}';

var testListItemsEvent = '{ \
	"method": "GET", \
	"body" : {}, \
	"headers": { \
	}, \
	"queryParams": { \
	}, \
	"pathParams": { \
	},  \
	"resourcePath": "/movies" \
	}';

/**
 * The main handler for the lambda function. invoked by the API gateway. Depends
 * on the API gateway using the associated velocity template in resources/API.
 * 
 */
function handler(event, context, callback) {

	// console.log(event);
	if(typeof event === 'string')
		event = JSON.parse(event);

	//logInput(event);

	// strip any leading slashes including the /movies/
	//if (event.resourcePath.charAt(0) == "/")
	var marker = event.resourcePath.lastIndexOf("/");
	
	var resource = event.resourcePath.substr(marker+1);

	// switch for handling paths
	switch (resource) {

	case 'add-movie':
		addMovie(event.body, config.tableName);
		break;
	case 'movies':
		listItems(config.tableName);
		break;
	case 'removeItem':
		removeItem(event.body.title, config.tableName);
		break;
	case 'rateMovie':
		rateMovie(event.body.title, event.body.rating, config.tableName);
		break;
	case 'findByTitle':
		findByTitle(event.query, config.tablename);
		break;
	case 'findByYear':
		findByYear(event.query, config.tableName);
		break;
	case 'findByRating':
		findByRating(rating, tableName);
		break;
	default:
		notyet();
	}
	
	console.log('responseData: ' +JSON.stringify(responseData));
	callback(null, responseData);
	//context.succeed(responseData);
};

exports.handler = handler;

/**
 * logInput - logs the lambda input data to the console for debugging
 * 
 * @param event
 */
function logInput(event) {
	// logging
	console.log('Logging input.');
	console.log('Body:', event.body);
	console.log('Headers:', event.headers);
	console.log('Method:', event.method);
	console.log('Params:', event.params);
	console.log('Query:', event.query);
	console.log('resourcePath: ', event.resourcePath)

	// context.succeed(event);
}

/**
 * init - should only be called for test purposes. Allows async testing
 * 
 */

function init() {

	//event = testAddItem11Event;

	//event = testAddItem2Event;

	//event = testListItemsEvent;

	//context = testContext;

	//exports.handler(event, context, ddbCallback);
}

/**
 * listItems - lists all items in the DB with year > 1950
 * 
 * @param tableName
 */
function listItems(tableName) {
	// console.log('listItems');

	var params = {
			TableName : tableName,
			ProjectionExpression : "#yr, title, info.rating",
			FilterExpression : "#yr between :start_yr and :end_yr",
			ExpressionAttributeNames : {
				"#yr" : "year",
			},
			ExpressionAttributeValues : {
				":start_yr" : 1950,
				":end_yr" : 2999
			}
	};
	
	docClient.scan(params, function(err, data) {
		if (err) {
			errStr = '{"response": "Unable to query. Error: "+JSON.stringify(err, null, 2)}';
			console.error(errStr);
			ddbCallback(errStr);
		} else {
			console.log("Query succeeded.");
			ddbCallback(data);
		}
	});
};

/**
 * add_movie method - adds an item to the table
 * 
 */
function addMovie(item, tableName) {
	// console.log('add_movie');

	var movie = item;

	// console.log('title: ' + movie.title);

	var params = {
			TableName : tableName,
			Item : {
				"year" : parseInt(movie.year),
				"title" : movie.title,
				"info" : movie.info
			}
	
	}

	// write the item to the table
	docClient
	.put(
			params,
			function(err, data) {
				if (err) {
					var errStr = '{"response": "Unable to add. Error: "+JSON.stringify(err, null, 2)}';
					console.error(errStr);
					ddbCallback(errStr);
					
				} else {
					var params = {
							TableName : tableName,
							ProjectionExpression : "#yr, title, info.rating",
							FilterExpression : "#yr between :start_yr and :end_yr",
							ExpressionAttributeNames : {
								"#yr" : "year",
							},
							ExpressionAttributeValues : {
								":start_yr" : 1950,
								":end_yr" : 2999
							}
					}

					// confirm addition of the item
					docClient
					.scan(
							params,
							function(err, data, context) {
								if (err) {
									var errStr = '{ "response": "Unable to query. Error: "+JSON.stringify(err, null, 2)}';
									console.error(errStr);
									ddbCallback(errStr)
								} else {
									console
									.log("Query succeeded.");
									ddbCallback(data);
								}
							}
						);
				}
			});
}

function ddbCallback(data){
	console.log('ddbCallback: ' +JSON.stringify(data));
	// call the real call back fr the lambda function here
	//callback(JSON.stringify(data),null);
	responseData = data;
}

/**
 * removeItem - removes and item with this title from the db
 * 
 * @title
 * @tableName
 */
function removeItem(title, tableName) {
	// console.log('removeItem');
	return notYet();
}

/**
 * countItems - counts the number of items in a dynamoDB table
 * 
 * @param tableName
 */
function countItems(tableName) {
	// console.log('countItems');
	return notYet();
}

/**
 * rateMovie - updates the movie's rating using (sum of current ratings+new
 * rating)/(count+1)
 * 
 * @param title
 * @param rating
 * @param tableName
 */

function rateMovie(title, rating, tableName) {
	return notYet();
}

/**
 * findByTitle - queries the DB for the movies with titles containing the
 * titleStr
 * 
 * @param titleStr
 * @param tablename
 */
function findByTitle(titleStr, tablename) {
	return notYet();
}

/**
 * findByYear - scans the DB for movies with value of year
 * 
 * @param year
 * @param tableName
 */
function findByYear(year, tableName) {
	return notYet();
}

/**
 * findByRating - find all movies with rating
 * 
 * @param rating
 * @param tableName
 */
function findByRating(rating, tableName) {
	return notYet();
}

function notYet() {
	var errStr = '{"response": "Function not yet implemented"}';
	console.log(errStr);
	return errStr;
}

/**
 * testLambda - test function to exercise all of the functions
 * 
 */
function testLambda() {
	return notYet();
}

/**
 * createTable - This async function runs at initialization of the lambda
 * function and ensures that the table exists.
 * 
 * 
 * 
 */

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
			init();
			// console.log(err.message);
		} else {
			// console.log(err);
			throw err;
		}
	} else {
		console.log('Database initialization complete.');
		init();
	}
});

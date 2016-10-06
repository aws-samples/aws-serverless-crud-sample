README for movies-dynamodb

This project shows how to use a single lambda function (written in nodejs)
to respond to multiple API gateway calls to manipulate data in DynamoDB. We show how
to send the data from the API gateway to a lambda function, which checks to 
see which API call was invoked by the user. It then performs the intended action using CRUD methods in DynamoDB. 

				Mobile Backend for Lambda.

Pre-requisite:
•	Create a IAM role called “Lambda-role” and assign it AWSLambdaFullAccess and AmazonDynamoDBFullAccess
•	Create a user and assign it AWSLambdaFullAccess and AmazonDynamoDBFullAccess policies.

Detailed Steps.
1.	Download code.



2.	Edit app_config.json to include your access key and secret , change region and dynamodb endpoint

create a table in DynamoDB. Follow the instructions here:
http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.01.html
(run the file createMoviesTable.js
 OR
 use the cli with this input:
 aaws dynamodb create-table 
 --cli-input-json file://movies-table.json 
 --region us-west-2 
 --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
 
 The file movies-table.json is in the code archive.
 
 The table must be created before completing the rest of the tutorial.
 
 If using cli, then the user must be the one with the role for ddb & lambda.
 

3.	Zip the file.
4.	Create a new lambda function 
a.	Select NodeJs4.3 as platform 
b.	Input a name for your function
c.	Upload zip for code entry type.
d.	Change Handler to – movies-dynamodb.handler
e.	For role – Choose existing role
f.	Existing role – select the role “Lambda-role”created in Pre-req step (1)
g.	Review and Create Function

h.	Test function by clicking “test” button and input the following as body


{
  "method": "POST",
  "body" : { "title": "Godzilla vs. Dynamo", "year": "2016", "info": "New from AWS Films, starring Andy Jassy."},
  "headers": {
      },
  "queryParams": {
      },
  "pathParams": {
      }, 
  "resourcePath": "/add-movie"
}

5.	Create endpoints on API gateway
a.	Add resources - /movies 
b.	Create method – Get 
i.	setContent Type – application/json
ii.	copy the requestTeamplate.vel file and paste into generate template section
iii.	Test
c.	Add resource /add-movie
d.	Create method – POST 
i.	setContent Type – application/json
ii.	copy the requestTeamplate.vel file and paste into generate template section
e.	Test

6.	You can see logs on Test page of your lambda function.



#! /bin/sh

TABLENAME=MOVIES

aws dynamodb create-table --cli-input-json file://movies-ddb.json --region us-west-2 --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

aws dynamodb wait table-exists --table-name $TABLENAME
echo "table created"

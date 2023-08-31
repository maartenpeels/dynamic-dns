#!/bin/bash

API_KEY="API_KEY"
API_ENDPOINT="API_ENDPOINT"

public_ip="$(dig +short myip.opendns.com @resolver1.opendns.com)"
echo "Public IP: $public_ip"

curl -X POST -d "{\"apiKey\":\"$API_KEY\",\"ip\":\"$public_ip\"}" $API_ENDPOINT

# Dynamic DNS

## Deploy
```bash
cdk deploy --parameters hostedzoneparamddns=#### --parameters hostedzonenameparamddns=#### --parameters subdomainparamddns=####
``````

- **hostedzoneparamddns**: Hosted Zone ID
- **hostedzonenameparamddns**: Hosted Zone Name
- **subdomainparamddns**: Subdomain to create & update

## Find Api Key
```bash
aws secretsmanager get-secret-value --secret-id ddns-api-key
```

## Setup client
1. Move both files in the `client` directory to the server where you want to run the client.
2. Set the `API_KEY` and `API_URL`(add `/update` to the url from the stack output) variables in the `ddns.sh` script.
3. Run the `install.sh` script to install the client. 
4. The client will run every hour and will update the DNS record.

import {Handler} from 'aws-lambda';
import {Route53, SecretsManager} from 'aws-sdk';

export const handler: Handler = async (event: { body: string }) => {
  const HOSTED_ZONE_ID = process.env.HOSTED_ZONE_ID!;
  const REGION = process.env.REGION!;
  const SUBDOMAIN = process.env.SUBDOMAIN!;

  const secretsClient = new SecretsManager({region: REGION});
  const getSecret = (secretId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      secretsClient.getSecretValue({SecretId: secretId}, (err, data) => {
        if (err) {
          return reject("Couldn't get secret");
        }

        resolve(data.SecretString || '');
      });
    });
  }
  const API_KEY = await getSecret('ddns-api-key');

  const body = JSON.parse(event.body);

  if (body.apiKey !== API_KEY) {
    return {
      statusCode: 403,
      body: JSON.stringify({message: 'Unauthorized'}),
    };
  }

  if (!body.ip) {
    return {
      statusCode: 400,
      body: JSON.stringify({message: 'Missing IP'}),
    };
  }

  const route53 = new Route53({region: REGION});
  const changeResourceRecordSets = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      route53.changeResourceRecordSets(
        {
          HostedZoneId: HOSTED_ZONE_ID,
          ChangeBatch: {
            Changes: [
              {
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: SUBDOMAIN,
                  Type: 'A',
                  TTL: 300,
                  ResourceRecords: [
                    {
                      Value: body.ip,
                    },
                  ],
                },
              },
            ],
          },
        }, (err, data) => {
          if (err) {
            return reject();
          }

          resolve();
        });
    });
  };
  await changeResourceRecordSets();

  return {
    statusCode: 200,
    body: JSON.stringify({message: 'OK'}),
  };
};

import * as cdk from 'aws-cdk-lib';
import {aws_apigateway, aws_iam, aws_lambda, aws_route53, aws_secretsmanager, CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

export class DynamicDnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZoneId = new cdk.CfnParameter(this, 'hosted-zone-param-ddns', {
      type: 'String',
      description: 'Hosted Zone ID',
    });

    const hostedZoneName = new cdk.CfnParameter(this, 'hosted-zone-name-param-ddns', {
      type: 'String',
      description: 'Hosted Zone Name',
    });

    const subdomain = new cdk.CfnParameter(this, 'subdomain-param-ddns', {
      type: 'String',
      description: 'Subdomain',
    });

    const apiKey = new aws_secretsmanager.Secret(this, 'api-key-ddns', {
      secretName: 'ddns-api-key',
      generateSecretString: {
        passwordLength: 32,
      }
    });

    const hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(this, 'hosted-zone-ddns', {
      hostedZoneId: hostedZoneId.valueAsString,
      zoneName: hostedZoneName.valueAsString,
    });

    const aRecord = new aws_route53.ARecord(this, 'a-record-ddns', {
      zone: hostedZone,
      target: aws_route53.RecordTarget.fromIpAddresses('255.255.255.255'),
      recordName: subdomain.valueAsString,
      ttl: cdk.Duration.seconds(300),
    });

    const updateARecord = new NodejsFunction(this, 'update-a-record-ddns', {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/update-a-record.ts',
      handler: 'handler',
      environment: {
        HOSTED_ZONE_ID: hostedZoneId.valueAsString,
        REGION: this.region,
        SUBDOMAIN: `${subdomain.valueAsString}.${hostedZoneName.valueAsString}.`,
      }
    });

    updateARecord.addToRolePolicy(new aws_iam.PolicyStatement({
      actions: ['route53:ChangeResourceRecordSets'],
      resources: [hostedZone.hostedZoneArn],
    }));

    const api = new aws_apigateway.RestApi(this, 'api-ddns', {
      restApiName: 'Dynamic DNS',
      description: 'Update A record',
    });

    apiKey.grantRead(updateARecord);

    const apiResource = api.root.addResource('update');
    apiResource.addMethod('POST', new aws_apigateway.LambdaIntegration(updateARecord));

    new CfnOutput(this, 'ApiUrl', {value: api.url});
  }
}

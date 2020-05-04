# Smart Product Solution Tools
These tools provide a stream-lined way to get started with the [Smart Product Solution](https://github.com/awslabs/smart-product-solution) reference architecture from [AWS Labs](https://github.com/awslabs).

For more information and a detailed deployment guide visit the Smart Product solution at https://aws.amazon.com/answers/iot/smart-product-solution/.

In the [Deployment](https://docs.aws.amazon.com/solutions/latest/smart-product-solution/deployment.html) section, complete [Step 1. Launch the stack](https://docs.aws.amazon.com/solutions/latest/smart-product-solution/deployment.html#step1), then continue from this guide.

## Prerequisites
- jq
- https://github.com/tests-always-included/mo (included)
- mosquitto client (to run mosquitto_pub command)

## Configuring the Tools
Update the req_distinguished_name section in the CA.cnf with relevant information for your self-signed CA.

```
[ req_distinguished_name ]
# Leave as long names as it helps documentation

countryName=		    US
stateOrProvinceName=	Kentucky
localityName=		    My Town
organizationName=	    Some Organisation
organizationalUnitName=	Some Department
commonName=	            www.example.com
emailAddress=		    admin@example.com
```

Repeat this for the template at templates/privateKeyVerification.csr.template

**IMPORTANT** Do not change the commonName value in the template

```
countryName=		    US
stateOrProvinceName=	Kentucky
localityName=		    My Town
organizationName=	    Some Organisation
organizationalUnitName=	Some Department
commonName=	            {{REG_CODE}}
emailAddress=		    admin@example.com
```

## Step 2. Demo the Solution

Use this procedure to demonstrate the solution’s capabilities using a sample smart product.

### Create a User Account and Log in to the Web Console
1. In the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/home) stack Outputs tab, select the URL value of the Smart Product Owner Web App key.
1. In the web console, select Create Account.
1. In the Create Account window, enter the applicable information.
1. Select Create Account.
1. A verification email will be sent to the specified email address.
1. Select the link in the verification email to verify your account.
1. Enter your username and password to log in to the web console.

### Create and Configure a root CA certificate
From a bash prompt, run the following command
```
./scripts/createConfigureRootCACert.sh
```

### Create and Configure a Device Certificate
From a bash prompt, run the following command



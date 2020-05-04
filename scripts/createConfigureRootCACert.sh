#!/bin/bash

cp ./scripts/CA.cnf ./certs/CA.cnf

cd certs

# Create the sample root certificate authority (CA) certificate.
openssl genrsa -out sampleCACertificate.key 2048

# Help from here on basicConstraints problem
# https://stackoverflow.com/questions/50414315/the-ca-certificate-does-not-have-the-basicconstraints-extension-as-true

# Create the csr
openssl req -new -sha256 -nodes \
    -key sampleCACertificate.key \
    -out sampleCACertificate.csr \
    -config CA.cnf

# Create the certificate
openssl x509 -req -days 3650 \
    -extfile CA.cnf \
    -extensions v3_ca \
    -in sampleCACertificate.csr \
    -signkey sampleCACertificate.key \
    -out sampleCACertificate.pem

# Get the AWS Registration code.
# This command returns a randomly generated, unique registration code
# for your AWS account. This code does not expire until you delete it.
REG_CODE=`aws iot get-registration-code | jq -r '.registrationCode'`

# Create a certificate signing request (CSR)
# The registration code is the Common Name field of the verification certificate
openssl genrsa -out privateKeyVerification.key 2048

# Generate a CSR config file with the registration code as the common name
export REG_CODE=$REG_CODE && cat ../templates/privateKeyVerification.csr.template \
    | ../libs/mo > privateKeyVerification.cnf

# Generate the CSR
openssl req -new -key privateKeyVerification.key \
    -config $PWD/privateKeyVerification.cnf \
    -out privateKeyVerification.csr

# Create a new CA certificate
openssl x509 -req -in privateKeyVerification.csr \
    -CA sampleCACertificate.pem \
    -CAkey sampleCACertificate.key \
    -CAcreateserial \
    -out privateKeyVerification.crt \
    -days 365 -sha256

# Use the verification certificate to register the CA certificate
CERT_ID=`aws iot register-ca-certificate \
    --ca-certificate file://sampleCACertificate.pem \
    --verification-certificate file://privateKeyVerification.crt | jq -r '.certificateId'`

echo "Certificate Id is $CERT_ID"

aws iot describe-ca-certificate --certificate-id $CERT_ID

# Activate the CA Certificate
aws iot update-ca-certificate \
    --certificate-id $CERT_ID \
    --new-status ACTIVE

# Enable automatic registration
aws iot update-ca-certificate \
    --certificate-id $CERT_ID \
    --new-auto-registration-status ENABLE

# Download the AWS IoT Root Certificate
curl -o ./root.cert https://www.amazontrust.com/repository/AmazonRootCA1.pem

cd ..
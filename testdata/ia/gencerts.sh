#!/bin/bash

mkdir -p certs

### Test self-signed certificates support:
# Generate private key:
openssl genrsa -out server.key
# Generate self-signed certificate:
openssl req -key server.key -new -x509 -days 365 -out self.crt -subj "/C=AU/ST=NSW/L=Sydney/O=MongoDB/OU=root/CN=fake-CA"

### Test certificates signed by some local CA:
# Generate CA private key:
openssl genrsa -out CA.key
# Create certificate signing request:
openssl req -key server.key -new -out server.csr -subj "/C=AU/ST=NSW/L=Sydney/O=MongoDB/OU=root/CN=fake-CA"
# Create configuration file:
echo "authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
subjectAltName = @alt_names
[alt_names]
DNS.1 = webhook" > server.ext
# Generate signed by CA certificate
openssl x509 -req -CA CA.crt -CAkey CA.key -in server.csr -out server.crt -days 365 -CAcreateserial -extfile server.ext

# Create client PEM file
#cat certs/client.key certs/client.crt > certs/client.pem
#openssl verify -CAfile certs/root-ca.pem certs/server-cert.pem certs/client-cert.pem

#!/bin/bash

pushd testdata/mysql/ssl-cert-scripts/
bash ./gencerts.sh
chown 0:70 certs/server.key
chmod 640 certs/server.key
popd
PWD=$(pwd) docker-compose -f docker-compose-postgresql-ssl.yml up -d
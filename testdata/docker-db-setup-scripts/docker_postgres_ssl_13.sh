#!/bin/bash

mkdir -p testdata/postgres/ssl-cert-scripts
cp testdata/mysql/ssl-cert-scripts/*.sh testdata/postgres/ssl-cert-scripts
pushd testdata/postgres/ssl-cert-scripts
bash ./gencerts.sh
sudo chown 0:70 certs/server-key.pem
sudo chmod 777 certs/server-key.pem
popd
PWD=$(pwd) docker-compose -f docker-compose-postgresql-ssl.yml up -d

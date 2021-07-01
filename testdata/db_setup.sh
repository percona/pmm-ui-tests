#!/bin/bash


## Slowlog file shared with ps docker container, to allow pmm-agent to read
sudo chmod 777 -R /tmp/mysql/log

## setup as we do in pmm-framework
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "SET GLOBAL slow_query_log='ON';"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "INSTALL PLUGIN QUERY_RESPONSE_TIME_AUDIT SONAME 'query_response_time.so';"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "INSTALL PLUGIN QUERY_RESPONSE_TIME SONAME 'query_response_time.so';"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "INSTALL PLUGIN QUERY_RESPONSE_TIME_READ SONAME 'query_response_time.so';"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "INSTALL PLUGIN QUERY_RESPONSE_TIME_WRITE SONAME 'query_response_time.so';"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "SET GLOBAL query_response_time_stats=ON;"
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "GRANT SELECT, PROCESS, SUPER, REPLICATION CLIENT, RELOAD ON *.* TO 'pmm-agent'@'%';"


## setup as we do in pmm-framework
docker exec pmm-agent_mysql_8_0 mysql -h 127.0.0.1 -u root -pps -e "SET GLOBAL slow_query_log='ON';"
docker exec pmm-agent_mysql_8_0 mysql -h 127.0.0.1 -u root -pps -e "GRANT SELECT, PROCESS, SUPER, REPLICATION CLIENT, RELOAD ON *.* TO 'pmm-agent'@'%';"

## Percona-distribution postgresql
docker exec pmm-agent_postgres psql -h localhost -U postgres -c 'create extension pg_stat_statements'
docker exec pmm-agent_postgres psql -h localhost -U postgres -c 'create extension pg_stat_monitor'
docker exec pmm-agent_postgres psql -h localhost -U postgres -c 'SELECT pg_reload_conf();'


### SSL instance setup
pushd testdata/mysql/ssl-cert-scripts/
bash ./gencerts.sh
docker exec mysql_ssl bash -c "mkdir -p /root/certs"
docker exec mysql_ssl mkdir -p /root/certs
docker cp ./certs/. mysql_ssl:/root/certs
docker exec mysql_ssl chown -R mysql:mysql /root/certs/
docker exec mysql_ssl bash -c "mv -v /root/certs/ /etc/certs/"
docker exec mysql_ssl ls -la /etc/certs/
docker exec mysql_ssl chmod 600 /etc/certs/client-key.pem /etc/certs/server-key.pem /etc/certs/root-ca-key.pem
docker restart mysql_ssl
sleep 20
popd
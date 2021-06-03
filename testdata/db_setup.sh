#!/bin/bash


## Slowlog volume shared with docker container
chmod 777 -R /tmp/mysql

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

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
docker exec pmm-agent_mysql_5_7 mysql -h 127.0.0.1 -u root -pps -e "GRANT SELECT, SUPER, PROCESS, REPLICATION CLIENT, RELOAD, BACKUP_ADMIN ON *.* TO 'pmm-agent'@'%';"

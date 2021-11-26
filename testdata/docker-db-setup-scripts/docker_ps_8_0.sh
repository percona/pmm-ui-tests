#!/bin/bash

docker exec pmm-agent_mysql_8_0 mysql -h 127.0.0.1 -u root -pps -e "SET GLOBAL slow_query_log='ON';"
docker exec pmm-agent_mysql_8_0 mysql -h 127.0.0.1 -u root -pps -e "GRANT SELECT, PROCESS, REPLICATION CLIENT, RELOAD, BACKUP_ADMIN ON *.* TO 'pmm-agent'@'%';"

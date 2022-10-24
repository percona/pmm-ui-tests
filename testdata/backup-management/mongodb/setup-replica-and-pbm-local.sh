#!/bin/bash

PWD=$(pwd) docker-compose -f docker-compose-mongo-replica-local.yml up -d mongors1 mongors2 mongors3 --build
sleep 5
docker exec -it mongors1 bash /opt/pbm/configure-replica.sh

PWD=$(pwd) docker-compose -f docker-compose-mongo-replica-local.yml up -d pbm-agent-rs1  pbm-agent-rs2 pbm-agent-rs3 pmm-client --build

sleep 5

docker exec -u 0 -it pmm-client /bin/bash -c "yum -y install https://repo.percona.com/yum/percona-release-latest.noarch.rpm"
docker exec -u 0 -it pmm-client /bin/bash -c "percona-release enable pbm release && yum -y install percona-backup-mongodb"

docker exec -u 0 -it pmm-client /bin/bash -c "pmm-admin add mongodb --service-name=mongo-backup-locations --username=admin --password=password --host=mongors1 --port=27027"
docker exec -u 0 -it pmm-client /bin/bash -c "pmm-admin add mongodb --service-name=mongo-backup-schedule --username=admin --password=password --host=mongors1 --port=27027"
docker exec -u 0 -it pmm-client /bin/bash -c "pmm-admin add mongodb --service-name=mongo-backup-inventory --username=admin --password=password --host=mongors1 --port=27027"
docker exec -u 0 -it pmm-client /bin/bash -c "pmm-admin add mongodb --service-name=mongo-service-to-delete --username=admin --password=password --host=mongors1 --port=27027"

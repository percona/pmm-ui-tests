#!/bin/bash

PWD=$(pwd) docker-compose -f docker-compose-mongo-replica.yml up -d

cat > setup-replica.js <<EOF
rs.initiate(
  {
    _id : 'rs0',
    members: [
      { _id : 0, host : "mongors1:27027", priority: 500 },
      { _id : 1, host : "mongors2:27028" },
      { _id : 2, host : "mongors3:27029" }
    ]
  });
  sleep(40000);

  db.getSiblingDB("admin").createUser(
  {
    user: "admin",
    pwd: "password",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" },
             { role: "dbAdminAnyDatabase", db: "admin" },
             { role: "readWriteAnyDatabase", db: "admin" } ]
  });

  db.getSiblingDB("admin").createRole({ "role": "pbmAnyAction",
      "privileges": [
         { "resource": { "anyResource": true },
           "actions": [ "anyAction" ]
         }
      ],
      "roles": []
   });

  db.getSiblingDB("admin").createUser({user: "pbmuser",
       "pwd": "secretpwd",
       "roles" : [
          { "db" : "admin", "role" : "readWrite", "collection": "" },
          { "db" : "admin", "role" : "backup" },
          { "db" : "admin", "role" : "clusterMonitor" },
          { "db" : "admin", "role" : "restore" },
          { "db" : "admin", "role" : "pbmAnyAction" }
       ]
    });

  db.e2e.insert({number: 1, name: "John"})
  db.e2e.find().pretty()
EOF

sleep 10
docker cp setup-replica.js mongors1:/
docker exec -u 0 mongors1 mongo --port=27027 --authenticationDatabase admin setup-replica.js

# Install PBM 1.8.1
docker exec -u 0 mongors1 /bin/bash -c "sudo percona-release enable pbm release && sudo apt -y install percona-backup-mongodb=1.8.1-1.focal"
docker exec -u 0 mongors2 /bin/bash -c "sudo percona-release enable pbm release && sudo apt -y install percona-backup-mongodb=1.8.1-1.focal"
docker exec -u 0 mongors3 /bin/bash -c "sudo percona-release enable pbm release && sudo apt -y install percona-backup-mongodb=1.8.1-1.focal"

docker exec  -d mongors1 /bin/bash -c 'PBM_MONGODB_URI="mongodb://pbmuser:secretpwd@localhost:27027" pbm-agent'
docker exec  -d mongors2 /bin/bash -c 'PBM_MONGODB_URI="mongodb://pbmuser:secretpwd@localhost:27028" pbm-agent'
docker exec  -d mongors3 /bin/bash -c 'PBM_MONGODB_URI="mongodb://pbmuser:secretpwd@localhost:27029" pbm-agent'

sudo -- sh -c "echo '127.0.0.1 mongors1 mongors2 mongors3' >> /etc/hosts"

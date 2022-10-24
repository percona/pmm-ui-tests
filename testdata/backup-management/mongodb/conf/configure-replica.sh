#!/usr/bin/env bash

set -o xtrace

MONGO_USER=${MONGO_USER:-"admin"}
BACKUP_USER=${BACKUP_USER:-"pbmuser"}
MONGO_PASS=${MONGO_PASS:-"password"}
CONFIGSVR=${CONFIGSVR:-"false"}
SINGLE_NODE=${SINGLE_NODE:-"false"}

mongo --port=27027 <<EOF
rs.initiate(
    {
        _id: 'rs0',
        configsvr: $CONFIGSVR,
        version: 1,
        members: [
            { _id: 0, host: "mongors1:27027" }
        ]
    }
)
EOF

sleep 5

mongo --port=27027 <<EOF
db.getSiblingDB("admin").createUser({ user: "${MONGO_USER}", pwd: "${MONGO_PASS}", roles: [ "root", "userAdminAnyDatabase", "clusterAdmin" ] })
EOF

mongo "mongodb://${MONGO_USER}:${MONGO_PASS}@localhost:27027/?replicaSet=rs0" <<EOF
db.getSiblingDB("admin").createRole({ "role": "pbmAnyAction",
"privileges": [
   { "resource": { "anyResource": true },
	 "actions": [ "anyAction" ]
   }
],
"roles": []
});

db.getSiblingDB("admin").createUser(
	{
		user: "${BACKUP_USER}",
		pwd: "${MONGO_PASS}",
		"roles" : [
			{ "db" : "admin", "role" : "readWrite", "collection": "" },
			{ "db" : "admin", "role" : "backup" },
			{ "db" : "admin", "role" : "clusterMonitor" },
			{ "db" : "admin", "role" : "restore" },
			{ "db" : "admin", "role" : "pbmAnyAction" }
		 ]
	}
);

EOF

if [ $SINGLE_NODE == "true" ] ; then
    exit 0
fi

mongo "mongodb://${MONGO_USER}:${MONGO_PASS}@localhost:27027/?replicaSet=rs0" <<EOF
rs.reconfig(
    {
        _id: "rs0",
        configsvr: $CONFIGSVR,
        protocolVersion: NumberLong(1),
        version: 2,
        members: [
            { _id: 0, host: "mongors1:27027" },
            { _id: 1, host: "mongors2:27028" },
            { _id: 2, host: "mongors3:27029" }
        ]
    },
    {
        "force" : true,
    }
)
EOF


ARG psmdbVersion=4.4
ARG localPort=27027

FROM percona/percona-server-mongodb:${psmdbVersion}

USER root

SHELL ["/bin/bash", "-c"]
RUN echo $' \n\
rs.initiate( \n\
  { \n\
    _id : 'rs0', \n\
    members: [ \n\
      { _id : 0, host : "mongors1:27027" }, \n\
      { _id : 1, host : "mongors2:27028" }, \n\
      { _id : 2, host : "mongors3:27029" } \n\
    ] \n\
  }); \n\
  sleep(40000); \n\
 \n\
  db.getSiblingDB("admin").createUser( \n\
  { \n\
    user: "admin", \n\
    pwd: "password", \n\
    roles: [ { role: "userAdminAnyDatabase", db: "admin" }, \n\
             { role: "dbAdminAnyDatabase", db: "admin" }, \n\
             { role: "readWriteAnyDatabase", db: "admin" } ] \n\
  }); \n\
 \n\
  db.getSiblingDB("admin").createRole({ "role": "pbmAnyAction", \n\
      "privileges": [ \n\
         { "resource": { "anyResource": true }, \n\
           "actions": [ "anyAction" ] \n\
         } \n\
      ], \n\
      "roles": [] \n\
   }); \n\
 \n\
  db.getSiblingDB("admin").createUser({user: "pbmuser", \n\
       "pwd": "secretpwd", \n\
       "roles" : [ \n\
          { "db" : "admin", "role" : "readWrite", "collection": "" }, \n\
          { "db" : "admin", "role" : "backup" }, \n\
          { "db" : "admin", "role" : "clusterMonitor" }, \n\
          { "db" : "admin", "role" : "restore" }, \n\
          { "db" : "admin", "role" : "pbmAnyAction" } \n\
       ] \n\
    }); \n\
 \n\
  db.e2e.insert({number: 1, name: "John"}) \n\
  db.e2e.find().pretty()' >> tmp/setup-replica.js \
    && chown -R 1001:0 tmp/setup-replica.js
RUN chmod 777 tmp/setup-replica.js

# upstream fix
RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-Linux-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-Linux-*
RUN percona-release  enable pbm release && yum -y install percona-backup-mongodb
RUN PBM_MONGODB_URI="mongodb://pbmuser:secretpwd@localhost:${localPort}" pbm-agent

USER 1001

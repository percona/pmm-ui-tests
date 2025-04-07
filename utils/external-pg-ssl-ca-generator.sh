apt install openssl
openssl genrsa -out /certs/ca.key 2048
openssl req -x509 -new -nodes -key /certs/ca.key -sha256 -config /utils/external-pgsql-ssl-config.cnf -out /certs/ca.crt
chown 1000 /certs/ca.crt
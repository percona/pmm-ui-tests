
mkdir -p certs

OPENSSL_SUBJ="/C=US/ST=California/L=Santa Clara"
OPENSSL_CA="${OPENSSL_SUBJ}/CN=fake-CA"
OPENSSL_SERVER="${OPENSSL_SUBJ}/CN=fake-server"
OPENSSL_CLIENT="${OPENSSL_SUBJ}/CN=fake-client"

sh ./genroot.sh "${OPENSSL_CA}"
sleep 5
sh ./genserver.sh "${OPENSSL_SERVER}"
sleep 5
sh ./genclient.sh "${OPENSSL_CLIENT}"

sleep 10
openssl rsa -in certs/client-key.pem -out certs/client-key.pem
openssl rsa -in certs/server-key.pem -out certs/server-key.pem
openssl verify -CAfile certs/root-ca.pem certs/server-cert.pem certs/client-cert.pem
sudo chown -R $USER:$USER certs
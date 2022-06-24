apt update
apt-get install wget libldap-common libsasl2-2 libsasl2-modules-db libsasl2-modules-db libbrotli1 libldap-2.5-0 libnghttp2-14 librtmp1 libssh-4 libcurl4 curl gnupg2 -y
apt-get install -y lsb-release
wget https://repo.percona.com/apt/percona-release_latest.$(lsb_release -sc)_all.deb
dpkg -i percona-release_latest.$(lsb_release -sc)_all.deb
apt update
apt install pmm2-client -y
pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml \
 --server-address=pmm-server-external-clickhouse:443 \
 --server-insecure-tls \
 --server-username=admin \
 --server-password=admin
nohup pmm-agent --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml &
sleep 30
pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7    mysql5.7:3306
tail -f /dev/null
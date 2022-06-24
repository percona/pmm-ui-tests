#
# This file needs to be marked executable
#
cd /etc/yum.repos.d/
sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
#yum update -y
cd /
yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm -y
#percona-release disable all
#percona-release enable percona experimental
yum update -y
yum install pmm2-client -y
pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml \
 --server-address=pmm-server-external-clickhouse:443 \
 --server-insecure-tls \
 --server-username=admin \
 --server-password=admin
nohup pmm-agent --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml &
sleep 60
pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7    mysql5.7:3306
tail -f /dev/null

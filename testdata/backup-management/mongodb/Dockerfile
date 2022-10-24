FROM percona/percona-server-mongodb:4.4.15

# specifies the PMM client to install.
ARG PMM_CLIENT_TAR="https://s3.us-east-2.amazonaws.com/pmm-build-cache/PR-BUILDS/pmm2-client/pmm2-client-PR-2836-197d20e.tar.gz"
USER root

# installing the custom tarball alone can't seem to update the $PATH, so we install official client as workaround
RUN yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm -y
RUN yum --showduplicates list pmm2-client && yum -y install pmm2-client-2.31.0-6.el8.x86_64

# install pbm
RUN percona-release enable pbm release && yum -y install percona-backup-mongodb

# download custom client and set it up
RUN curl -o pmm-client.tar.gz ${PMM_CLIENT_TAR} && mkdir -p pmm-client && tar -xvf pmm-client.tar.gz -C pmm-client --strip-components=1 && ./pmm-client/install_tarball

# useful for local pmm development
#COPY bin/pmm-agent /usr/local/percona/pmm2/bin/
#COPY bin/pmm-agent-entrypoint /usr/local/percona/pmm2/bin/

# setup authentication
COPY keyfile /opt/keyfile
RUN chown mongodb /opt/keyfile && chmod 400 /opt/keyfile && mkdir -p /home/mongodb && chown mongodb /home/mongodb
# switch back to default mongo user
USER mongodb

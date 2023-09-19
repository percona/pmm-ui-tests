# How to run Portal tests locally

## Environment setup guide

### Run PMM Server with portal arguments  

* **Use prepared docker-compose:**   
  1. navigate to the repo root folder contains [docker-compose.yaml](../../docker-compose.yml) 
  2. run `docker-compose up -d`


* **Run docker container manually:**  
  run the following commands:  
  <pre>
  PMM_SERVER_IMAGE=percona/pmm-server:2.39.0

  docker pull $PMM_SERVER_IMAGE
  docker volume create pmm-data
  docker run --detach --restart always \
  --publish 443:443 \
  -v pmm-data:/srv \
  --name pmm-server \
  -e ENABLE_RBAC=1 \
  -e PERCONA_PORTAL_URL=https://portal-dev.percona.com \
  -e PERCONA_TEST_PLATFORM_ADDRESS=https://check-dev.percona.com:443 \
  -e PERCONA_TEST_PLATFORM_PUBLIC_KEY=RWTg+ZmCCjt7O8eWeAmTLAqW+1ozUbpRSKSwNTmO+exlS5KEIPYWuYdX \
  -e PERCONA_TEST_CHECKS_PUBLIC_KEY=RWTg+ZmCCjt7O8eWeAmTLAqW+1ozUbpRSKSwNTmO+exlS5KEIPYWuYdX \
  -e PERCONA_TEST_VERSION_SERVICE_URL=https://check-dev.percona.com/versions/v1 \
  -e GF_AUTH_OAUTH_ALLOW_INSECURE_EMAIL_LOOKUP=1 \
  $PMM_SERVER_IMAGE
  </pre>

### Setup PMM Client
  PMM Client may be installed in multiple ways: 
* using pmm-framework, 
* percona-release and packages manager
* **install script**  
 run the following commands:
  <pre>
  PMM_VERSION=2.39.0
  
  ### install local agent
  path=/usr/local/percona/pmm2
  #wget -4P /tmp/ --progress=dot:giga "https://raw.githubusercontent.com/Percona-QA/package-testing/master/scripts/pmm2_client_install_tarball.sh"
  (cd /tmp && curl -O https://raw.githubusercontent.com/Percona-QA/package-testing/master/scripts/pmm2_client_install_tarball.sh)
  #sudo bash -x /tmp/pmm2_client_install_tarball.sh -v $PMM_VERSION -r PR-2974-fddced9
  sudo bash -x /tmp/pmm2_client_install_tarball.sh -v $PMM_VERSION

  ### Setup local agent
  sudo pmm-admin config --force --server-insecure-tls --metrics-mode=auto --agent-password=pmm-pass --server-url=https://admin:admin@127.0.0.1:443
  sudo pmm-agent setup --force --config-file=${path}/config/pmm-agent.yaml --server-address=127.0.0.1:443 --server-insecure-tls --server-username=admin --server-password=admin
  sudo pmm-agent --config-file=${path}/config/pmm-agent.yaml > pmm-agent.log 2>&1 &
  
  ### verify pmm-admin is up and connected
  pmm-admin status
  </pre>

### Set required ENV variables

**IMPORTANT!** _Make sure ".env" file is in git ignore and will not be committed!_

create ".env" file in the project root dir with the following content:
<pre>
OAUTH_DEV_HOST={string value}
OKTA_TOKEN={string value}
OAUTH_ISSUER_URL={string value}

SERVICENOW_LOGIN='{string value}'
SERVICENOW_PASSWORD='{string value}'
SERVICENOW_DEV_URL='{string value}'
</pre>

### Run Portal tests
<pre>
npx playwright test --project=Portal -g @portal --headed
</pre>
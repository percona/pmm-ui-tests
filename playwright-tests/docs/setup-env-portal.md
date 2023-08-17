# How to run Portal tests locally

## Environment setup guide

### Run PMM Server with portal arguments  

* **Use prepared docker-compose:**   
  1. navigate to the repo root folder contains [docker-compose.yaml](../../docker-compose.yml) 
  2. run `docker-compose up -d`


* **Run docker container manually:**  
  run the following commands:  
  <pre>
  PMM_VERSION=2.39.0  
  docker pull percona/pmm-server:$PMM_VERSION
  docker volume create pmm-data
  docker run --detach --restart always \
    --publish 443:443 \
    -v pmm-data:/srv \
    --name pmm-server \
    -e PERCONA_PORTAL_URL=https://portal-dev.percona.com \
    -e PERCONA_TEST_PLATFORM_ADDRESS=https://check-dev.percona.com:443 \
    -e PERCONA_TEST_PLATFORM_PUBLIC_KEY=RWTg+ZmCCjt7O8eWeAmTLAqW+1ozUbpRSKSwNTmO+exlS5KEIPYWuYdX \
    -e PERCONA_TEST_CHECKS_PUBLIC_KEY=RWTg+ZmCCjt7O8eWeAmTLAqW+1ozUbpRSKSwNTmO+exlS5KEIPYWuYdX \
    -e PERCONA_TEST_VERSION_SERVICE_URL=https://check-dev.percona.com/versions/v1 \
    percona/pmm-server:$PMM_VERSION
  </pre>

### Setup PMM Client


### Set required ENV variables


### Run Portal tests

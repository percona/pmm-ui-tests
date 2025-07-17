#!/usr/bin/env bash
# Usage: ./run-e2e-locally.sh --tag @ssl-mysql [--setup-args "--database=pgsql"] [--qa-integration-branch v3]


# Default values
TAG=""
COMPOSE_FILE="docker-compose.yml"
SETUP_ARGS=""
ADMIN_PASSWORD="admin-password"
PMM_SERVER_IP="192.168.0.1"
QA_INTEGRATION_BRANCH="v3"
CLIENT_VERSION="3-dev-latest"

# Export variables for use in scripts
export ADMIN_PASSWORD="$ADMIN_PASSWORD"


# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

set -e

# Conflict check for OS, existing containers, and network
conflict=0
OS_VERSION=$(lsb_release -rs 2>/dev/null || echo "")
if [[ "$OS_VERSION" != "22.04" ]]; then
    echo -e "${YELLOW}Warning: This script is only officially tested on Ubuntu 22.04. Detected version: $OS_VERSION${NC}"
    conflict=1
fi
if docker ps -a --format '{{.Names}}' | grep -q '^pmm-server$'; then
    echo -e "${YELLOW}Warning: A container named pmm-server already exists. There is a high chance this script will fail if conflicting containers are present.${NC}"
    conflict=1
fi
if docker network ls --format '{{.Name}}' | grep -q '^pmm-qa$'; then
    echo -e "${YELLOW}Warning: A network named pmm-qa already exists. There is a high chance this script will fail if conflicting networks or containers are present.${NC}"
    conflict=1
fi
if [[ $conflict -eq 1 ]]; then
    read -p "Continue anyway? [y/N] " resp
    if [[ ! "$resp" =~ ^[yY]$ ]]; then
        echo -e "${RED}Aborting as requested.${NC}"
        exit 1
    fi
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
    --tag)
        TAG="$2"
        shift 2
        ;;
    --setup-args)
        SETUP_ARGS="$2"
        shift 2
        ;;
    --qa-integration-branch)
        QA_INTEGRATION_BRANCH="$2"
        shift 2
        ;;
    *)
        echo -e "${RED}Unknown argument: $1${NC}"
        exit 1
        ;;
    esac
done

# Auto-set SETUP_ARGS based on tag if not provided
if [[ -z "$SETUP_ARGS" ]]; then
    case "$TAG" in
    "@settings|@cli")
        SETUP_ARGS="--database=pgsql" ;;
    @ssl-mysql)
        SETUP_ARGS="--database=ssl_mysql" ;;
    @ssl-mongo)
        SETUP_ARGS="--database=ssl_psmdb" ;;
    @ssl-postgres)
        SETUP_ARGS="--database=ssl_pdpgsql=16" ;;
    @experimental)
        SETUP_ARGS="--database=pdpgsql" ;;
    @disconnect)
        SETUP_ARGS="--help" ;;
    @bm-mongo|@bm-locations|@pmm-psmdb-replica-integration)
        SETUP_ARGS="--database=psmdb,SETUP_TYPE=pss" ;;
    @exporters)
        SETUP_ARGS="--database=ps,QUERY_SOURCE=slowlog" ;;
    @mongodb-exporter)
        SETUP_ARGS="--database=psmdb" ;;
    @fb-instances)
        SETUP_ARGS="--database=ps --database=external --database=haproxy" ;;
    @fb-alerting|@fb-settings)
        SETUP_ARGS="--database=mysql" ;;
    @pgsm-pmm-integration)
        SETUP_ARGS="--database=pdpgsql" ;;
    @pgss-pmm-integration)
        SETUP_ARGS="--database=pgsql" ;;
    @user-password)
        SETUP_ARGS="--addclient=ps,1 --addclient=modb,1" ;;
    @dump)
        SETUP_ARGS="--database=ps" ;;
    @service-account)
        SETUP_ARGS="--database=ps=8.0" ;;
    @pmm-psmdb-arbiter-integration)
        SETUP_ARGS="--database=psmdb,SETUP_TYPE=psa" ;;
    @fb-pmm-ps-integration)
        SETUP_ARGS="--database=ps=8.0,QUERY_SOURCE=slowlog" ;;
    @rbac)
        SETUP_ARGS="--database=ps --database=pdpgsql" ;;
    @fb-encryption)
        SETUP_ARGS="--database=ps=8.0" ;;
    @docker-configuration)
        SETUP_ARGS="-h" ;;
    @nomad)
        SETUP_ARGS="--database=ps=8.4 --database=pdpgsql --database=psmdb" ;;
    *)
        SETUP_ARGS="--database=ps" ;;
    esac
    echo -e "${YELLOW}==> Auto-selected setup args for tag $TAG: $SETUP_ARGS${NC}"
fi

# Install required system dependencies for a fresh environment
echo -e "${GREEN}==> Installing system dependencies...${NC}"
sudo apt-get install -y apt-transport-https ca-certificates dirmngr ansible libaio1 libaio-dev libnuma-dev libncurses5 socat sysbench
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754
echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
sudo apt-get update
sudo apt-get install -y git python3 python3-pip python3-venv nodejs dos2unix ansible clickhouse-client
sudo curl -s https://raw.githubusercontent.com/datacharmer/dbdeployer/master/scripts/dbdeployer-install.sh | bash || true
npx playwright install-deps || true

# Ensure qa-integration repo is present in the parent directory
if [ ! -d "../qa-integration" ]; then
    echo -e "${GREEN}==> Cloning qa-integration (branch $QA_INTEGRATION_BRANCH)...${NC}"
    git clone --branch "$QA_INTEGRATION_BRANCH" --single-branch https://github.com/Percona-Lab/qa-integration.git ../qa-integration || true
else
    echo -e "${GREEN}==> Ensuring qa-integration is on branch $QA_INTEGRATION_BRANCH...${NC}"
    (cd ../qa-integration && git fetch && git checkout "$QA_INTEGRATION_BRANCH" && git pull) || true
fi

# Select compose file automatically based on tag
if [[ "$TAG" == "@nomad" ]]; then
    COMPOSE_FILE="docker-compose-nomad.yml"
    echo "==> Tag is @nomad, using compose file: $COMPOSE_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
fi

if [[ -z "$TAG" ]]; then
    echo -e "${YELLOW}Usage: $0 --tag <@tag> [--setup-args <args>]${NC}"
    exit 1
fi

echo -e "${GREEN}==> Creating Docker network (if needed)...${NC}"
docker network create pmm-qa || true

echo -e "${GREEN}==> Starting PMM environment with $COMPOSE_FILE ...${NC}"
docker compose -f "$COMPOSE_FILE" up -d

echo -e "${GREEN}==> Waiting 60 seconds for PMM Server to be ready...${NC}"
sleep 60

echo -e "${GREEN}==> Setting admin password...${NC}"
docker exec pmm-server change-admin-password "$ADMIN_PASSWORD" || true

echo -e "${GREEN}==> Running DB setup script...${NC}"
bash -x testdata/db_setup.sh

echo -e "${GREEN}==> Connect network pmm-qa and pmm-server (if needed)...${NC}"
docker network connect pmm-qa pmm-server || true

echo -e "${GREEN}==> Setting up PMM Client...${NC}"
(cd ../qa-integration/pmm_qa && sudo bash -x pmm3-client-setup.sh --pmm_server_ip "$PMM_SERVER_IP" --client_version "$CLIENT_VERSION" --admin_password "$ADMIN_PASSWORD" --use_metrics_mode no)

echo -e "${GREEN}==> Preparing Python environment for E2E tests...${NC}"
(cd ../qa-integration/pmm_qa && \
    mkdir -m 777 -p /tmp/backup_data && \
    python3 -m venv virtenv && \
    . virtenv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install setuptools && \
    pip install ansible && \
    python pmm-framework.py $SETUP_ARGS --pmm-server-password="$ADMIN_PASSWORD" --verbose)

echo -e "${GREEN}==> Installing npm dependencies and Playwright...${NC}"
npm ci
npx playwright install --with-deps
envsubst < env.list > env.generated.list

echo -e "${GREEN}==> Running tests with tag $TAG ...${NC}"
npx codeceptjs run -c pr.codecept.js --grep "$TAG"

echo -e "${GREEN}==> Done!${NC}"

export PWD=$(pwd)

task_default() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d || return
}

task_setup_pmm_server() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d pmm-server || return
}

task_setup_mysql_5() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d mysql || return
}

task_setup_mongo() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d mongo || return
}

task_setup_postgres() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d postgres || return
}

task_setup_proxysql() {
  PWD=$(pwd) docker-compose -f docker-compose.yml up -d proxysql || return
}

task_setup_ms_ssl() {
  PWD=$(pwd) docker-compose -f docker-compose-mysql-ssl.yml up -d || return
  bash -x ${PWD}/testdata/docker-db-setup-scripts/docker_mysql_ssl_8_0.sh
}

task_setup_mongodb_ssl() {
  bash -x ${PWD}/testdata/docker-db-setup-scripts/docker_mongodb_ssl_4_4.sh || return
}

task_setup_pmm_server_basic_load() {
  task_setup_pmm_server
  task_setup_mysql_5
  task_setup_mongo
  task_setup_postgres
  task_setup_proxysql
  bash -x testdata/db_setup.sh || return
}

task_setup_db_basic_load() {
  task_setup_mysql_5
  task_setup_mongo
  task_setup_postgres
  task_setup_proxysql
  bash -x testdata/db_setup.sh || return
}

task_cleanup() {
  docker-compose down --remove-orphans
}

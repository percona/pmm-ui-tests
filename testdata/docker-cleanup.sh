#!/usr/bin/env bash

docker kill $(docker ps -q)
docker image prune -af
docker container prune -f
docker volume prune -f
docker system prune -f
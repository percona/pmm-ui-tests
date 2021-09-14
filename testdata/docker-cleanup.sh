#!/usr/bin/env bash

docker image prune -af
docker container prune -f
docker volume prune -f

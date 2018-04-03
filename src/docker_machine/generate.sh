#!/bin/bash
GOCA_PATH=$PWD/../oca/go
ADDON_PATH=$PWD
BIN_LOCATION=/usr/share/one

export GOPATH=$GOPATH:$GOCA_PATH:$ADDON_PATH

cd src/docker_machine/
make build

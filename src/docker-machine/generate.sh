#!/bin/bash
GOCA_PATH=$PWD/../oca/go
ADDON_PATH=$PWD

export GOPATH=$GOPATH:$GOCA_PATH:$ADDON_PATH

cd src/docker-machine/
make build
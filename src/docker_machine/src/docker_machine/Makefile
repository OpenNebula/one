SHELL := /bin/bash

BUILD_ID := $(shell head -c20 /dev/urandom|od -An -tx1|tr -d ' \n')
REPO_ROOT ?= $(shell realpath ../../../../)
GOCA_PATH ?= ${REPO_ROOT}/src/oca/go
GOPATH_REPO ?= ${REPO_ROOT}/src/docker_machine
USE_LOCAL_GOCA ?= yes

ifeq ($(GOPATH),)
GOPATH := $(GOPATH_REPO)
else
GOPATH := $(GOPATH):$(GOPATH_REPO)
endif

.PHONY: clean build

build: bin/docker-machine-driver-opennebula

bin/docker-machine-driver-opennebula: vendor
	GOPATH=$(GOPATH) go build -ldflags "-B 0x$(BUILD_ID)" -o ./bin/docker-machine-driver-opennebula ./bin

vendor:
	rm -rf vendor/
	GOPATH=$(GOPATH) dep ensure
ifeq ($(USE_LOCAL_GOCA),yes)
	set -e; trap 'rm -rf vendor/' ERR; \
	rm -rf vendor/github.com/OpenNebula/one; \
	ln -s ${REPO_ROOT} vendor/github.com/OpenNebula/one
endif

clean:
	-rm -rf vendor/ bin/docker-machine-driver-opennebula

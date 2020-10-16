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
	GOPATH=$(GOPATH) go mod init
ifeq ($(USE_LOCAL_GOCA),yes)
	GOPATH=$(GOPATH) go mod edit -replace github.com/OpenNebula/one/src/oca/go/src/goca=$(REPO_ROOT)/src/oca/go/src/goca
endif
	GOPATH=$(GOPATH) go mod tidy

clean:
	-rm -rf go.mod go.sum bin/docker-machine-driver-opennebula

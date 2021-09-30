SHELL := /bin/bash

BUILD_ID := $(shell head -c20 /dev/urandom|od -An -tx1|tr -d ' \n')
REPO_ROOT ?= $(shell realpath ../../../../)
GOCA_PATH ?= ${REPO_ROOT}/src/oca/go
GOPATH_REPO ?= ${REPO_ROOT}/src/docker_machine
USE_LOCAL_GOCA ?= yes
TARGET_ARCHS ?= amd64 arm64

ifeq ($(GOPATH),)
GOPATH := $(GOPATH_REPO)
else
GOPATH := $(GOPATH):$(GOPATH_REPO)
endif

.PHONY: clean build

build: \
    bin/docker-machine-driver-opennebula \
    $(patsubst %, bin/docker-machine-driver-opennebula.%, $(TARGET_ARCHS))

# driver without suffix is always default x86-64 (for backward compatibility)
bin/docker-machine-driver-opennebula: bin/docker-machine-driver-opennebula.amd64
	cp -f $< $@

# architecture dependent builds
bin/docker-machine-driver-opennebula.%: vendor
	GOPATH=$(GOPATH) GOARCH=${*} go build -ldflags "-B 0x$(BUILD_ID)" -o "$@" ./bin

vendor:
	rm -rf vendor/
	GOPATH=$(GOPATH) dep ensure
ifeq ($(USE_LOCAL_GOCA),yes)
	set -e; trap 'rm -rf vendor/' ERR; \
	rm -rf vendor/github.com/OpenNebula/one; \
	ln -s ${REPO_ROOT} vendor/github.com/OpenNebula/one
endif

clean:
	-rm -rf vendor/ bin/docker-machine-driver-opennebula*

# Copyright 2018 www.privaz.io Valletech AB
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Use full path to ensure virtualenv compatibility
PYTHON = $(shell which python3)
GDS = $(shell which generateDS)
PWD = $(shell pwd)

PROTO_DIR = ../../../src/rm/grpc/proto
PROTOS = $(shell find $(PROTO_DIR) -name "*.proto")
GRPC_OUT = $(patsubst $(PROTO_DIR)/%.proto, pyone/grpc/%_pb2.py, $(PROTOS)) \
           $(patsubst $(PROTO_DIR)/%.proto, pyone/grpc/%_pb2_grpc.py, $(PROTOS))

schemas = index.xsd

VPATH = src: ../../../share/doc/xsd

ifneq ("${ROOT}","")
  root="--root=${ROOT}"
endif

all: pyone/bindings/__init__.py pyone/bindings/supbind.py grpc

pyone/bindings/__init__.py pyone/bindings/supbind.py: $(schemas)
	$(if $(GDS),,$(error generateDS not found. Please install it with: pip install generateDS))
	mkdir -p pyone/bindings
	${PYTHON} ${GDS} -q -f -o pyone/bindings/supbind.py -s pyone/bindings/__init__.py --super=supbind --external-encoding=utf-8 --silence $^
	sed -i "s/import supbind/from . import supbind/" pyone/bindings/__init__.py
	sed -i "s/import sys/import sys\nfrom pyone.util import TemplatedType/" pyone/bindings/__init__.py
	sed -i "s/(supermod\./(TemplatedType, supermod\./g" pyone/bindings/__init__.py

grpc: $(GRPC_OUT)

$(GRPC_OUT): $(PROTOS)
	mkdir -p pyone/grpc
	${PYTHON} -m grpc_tools.protoc -I$(PROTO_DIR) --python_out=pyone/grpc --grpc_python_out=pyone/grpc $(PROTOS)
	@echo "Fixing Python gRPC imports..."
	sed -i 's/^import .*_pb2/from . &/' pyone/grpc/*_pb2*.py

.PHONY: clean dist
clean:
	rm -rf build dist pyone/bindings pyone/grpc *.egg-info doc

dist:
	${PYTHON} setup.py sdist bdist_wheel

install:
	${PYTHON} setup.py install ${root}

doc:
	mkdir -p doc
	PYTHONPATH=$(PWD) pdoc --overwrite --html --html-no-source --html-dir doc pyone

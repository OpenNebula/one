#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

mkdir -p samples/cluster    samples/cluster_pool
mkdir -p samples/datastore  samples/datastore_pool
mkdir -p samples/group      samples/group_pool
mkdir -p samples/host       samples/host_pool
mkdir -p samples/image      samples/image_pool
mkdir -p samples/vmtemplate samples/vmtemplate_pool
mkdir -p samples/user       samples/user_pool
mkdir -p samples/vm         samples/vm_pool
mkdir -p samples/vnet       samples/vnet_pool



onecluster create newcluster
onegroup create newgroup


# Host
onehost create host01 --im im_test --vm vmm_test --net dummy
onehost create host02 --im im_test --vm vmm_test --net dummy

onecluster addhost newcluster host02

onehost show 0 -x > samples/host/0.xml
onehost show 1 -x > samples/host/1.xml

onehost list -x > samples/host_pool/0.xml


# VNets
onevnet list -x > samples/vnet_pool/1.xml

onevnet create test/vnet.0

onevnet list -x > samples/vnet_pool/2.xml

onevnet create test/vnet.1
onevnet create test/vnet.2

onecluster addvnet newcluster 0
onecluster addvnet newcluster 2

onevnet show 0 -x > samples/vnet/0.xml
onevnet show 1 -x > samples/vnet/1.xml
onevnet show 2 -x > samples/vnet/2.xml

onevnet list -x > samples/vnet_pool/3.xml


# Template
onetemplate list -x > samples/vmtemplate_pool/1.xml

onetemplate create test/template.0
onetemplate create test/template.1

onetemplate show 0 -x > samples/vmtemplate/0.xml
onetemplate show 1 -x > samples/vmtemplate/1.xml

onetemplate list -x > samples/vmtemplate_pool/2.xml


# VM
onetemplate instantiate 0

onevm show 0 -x > samples/vm/0.xml

onevm list -x > samples/vm_pool/0.xml

# Cluster
onecluster create emptycluster

onecluster show 100 -x > samples/cluster/0.xml
onecluster show 101 -x > samples/cluster/1.xml

onecluster list -x > samples/cluster_pool/0.xml


# Image
oneimage list -x > samples/image_pool/1.xml

oneimage create test/image.0 -d default
oneimage create test/image.1 -d default

oneimage show 0 -x > samples/image/0.xml
oneimage show 1 -x > samples/image/1.xml

oneimage list -x > samples/image_pool/3.xml


# Datastore
onedatastore create test/datastore.0
onedatastore create test/datastore.1

onecluster adddatastore newcluster 100
onecluster adddatastore newcluster 101

onedatastore show 100 -x > samples/datastore/0.xml
onedatastore show 101 -x > samples/datastore/1.xml

onedatastore list -x > samples/datastore_pool/0.xml


# User
oneuser create newuser abc
oneuser chgrp newuser newgroup

oneuser show newuser -x > samples/user/0.xml

oneuser list -x > samples/user_pool/0.xml


# Group
onegroup create emptygroup

onegroup show 0 -x > samples/group/0.xml
onegroup show 1 -x > samples/group/1.xml
onegroup show 100 -x > samples/group/2.xml
onegroup show 101 -x > samples/group/3.xml

onegroup list -x > samples/group_pool/0.xml



for i in  cluster datastore group host image vmtemplate user vm vnet
do
    POOL_NAME="$i""_pool"

    sed -i "s%<${i^^}>%<${i^^} xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$i.xsd'>%" samples/$i/*.xml
    sed -i "s%<${i^^}_POOL/>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'/>%" samples/$POOL_NAME/*.xml
    sed -i "s%<${i^^}_POOL>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'>%" samples/$POOL_NAME/*.xml

    xmllint --noout --schema $i.xsd samples/$i/*
    xmllint --noout --schema $POOL_NAME.xsd samples/$POOL_NAME/*
done

exit 0

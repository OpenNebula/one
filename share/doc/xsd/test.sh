#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
mkdir -p samples/vdc        samples/vdc_pool
mkdir -p samples/host       samples/host_pool
mkdir -p samples/image      samples/image_pool
mkdir -p samples/vmtemplate samples/vmtemplate_pool
mkdir -p samples/user       samples/user_pool
mkdir -p samples/vm         samples/vm_pool
mkdir -p samples/vnet       samples/vnet_pool
mkdir -p samples/vnet       samples/acct



onecluster create newcluster
onegroup create newgroup


# Host
onehost create host01 --im dummy --vm dummy --net dummy
onehost create host02 --im dummy --vm dummy --net dummy

onecluster addhost newcluster host02

for i in `onehost list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onehost show $i -x > samples/host/$i.xml
done

onehost list -x > samples/host_pool/0.xml


# VNets
onevnet list -x > samples/vnet_pool/1.xml

onevnet create test/vnet.0

onevnet list -x > samples/vnet_pool/2.xml

onevnet create test/vnet.1
onevnet create test/vnet.2

onecluster addvnet newcluster 0
onecluster addvnet newcluster 2

onevnet reserve 1 --address_range 1 --size 2 --name reserve

for i in `onevnet list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevnet show $i -x > samples/vnet/$i.xml
done

onevnet list -x > samples/vnet_pool/3.xml


# Template
onetemplate list -x > samples/vmtemplate_pool/1.xml

onetemplate create test/template.0
onetemplate create test/template.1

for i in `onetemplate list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onetemplate show $i -x > samples/vmtemplate/$i.xml
done

onetemplate list -x > samples/vmtemplate_pool/2.xml


# VM
onetemplate instantiate 0 -m 2
onetemplate instantiate 1 -m 2

for i in `onevm list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevm deploy $i host01
done

sleep 5

onevm migrate --live 0 0
onevm delete 1
onevm poweroff 2

sleep 5

onevm suspend 0
onevm resume 2

sleep 5

for i in `onevm list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevm show $i -x > samples/vm/$i.xml
done

onevm list -x > samples/vm_pool/0.xml

# Cluster
onecluster create emptycluster

for i in `onecluster list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onecluster show $i -x > samples/cluster/$i.xml
done

onecluster list -x > samples/cluster_pool/0.xml


# Image
oneimage list -x > samples/image_pool/1.xml

oneimage create test/image.0 -d default
oneimage create test/image.1 -d default

for i in `oneimage list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    oneimage show $i -x > samples/image/$i.xml
done

oneimage list -x > samples/image_pool/3.xml


# Datastore
onedatastore create test/datastore.0
onedatastore create test/datastore.1

onecluster adddatastore newcluster 100
onecluster adddatastore newcluster 101

for i in `onedatastore list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onedatastore show $i -x > samples/datastore/$i.xml
done

onedatastore list -x > samples/datastore_pool/0.xml


# User
oneuser create newuser abc
oneuser chgrp newuser newgroup

for i in `oneuser list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    oneuser show $i -x > samples/user/$i.xml
done

oneuser list -x > samples/user_pool/0.xml


# Group
onegroup create emptygroup

for i in `onegroup list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onegroup show $i -x > samples/group/$i.xml
done

onegroup list -x > samples/group_pool/0.xml

# VDC
onevdc create emptyvdc

onevdc create newvdc
onevdc addgroup newvdc 0 newgroup
onevdc addhost newvdc 0 host01
onevdc addcluster newvdc 0 newcluster

for i in `onevdc list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevdc show $i -x > samples/vdc/$i.xml
done

onevdc list -x > samples/vdc_pool/0.xml


for i in  cluster datastore group vdc host image vmtemplate user vm vnet
do
    POOL_NAME="$i""_pool"

    sed -i "s%<${i^^}>%<${i^^} xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$i.xsd'>%" samples/$i/*.xml
    sed -i "s%<${i^^}_POOL/>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'/>%" samples/$POOL_NAME/*.xml
    sed -i "s%<${i^^}_POOL>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'>%" samples/$POOL_NAME/*.xml

    xmllint --noout --schema $i.xsd samples/$i/*
    xmllint --noout --schema $POOL_NAME.xsd samples/$POOL_NAME/*
done


# Accounting
oneacct -x > samples/acct/0.xml

sed -i "s%<HISTORY_RECORDS>%<HISTORY_RECORDS xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../acct.xsd'>%" samples/acct/*.xml

xmllint --noout --schema acct.xsd samples/acct/*

exit 0

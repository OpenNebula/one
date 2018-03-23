#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                #
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
mkdir -p samples/vm_group    samples/vm_group_pool
mkdir -p samples/acct
mkdir -p samples/vrouter            samples/vrouter_pool
mkdir -p samples/marketplace        samples/marketplace_pool
mkdir -p samples/marketplaceapp     samples/marketplaceapp_pool
touch output.log
cp oned.conf /etc/one/oned.conf

echo "Creating new cluster..." >> output.log
onecluster create newcluster
echo "Creating new group..." >> output.log
onegroup create newgroup


# Host
echo "Creating new hosts..." >> output.log
onehost create host01 --im dummy --vm dummy
onehost create host02 --im dummy --vm dummy
onehost create host03 --im dummy --vm dummy

#Wait to monitor hosts
sleep 30

onecluster addhost newcluster host03

for i in `onehost list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onehost show $i -x > samples/host/$i.xml
done

onehost list -x > samples/host_pool/0.xml


# VNets
echo "Creating new vnets..." >> output.log
onevnet list -x > samples/vnet_pool/1.xml

onevnet create test/vnet.0

onevnet list -x > samples/vnet_pool/2.xml

onevnet create test/vnet.1
onevnet create test/vnet.2

echo "Adding vnets to cluster..." >> output.log
onecluster addvnet newcluster 0
onecluster addvnet newcluster 2

echo "Reserving vnet..." >> output.log
onevnet reserve 1 --address_range 1 --size 2 --name reserve

for i in `onevnet list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevnet show $i -x > samples/vnet/$i.xml
done

onevnet list -x > samples/vnet_pool/3.xml

# Cluster
echo "Creating new empty cluster..." >> output.log
onecluster create emptycluster

for i in `onecluster list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onecluster show $i -x > samples/cluster/$i.xml
done

onecluster list -x > samples/cluster_pool/0.xml


# Image
echo "Creating new images..." >> output.log
oneimage list -x > samples/image_pool/1.xml

oneimage create test/image.0 -d default
oneimage create test/image.1 -d default

for i in `oneimage list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    oneimage show $i -x > samples/image/$i.xml
done

oneimage list -x > samples/image_pool/3.xml


# Datastore
echo "Creating new datastores..." >> output.log
onedatastore create test/datastore.0
onedatastore create test/datastore.1

echo "Adding datastores to cluster..." >> output.log
onecluster adddatastore newcluster 100
onecluster adddatastore newcluster 101

for i in `onedatastore list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onedatastore show $i -x > samples/datastore/$i.xml
done

onedatastore list -x > samples/datastore_pool/0.xml


# User
echo "Creating new users..." >> output.log
oneuser defaultquota test/quota.txt

oneuser create newuser abc
oneuser chgrp newuser newgroup

echo "Creating token for an user..." >> output.log
echo "no" | oneuser token-create --user newuser --password abc --time 123
echo "no" | oneuser token-create --user newuser --password abc --time 456
echo "no" | oneuser token-create --user newuser --password abc --time 789

for i in `oneuser list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    oneuser show $i -x > samples/user/$i.xml
done

oneuser list -x > samples/user_pool/0.xml


# Group
echo "Creating new empty group..." >> output.log
onegroup defaultquota test/quota.txt

onegroup create emptygroup

for i in `onegroup list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onegroup show $i -x > samples/group/$i.xml
done

onegroup list -x > samples/group_pool/0.xml

# VDC
echo "Creating new empty vdc..." >> output.log
onevdc create emptyvdc

onevdc create newvdc
echo "Adding group to vnc..." >> output.log
onevdc addgroup newvdc newgroup
echo "Adding host to vnc..." >> output.log
onevdc addhost newvdc 0 host01
echo "Adding cluster to vnc..." >> output.log
onevdc addcluster newvdc 0 newcluster

for i in `onevdc list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevdc show $i -x > samples/vdc/$i.xml
done

onevdc list -x > samples/vdc_pool/0.xml


# Template
echo "Creating new template..." >> output.log
onetemplate list -x > samples/vmtemplate_pool/1.xml

onetemplate create test/template.0 --user newuser --password abc
onetemplate create test/template.1 --user newuser --password abc
onetemplate create test/vr-template.0

for i in `onetemplate list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onetemplate show $i -x > samples/vmtemplate/$i.xml
done

onetemplate list -x > samples/vmtemplate_pool/2.xml

# VM
echo "Instantiating a template..." >> output.log
onetemplate instantiate 0 -m 2 --user newuser --password abc
onetemplate instantiate 1 -m 2 --user newuser --password abc

# Virtual Routers
echo "Creating new vrouters..." >> output.log
onevrouter create test/vr.0
onevrouter instantiate 0 vr-tmpl -m 2

for i in `onevm list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevm deploy $i host01
done

sleep 5

echo "Executing action with a vm..." >> output.log
onevm migrate --live 0 host02
onevm terminate --hard 1
onevm poweroff 2
onevm poweroff 0

sleep 5

onevm snapshot-create 0

sleep 5

onevm resume 0

sleep 5

onevm disk-attach 0 -i 1
onevm disk-snapshot-create 0 0 disk_snapshot

onevm resume 2

sleep 5

for i in `onevm list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevm show $i -x > samples/vm/$i.xml
done

onevm list -x > samples/vm_pool/0.xml

for i in `onevrouter list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevrouter show $i -x > samples/vrouter/$i.xml
done

onevrouter list -x > samples/vrouter_pool/0.xml

echo "Working with markets..." >> output.log
# Marketplace

for i in `onemarket list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onemarket show $i -x > samples/marketplace/$i.xml
done

onemarket list -x > samples/marketplace_pool/0.xml

# Marketplace Apps

for i in `onemarketapp list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onemarketapp show $i -x > samples/marketplaceapp/$i.xml
done

onemarketapp list -x > samples/marketplaceapp_pool/0.xml

# VMGroups
echo "Creating new vmgroups..." >> output.log
onevmgroup list -x > samples/vm_group_pool/1.xml

onevmgroup create test/vm_group.0

onevmgroup list -x > samples/vm_group_pool/2.xml

for i in `onevmgroup list | tail -n +2 | tr -s ' ' | cut -f2 -d ' '`; do
    onevmgroup show $i -x > samples/vm_group/$i.xml
done

echo "Executing xmllint..." >> output.log
for i in  cluster datastore group vdc host image vmtemplate user vm vnet vrouter marketplace marketplaceapp vm_group
do
    POOL_NAME="$i""_pool"

    sed -i "s%<${i^^}>%<${i^^} xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$i.xsd'>%" samples/$i/*.xml
    sed -i "s%<${i^^}_POOL/>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'/>%" samples/$POOL_NAME/*.xml
    sed -i "s%<${i^^}_POOL>%<${i^^}_POOL xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../$POOL_NAME.xsd'>%" samples/$POOL_NAME/*.xml

    xmllint --noout --schema $i.xsd samples/$i/* >> output.log 2>&1
    xmllint --noout --schema $POOL_NAME.xsd samples/$POOL_NAME/* >> output.log 2>&1
done

# Accounting
oneacct -x > samples/acct/0.xml

sed -i "s%<HISTORY_RECORDS>%<HISTORY_RECORDS xmlns='http://opennebula.org/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://opennebula.org/XMLSchema ../../acct.xsd'>%" samples/acct/*.xml

xmllint --noout --schema acct.xsd samples/acct/* >> output.log 2>&1

exit 0

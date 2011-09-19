#!/bin/bash

# This script populates a DB with different resources
# Set the TWO_SERIES flag if the target OpenNebula is 2.0 or 2.2

# The oneadmin's auth must be in ~/.one/one_auth

TWO_SERIES="no"
#TWO_SERIES="yes"

ONEADMIN_AUTH=$ONE_AUTH

TMP_FILE="tmp_file"

# 5 Users

for i in 0 1 2 3 4; do
    echo "user_$i:pass_$i" > one_auth$i
    oneuser create user_$i pass_$i
done


# 5 Hosts

for i in 0 1 2 3 4; do
    onehost create host_$i im_dummy vmm_dummy tm_dummy
done

# 3 Fixed VNets

for i in 0 1 2; do
    (   echo "NAME = vnet_fixed_$i"
        echo "TYPE = FIXED"
        echo "PUBLIC = FIXED"
        echo "BRIDGE = vbr1"
        echo "EXTRA_ATT = \"EXTRA_VALUE FOR VNET $i\""
        echo "LEASES = [IP=192.168.$i.1]"
        echo "LEASES = [IP=192.168.$i.2]"
        echo "LEASES = [IP=192.168.$i.3]"
        echo "LEASES = [IP=192.168.$i.4]"
        echo "LEASES = [IP=192.168.$i.5]"
    ) > $TMP_FILE

    # Change auth
    export ONE_AUTH="`pwd`/one_auth$i"

    onevnet create $TMP_FILE
done

# 2 Ranged VNets

for i in 3 4; do
    (   echo "NAME = vnet_ranged_$i"
        echo "TYPE = RANGED"
        echo "BRIDGE = vbr0"
        echo "NETWORK_SIZE    = C"
        echo "NETWORK_ADDRESS = 192.168.$i.0"
        echo "EXTRA_ATT       = \"EXTRA_VALUE FOR VNET $i\""
    ) > $TMP_FILE

    # Change auth
    export ONE_AUTH="`pwd`/one_auth$i"

    onevnet create $TMP_FILE
    onevnet publish $i
done

# 5 Images

for i in 0 1 2 3 4; do
    (   echo "NAME          = image_$i"
        echo "TYPE          = DATABLOCK"
        echo "PATH          = /dev/null"
        echo "EXTRA_ATT     = \"EXTRA_VALUE FOR IMG $i\""
    ) > $TMP_FILE

    export ONE_AUTH="`pwd`/one_auth$i"

    oneimage create $TMP_FILE
done

# 5 VMs

for i in 0 1 2 3 4; do
    (   echo "NAME   = one-$i                      "
        echo "CPU    = $i                          "
        echo "MEMORY = 512                         "

        echo "OS = [                               "
        echo "  kernel   = vmlinuz,                "
        echo "  initrd   = initrd.img,             "
        echo "  root     = sda ]                   "
        echo "DISK = [ IMAGE_ID = $i ]             "

        echo "DISK = [                             "
        echo "  type     = swap,                   "
        echo "  size     = 1024,                   "
        echo "  readonly = no ]                    "

        echo "NIC = [ NETWORK_ID = $i ]            "

        echo "REQUIREMENTS = \"CPUSPEED > 1000\"   "
        echo "RANK         = FREECPU               "
        echo "CONTEXT = [ files = \"/dev/null\"  ] "

        echo "EXTRA_ATT = \"EXTRA_VALUE FOR VM $i\""
    ) > $TMP_FILE

    export ONE_AUTH="`pwd`/one_auth$i"

    if [ $TWO_SERIES == "yes" ]; then
        onevm create $TMP_FILE
    else
        onetemplate create $TMP_FILE
        onetemplate instantiate $i
    fi
done


if [ -n "$ONEADMIN_AUTH" ] ; then
    export ONE_AUTH=$ONEADMIN_AUTH
else
    # Unset the one_auth file, cli will look for it in ~/.one/one_auth
    unset ONE_AUTH
fi

for i in 0 1 2 3; do
    onevm deploy $i $i
done

rm $TMP_FILE


echo -n "Waiting until all VMs are running "

while [ $(onevm list a | grep -c runn) -ne 4 ]; do
    echo -n "."
    sleep 0.5s
done

echo " ok"

# Wait for some monitorization data
sleep 3s


onevm migrate 0 1
while [ $(onevm list a | grep -c runn) -ne 4 ]; do sleep 0.5s; done


onevm livemigrate 1 2
while [ $(onevm list a | grep -c runn) -ne 4 ]; do sleep 0.5s; done

onevm stop 1
while [ $(onevm list a | grep -c stop) -ne 1 ]; do sleep 0.5s; done

onevm resume 1
while [ $(onevm list a | grep -c pend) -ne 2 ]; do sleep 0.5s; done

onevm deploy 1 0
while [ $(onevm list a | grep -c runn) -ne 4 ]; do sleep 0.5s; done

onevm migrate 1 3
while [ $(onevm list a | grep -c runn) -ne 4 ]; do sleep 0.5s; done

onevm shutdown 1
while [ $(onevm list a | grep -c runn) -ne 3 ]; do sleep 0.5s; done

onevm shutdown 2
while [ $(onevm list a | grep -c runn) -ne 2 ]; do sleep 0.5s; done

onevm delete 3
while [ $(onevm list a | grep -c runn) -ne 1 ]; do sleep 0.5s; done

onehost disable 3
oneimage persistent 3
onevnet publish 2
onevnet unpublish 3

# Wait for some monitorization data
sleep 3s

mkdir -p results/xml_files

for obj in vnet image vm; do
    one$obj list a -x > results/xml_files/$obj-pool.xml
done

for obj in host user; do
    one$obj list -x > results/xml_files/$obj-pool.xml
done

for obj in host vnet image vm user; do
    for i in 0 1 2 3 4; do
        one$obj show -x $i > results/xml_files/$obj-$i.xml
    done
done

if [ $TWO_SERIES == "no" ]; then
    oneacl list -x > results/xml_files/acl-pool.xml
    onegroup list -x > results/xml_files/group-pool.xml

    for i in 0 1; do
        onegroup show -x $i > results/xml_files/group-$i.xml
    done
fi

# Clean one auth files
for i in 0 1 2 3 4; do
    rm one_auth$i
done

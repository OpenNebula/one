#!/bin/bash

TWO_SERIES="no"
#TWO_SERIES="yes"


TMP_FILE="tmp_file"


# 5 Hosts and Clusters

for i in 0 1 2 3 4; do
    onehost create host_$i im_dummy vmm_dummy tm_dummy
done

# 3 Fixed VNets

for i in 0 1 2; do
    (   echo "NAME = vnet_fixed_$i"
        echo "TYPE = FIXED"
        echo "BRIDGE = vbr1"
        echo "LEASES = [IP=192.168.$i.1]"
        echo "LEASES = [IP=192.168.$i.2]"
        echo "LEASES = [IP=192.168.$i.3]"
        echo "LEASES = [IP=192.168.$i.4]"
        echo "LEASES = [IP=192.168.$i.5]"
    ) > $TMP_FILE

    onevnet create $TMP_FILE
done

# 2 Ranged VNets

for i in 3 4; do
    (   echo "NAME = vnet_ranged_$i"
        echo "TYPE = RANGED"
        echo "BRIDGE = vbr0"
        echo "NETWORK_SIZE    = C"
        echo "NETWORK_ADDRESS = 192.168.$i.0"
    ) > $TMP_FILE

    onevnet create $TMP_FILE
done

# 5 Images

for i in 0 1 2 3 4; do
    (   echo "NAME          = image_$i"
        echo "TYPE          = DATABLOCK"
        echo "PATH          = /dev/null"
    ) > $TMP_FILE

    oneimage create $TMP_FILE
done

# 5 Users

for i in 0 1 2 3 4; do
    oneuser create user_$i pass_$i
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
    ) > $TMP_FILE

    if [ $TWO_SERIES == "yes" ]; then
        onevm create $TMP_FILE
    else
        onetemplate create $TMP_FILE
        onetemplate instantiate $i
    fi

    onevm deploy $i $i
done

rm $TMP_FILE

echo -n "Waiting until all VMs are running "

while [ $(onevm list | grep -c runn) -ne 5 ]; do
    echo -n "."
    sleep 0.5s
done

echo " ok"

# Wait for some monitorization data
sleep 3s

onevm migrate 0 1
while [ $(onevm list | grep -c runn) -ne 5 ]; do sleep 0.5s; done

onevm livemigrate 1 2
while [ $(onevm list | grep -c runn) -ne 5 ]; do sleep 0.5s; done

onevm shutdown 2
while [ $(onevm list | grep -c runn) -ne 4 ]; do sleep 0.5s; done

onevm delete 3
while [ $(onevm list | grep -c runn) -ne 3 ]; do sleep 0.5s; done

onehost disable 3
oneimage persistent 3
onevnet publish 2
onevnet unpublish 3

# Wait for some monitorization data
sleep 3s

mkdir -p results/xml_files

for obj in host vnet image vm; do
    for i in 0 1 2 3 4; do
        one$obj show -x $i > results/xml_files/$obj-$i.xml
    done
done

#!/bin/bash

if [ -z "${ONE_LOCATION}" ]; then
    echo "ONE_LOCATION is not defined. Don't know where to copy, aborting."
    exit -1
fi

echo -n "Installing VMWare drivers."

if [ ! -f GetProperty.java ]; then
    ln -s ../../im_mad/vmware/GetProperty.java GetProperty.java
fi
 
javac *.java
cp *class $ONE_LOCATION/lib/mads
cp one_vmm_vmware $ONE_LOCATION/lib/mads
chmod +x $ONE_LOCATION/lib/mads/one_vmm_vmware

echo -n "."

cd ../../im_mad/vmware/
javac *.java
cp *class $ONE_LOCATION/lib/mads
cp one_im_vmware $ONE_LOCATION/lib/mads
chmod +x $ONE_LOCATION/lib/mads/one_im_vmware
cd - &> /dev/null

cd ../../tm_mad/vmware
mkdir -p $ONE_LOCATION/lib/tm_commands/vmware
cp *sh $ONE_LOCATION/lib/tm_commands/vmware

echo -n "."

mkdir -p $ONE_LOCATION/etc/im_vmware
mkdir -p $ONE_LOCATION/etc/vmm_vmware
mkdir -p $ONE_LOCATION/etc/tm_vmware

cp tm_vmware.conf tm_vmwarerc $ONE_LOCATION/etc/tm_vmware
cp ../../vmm_mad/vmware/vmm_vmwarerc $ONE_LOCATION/etc/vmm_vmware
cp ../../im_mad/vmware/im_vmwarerc $ONE_LOCATION/etc/im_vmware

echo "done"



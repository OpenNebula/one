#!/bin/bash

if [ -z "${ONE_LOCATION}" ]; then
    echo "ONE_LOCATION is not defined. Don't know where to copy, aborting."
    exit -1
fi

echo -n "Installing VMWare drivers."

javac OneVmmVmware.java
cp *class $ONE_LOCATION/lib/mads
cp one_vmm_vmware $ONE_LOCATION/bin

cd ../../im_mad/vmware/
javac OneImVmware.java
cp *class $ONE_LOCATION/lib/mads
cp one_im_vmware $ONE_LOCATION/bin
cd -

echo -n "."

mkdir $ONE_LOCATION/etc/im_vmware
mkdir $ONE_LOCATION/etc/vmm_vmware

cp vmm_vmware.conf vmm_vmwarerc $ONE_LOCATION/etc/vmm_vmware
cp im_vmware.conf im_vmwarerc $ONE_LOCATION/etc/im_vmware

echo "done"



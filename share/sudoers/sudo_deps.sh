#!/bin/bash 

if apt-get install -y opennebula-node-lxd lvm2 ceph-common openvswitch-switch rbd-nbd; then
    exit 0
else
    yum install -y opennebula-node-kvm lvm2 ceph-common || exit 1

    # ovs build deps
    yum install -y wget openssl-devel python-six python-sphinx gcc make python-devel openssl-devel kernel-devel graphviz kernel-debug-devel autoconf automake rpm-build redhat-rpm-config libtool python-twisted-core python-zope-interface PyQt4 desktop-file-utils libcap-ng-devel groff checkpolicy selinux-policy-devel openssl
    # ovs build
    mkdir -p ~/rpmbuild/SOURCES
    wget http://openvswitch.org/releases/openvswitch-2.9.2.tar.gz
    cp openvswitch-2.9.2.tar.gz ~/rpmbuild/SOURCES/
    tar xfz openvswitch-2.9.2.tar.gz
    rpmbuild -bb --nocheck openvswitch-2.9.2/rhel/openvswitch-fedora.spec
    # ovs package install
    yum localinstall -y ~/rpmbuild/RPMS/x86_64/openvswitch-2.9.2-1.el7.x86_64.rpm
fi
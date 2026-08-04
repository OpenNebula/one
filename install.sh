#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

#-------------------------------------------------------------------------------
# Install program for OpenNebula. It will install it relative to
# $ONE_LOCATION if defined with the -d option, otherwise it'll be installed
# under /. In this case you may specified the oneadmin user/group, so you do
# not need run the OpenNebula daemon with root privileges
#-------------------------------------------------------------------------------

#shellcheck disable=SC2034,SC2054

#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: install.sh [-u install_user] [-g install_group] [-k keep conf]"
 echo "                  [-d ONE_LOCATION] [-a arch] [-r] [-l] [-h]"
 echo
 echo "-u: user that will run opennebula, defaults to user executing install.sh"
 echo "-g: group of the user that will run opennebula, defaults to user"
 echo "    executing install.sh"
 echo "-k: keep configuration files of existing OpenNebula installation, useful"
 echo "    when upgrading. This flag should not be set when installing"
 echo "    OpenNebula for the first time"
 echo "-d: target installation directory, if not defined it'd be root. Must be"
 echo "    an absolute path."
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-a: architecture of downloaded vendor artifacts, default: x86_64"
 echo "-h: prints this help"
 echo
 echo "The DESTDIR environment variable prefixes all installed paths, useful"
 echo "for packaging, e.g. DESTDIR=dist ./install.sh"
}
#-------------------------------------------------------------------------------

PARAMETERS=":u:g:d:a:hkrl"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
ONEADMIN_USER=$(id -u)
ONEADMIN_GROUP=$(id -g)
SRC_DIR=$PWD
ARCH="x86_64"

while getopts $PARAMETERS opt; do
    case $opt in
        h) usage; exit 0;;
        k) INSTALL_ETC="no" ;;
        r) UNINSTALL="yes" ;;
        l) LINK="yes" ;;
        u) ONEADMIN_USER="$OPTARG" ;;
        g) ONEADMIN_GROUP="$OPTARG" ;;
        a) ARCH="$OPTARG" ;;
        d) ROOT="$OPTARG" ;;
        \?) usage; exit 1 ;;
    esac
done

shift $((OPTIND - 1))

if [ "$ARCH" != x86_64 ] && [ "$ARCH" != arm64 ]; then
    echo "Unsupported architecture: $ARCH, only x86_64 or arm64"
    exit 1
fi

#-------------------------------------------------------------------------------
# Definition of locations
#-------------------------------------------------------------------------------

if [ -z "$ROOT" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    SBIN_LOCATION="/usr/sbin"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    ODS_LOCATION="$LIB_LOCATION/ods"
    FIREEDGE_LOCATION="$LIB_LOCATION/fireedge"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    ONEFORM_LOCATION="$LIB_LOCATION/oneform"
    ONEHEM_LOCATION="$LIB_LOCATION/onehem"
    ONEKS_LOCATION="$LIB_LOCATION/oneks"
    ONEKS_SPECS_LOCATION="$VAR_LOCATION/oneks"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    RUN_LOCATION="/var/run/one"
    LOCK_LOCATION="/var/lock/one"
    SHARE_LOCATION="/usr/share/one"
    MAN_LOCATION="/usr/share/man/man1"
    VM_LOCATION="/var/lib/one/vms"
    DOCS_LOCATION="/usr/share/doc/one"
    ANS_LOCATION="$SHARE_LOCATION/ansible"

    ONEFORM_PROVIDERS_LOCATION="$ONEFORM_LOCATION/drivers"
    ONEFORM_PROVIDERS_STATES_LOCATION="$VAR_LOCATION/oneform/drivers/.states"
    ONEFORM_EXTERNAL_PROVIDERS_LOCATION="$VAR_LOCATION/oneform/drivers"

    ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION="/var/lib/alertmanager"
    ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION="/var/lib/prometheus"

    ONEPROMETHEUS_DIRS="$ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION \
                        $ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION"

    MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
               $SHARE_LOCATION $DOCS_LOCATION \
               $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
               $SYSTEM_DS_LOCATION $DEFAULT_DS_LOCATION $MAN_LOCATION \
               $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION $ONEFORM_LOCATION \
               $ONEHEM_LOCATION $ONEPROMETHEUS_DIRS $ODS_LOCATION $ANS_LOCATION \
               $ONEFORM_PROVIDERS_LOCATION $ONEFORM_EXTERNAL_PROVIDERS_LOCATION \
               $ONEFORM_PROVIDERS_STATES_LOCATION"

    DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                 $RUN_LOCATION"

    CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION $LOCK_LOCATION"
else
    BIN_LOCATION="$ROOT/bin"
    SBIN_LOCATION="$ROOT/sbin"
    LIB_LOCATION="$ROOT/lib"
    ETC_LOCATION="$ROOT/etc"
    VAR_LOCATION="$ROOT/var"
    RUN_LOCATION="$VAR_LOCATION/run"
    LOCK_LOCATION="$VAR_LOCATION/lock"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    ODS_LOCATION="$LIB_LOCATION/ods"
    FIREEDGE_LOCATION="$LIB_LOCATION/fireedge"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    ONEFORM_LOCATION="$LIB_LOCATION/oneform"
    ONEHEM_LOCATION="$LIB_LOCATION/onehem"
    ONEKS_LOCATION="$LIB_LOCATION/oneks"
    ONEKS_SPECS_LOCATION="$VAR_LOCATION/oneks"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    SHARE_LOCATION="$ROOT/share"
    MAN_LOCATION="$ROOT/share/man/man1"
    VM_LOCATION="$VAR_LOCATION/vms"
    DOCS_LOCATION="$ROOT/share/doc"
    ANS_LOCATION="$SHARE_LOCATION/ansible"

    ONEFORM_PROVIDERS_LOCATION="$LIB_LOCATION/oneform/drivers"
    ONEFORM_PROVIDERS_STATES_LOCATION="$VAR_LOCATION/oneform/drivers/.states"
    ONEFORM_EXTERNAL_PROVIDERS_LOCATION="$VAR_LOCATION/oneform/drivers"

    ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION="$ROOT/var/alertmanager"
    ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION="$ROOT/var/prometheus"

    ONEPROMETHEUS_DIRS="$ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION \
                        $ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION"

    MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
               $SHARE_LOCATION $SYSTEM_DS_LOCATION \
               $DEFAULT_DS_LOCATION $MAN_LOCATION $DOCS_LOCATION \
               $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION $ONEFORM_LOCATION \
               $ONEHEM_LOCATION $LOCK_LOCATION $RUN_LOCATION \
               $ONEPROMETHEUS_DIRS $ODS_LOCATION $ANS_LOCATION \
               $ONEFORM_PROVIDERS_LOCATION $ONEFORM_EXTERNAL_PROVIDERS_LOCATION \
               $ONEFORM_PROVIDERS_STATES_LOCATION"

    DELETE_DIRS="$MAKE_DIRS"

    CHOWN_DIRS="$ROOT"
fi

# Directories that are installed empty. Every other directory is created on
# demand, from the destinations in the INSTALL tables.
EMPTY_DIRS="$ETC_LOCATION/auth/certificates \
            $SHARE_LOCATION/providers \
            $VAR_LOCATION/remotes/etc/tm/local \
            $VAR_LOCATION/remotes/im/dummy-probes.d/vm/snapshot \
            $VAR_LOCATION/remotes/im/lxc-probes.d/vm/execution \
            $VAR_LOCATION/remotes/im/lxc-probes.d/vm/snapshot \
            $VAR_LOCATION/remotes/im/qemu-probes.d/vm/execution \
            $VAR_LOCATION/remotes/onebex/etc \
            $VAR_LOCATION/remotes/vnm/802.1Q/clean.d \
            $VAR_LOCATION/remotes/vnm/802.1Q/post.d \
            $VAR_LOCATION/remotes/vnm/802.1Q/pre.d \
            $VAR_LOCATION/remotes/vnm/bridge/clean.d \
            $VAR_LOCATION/remotes/vnm/bridge/post.d \
            $VAR_LOCATION/remotes/vnm/bridge/pre.d \
            $VAR_LOCATION/remotes/vnm/dummy/clean.d \
            $VAR_LOCATION/remotes/vnm/dummy/post.d \
            $VAR_LOCATION/remotes/vnm/dummy/pre.d \
            $VAR_LOCATION/remotes/vnm/elastic/clean.d \
            $VAR_LOCATION/remotes/vnm/elastic/pre.d \
            $VAR_LOCATION/remotes/vnm/fw/clean.d \
            $VAR_LOCATION/remotes/vnm/fw/post.d \
            $VAR_LOCATION/remotes/vnm/fw/pre.d \
            $VAR_LOCATION/remotes/vnm/hooks/post \
            $VAR_LOCATION/remotes/vnm/ovswitch/clean.d \
            $VAR_LOCATION/remotes/vnm/ovswitch/post.d \
            $VAR_LOCATION/remotes/vnm/ovswitch/pre.d \
            $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/clean.d \
            $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/post.d \
            $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/pre.d \
            $VAR_LOCATION/remotes/vnm/vxlan/clean.d \
            $VAR_LOCATION/remotes/vnm/vxlan/post.d \
            $VAR_LOCATION/remotes/vnm/vxlan/pre.d"

MAKE_DIRS="$MAKE_DIRS $EMPTY_DIRS"

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# FILE DEFINITION, WHAT IS GOING TO BE INSTALLED AND WHERE
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
INSTALL_FILES=(
    BIN_FILES:"$BIN_LOCATION"
    SBIN_FILES:"$SBIN_LOCATION"
    MAN_FILES:"$MAN_LOCATION"
    DOCS_FILES:"$DOCS_LOCATION"

    RUBY_LIB_FILES:"$LIB_LOCATION"/ruby
    RUBY_AUTH_LIB_FILES:"$LIB_LOCATION"/ruby/opennebula

    MAD_RUBY_LIB_FILES:"$LIB_LOCATION"/ruby
    MAD_RUBY_LIB_FILES:"$VAR_LOCATION"/remotes
    MADS_LIB_FILES:"$LIB_LOCATION"/mads
    REMOTE_FILES:"$VAR_LOCATION"/remotes

    IM_PROBES_FILES:"$VAR_LOCATION"/remotes/im
    IM_PROBES_ETC_KVM_PROBES_FILES:"$VAR_LOCATION"/remotes/etc/im/kvm-probes.d
    IM_PROBES_QEMU_HOST_SYSTEM_FILES:"$VAR_LOCATION"/remotes/im/qemu-probes.d/host/system
    IM_PROBES_ETC_QEMU_PROBES_FILES:"$VAR_LOCATION"/remotes/etc/im/qemu-probes.d
    IM_PROBES_DUMMY_VM_STATUS_FILES:"$VAR_LOCATION"/remotes/im/dummy-probes.d/vm/status
    IM_PROBES_LXC_HOST_SYSTEM_FILES:"$VAR_LOCATION"/remotes/im/lxc-probes.d/host/system
    IM_PROBES_LXC_PROBES_FILES:"$VAR_LOCATION"/remotes/im/lxc-probes.d
    IM_PROBES_ETC_LXC_PROBES_FILES:"$VAR_LOCATION"/remotes/etc/im/lxc-probes.d
    IM_PROBES_VERSION:"$VAR_LOCATION"/remotes

    AUTH_SSH_FILES:"$VAR_LOCATION"/remotes/auth/ssh
    AUTH_X509_FILES:"$VAR_LOCATION"/remotes/auth/x509
    AUTH_LDAP_FILES:"$VAR_LOCATION"/remotes/auth/ldap
    AUTH_SAML_FILES:"$VAR_LOCATION"/remotes/auth/saml
    AUTH_SERVER_X509_FILES:"$VAR_LOCATION"/remotes/auth/server_x509
    AUTH_SERVER_CIPHER_FILES:"$VAR_LOCATION"/remotes/auth/server_cipher

    VMM_EXEC_LXC_LIB:"$VAR_LOCATION"/remotes/vmm/lxc
    VMM_EXEC_ETC_KVM_SCRIPTS:"$VAR_LOCATION"/remotes/etc/vmm/kvm
    VMM_EXEC_ETC_LXC_SCRIPTS:"$VAR_LOCATION"/remotes/etc/vmm/lxc
    VMM_EXEC_ETC_LXC_PROFILES:"$VAR_LOCATION"/remotes/etc/vmm/lxc/profiles

    TM_FILES:"$VAR_LOCATION"/remotes/tm
    TM_FS_LVM_ETC_FILES:"$VAR_LOCATION"/remotes/etc/tm/fs_lvm
    TM_SSH_ETC_FILES:"$VAR_LOCATION"/remotes/etc/tm/ssh

    DATASTORE_DRIVER_COMMON_SCRIPTS:"$VAR_LOCATION"/remotes/datastore/
    DATASTORE_DRIVER_ETC_FS_SCRIPTS:"$VAR_LOCATION"/remotes/etc/datastore/fs
    DATASTORE_DRIVER_ETC_CEPH_SCRIPTS:"$VAR_LOCATION"/remotes/etc/datastore/ceph
    DATASTORE_DRIVER_ETC_SCRIPTS:"$VAR_LOCATION"/remotes/etc/datastore

    MARKETPLACE_DRIVER_ETC_HTTP_SCRIPTS:"$VAR_LOCATION"/remotes/etc/market/http

    SCHEDULER_DRIVER_RANK_SCRIPTS:"$VAR_LOCATION"/remotes/scheduler/rank
    SCHEDULER_DRIVER_ONEDRS_SCRIPTS:"$VAR_LOCATION"/remotes/scheduler/one_drs
    SCHEDULER_DRIVER_ONEDRS_VENDOR:"$LIB_LOCATION"/python

    NETWORK_HOOKS_PRE_FILES:"$VAR_LOCATION"/remotes/vnm/hooks/pre
    NETWORK_HOOKS_CLEAN_FILES:"$VAR_LOCATION"/remotes/vnm/hooks/clean
    NETWORK_ETC_FILES:"$VAR_LOCATION"/remotes/etc/vnm

    INSTALL_GEMS_SHARE_FILES:"$SHARE_LOCATION"

    CLI_LIB_FILES:"$LIB_LOCATION"/ruby/cli

    ONETOKEN_SHARE_FILE:"$SHARE_LOCATION"
    CONTEXT_SHARE:"$SHARE_LOCATION"/context

    FOLLOWER_CLEANUP_SHARE_FILE:"$SHARE_LOCATION"
    PRE_CLEANUP_SHARE_FILE:"$SHARE_LOCATION"

    HOOK_RAFT_FILES:"$VAR_LOCATION"/remotes/hooks/raft

    SSH_SH_LIB_FILES:"$LIB_LOCATION"/sh
    SSH_SH_OVERRIDE_LIB_FILES:"$LIB_LOCATION"/sh/override

    ONEPROMETHEUS_ALERTMANAGER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_ALERTMANAGER_FILES:"$LIB_LOCATION"/alertmanager

    ONEPROMETHEUS_GRAFANA_FILES:"$SHARE_LOCATION"/grafana

    ONEPROMETHEUS_LVM_EXPORTER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_LVM_EXPORTER_FILES:"$LIB_LOCATION"/lvm_exporter

    ONEPROMETHEUS_MYSQLD_EXPORTER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_MYSQLD_EXPORTER_FILES:"$LIB_LOCATION"/mysqld_exporter

    ONEPROMETHEUS_NODE_EXPORTER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_NODE_EXPORTER_FILES:"$LIB_LOCATION"/node_exporter

    ONEPROMETHEUS_OVS_EXPORTER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_OVS_EXPORTER_FILES:"$LIB_LOCATION"/ovs_exporter

    ONEPROMETHEUS_PROMETHEUS_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_PROMETHEUS_FILES:"$LIB_LOCATION"/prometheus
    ONEPROMETHEUS_PROMETHEUS_SHARE_FILES:"$SHARE_LOCATION"/prometheus

    ONEPROMETHEUS_SMARTCTL_EXPORTER_BIN_FILES:"$BIN_LOCATION"
    ONEPROMETHEUS_SMARTCTL_EXPORTER_FILES:"$LIB_LOCATION"/smartctl_exporter

    ONEBEX_FILES:"$VAR_LOCATION"/remotes/onebex
)

# Subtree entries installed by do_tree, one per line:
#
#     source_dir:destination_dir[:exclude,exclude,...]
#
# The whole contents of source_dir is installed into destination_dir, which
# is created automatically. Optional excludes are shell glob patterns matched
# against the top level entries of source_dir, for files that are installed
# elsewhere by other entries.
INSTALL_TREES=(
    src/oca/ruby/opennebula/lib:"$LIB_LOCATION"/ruby/opennebula/lib
    src/oca/ruby/opennebula/grpc/lib:"$LIB_LOCATION"/ruby/opennebula/grpc/lib
    src/oca/ruby/opennebula/grpc:"$LIB_LOCATION"/ruby/opennebula/grpc:lib,Makefile
    src/oca/ruby/opennebula:"$LIB_LOCATION"/ruby/opennebula:flow,form,grpc,lib,ods
    src/oca/ruby/opennebula/flow:"$LIB_LOCATION"/ruby/opennebula/flow:grammar.treetop
    src/oca/ruby/opennebula/form:"$LIB_LOCATION"/ruby/opennebula/form
    src/oca/ruby/opennebula/ods:"$LIB_LOCATION"/ruby/opennebula/ods
    src/mad/sh:"$LIB_LOCATION"/sh:create_docker_image.sh,madcommon.sh
    src/mad/sh:"$VAR_LOCATION"/remotes:create_docker_image.sh,madcommon.sh
    src/onedb:"$LIB_LOCATION"/ruby/onedb:local,onedb,patches,shared,test
    src/onedb/shared:"$LIB_LOCATION"/ruby/onedb/shared
    src/onedb/local:"$LIB_LOCATION"/ruby/onedb/local
    src/im_mad/remotes/lib:"$VAR_LOCATION"/remotes/im/lib:probe_db.conf,python
    src/im_mad/remotes/lib/python:"$VAR_LOCATION"/remotes/im/lib/python:pyoneai
    src/im_mad/remotes/lib/python/pyoneai:"$VAR_LOCATION"/remotes/im/lib/python/pyoneai:tests
    src/vmm_mad/remotes/lib:"$VAR_LOCATION"/remotes/vmm/lib:kvm,lxc
    src/vmm_mad/remotes/kvm:"$VAR_LOCATION"/remotes/vmm/kvm:kvmrc,vgpu,vtpm_setup
    src/tm_mad/lib:"$VAR_LOCATION"/remotes/tm/lib
    src/tm_mad/lvm:"$VAR_LOCATION"/remotes/tm/lvm
    src/datastore_mad/remotes/dummy:"$VAR_LOCATION"/remotes/datastore/dummy
    src/datastore_mad/remotes/lvm:"$VAR_LOCATION"/remotes/datastore/lvm
    src/market_mad/remotes/http:"$VAR_LOCATION"/remotes/market/http:http.conf
    src/market_mad/remotes/one:"$VAR_LOCATION"/remotes/market/one
    src/market_mad/remotes/s3:"$VAR_LOCATION"/remotes/market/s3
    src/market_mad/remotes/linuxcontainers:"$VAR_LOCATION"/remotes/market/linuxcontainers
    src/ipamm_mad/remotes/dummy:"$VAR_LOCATION"/remotes/ipam/dummy
    src/schedm_mad/remotes/dummy:"$VAR_LOCATION"/remotes/scheduler/dummy
    src/schedm_mad/remotes/one_drs/lib:"$VAR_LOCATION"/remotes/scheduler/one_drs/lib:mapper,models
    src/schedm_mad/remotes/one_drs/lib/mapper:"$VAR_LOCATION"/remotes/scheduler/one_drs/lib/mapper
    src/schedm_mad/remotes/one_drs/lib/models:"$VAR_LOCATION"/remotes/scheduler/one_drs/lib/models
    src/vnm_mad/remotes/lib:"$VAR_LOCATION"/remotes/vnm
    src/cli/one_helper:"$LIB_LOCATION"/ruby/cli/one_helper
    src/cloud/common:"$LIB_LOCATION"/ruby/cloud:CloudAuth
    src/cloud/common/CloudAuth:"$LIB_LOCATION"/ruby/cloud/CloudAuth:SunstoneCloudAuth.rb
    share/start-scripts:"$SHARE_LOCATION"/start-scripts
    share/hooks/autostart:"$VAR_LOCATION"/remotes/hooks/autostart
    share/hooks/ft:"$VAR_LOCATION"/remotes/hooks/ft
    share/schemas/libvirt:"$SHARE_LOCATION"/schemas/libvirt
    share/doc/xsd:"$SHARE_LOCATION"/schemas/xsd:README.txt
    share/ssh/etc:"$SHARE_LOCATION"/ssh
    src/oneprometheus/opennebula-libvirt-exporter/src:"$LIB_LOCATION"/libvirt_exporter
    src/onebex/app:"$VAR_LOCATION"/remotes/onebex/app
    src/onebex/exporters:"$VAR_LOCATION"/remotes/onebex/exporters
    src/onedb/patches:"$LIB_LOCATION"/ruby/onedb/patches
    src/im_mad/remotes/kvm.d:"$VAR_LOCATION"/remotes/im/kvm.d
    src/im_mad/remotes/qemu.d:"$VAR_LOCATION"/remotes/im/qemu.d
    src/im_mad/remotes/dummy.d:"$VAR_LOCATION"/remotes/im/dummy.d
    src/im_mad/remotes/lxc.d:"$VAR_LOCATION"/remotes/im/lxc.d
    src/im_mad/remotes/kvm-probes.d/host/beacon:"$VAR_LOCATION"/remotes/im/kvm-probes.d/host/beacon
    src/im_mad/remotes/kvm-probes.d/host/monitor:"$VAR_LOCATION"/remotes/im/kvm-probes.d/host/monitor
    src/im_mad/remotes/kvm-probes.d/host/system:"$VAR_LOCATION"/remotes/im/kvm-probes.d/host/system:nfs_automounted.rb
    src/im_mad/remotes/kvm-probes.d/vm/monitor:"$VAR_LOCATION"/remotes/im/kvm-probes.d/vm/monitor
    src/im_mad/remotes/kvm-probes.d/vm/status:"$VAR_LOCATION"/remotes/im/kvm-probes.d/vm/status
    src/im_mad/remotes/kvm-probes.d/vm/execution:"$VAR_LOCATION"/remotes/im/kvm-probes.d/vm/execution
    src/im_mad/remotes/kvm-probes.d/vm/snapshot:"$VAR_LOCATION"/remotes/im/kvm-probes.d/vm/snapshot
    src/im_mad/remotes/qemu-probes.d/host/beacon:"$VAR_LOCATION"/remotes/im/qemu-probes.d/host/beacon
    src/im_mad/remotes/qemu-probes.d/host/monitor:"$VAR_LOCATION"/remotes/im/qemu-probes.d/host/monitor:prediction.sh
    src/im_mad/remotes/qemu-probes.d/vm/monitor:"$VAR_LOCATION"/remotes/im/qemu-probes.d/vm/monitor
    src/im_mad/remotes/qemu-probes.d/vm/status:"$VAR_LOCATION"/remotes/im/qemu-probes.d/vm/status
    src/im_mad/remotes/qemu-probes.d/vm/snapshot:"$VAR_LOCATION"/remotes/im/qemu-probes.d/vm/snapshot
    src/im_mad/remotes/dummy-probes.d/host/beacon:"$VAR_LOCATION"/remotes/im/dummy-probes.d/host/beacon
    src/im_mad/remotes/dummy-probes.d/host/monitor:"$VAR_LOCATION"/remotes/im/dummy-probes.d/host/monitor
    src/im_mad/remotes/dummy-probes.d/host/system:"$VAR_LOCATION"/remotes/im/dummy-probes.d/host/system
    src/im_mad/remotes/dummy-probes.d/vm/monitor:"$VAR_LOCATION"/remotes/im/dummy-probes.d/vm/monitor
    src/im_mad/remotes/dummy-probes.d/vm/execution:"$VAR_LOCATION"/remotes/im/dummy-probes.d/vm/execution
    src/im_mad/remotes/lxc-probes.d/host/beacon:"$VAR_LOCATION"/remotes/im/lxc-probes.d/host/beacon
    src/im_mad/remotes/lxc-probes.d/host/monitor:"$VAR_LOCATION"/remotes/im/lxc-probes.d/host/monitor
    src/im_mad/remotes/lxc-probes.d/vm/monitor:"$VAR_LOCATION"/remotes/im/lxc-probes.d/vm/monitor
    src/im_mad/remotes/lxc-probes.d/vm/status:"$VAR_LOCATION"/remotes/im/lxc-probes.d/vm/status
    src/authm_mad/remotes/dummy:"$VAR_LOCATION"/remotes/auth/dummy
    src/authm_mad/remotes/plain:"$VAR_LOCATION"/remotes/auth/plain
    src/vmm_mad/remotes/lib/kvm:"$VAR_LOCATION"/remotes/vmm/kvm
    src/vmm_mad/remotes/lxc:"$VAR_LOCATION"/remotes/vmm/lxc:lxcrc,profile_privileged
    src/tm_mad/shared:"$VAR_LOCATION"/remotes/tm/shared
    src/tm_mad/shared:"$VAR_LOCATION"/remotes/tm/qcow2
    src/tm_mad/fs_lvm:"$VAR_LOCATION"/remotes/tm/fs_lvm:fs_lvm.conf
    src/tm_mad/fs_lvm_ssh:"$VAR_LOCATION"/remotes/tm/fs_lvm_ssh
    src/tm_mad/ssh:"$VAR_LOCATION"/remotes/tm/ssh:sshrc
    src/tm_mad/local:"$VAR_LOCATION"/remotes/tm/local
    src/tm_mad/ceph:"$VAR_LOCATION"/remotes/tm/ceph
    src/tm_mad/dev:"$VAR_LOCATION"/remotes/tm/dev
    src/tm_mad/iscsi_libvirt:"$VAR_LOCATION"/remotes/tm/iscsi_libvirt
    src/tm_mad/dummy:"$VAR_LOCATION"/remotes/tm/dummy
    src/datastore_mad/remotes/fs:"$VAR_LOCATION"/remotes/datastore/fs:fs.conf
    src/datastore_mad/remotes/ceph:"$VAR_LOCATION"/remotes/datastore/ceph:ceph.conf
    src/datastore_mad/remotes/dev:"$VAR_LOCATION"/remotes/datastore/dev
    src/datastore_mad/remotes/iscsi_libvirt:"$VAR_LOCATION"/remotes/datastore/iscsi_libvirt
    src/datastore_mad/remotes/rsync:"$VAR_LOCATION"/remotes/datastore/rsync
    src/datastore_mad/remotes/restic:"$VAR_LOCATION"/remotes/datastore/restic:vendor
    src/datastore_mad/remotes/virtiofs:"$VAR_LOCATION"/remotes/datastore/virtiofs
    src/datastore_mad/remotes/interactive:"$VAR_LOCATION"/remotes/datastore/interactive
    src/vnm_mad/remotes/802.1Q:"$VAR_LOCATION"/remotes/vnm/802.1Q:clean.d,post.d,pre.d
    src/vnm_mad/remotes/vxlan:"$VAR_LOCATION"/remotes/vnm/vxlan:clean.d,post.d,pre.d
    src/vnm_mad/remotes/dummy:"$VAR_LOCATION"/remotes/vnm/dummy:clean.d,post.d,pre.d
    src/vnm_mad/remotes/bridge:"$VAR_LOCATION"/remotes/vnm/bridge:clean.d,post.d,pre.d
    src/vnm_mad/remotes/fw:"$VAR_LOCATION"/remotes/vnm/fw:clean.d,post.d,pre.d
    src/vnm_mad/remotes/ovswitch:"$VAR_LOCATION"/remotes/vnm/ovswitch:clean.d,post.d,pre.d
    src/vnm_mad/remotes/ovswitch_vxlan:"$VAR_LOCATION"/remotes/vnm/ovswitch_vxlan:clean.d,post.d,pre.d
    src/vnm_mad/remotes/elastic:"$VAR_LOCATION"/remotes/vnm/elastic:clean.d,post.d,pre.d
    src/vnm_mad/remotes/nodeport:"$VAR_LOCATION"/remotes/vnm/nodeport:clean.d,post.d,pre.d
    share/vendor/ruby/gems:"$LIB_LOCATION"/ruby/vendors
    share/hooks/metrics:"$VAR_LOCATION"/remotes/hooks/metrics
    src/oneprometheus/alertmanager/etc:"$ETC_LOCATION"/alertmanager
    src/oneprometheus/opennebula-exporter/src:"$LIB_LOCATION"/opennebula_exporter
    src/oneprometheus/prometheus/etc:"$ETC_LOCATION"/prometheus
    src/onebex/config:"$VAR_LOCATION"/remotes/onebex/config
    src/onebex/etc:"$VAR_LOCATION"/remotes/etc/onebex
    src/onecfg/lib/common/helpers:"$LIB_LOCATION"/onecfg/lib/common/helpers
    src/onecfg/lib/common/logger:"$LIB_LOCATION"/onecfg/lib/common/logger
    src/onecfg/lib/config/type/yaml:"$LIB_LOCATION"/onecfg/lib/config/type/yaml
    src/onecfg/lib/patch:"$LIB_LOCATION"/onecfg/lib/patch
    src/onecfg/share/etc:"$SHARE_LOCATION"/onecfg/etc
    src/onecfg/lib/ee/patch:"$LIB_LOCATION"/onecfg/lib/ee/patch
    src/flow/lib/strategy:"$ONEFLOW_LOCATION"/lib/strategy
    src/form/app/services:"$ONEFORM_LOCATION"/app/services
    share/ansible/plugins/inventory:"$ANS_LOCATION"/plugins/inventory
)

INSTALL_ONECFG_FILES=(
    ONECFG_BIN_FILES:"$BIN_LOCATION"
)

# Onecfg subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ONECFG_TREES=(
    src/onecfg/lib:"$LIB_LOCATION"/onecfg/lib:common,config,ee,patch
    src/onecfg/lib/common:"$LIB_LOCATION"/onecfg/lib/common:helpers,logger
    src/onecfg/lib/config:"$LIB_LOCATION"/onecfg/lib/config:type
    src/onecfg/lib/config/type:"$LIB_LOCATION"/onecfg/lib/config/type:augeas,yaml
    src/onecfg/lib/config/type/augeas:"$LIB_LOCATION"/onecfg/lib/config/type/augeas
    src/onecfg/lib/ee:"$LIB_LOCATION"/onecfg/lib/ee:config,migrators,patch
    src/onecfg/lib/ee/migrators:"$LIB_LOCATION"/onecfg/lib/ee/migrators
    src/onecfg/lib/ee/config:"$LIB_LOCATION"/onecfg/lib/ee/config
    src/onecfg/share/migrators:"$SHARE_LOCATION"/onecfg/migrators
)

INSTALL_FIREEDGE_FILES=(
  FIREEDGE_MINIFIED_FILES:"$FIREEDGE_LOCATION"
  FIREEDGE_BIN_FILES:"$BIN_LOCATION"
)

INSTALL_FIREEDGE_ETC_FILES=(
  FIREEDGE_ETC_FILES:"$ETC_LOCATION"
  FIREEDGE_SUNSTONE_ETC_TABS:"$ETC_LOCATION"/fireedge/sunstone/tabs
  FIREEDGE_SUNSTONE_ETC_VIEW:"$ETC_LOCATION"/fireedge/sunstone/views
 )

# Fireedge Etc subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_FIREEDGE_ETC_TREES=(
    src/fireedge/etc/sunstone:"$ETC_LOCATION"/fireedge/sunstone:profiles,tabs,views
    src/fireedge/etc/sunstone/profiles:"$ETC_LOCATION"/fireedge/sunstone/profiles
    src/fireedge/etc/sunstone/views/admin:"$ETC_LOCATION"/fireedge/sunstone/views/admin
    src/fireedge/etc/sunstone/views/user:"$ETC_LOCATION"/fireedge/sunstone/views/user:vrouter-tab.yaml
    src/fireedge/etc/sunstone/views/cloud:"$ETC_LOCATION"/fireedge/sunstone/views/cloud
    src/fireedge/etc/sunstone/views/groupadmin:"$ETC_LOCATION"/fireedge/sunstone/views/groupadmin
)

INSTALL_ONEGATE_FILES=(
    ONEGATE_FILES:"$ONEGATE_LOCATION"
    ONEGATE_BIN_FILES:"$BIN_LOCATION"
)

INSTALL_ONEGATE_ETC_FILES=(
    ONEGATE_ETC_FILES:"$ETC_LOCATION"
)

INSTALL_ONEFLOW_FILES=(
    ONEFLOW_FILES:"$ONEFLOW_LOCATION"
    ONEFLOW_BIN_FILES:"$BIN_LOCATION"
)

# Oneflow subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ONEFLOW_TREES=(
    src/flow/lib:"$ONEFLOW_LOCATION"/lib:models,strategy
    src/flow/lib/models:"$ONEFLOW_LOCATION"/lib/models
)

INSTALL_ONEFLOW_ETC_FILES=(
    ONEFLOW_ETC_FILES:"$ETC_LOCATION"
)

INSTALL_ONEFORM_FILES=(
    ONEFORM_FILES:"$ONEFORM_LOCATION"
    ONEFORM_BIN_FILES:"$BIN_LOCATION"
    ONEFORM_APP_FILES:"$ONEFORM_LOCATION"/app
    ONEFORM_PROVIDERS_FILES:"$ONEFORM_PROVIDERS_LOCATION"
)

# Oneform subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ONEFORM_TREES=(
    src/form/lib/tools:"$ONEFORM_LOCATION"/lib/tools
    src/form/lib/helpers:"$ONEFORM_LOCATION"/lib/helpers
    src/form/app/controllers:"$ONEFORM_LOCATION"/app/controllers
    src/form/app/models:"$ONEFORM_LOCATION"/app/models
    src/form/config:"$ONEFORM_LOCATION"/config
    share/ansible/plugins/lib:"$ANS_LOCATION"/plugins/lib
    src/form/drivers/.states:"$ONEFORM_PROVIDERS_STATES_LOCATION"
)

INSTALL_ONEFORM_ETC_FILES=(
    ONEFORM_ETC_FILES:"$ETC_LOCATION"
)

INSTALL_ODS_FILES=(
    ODS_FILES:"$ODS_LOCATION"
    ODS_APP_FILES:"$ODS_LOCATION"/app
)

# Ods subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ODS_TREES=(
    src/ods/config:"$ODS_LOCATION"/config
    src/ods/app/controllers:"$ODS_LOCATION"/app/controllers
    src/ods/app/models:"$ODS_LOCATION"/app/models
    src/ods/lib:"$ODS_LOCATION"/lib:helpers
    src/ods/lib/helpers:"$ODS_LOCATION"/lib/helpers
)

INSTALL_ONEHEM_FILES=(
    ONEHEM_FILES:"$ONEHEM_LOCATION"
    ONEHEM_BIN_FILES:"$BIN_LOCATION"
)

INSTALL_ONEHEM_ETC_FILES=(
    ONEHEM_ETC_FILES:"$ETC_LOCATION"
)

INSTALL_ONEKS_FILES=(
    ONEKS_FILES:"$ONEKS_LOCATION"
    ONEKS_CONFIG_FILES:"$ONEKS_LOCATION"/config
    ONEKS_BIN_FILES:"$BIN_LOCATION"
    ONEKS_CLI_BIN_FILES:"$BIN_LOCATION"
)

# Oneks subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ONEKS_TREES=(
    src/oneks/app:"$ONEKS_LOCATION"/app
    src/oneks/lib:"$ONEKS_LOCATION"/lib
    src/oneks/specs:"$ONEKS_SPECS_LOCATION"
    src/oneks/oca_ks:"$LIB_LOCATION"/ruby/opennebula/ks
    src/oneks/cli/one_helper:"$LIB_LOCATION"/ruby/cli/one_helper
)

INSTALL_ONEKS_ETC_FILES=(
    ONEKS_ETC_FILES:"$ETC_LOCATION"
)

# Oneks Etc subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ONEKS_ETC_TREES=(
    src/oneks/cli/etc:"$ETC_LOCATION"/cli
)

INSTALL_ETC_FILES=(
    ETC_FILES:"$ETC_LOCATION"
    SCHED_RANK_ETC_FILES:"$ETC_LOCATION"/schedulers
    ETC_FILES:"$SHARE_LOCATION"/conf
    VMM_EXEC_ETC_FILES:"$ETC_LOCATION"/vmm_exec
    HM_ETC_FILES:"$ETC_LOCATION"/hm
    AUTH_ETC_FILES:"$ETC_LOCATION"/auth
)

# Etc subtrees installed by do_tree, see INSTALL_TREES for the entry format
INSTALL_ETC_TREES=(
    src/cli/etc:"$ETC_LOCATION"/cli
)

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/cli/onevm \
           src/cli/oneacct \
           src/cli/oneshowback \
           src/cli/onehost \
           src/cli/onevnet \
           src/cli/oneuser \
           src/cli/oneimage \
           src/cli/onegroup \
           src/cli/onetemplate \
           src/cli/oneacl \
           src/cli/onedatastore \
           src/cli/onecluster \
           src/cli/onezone \
           src/cli/oneflow \
           src/cli/oneflow-template \
           src/cli/oneprovider \
           src/cli/oneprovision \
           src/cli/oneform \
           src/cli/onesecgroup \
           src/cli/onevmgroup \
           src/cli/onevdc \
           src/cli/onevrouter \
           src/cli/onemarket \
           src/cli/onemarketapp \
           src/cli/onevntemplate \
           src/cli/onehook \
           src/cli/onebackupjob \
           src/cli/onelog \
           src/cli/oneirb \
           src/onedb/onedb \
           share/scripts/qemu-kvm-one-gen \
           share/scripts/one"

#-------------------------------------------------------------------------------
# Ruby library files, to be installed under $LIB_LOCATION/ruby
#-------------------------------------------------------------------------------

RUBY_LIB_FILES="src/mad/ruby/ActionManager.rb \
                src/mad/ruby/OpenNebulaDriver.rb \
                src/mad/ruby/VirtualMachineDriver.rb \
                src/mad/ruby/HostSyncManager.rb \
                src/mad/ruby/DriverExecHelper.rb \
                src/mad/ruby/ssh_stream.rb \
                src/vnm_mad/one_vnm.rb \
                src/oca/ruby/opennebula.rb \
                share/misc/load_opennebula_paths.rb"

#-------------------------------------------------------------------------------
# Ruby auth library files, to be installed under $LIB_LOCATION/ruby/opennebula
#-------------------------------------------------------------------------------

RUBY_AUTH_LIB_FILES="src/authm_mad/remotes/ssh/ssh_auth.rb \
                src/authm_mad/remotes/server_x509/server_x509_auth.rb \
                src/authm_mad/remotes/server_cipher/server_cipher_auth.rb \
                src/authm_mad/remotes/ldap/ldap_auth.rb \
                src/authm_mad/remotes/saml/saml_auth.rb \
                src/authm_mad/remotes/x509/x509_auth.rb"

#-----------------------------------------------------------------------------
# MAD Script library files, to be installed under $LIB_LOCATION/<script lang>
# and remotes directory
#-----------------------------------------------------------------------------

REMOTE_FILES="src/vmm_mad/remotes/kvm/vgpu
              src/vmm_mad/remotes/kvm/vtpm_setup"

MAD_RUBY_LIB_FILES="src/mad/ruby/DriverLogger.rb \
                    src/mad/ruby/CommandManager.rb"

#-------------------------------------------------------------------------------
# Driver executable files, to be installed under $LIB_LOCATION/mads
#-------------------------------------------------------------------------------

MADS_LIB_FILES="src/mad/sh/madcommon.sh \
              src/vmm_mad/exec/one_vmm_exec.rb \
              src/vmm_mad/exec/one_vmm_exec \
              src/vmm_mad/exec/one_vmm_sh \
              src/vmm_mad/exec/one_vmm_ssh \
              src/vmm_mad/dummy/one_vmm_dummy.rb \
              src/vmm_mad/dummy/one_vmm_dummy \
              src/im_mad/im_exec/one_im_exec.rb \
              src/im_mad/im_exec/one_im_exec \
              src/im_mad/im_exec/one_im_ssh \
              src/im_mad/im_exec/one_im_sh \
              src/monitor/src/monitor/onemonitord \
              src/tm_mad/one_tm \
              src/tm_mad/one_tm.rb \
              src/hm_mad/one_hm.rb \
              src/hm_mad/one_hm \
              src/authm_mad/one_auth_mad.rb \
              src/authm_mad/one_auth_mad \
              src/datastore_mad/one_datastore.rb \
              src/datastore_mad/one_datastore_exec.rb \
              src/datastore_mad/one_datastore \
              src/market_mad/one_market.rb \
              src/market_mad/one_market \
              src/ipamm_mad/one_ipam \
              src/ipamm_mad/one_ipam.rb \
              src/schedm_mad/one_sched \
              src/schedm_mad/one_sched.rb"

#-------------------------------------------------------------------------------
# Common library files for VMM drivers
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# VMM SH Driver LXC scripts, to be installed under $REMOTES_LOCATION/vmm/lxc
#-------------------------------------------------------------------------------
VMM_EXEC_LXC_LIB="src/vmm_mad/remotes/lib/lxc/opennebula_vm.rb \
                src/vmm_mad/remotes/lib/lxc/client.rb \
                src/vmm_mad/remotes/lib/lxc/command.rb \
                src/vmm_mad/remotes/lib/lxc/container.rb \
                src/vmm_mad/remotes/lib/lxc/storage/mappers/qcow2.rb \
                src/vmm_mad/remotes/lib/lxc/storage/mappers/raw.rb \
                src/vmm_mad/remotes/lib/lxc/storage/mappers/rbd.rb \
                src/vmm_mad/remotes/lib/lxc/storage/mappers/device.rb \
                src/vmm_mad/remotes/lib/lxc/storage/storageutils.rb"

#-------------------------------------------------------------------------------
# VMM configuration LXC scripts, to be installed under $REMOTES_LOCATION/etc/vmm/lxc
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_LXC_SCRIPTS="src/vmm_mad/remotes/lxc/lxcrc"

#-------------------------------------------------------------------------------
# LXC profiles, to be installed under $REMOTES_LOCATION/etc/vmm/lxc/profiles
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_LXC_PROFILES="src/vmm_mad/remotes/lxc/profile_privileged"

#-------------------------------------------------------------------------------
# VMM configuration KVM scripts, to be installed under $REMOTES_LOCATION/etc/vmm/kvm
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_KVM_SCRIPTS="src/vmm_mad/remotes/kvm/kvmrc"

#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $REMOTES_LOCATION/im
#-------------------------------------------------------------------------------
IM_PROBES_FILES="\
    src/im_mad/remotes/run_monitord_client \
    src/im_mad/remotes/stop_monitord_client"

# KVM PROBES
IM_PROBES_ETC_KVM_PROBES_FILES="\
    src/im_mad/remotes/kvm-probes.d/pci.conf \
    src/im_mad/remotes/kvm-probes.d/guestagent.conf \
    src/im_mad/remotes/kvm-probes.d/forecast.conf \
    src/im_mad/remotes/lib/probe_db.conf"

IM_PROBES_QEMU_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/qemu-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/qemu-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/qemu-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/machines_models.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/name.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/clean_db.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/wild_vm.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/pci.rb \
     src/im_mad/remotes/qemu-probes.d/host/system/version.sh"

IM_PROBES_ETC_QEMU_PROBES_FILES="\
    src/im_mad/remotes/qemu-probes.d/pci.conf \
    src/im_mad/remotes/qemu-probes.d/forecast.conf \
    src/im_mad/remotes/lib/probe_db.conf"

# DUMMY PROBES
IM_PROBES_DUMMY_VM_STATUS_FILES=""

# LXC PROBES
IM_PROBES_LXC_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/name.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/clean_db.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/pci.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/version.sh"

IM_PROBES_ETC_LXC_PROBES_FILES="\
    src/im_mad/remotes/lxc-probes.d/forecast.conf \
    src/im_mad/remotes/lxc-probes.d/pci.conf \
    src/im_mad/remotes/lib/probe_db.conf"

IM_PROBES_VERSION="src/im_mad/remotes/VERSION"

#-------------------------------------------------------------------------------
# Auth Manager drivers to be installed under $REMOTES_LOCATION/auth
#-------------------------------------------------------------------------------

AUTH_SERVER_CIPHER_FILES="src/authm_mad/remotes/server_cipher/authenticate"

AUTH_SERVER_X509_FILES="src/authm_mad/remotes/server_x509/authenticate"

AUTH_X509_FILES="src/authm_mad/remotes/x509/authenticate"

AUTH_LDAP_FILES="src/authm_mad/remotes/ldap/authenticate"

AUTH_SAML_FILES="src/authm_mad/remotes/saml/authenticate"

AUTH_SSH_FILES="src/authm_mad/remotes/ssh/authenticate"

#-------------------------------------------------------------------------------
# Virtual Network Manager drivers configuration to be installed under $REMOTES_LOCATION/etc/vnm
#-------------------------------------------------------------------------------

NETWORK_ETC_FILES="src/vnm_mad/remotes/OpenNebulaNetwork.conf"

#-------------------------------------------------------------------------------
# IPAM dummy drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# Transfer Manager commands, to be installed under $LIB_LOCATION/tm_commands
#   - SHARED TM, $VAR_LOCATION/tm/shared
#   - FS_LVM TM, $VAR_LOCATION/tm/fs_lvm
#   - LVM TM, $VAR_LOCATION/tm/lvm
#   - QCOW2 TM, $VAR_LOCATION/tm/qcow2
#   - SSH TM, $VAR_LOCATION/tm/ssh
#   - DUMMY TM, $VAR_LOCATION/tm/dummy
#   - CEPH TM, $VAR_LOCATION/tm/ceph
#   - DEV TM, $VAR_LOCATION/tm/dev
#   - ISCSI TM, $VAR_LOCATION/tm/iscsi_libvirt
#-------------------------------------------------------------------------------

TM_FILES="src/tm_mad/tm_common.sh"

TM_FS_LVM_ETC_FILES="src/tm_mad/fs_lvm/fs_lvm.conf"

TM_SSH_ETC_FILES="src/tm_mad/ssh/sshrc"

#-------------------------------------------------------------------------------
# Datastore drivers, to be installed under $REMOTES_LOCATION/datastore
#   - Dummy Image Repository, $REMOTES_LOCATION/datastore/dummy
#   - FS based Image Repository, $REMOTES_LOCATION/datastore/fs
#-------------------------------------------------------------------------------

DATASTORE_DRIVER_COMMON_SCRIPTS="src/datastore_mad/remotes/xpath.rb \
                             src/datastore_mad/remotes/downloader.sh \
                             src/datastore_mad/remotes/lxd_downloader.sh \
                             src/datastore_mad/remotes/restic_downloader.rb \
                             src/datastore_mad/remotes/rsync_downloader.rb \
                             src/datastore_mad/remotes/onebex_downloader.rb \
                             src/datastore_mad/remotes/onebex_writer.rb \
                             src/datastore_mad/remotes/url.rb \
                             src/datastore_mad/remotes/lvm.rb \
                             src/datastore_mad/remotes/libfs.sh"

DATASTORE_DRIVER_ETC_FS_SCRIPTS="src/datastore_mad/remotes/fs/fs.conf"

DATASTORE_DRIVER_ETC_CEPH_SCRIPTS="src/datastore_mad/remotes/ceph/ceph.conf"

DATASTORE_DRIVER_ETC_SCRIPTS="src/datastore_mad/remotes/datastore.conf"

#-------------------------------------------------------------------------------
# Marketplace drivers, to be installed under $REMOTES_LOCATION/market
#   - HTTP based marketplace, $REMOTES_LOCATION/market/http
#   - OpenNebula public marketplace, $REMOTES_LOCATION/market/one
#   - S3-obeject based marketplace, $REMOTES_LOCATION/market/s3
#   - Linuxcontainers.org marketplace $REMOTE_LOCATION/market/linuxcontainers
#-------------------------------------------------------------------------------

MARKETPLACE_DRIVER_ETC_HTTP_SCRIPTS="src/market_mad/remotes/http/http.conf"

#-------------------------------------------------------------------------------
# Scheduler drivers, to be installed under $REMOTES_LOCATION/sched
#   - Rank scheduler $REMOTES_LOCATION/scheduler/rank
#   - OpenNebula DRS, $REMOTES_LOCATION/scheduler/one-drs
#-------------------------------------------------------------------------------

SCHEDULER_DRIVER_RANK_SCRIPTS="src/schedm_mad/remotes/rank/src/sched/place \
            src/schedm_mad/remotes/rank/optimize"

SCHEDULER_DRIVER_ONEDRS_SCRIPTS="src/schedm_mad/remotes/one_drs/place \
            src/schedm_mad/remotes/one_drs/optimize"

SCHEDULER_DRIVER_ONEDRS_VENDOR="src/schedm_mad/remotes/one_drs/vendor/lib/PuLP-2.9.0.dist-info/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/bin/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/pulp/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/typing_extensions-4.12.2.dist-info/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/typing_extensions.py \
            src/schedm_mad/remotes/one_drs/vendor/lib/xsdata/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/xsdata-24.12.dist-info/"

#-------------------------------------------------------------------------------
# OneBEX files, to be installed under $REMOTES_LOCATION/onebex (except config)
#-------------------------------------------------------------------------------

ONEBEX_FILES="src/onebex/onebex-server.rb \
              src/onebex/bex_state.rb \
              src/onebex/config.ru"

#-------------------------------------------------------------------------------
# Configuration files for OpenNebula, to be installed under $ETC_LOCATION
#-------------------------------------------------------------------------------

ETC_FILES="share/etc/oned.conf \
           share/etc/defaultrc \
           share/etc/guacd \
           src/tm_mad/tmrc \
           src/monitor/etc/monitord.conf "

SCHED_RANK_ETC_FILES="src/schedm_mad/remotes/rank/etc/rank.conf \
                      src/schedm_mad/remotes/one_drs/etc/one_drs.conf"

#-------------------------------------------------------------------------------
# Virtualization drivers config. files, to be installed under $ETC_LOCATION
#   - ssh, $ETC_LOCATION/vmm_exec
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_FILES="src/vmm_mad/exec/vmm_execrc \
                    src/vmm_mad/exec/${ARCH}/vmm_exec_kvm.conf"

#-------------------------------------------------------------------------------
# Hook Manager driver config. files, to be installed under $ETC_LOCATION/hm
#-------------------------------------------------------------------------------

HM_ETC_FILES="src/hm_mad/hmrc"

#-------------------------------------------------------------------------------
# Auth Manager drivers config. files, to be installed under $ETC_LOCATION/auth
#-------------------------------------------------------------------------------

AUTH_ETC_FILES="src/authm_mad/remotes/server_x509/server_x509_auth.conf \
                src/authm_mad/remotes/ldap/ldap_auth.conf \
                src/authm_mad/remotes/saml/saml_auth.conf \
                src/authm_mad/remotes/x509/x509_auth.conf"

#-------------------------------------------------------------------------------
# HOOK RAFT scripts, to be installed under $VAR_LOCATION/remotes/hooks/raft
#-------------------------------------------------------------------------------

HOOK_RAFT_FILES="share/hooks/raft/vip.sh"

#-------------------------------------------------------------------------------
# Installation scripts, to be installed under $SHARE_LOCATION
#-------------------------------------------------------------------------------

INSTALL_GEMS_SHARE_FILES="share/install_gems/install_gems \
                          share/install_gems/Gemfile"

ONETOKEN_SHARE_FILE="share/onetoken/onetoken.sh"

FOLLOWER_CLEANUP_SHARE_FILE="share/hooks/raft/follower_cleanup"

PRE_CLEANUP_SHARE_FILE="share/pkgs/services/systemd/pre_cleanup"

#-----------------------------------------------------------------------------
# CLI files
#-----------------------------------------------------------------------------

CLI_LIB_FILES="src/cli/cli_helper.rb \
               src/cli/command_parser.rb \
               src/cli/one_helper.rb \
               src/cli/ods_helper.rb"

CLI_BIN_FILES="src/cli/onevm \
               src/cli/onehost \
               src/cli/onevnet \
               src/cli/oneuser \
               src/cli/oneimage \
               src/cli/onetemplate \
               src/cli/onegroup \
               src/cli/oneacl \
               src/cli/onedatastore \
               src/cli/onecluster \
               src/cli/onezone \
               src/cli/oneflow \
               src/cli/oneflow-template \
               src/cli/oneform \
               src/cli/oneprovider \
               src/cli/oneprovision \
               src/cli/oneacct \
               src/cli/onesecgroup \
               src/cli/onevmgroup \
               src/cli/oneshowback \
               src/cli/onevdc \
               src/cli/onevrouter \
               src/cli/onemarketapp \
               src/cli/onemarket \
               src/cli/onevntemplate \
               src/cli/oneirb \
               src/cli/onelog \
               src/cli/onehook \
               src/cli/onebackupjob"

#-----------------------------------------------------------------------------
# FireEdge files
#-----------------------------------------------------------------------------

FIREEDGE_BIN_FILES="src/fireedge/bin/fireedge-server"

FIREEDGE_MINIFIED_FILES="src/fireedge/dist \
                src/fireedge/node_modules"

FIREEDGE_ETC_FILES="src/fireedge/etc/fireedge-server.conf"

#----------------------------------------------------------------------------
# FireEdge Sunstone files
#----------------------------------------------------------------------------

FIREEDGE_SUNSTONE_ETC_TABS="src/fireedge/etc/sunstone/tabs/*.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW="src/fireedge/etc/sunstone/views/sunstone-views.yaml"

#-----------------------------------------------------------------------------
# OneGate files
#-----------------------------------------------------------------------------

ONEGATE_FILES="src/onegate/onegate-server.rb \
               src/onegate/config.ru \
               share/onegate/onegate"

ONEGATE_BIN_FILES="src/onegate/bin/onegate-server"

ONEGATE_ETC_FILES="src/onegate/etc/onegate-server.conf"

#-----------------------------------------------------------------------------
# OneFlow files
#-----------------------------------------------------------------------------

ONEFLOW_FILES="src/flow/oneflow-server.rb \
                src/flow/config.ru"

ONEFLOW_BIN_FILES="src/flow/bin/oneflow-server"

ONEFLOW_ETC_FILES="src/flow/etc/oneflow-server.conf"

#-----------------------------------------------------------------------------
# OneKS files
#-----------------------------------------------------------------------------

ONEKS_FILES="src/oneks/oneks-server.rb \
             src/oneks/etc/oneks-server.yaml"

ONEKS_CONFIG_FILES="src/oneks/config/*"

ONEKS_BIN_FILES="src/oneks/bin/oneks-server"

ONEKS_ETC_FILES="src/oneks/etc/oneks-server.conf"

ONEKS_CLI_BIN_FILES="src/oneks/cli/oneks"

#-----------------------------------------------------------------------------
# OneForm files
#-----------------------------------------------------------------------------

ONEFORM_FILES="src/form/oneform-server.rb \
               src/form/config.ru \
               src/form/Gemfile"

ONEFORM_BIN_FILES="src/form/bin/oneform-server
                   src/form/bin/terraform"          # symlink to amd64/arm64 binary

ONEFORM_ETC_FILES="src/form/etc/oneform-server.conf"

ONEFORM_APP_FILES="src/form/app/app_routes.rb"

ONEFORM_PROVIDERS_FILES="src/form/drivers/*"
#-----------------------------------------------------------------------------
# ODS files
#-----------------------------------------------------------------------------

ODS_FILES="src/ods/ods-server.rb"

ODS_APP_FILES="src/ods/app/*.rb"

#-----------------------------------------------------------------------------
# Onecfg files
#-----------------------------------------------------------------------------

ONECFG_BIN_FILES="src/onecfg/bin/onecfg"

#-----------------------------------------------------------------------------
# OneHem files
#-----------------------------------------------------------------------------
ONEHEM_FILES="src/hem/onehem-server.rb"

ONEHEM_BIN_FILES="src/hem/bin/onehem-server"

ONEHEM_ETC_FILES="src/hem/etc/onehem-server.conf"

#-----------------------------------------------------------------------------
# SSH files
#-----------------------------------------------------------------------------

SSH_SH_LIB_FILES="share/ssh/bin/ssh-socks-cleaner"

SSH_SH_OVERRIDE_LIB_FILES="share/ssh/bin/ssh"

#-----------------------------------------------------------------------------
# MAN files
#-----------------------------------------------------------------------------

MAN_FILES="share/man/oneacct.1.gz \
        share/man/oneshowback.1.gz \
        share/man/oneacl.1.gz \
        share/man/onehook.1.gz \
        share/man/onebackupjob.1.gz \
        share/man/onelog.1.gz \
        share/man/oneirb.1.gz \
        share/man/onehost.1.gz \
        share/man/oneimage.1.gz \
        share/man/oneuser.1.gz \
        share/man/onevm.1.gz \
        share/man/onevnet.1.gz \
        share/man/onetemplate.1.gz \
        share/man/onegroup.1.gz \
        share/man/onecfg.1.gz \
        share/man/onedb.1.gz \
        share/man/onedatastore.1.gz \
        share/man/onecluster.1.gz \
        share/man/onezone.1.gz \
        share/man/oneflow.1.gz \
        share/man/oneflow-template.1.gz \
        share/man/oneprovider.1.gz \
        share/man/oneprovision.1.gz \
        share/man/oneform.1.gz \
        share/man/onesecgroup.1.gz \
        share/man/onevdc.1.gz \
        share/man/onevrouter.1.gz \
        share/man/onemarket.1.gz \
        share/man/onemarketapp.1.gz \
        share/man/onevmgroup.1.gz \
        share/man/onevntemplate.1.gz"

#-----------------------------------------------------------------------------
# Docs Files
#-----------------------------------------------------------------------------

DOCS_FILES="LICENSE LICENSE.onsla LICENSE.onsla-nc NOTICE README.md"

#-------------------------------------------------------------------------------
# XSD
#-------------------------------------------------------------------------------

CONTEXT_SHARE=$(find share/context/ -type f \( ! -iname "*.sh" ! -iname "SConstruct" \))

#-------------------------------------------------------------------------------
# PROMETHEUS
#-------------------------------------------------------------------------------

ALERTMANAGER_VENDOR_DIR='alertmanager'
LVM_EXPORTER_VENDOR_DIR='lvm_exporter'
MYSQLD_EXPORTER_VENDOR_DIR='mysqld_exporter'
NODE_EXPORTER_VENDOR_DIR='node_exporter'
OVS_EXPORTER_VENDOR_DIR='ovs_exporter'
PROMETHEUS_VENDOR_DIR='prometheus'
SMARTCTL_EXPORTER_VENDOR_DIR='smartctl_exporter'
if [ "$ARCH" = 'arm64' ]; then
    ALERTMANAGER_VENDOR_DIR='alertmanager.arm64'
    LVM_EXPORTER_VENDOR_DIR='lvm_exporter.arm64'
    MYSQLD_EXPORTER_VENDOR_DIR='mysqld_exporter.arm64'
    NODE_EXPORTER_VENDOR_DIR='node_exporter.arm64'
    OVS_EXPORTER_VENDOR_DIR='ovs_exporter.arm64'
    PROMETHEUS_VENDOR_DIR='prometheus.arm64'
    SMARTCTL_EXPORTER_VENDOR_DIR='smartctl_exporter.arm64'

    # adjust restic binary symlink
    rm src/datastore_mad/remotes/restic/restic
    ln -s ./vendor/bin/restic.arm64 src/datastore_mad/remotes/restic/restic

    # adjust terraform binary symlink
    rm src/form/bin/terraform
    ln -s ../vendor/terraform.arm64 src/form/bin/terraform
fi

# ALERTMANAGER
ONEPROMETHEUS_ALERTMANAGER_BIN_FILES="src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/alertmanager \
                                      src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/amtool"
ONEPROMETHEUS_ALERTMANAGER_FILES="src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/LICENSE \
                                  src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/NOTICE"

# GRAFANA
ONEPROMETHEUS_GRAFANA_FILES="src/oneprometheus/grafana/share/dashboards/"

# LIBVIRT-EXPORTER
# LVM-EXPORTER
ONEPROMETHEUS_LVM_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${LVM_EXPORTER_VENDOR_DIR}/lvm_exporter"
ONEPROMETHEUS_LVM_EXPORTER_FILES="src/oneprometheus/vendor/${LVM_EXPORTER_VENDOR_DIR}/LICENSE"

# MYSQLD-EXPORTER
ONEPROMETHEUS_MYSQLD_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${MYSQLD_EXPORTER_VENDOR_DIR}/mysqld_exporter"
ONEPROMETHEUS_MYSQLD_EXPORTER_FILES="src/oneprometheus/vendor/${MYSQLD_EXPORTER_VENDOR_DIR}/LICENSE \
                                     src/oneprometheus/vendor/${MYSQLD_EXPORTER_VENDOR_DIR}/NOTICE"

# NODE-EXPORTER
ONEPROMETHEUS_NODE_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/node_exporter"
ONEPROMETHEUS_NODE_EXPORTER_FILES="src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/LICENSE \
                                   src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/NOTICE"

# OVS-EXPORTER
ONEPROMETHEUS_OVS_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${OVS_EXPORTER_VENDOR_DIR}/ovs_exporter"
ONEPROMETHEUS_OVS_EXPORTER_FILES="src/oneprometheus/vendor/${OVS_EXPORTER_VENDOR_DIR}/LICENSE"

# OPENNEBULA-EXPORTER
# PROMETHEUS
ONEPROMETHEUS_PROMETHEUS_BIN_FILES="src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/prometheus \
                                    src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/promtool"
ONEPROMETHEUS_PROMETHEUS_FILES="src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/console_libraries/ \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/consoles/ \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/LICENSE \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/NOTICE"
ONEPROMETHEUS_PROMETHEUS_SHARE_FILES="src/oneprometheus/prometheus/share/patch_datasources.rb"

# SMARTCTL-EXPORTER
ONEPROMETHEUS_SMARTCTL_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${SMARTCTL_EXPORTER_VENDOR_DIR}/smartctl_exporter"
ONEPROMETHEUS_SMARTCTL_EXPORTER_FILES="src/oneprometheus/vendor/${SMARTCTL_EXPORTER_VENDOR_DIR}/LICENSE \
                                       src/oneprometheus/vendor/${SMARTCTL_EXPORTER_VENDOR_DIR}/NOTICE"

#-----------------------------------------------------------------------------
#-----------------------------------------------------------------------------
# INSTALL.SH SCRIPT
#-----------------------------------------------------------------------------
#-----------------------------------------------------------------------------

# --- Create OpenNebula directories ---

if [ "$UNINSTALL" = "no" ] ; then
    for d in $MAKE_DIRS; do
        mkdir -p "$DESTDIR$d"
    done
fi

# --- Install/Uninstall files ---

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm "$DESTDIR$2/$(basename "$1")"
    else
        if [ "$LINK" = "yes" ]; then
            ln -s "$SRC_DIR"/"$1" "$DESTDIR$2"
        else
            cp -RL "$SRC_DIR"/"$1" "$DESTDIR$2"
        fi
    fi
}

# do_tree source_dir destination_dir [excludes]
#
# Installs the contents of source_dir into destination_dir, which is created
# automatically. Copy mode is recursive and dereferences symlinks like
# do_file (cp -RL), as some trees link scripts from source directories that
# are not installed, such as ../common. In symlink mode each top level entry
# is symlinked instead, so destination_dir stays a real directory that other
# install entries may share, while development edits in the source tree are
# live. Uninstall removes the top level entries and then destination_dir
# itself, if empty. Excludes are comma separated shell glob patterns matched
# against the top level entry names.
do_tree() {
    TREE_EXCLUDES=$(echo "$3" | tr ',' ' ')

    if [ "$UNINSTALL" = "no" ]; then
        mkdir -p "$DESTDIR$2"
    fi

    for f in "$SRC_DIR"/"$1"/*; do
        b=$(basename "$f")

        for e in $TREE_EXCLUDES; do
            # shellcheck disable=SC2254 # excludes are glob patterns
            case $b in $e) continue 2 ;; esac
        done

        if [ "$UNINSTALL" = "yes" ]; then
            rm -rf "$DESTDIR${2:?}/$b"
        elif [ "$LINK" = "yes" ]; then
            ln -s "$f" "$DESTDIR$2"
        else
            cp -RL "$f" "$DESTDIR$2"
        fi
    done

    if [ "$UNINSTALL" = "yes" ]; then
        rmdir "$DESTDIR$2"
    fi
}

INSTALL_SET="${INSTALL_FILES[*]} \
             ${INSTALL_FIREEDGE_FILES[*]} \
             ${INSTALL_ONEGATE_FILES[*]} \
             ${INSTALL_ONEFLOW_FILES[*]} \
             ${INSTALL_ONEFORM_FILES[*]} \
             ${INSTALL_ODS_FILES[*]} \
             ${INSTALL_ONEHEM_FILES[*]} \
             ${INSTALL_ONEKS_FILES[*]} \
             ${INSTALL_ONEPROVISION_FILES[*]} \
             ${INSTALL_ONECFG_FILES[*]}"

INSTALL_TREE_SET="${INSTALL_TREES[*]} \
                  ${INSTALL_ONEFLOW_TREES[*]} \
                  ${INSTALL_ONEFORM_TREES[*]} \
                  ${INSTALL_ODS_TREES[*]} \
                  ${INSTALL_ONEKS_TREES[*]} \
                  ${INSTALL_ONECFG_TREES[*]}"

for i in $INSTALL_SET; do
    SRC=$(echo "$i" | cut -d: -f1)
    DST=$(echo "$i" | cut -d: -f2)

    SRC_FILES=${!SRC}

    if [ "$UNINSTALL" = "no" ]; then
        mkdir -p "$DESTDIR$DST"
    fi

    for f in $SRC_FILES; do
        do_file "$f" "$DST"
    done
done

for i in $INSTALL_TREE_SET; do
    SRC=$(echo "$i" | cut -d: -f1)
    DST=$(echo "$i" | cut -d: -f2)
    EXCLUDES=$(echo "$i" | cut -d: -f3)

    do_tree "$SRC" "$DST" "$EXCLUDES"
done

INSTALL_ETC_SET="${INSTALL_ETC_FILES[*]} \
                 ${INSTALL_FIREEDGE_ETC_FILES[*]} \
                 ${INSTALL_ONEGATE_ETC_FILES[*]} \
                 ${INSTALL_ONEHEM_ETC_FILES[*]} \
                 ${INSTALL_ONEFLOW_ETC_FILES[*]} \
                 ${INSTALL_ONEFORM_ETC_FILES[*]} \
                 ${INSTALL_ONEKS_ETC_FILES[*]}"

INSTALL_ETC_TREE_SET="${INSTALL_ETC_TREES[*]} \
                      ${INSTALL_FIREEDGE_ETC_TREES[*]} \
                      ${INSTALL_ONEKS_ETC_TREES[*]}"

# The configuration directory skeleton is created even when the files are
# not installed (-k)
if [ "$UNINSTALL" = "no" ]; then
    for i in $INSTALL_ETC_SET $INSTALL_ETC_TREE_SET; do
        DST=$(echo "$i" | cut -d: -f2)

        mkdir -p "$DESTDIR$DST"
    done
fi

if [ "$INSTALL_ETC" = "yes" ] ; then
    for i in $INSTALL_ETC_SET; do
        SRC=$(echo "$i" | cut -d: -f1)
        DST=$(echo "$i" | cut -d: -f2)

        SRC_FILES=${!SRC}

        OLD_LINK=$LINK
        LINK="no"

        for f in $SRC_FILES; do
            do_file "$f" "$DST"
        done

        LINK=$OLD_LINK
   done

    for i in $INSTALL_ETC_TREE_SET; do
        SRC=$(echo "$i" | cut -d: -f1)
        DST=$(echo "$i" | cut -d: -f2)
        EXCLUDES=$(echo "$i" | cut -d: -f3)

        OLD_LINK=$LINK
        LINK="no"

        do_tree "$SRC" "$DST" "$EXCLUDES"

        LINK=$OLD_LINK
    done
fi

# --- Set ownership, remove OpenNebula directories or delete other arch files---

if [ "$UNINSTALL" = "no" ] ; then
    for d in $CHOWN_DIRS; do
        chown -R "$ONEADMIN_USER:$ONEADMIN_GROUP" "$DESTDIR$d"
    done

    if [ "$ARCH" = 'x86_64' ]; then
        rm -rf "$DESTDIR$LIB_LOCATION"/python/pulp/solverdir/cbc/linux/arm64/cbc
    else
        rm -rf "$DESTDIR$LIB_LOCATION"/python/pulp/solverdir/cbc/linux/i64/cbc
    fi
else
    for d in $(echo "$DELETE_DIRS" | awk '{for (i=NF;i>=1;i--) printf $i" "}'); do
        rmdir "$d"
    done
fi

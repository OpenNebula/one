#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: install.sh [-u install_user] [-g install_group] [-k keep conf]"
 echo "                  [-d ONE_LOCATION] [-c] [-a arch] [-r]"
 echo "                  [-s] [-p] [-G] [-6] [-f] [-l] [-e] [-h]"
 echo
 echo "-u: user that will run opennebula, defaults to user executing install.sh"
 echo "-g: group of the user that will run opennebula, defaults to user"
 echo "    executing install.sh"
 echo "-k: keep configuration files of existing OpenNebula installation, useful"
 echo "    when upgrading. This flag should not be set when installing"
 echo "    OpenNebula for the first time"
 echo "-d: target installation directory, if not defined it'd be root. Must be"
 echo "    an absolute path."
 echo "-c: install client utilities: OpenNebula cli"
 echo "-F: install only OpenNebula FireEdge"
 echo "-P: do not install OpenNebula FireEdge non-minified files"
 echo "-G: install only OpenNebula Gate"
 echo "-f: install only OpenNebula Flow"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-a: architecture of downloaded vendor artifacts, default: x86_64"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

PARAMETERS=":u:g:d:a:ehkrlcspFPorlfG6"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
CLIENT="no"
ONEGATE="no"
FIREEDGE="no"
FIREEDGE_DEV="no"
ONEFLOW="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD
ARCH="x86_64"

while getopts $PARAMETERS opt; do
    case $opt in
        h) usage; exit 0;;
        k) INSTALL_ETC="no" ;;
        r) UNINSTALL="yes" ;;
        l) LINK="yes" ;;
        c) CLIENT="yes"; INSTALL_ETC="no" ;;
        G) ONEGATE="yes" ;;
        F) FIREEDGE="yes" ;;
        P) FIREEDGE_DEV="no" ;;
        f) ONEFLOW="yes" ;;
        u) ONEADMIN_USER="$OPTARG" ;;
        g) ONEADMIN_GROUP="$OPTARG" ;;
        a) ARCH="$OPTARG" ;;
        d) ROOT="$OPTARG" ;;
        \?) usage; exit 1 ;;
    esac
done

shift $(($OPTIND - 1))

if [ "$ARCH" != x86_64 ] && [ "$ARCH" != arm64 ]; then
    echo "Unsupported architecture: $ARCH, only x86_64 or arm64"
    exit 1
fi

#-------------------------------------------------------------------------------
# Definition of locations
#-------------------------------------------------------------------------------

CONF_LOCATION="$HOME/.one"

if [ -z "$ROOT" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    SBIN_LOCATION="/usr/sbin"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    FIREEDGE_LOCATION="$LIB_LOCATION/fireedge"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    ONEHEM_LOCATION="$LIB_LOCATION/onehem"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    RUN_LOCATION="/var/run/one"
    LOCK_LOCATION="/var/lock/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/one"
    MAN_LOCATION="/usr/share/man/man1"
    VM_LOCATION="/var/lib/one/vms"
    DOCS_LOCATION="/usr/share/doc/one"

    ONEPROMETHEUS_SYSTEMD_LOCATION="/lib/systemd/system"
    ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION="/var/lib/alertmanager"
    ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION="/var/lib/prometheus"

    ONEPROMETHEUS_DIRS="$ONEPROMETHEUS_SYSTEMD_LOCATION \
                        $ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION \
                        $ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS=""

        CHOWN_DIRS=""
    elif [ "$FIREEDGE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ETC_LOCATION $FIREEDGE_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    elif [ "$ONEGATE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    elif [ "$ONEFLOW" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $ONEFLOW_LOCATION \
                    $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    else
        MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $DOCS_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
                   $SYSTEM_DS_LOCATION $DEFAULT_DS_LOCATION $MAN_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION \
                   $ONEHEM_LOCATION $ONEPROMETHEUS_DIRS"

        DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                     $RUN_LOCATION $SHARE_DIRS"

        CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION $LOCK_LOCATION"
    fi

else
    BIN_LOCATION="$ROOT/bin"
    SBIN_LOCATION="$ROOT/sbin"
    LIB_LOCATION="$ROOT/lib"
    ETC_LOCATION="$ROOT/etc"
    VAR_LOCATION="$ROOT/var"
    RUN_LOCATION="$VAR_LOCATION/run"
    LOCK_LOCATION="$VAR_LOCATION/lock"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    FIREEDGE_LOCATION="$LIB_LOCATION/fireedge"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    ONEHEM_LOCATION="$LIB_LOCATION/onehem"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    INCLUDE_LOCATION="$ROOT/include"
    SHARE_LOCATION="$ROOT/share"
    MAN_LOCATION="$ROOT/share/man/man1"
    VM_LOCATION="$VAR_LOCATION/vms"
    DOCS_LOCATION="$ROOT/share/doc"

    ONEPROMETHEUS_SYSTEMD_LOCATION="$LIB_LOCATION/systemd"
    ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION="$ROOT/var/alertmanager"
    ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION="$ROOT/var/prometheus"

    ONEPROMETHEUS_DIRS="$ONEPROMETHEUS_SYSTEMD_LOCATION \
                        $ONEPROMETHEUS_VAR_ALERTMANAGER_LOCATION \
                        $ONEPROMETHEUS_VAR_PROMETHEUS_LOCATION"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEGATE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$FIREEDGE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $FIREEDGE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEFLOW" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $ONEFLOW_LOCATION \
                   $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    else
        MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $SYSTEM_DS_LOCATION \
                   $DEFAULT_DS_LOCATION $MAN_LOCATION $DOCS_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION \
                   $ONEHEM_LOCATION $LOCK_LOCATION $RUN_LOCATION \
                   $ONEPROMETHEUS_DIRS"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS="$ROOT"
    fi

    CHOWN_DIRS="$ROOT"
fi

SHARE_DIRS="$SHARE_LOCATION/schemas \
            $SHARE_LOCATION/schemas/libvirt \
            $SHARE_LOCATION/schemas/xsd \
            $SHARE_LOCATION/ssh \
            $SHARE_LOCATION/start-scripts \
            $SHARE_LOCATION/conf \
            $SHARE_LOCATION/context \
            $SHARE_LOCATION/onecfg \
            $SHARE_LOCATION/onecfg/etc \
            $SHARE_LOCATION/onecfg/migrators \
            $SHARE_LOCATION/grafana \
            $SHARE_LOCATION/prometheus"

ETC_DIRS="$ETC_LOCATION/vmm_exec \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/auth \
          $ETC_LOCATION/auth/certificates \
          $ETC_LOCATION/cli \
          $ETC_LOCATION/fireedge \
          $ETC_LOCATION/fireedge/sunstone \
          $ETC_LOCATION/fireedge/sunstone/profiles \
          $ETC_LOCATION/fireedge/sunstone/views/admin \
          $ETC_LOCATION/fireedge/sunstone/views/user \
          $ETC_LOCATION/fireedge/sunstone/views/groupadmin \
          $ETC_LOCATION/fireedge/sunstone/views/cloud \
          $ETC_LOCATION/alertmanager \
          $ETC_LOCATION/schedulers \
          $ETC_LOCATION/prometheus"

LIB_DIRS="$LIB_LOCATION/ruby \
          $LIB_LOCATION/ruby/opennebula \
          $LIB_LOCATION/ruby/opennebula/flow \
          $LIB_LOCATION/ruby/cloud/ \
          $LIB_LOCATION/ruby/cloud/CloudAuth \
          $LIB_LOCATION/ruby/onedb \
          $LIB_LOCATION/ruby/onedb/shared \
          $LIB_LOCATION/ruby/onedb/local \
          $LIB_LOCATION/ruby/onedb/patches \
          $LIB_LOCATION/ruby/vendors \
          $LIB_LOCATION/python \
          $LIB_LOCATION/mads \
          $LIB_LOCATION/sh \
          $LIB_LOCATION/sh/override \
          $LIB_LOCATION/ruby/cli \
          $LIB_LOCATION/ruby/cli/one_helper \
          $LIB_LOCATION/onecfg/lib \
          $LIB_LOCATION/onecfg/lib/common \
          $LIB_LOCATION/onecfg/lib/common/helpers \
          $LIB_LOCATION/onecfg/lib/common/logger \
          $LIB_LOCATION/onecfg/lib/config \
          $LIB_LOCATION/onecfg/lib/config/type \
          $LIB_LOCATION/onecfg/lib/config/type/augeas \
          $LIB_LOCATION/onecfg/lib/config/type/yaml \
          $LIB_LOCATION/onecfg/lib/patch \
          $LIB_LOCATION/onecfg/lib/ee \
          $LIB_LOCATION/onecfg/lib/ee/migrators \
          $LIB_LOCATION/onecfg/lib/ee/config \
          $LIB_LOCATION/onecfg/lib/ee/patch \
          $LIB_LOCATION/alertmanager \
          $LIB_LOCATION/libvirt_exporter \
          $LIB_LOCATION/node_exporter \
          $LIB_LOCATION/opennebula_exporter \
          $LIB_LOCATION/prometheus"

VAR_DIRS="$VAR_LOCATION/remotes \
          $VAR_LOCATION/remotes/etc \
          $VAR_LOCATION/remotes/etc/tm/fs_lvm \
          $VAR_LOCATION/remotes/etc/tm/ssh \
          $VAR_LOCATION/remotes/etc/tm/local \
          $VAR_LOCATION/remotes/etc/datastore/fs \
          $VAR_LOCATION/remotes/etc/datastore/ceph \
          $VAR_LOCATION/remotes/etc/im/kvm-probes.d \
          $VAR_LOCATION/remotes/etc/im/qemu-probes.d \
          $VAR_LOCATION/remotes/etc/im/lxc-probes.d \
          $VAR_LOCATION/remotes/etc/market/http \
          $VAR_LOCATION/remotes/etc/vmm/kvm \
          $VAR_LOCATION/remotes/etc/vmm/lxc \
          $VAR_LOCATION/remotes/etc/vmm/lxc/profiles \
          $VAR_LOCATION/remotes/etc/vnm \
          $VAR_LOCATION/remotes/im \
          $VAR_LOCATION/remotes/im/lib \
          $VAR_LOCATION/remotes/im/lib/python \
          $VAR_LOCATION/remotes/im/lib/python/pyoneai \
          $VAR_LOCATION/remotes/im/kvm.d \
          $VAR_LOCATION/remotes/im/kvm-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/kvm-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/kvm-probes.d/host/system \
          $VAR_LOCATION/remotes/im/kvm-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/kvm-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/kvm-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/qemu.d \
          $VAR_LOCATION/remotes/im/qemu-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/qemu-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/qemu-probes.d/host/system \
          $VAR_LOCATION/remotes/im/qemu-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/qemu-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/qemu-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/dummy.d \
          $VAR_LOCATION/remotes/im/dummy-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/dummy-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/dummy-probes.d/host/system \
          $VAR_LOCATION/remotes/im/dummy-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/dummy-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/dummy-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/lxc.d \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/system \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/vmm \
          $VAR_LOCATION/remotes/vmm/lib \
          $VAR_LOCATION/remotes/vmm/kvm \
          $VAR_LOCATION/remotes/vmm/lxc \
          $VAR_LOCATION/remotes/vnm \
          $VAR_LOCATION/remotes/vnm/802.1Q \
          $VAR_LOCATION/remotes/vnm/802.1Q/pre.d \
          $VAR_LOCATION/remotes/vnm/802.1Q/post.d \
          $VAR_LOCATION/remotes/vnm/802.1Q/clean.d \
          $VAR_LOCATION/remotes/vnm/vxlan \
          $VAR_LOCATION/remotes/vnm/vxlan/pre.d \
          $VAR_LOCATION/remotes/vnm/vxlan/post.d \
          $VAR_LOCATION/remotes/vnm/vxlan/clean.d \
          $VAR_LOCATION/remotes/vnm/dummy \
          $VAR_LOCATION/remotes/vnm/dummy/pre.d \
          $VAR_LOCATION/remotes/vnm/dummy/post.d \
          $VAR_LOCATION/remotes/vnm/dummy/clean.d \
          $VAR_LOCATION/remotes/vnm/bridge \
          $VAR_LOCATION/remotes/vnm/bridge/pre.d \
          $VAR_LOCATION/remotes/vnm/bridge/post.d \
          $VAR_LOCATION/remotes/vnm/bridge/clean.d \
          $VAR_LOCATION/remotes/vnm/fw \
          $VAR_LOCATION/remotes/vnm/fw/pre.d \
          $VAR_LOCATION/remotes/vnm/fw/post.d \
          $VAR_LOCATION/remotes/vnm/fw/clean.d \
          $VAR_LOCATION/remotes/vnm/ovswitch \
          $VAR_LOCATION/remotes/vnm/ovswitch/pre.d \
          $VAR_LOCATION/remotes/vnm/ovswitch/post.d \
          $VAR_LOCATION/remotes/vnm/ovswitch/clean.d \
          $VAR_LOCATION/remotes/vnm/ovswitch_vxlan \
          $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/pre.d \
          $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/post.d \
          $VAR_LOCATION/remotes/vnm/ovswitch_vxlan/clean.d \
          $VAR_LOCATION/remotes/vnm/elastic \
          $VAR_LOCATION/remotes/vnm/elastic/pre.d \
          $VAR_LOCATION/remotes/vnm/elastic/clean.d \
          $VAR_LOCATION/remotes/vnm/nodeport\
          $VAR_LOCATION/remotes/vnm/hooks/pre \
          $VAR_LOCATION/remotes/vnm/hooks/post \
          $VAR_LOCATION/remotes/vnm/hooks/clean \
          $VAR_LOCATION/remotes/tm/ \
          $VAR_LOCATION/remotes/tm/dummy \
          $VAR_LOCATION/remotes/tm/lib \
          $VAR_LOCATION/remotes/tm/shared \
          $VAR_LOCATION/remotes/tm/fs_lvm \
          $VAR_LOCATION/remotes/tm/fs_lvm_ssh \
          $VAR_LOCATION/remotes/tm/qcow2 \
          $VAR_LOCATION/remotes/tm/ssh \
          $VAR_LOCATION/remotes/tm/local \
          $VAR_LOCATION/remotes/tm/ceph \
          $VAR_LOCATION/remotes/tm/dev \
          $VAR_LOCATION/remotes/tm/iscsi_libvirt \
          $VAR_LOCATION/remotes/hooks \
          $VAR_LOCATION/remotes/hooks/autostart \
          $VAR_LOCATION/remotes/hooks/ft \
          $VAR_LOCATION/remotes/hooks/raft \
          $VAR_LOCATION/remotes/datastore \
          $VAR_LOCATION/remotes/datastore/dummy \
          $VAR_LOCATION/remotes/datastore/fs \
          $VAR_LOCATION/remotes/datastore/ceph \
          $VAR_LOCATION/remotes/datastore/dev \
          $VAR_LOCATION/remotes/datastore/iscsi_libvirt \
          $VAR_LOCATION/remotes/datastore/rsync \
          $VAR_LOCATION/remotes/datastore/restic \
          $VAR_LOCATION/remotes/market \
          $VAR_LOCATION/remotes/market/http \
          $VAR_LOCATION/remotes/market/one \
          $VAR_LOCATION/remotes/market/s3 \
          $VAR_LOCATION/remotes/market/linuxcontainers \
          $VAR_LOCATION/remotes/auth \
          $VAR_LOCATION/remotes/auth/plain \
          $VAR_LOCATION/remotes/auth/ssh \
          $VAR_LOCATION/remotes/auth/x509 \
          $VAR_LOCATION/remotes/auth/ldap \
          $VAR_LOCATION/remotes/auth/saml \
          $VAR_LOCATION/remotes/auth/server_x509 \
          $VAR_LOCATION/remotes/auth/server_cipher \
          $VAR_LOCATION/remotes/auth/dummy \
          $VAR_LOCATION/remotes/ipam/dummy \
          $VAR_LOCATION/remotes/ipam/equinix \
          $VAR_LOCATION/remotes/ipam/scaleway \
          $VAR_LOCATION/remotes/ipam/vultr \
          $VAR_LOCATION/remotes/ipam/aws \
          $VAR_LOCATION/remotes/scheduler/dummy \
          $VAR_LOCATION/remotes/scheduler/rank \
          $VAR_LOCATION/remotes/scheduler/one_drs \
          $VAR_LOCATION/remotes/scheduler/one_drs/lib \
          $VAR_LOCATION/remotes/scheduler/one_drs/lib/mapper \
          $VAR_LOCATION/remotes/scheduler/one_drs/lib/models"

FIREEDGE_DIRS="$FIREEDGE_LOCATION"

ONEFLOW_DIRS="$ONEFLOW_LOCATION/lib \
              $ONEFLOW_LOCATION/lib/strategy \
              $ONEFLOW_LOCATION/lib/models"

LIB_OCA_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/opennebula \
                 $LIB_LOCATION/ruby/opennebula/flow"

LIB_CLI_CLIENT_DIRS="$LIB_LOCATION/ruby/cli \
                     $LIB_LOCATION/ruby/cli/one_helper"

CONF_CLI_DIRS="$ETC_LOCATION/cli"

if [ "$CLIENT" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS \
               $LIB_OCA_CLIENT_DIRS $LIB_CLI_CLIENT_DIRS $CONF_CLI_DIRS \
               $ETC_LOCATION"
elif [ "$ONEGATE" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$ONEFLOW" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $ONEFLOW_DIRS $LIB_OCA_CLIENT_DIRS"
else
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS \
                $FIREEDGE_DIRS $ONEFLOW_DIRS"
fi

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# FILE DEFINITION, WHAT IS GOING TO BE INSTALLED AND WHERE
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
INSTALL_FILES=(
    BIN_FILES:$BIN_LOCATION
    SBIN_FILES:$SBIN_LOCATION
    INCLUDE_FILES:$INCLUDE_LOCATION
    LIB_FILES:$LIB_LOCATION
    MAN_FILES:$MAN_LOCATION
    DOCS_FILES:$DOCS_LOCATION

    RUBY_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_AUTH_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FLOW_FILES:$LIB_LOCATION/ruby/opennebula/flow

    MAD_RUBY_LIB_FILES:$LIB_LOCATION/ruby
    MAD_RUBY_LIB_FILES:$VAR_LOCATION/remotes
    MAD_SH_LIB_FILES:$LIB_LOCATION/sh
    MAD_SH_LIB_FILES:$VAR_LOCATION/remotes
    MADS_LIB_FILES:$LIB_LOCATION/mads
    REMOTE_FILES:$VAR_LOCATION/remotes

    ONEDB_FILES:$LIB_LOCATION/ruby/onedb
    ONEDB_PATCH_FILES:$LIB_LOCATION/ruby/onedb/patches
    ONEDB_SHARED_MIGRATOR_FILES:$LIB_LOCATION/ruby/onedb/shared
    ONEDB_LOCAL_MIGRATOR_FILES:$LIB_LOCATION/ruby/onedb/local

    IM_PROBES_FILES:$VAR_LOCATION/remotes/im
    IM_PROBES_LIB_FILES:$VAR_LOCATION/remotes/im/lib
    IM_PROBES_LIB_PYTHON_FILES:$VAR_LOCATION/remotes/im/lib/python
    IM_PROBES_LIB_PYONEAI_FILES:$VAR_LOCATION/remotes/im/lib/python/pyoneai
    IM_PROBES_KVM_FILES:$VAR_LOCATION/remotes/im/kvm.d
    IM_PROBES_QEMU_FILES:$VAR_LOCATION/remotes/im/qemu.d
    IM_PROBES_DUMMY_FILES:$VAR_LOCATION/remotes/im/dummy.d
    IM_PROBES_LXC_FILES:$VAR_LOCATION/remotes/im/lxc.d
    IM_PROBES_KVM_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/host/beacon
    IM_PROBES_KVM_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/host/monitor
    IM_PROBES_KVM_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/host/system
    IM_PROBES_KVM_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/vm/monitor
    IM_PROBES_KVM_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/vm/status
    IM_PROBES_KVM_VM_SNAPSHOT_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d/vm/snapshot
    IM_PROBES_ETC_KVM_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/kvm-probes.d
    IM_PROBES_QEMU_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/host/beacon
    IM_PROBES_QEMU_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/host/monitor
    IM_PROBES_QEMU_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/host/system
    IM_PROBES_QEMU_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/vm/monitor
    IM_PROBES_QEMU_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/vm/status
    IM_PROBES_QEMU_VM_SNAPSHOT_FILES:$VAR_LOCATION/remotes/im/qemu-probes.d/vm/snapshot
    IM_PROBES_ETC_QEMU_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/qemu-probes.d
    IM_PROBES_DUMMY_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/dummy-probes.d/host/beacon
    IM_PROBES_DUMMY_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/dummy-probes.d/host/monitor
    IM_PROBES_DUMMY_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/dummy-probes.d/host/system
    IM_PROBES_DUMMY_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/dummy-probes.d/vm/monitor
    IM_PROBES_DUMMY_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/dummy-probes.d/vm/status
    IM_PROBES_LXC_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/beacon
    IM_PROBES_LXC_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/monitor
    IM_PROBES_LXC_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/system
    IM_PROBES_LXC_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/vm/monitor
    IM_PROBES_LXC_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/vm/status
    IM_PROBES_LXC_PROBES_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d
    IM_PROBES_ETC_LXC_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/lxc-probes.d
    IM_PROBES_VERSION:$VAR_LOCATION/remotes

    AUTH_SSH_FILES:$VAR_LOCATION/remotes/auth/ssh
    AUTH_X509_FILES:$VAR_LOCATION/remotes/auth/x509
    AUTH_LDAP_FILES:$VAR_LOCATION/remotes/auth/ldap
    AUTH_SAML_FILES:$VAR_LOCATION/remotes/auth/saml
    AUTH_SERVER_X509_FILES:$VAR_LOCATION/remotes/auth/server_x509
    AUTH_SERVER_CIPHER_FILES:$VAR_LOCATION/remotes/auth/server_cipher
    AUTH_DUMMY_FILES:$VAR_LOCATION/remotes/auth/dummy
    AUTH_PLAIN_FILES:$VAR_LOCATION/remotes/auth/plain

    VMM_EXEC_LIB:$VAR_LOCATION/remotes/vmm/lib
    VMM_EXEC_KVM_SCRIPTS:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_KVM_LIB:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_LXC_SCRIPTS:$VAR_LOCATION/remotes/vmm/lxc
    VMM_EXEC_LXC_LIB:$VAR_LOCATION/remotes/vmm/lxc
    VMM_EXEC_ETC_KVM_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/kvm
    VMM_EXEC_ETC_LXC_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/lxc
    VMM_EXEC_ETC_LXC_PROFILES:$VAR_LOCATION/remotes/etc/vmm/lxc/profiles

    TM_FILES:$VAR_LOCATION/remotes/tm
    TM_LIB_FILES:$VAR_LOCATION/remotes/tm/lib
    TM_SHARED_FILES:$VAR_LOCATION/remotes/tm/shared
    TM_FS_LVM_FILES:$VAR_LOCATION/remotes/tm/fs_lvm
    TM_FS_LVM_ETC_FILES:$VAR_LOCATION/remotes/etc/tm/fs_lvm/fs_lvm.conf
    TM_FS_LVM_SSH_FILES:$VAR_LOCATION/remotes/tm/fs_lvm_ssh
    TM_QCOW2_FILES:$VAR_LOCATION/remotes/tm/qcow2
    TM_SSH_FILES:$VAR_LOCATION/remotes/tm/ssh
    TM_LOCAL_FILES:$VAR_LOCATION/remotes/tm/local
    TM_SSH_ETC_FILES:$VAR_LOCATION/remotes/etc/tm/ssh
    TM_CEPH_FILES:$VAR_LOCATION/remotes/tm/ceph
    TM_DEV_FILES:$VAR_LOCATION/remotes/tm/dev
    TM_ISCSI_FILES:$VAR_LOCATION/remotes/tm/iscsi_libvirt
    TM_DUMMY_FILES:$VAR_LOCATION/remotes/tm/dummy

    DATASTORE_DRIVER_COMMON_SCRIPTS:$VAR_LOCATION/remotes/datastore/
    DATASTORE_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/datastore/dummy
    DATASTORE_DRIVER_FS_SCRIPTS:$VAR_LOCATION/remotes/datastore/fs
    DATASTORE_DRIVER_ETC_FS_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore/fs
    DATASTORE_DRIVER_CEPH_SCRIPTS:$VAR_LOCATION/remotes/datastore/ceph
    DATASTORE_DRIVER_ETC_CEPH_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore/ceph
    DATASTORE_DRIVER_DEV_SCRIPTS:$VAR_LOCATION/remotes/datastore/dev
    DATASTORE_DRIVER_ISCSI_SCRIPTS:$VAR_LOCATION/remotes/datastore/iscsi_libvirt
    DATASTORE_DRIVER_RSYNC_SCRIPTS:$VAR_LOCATION/remotes/datastore/rsync
    DATASTORE_DRIVER_RESTIC_SCRIPTS:$VAR_LOCATION/remotes/datastore/restic
    DATASTORE_DRIVER_ETC_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore

    MARKETPLACE_DRIVER_HTTP_SCRIPTS:$VAR_LOCATION/remotes/market/http
    MARKETPLACE_DRIVER_ETC_HTTP_SCRIPTS:$VAR_LOCATION/remotes/etc/market/http
    MARKETPLACE_DRIVER_ONE_SCRIPTS:$VAR_LOCATION/remotes/market/one
    MARKETPLACE_DRIVER_S3_SCRIPTS:$VAR_LOCATION/remotes/market/s3
    MARKETPLACE_DRIVER_LXC_SCRIPTS:$VAR_LOCATION/remotes/market/linuxcontainers

    IPAM_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/ipam/dummy
    IPAM_DRIVER_EQUINIX_SCRIPTS:$VAR_LOCATION/remotes/ipam/equinix
    IPAM_DRIVER_SCALEWAY_SCRIPTS:$VAR_LOCATION/remotes/ipam/scaleway
    IPAM_DRIVER_VULTR_SCRIPTS:$VAR_LOCATION/remotes/ipam/vultr
    IPAM_DRIVER_EC2_SCRIPTS:$VAR_LOCATION/remotes/ipam/aws

    SCHEDULER_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/scheduler/dummy
    SCHEDULER_DRIVER_RANK_SCRIPTS:$VAR_LOCATION/remotes/scheduler/rank
    SCHEDULER_DRIVER_ONEDRS_SCRIPTS:$VAR_LOCATION/remotes/scheduler/one_drs
    SCHEDULER_DRIVER_ONEDRS_LIB:$VAR_LOCATION/remotes/scheduler/one_drs/lib
    SCHEDULER_DRIVER_ONEDRS_MAPPER:$VAR_LOCATION/remotes/scheduler/one_drs/lib/mapper
    SCHEDULER_DRIVER_ONEDRS_MODELS:$VAR_LOCATION/remotes/scheduler/one_drs/lib/models
    SCHEDULER_DRIVER_ONEDRS_VENDOR:$LIB_LOCATION/python

    NETWORK_FILES:$VAR_LOCATION/remotes/vnm
    NETWORK_HOOKS_PRE_FILES:$VAR_LOCATION/remotes/vnm/hooks/pre
    NETWORK_HOOKS_CLEAN_FILES:$VAR_LOCATION/remotes/vnm/hooks/clean
    NETWORK_ETC_FILES:$VAR_LOCATION/remotes/etc/vnm
    NETWORK_8021Q_FILES:$VAR_LOCATION/remotes/vnm/802.1Q
    NETWORK_VXLAN_FILES:$VAR_LOCATION/remotes/vnm/vxlan
    NETWORK_DUMMY_FILES:$VAR_LOCATION/remotes/vnm/dummy
    NETWORK_BRIDGE_FILES:$VAR_LOCATION/remotes/vnm/bridge
    NETWORK_FW_FILES:$VAR_LOCATION/remotes/vnm/fw
    NETWORK_OVSWITCH_FILES:$VAR_LOCATION/remotes/vnm/ovswitch
    NETWORK_OVSWITCH_VXLAN_FILES:$VAR_LOCATION/remotes/vnm/ovswitch_vxlan
    NETWORK_ELASTIC_FILES:$VAR_LOCATION/remotes/vnm/elastic
    NETWORK_NODEPORT_FILES:$VAR_LOCATION/remotes/vnm/nodeport

    INSTALL_GEMS_SHARE_FILES:$SHARE_LOCATION
    VENDOR_DIRS:$LIB_LOCATION/ruby/vendors

    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper

    COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud
    CLOUD_AUTH_LIB_FILES:$LIB_LOCATION/ruby/cloud/CloudAuth

    ONETOKEN_SHARE_FILE:$SHARE_LOCATION
    CONTEXT_SHARE:$SHARE_LOCATION/context

    FOLLOWER_CLEANUP_SHARE_FILE:$SHARE_LOCATION
    PRE_CLEANUP_SHARE_FILE:$SHARE_LOCATION

    START_SCRIPT_SHARE_FILES:$SHARE_LOCATION/start-scripts

    HOOK_AUTOSTART_FILES:$VAR_LOCATION/remotes/hooks/autostart
    HOOK_FT_FILES:$VAR_LOCATION/remotes/hooks/ft
    HOOK_RAFT_FILES:$VAR_LOCATION/remotes/hooks/raft

    LIBVIRT_RNG_SHARE_MODULE_FILES:$SHARE_LOCATION/schemas/libvirt
    XSD_FILES:$SHARE_LOCATION/schemas/xsd

    SSH_SH_LIB_FILES:$LIB_LOCATION/sh
    SSH_SH_OVERRIDE_LIB_FILES:$LIB_LOCATION/sh/override
    SSH_SHARE_FILES:$SHARE_LOCATION/ssh

    ONEPROMETHEUS_ALERTMANAGER_BIN_FILES:$BIN_LOCATION
    ONEPROMETHEUS_ALERTMANAGER_CONFIG_FILES:$ETC_LOCATION/alertmanager
    ONEPROMETHEUS_ALERTMANAGER_FILES:$LIB_LOCATION/alertmanager
    ONEPROMETHEUS_ALERTMANAGER_SYSTEMD_FILES:$ONEPROMETHEUS_SYSTEMD_LOCATION

    ONEPROMETHEUS_GRAFANA_FILES:$SHARE_LOCATION/grafana

    ONEPROMETHEUS_LIBVIRT_EXPORTER_FILES:$LIB_LOCATION/libvirt_exporter
    ONEPROMETHEUS_LIBVIRT_EXPORTER_SYSTEMD_FILES:$ONEPROMETHEUS_SYSTEMD_LOCATION

    ONEPROMETHEUS_NODE_EXPORTER_BIN_FILES:$BIN_LOCATION
    ONEPROMETHEUS_NODE_EXPORTER_FILES:$LIB_LOCATION/node_exporter
    ONEPROMETHEUS_NODE_EXPORTER_SYSTEMD_FILES:$ONEPROMETHEUS_SYSTEMD_LOCATION

    ONEPROMETHEUS_OPENNEBULA_EXPORTER_FILES:$LIB_LOCATION/opennebula_exporter
    ONEPROMETHEUS_OPENNEBULA_EXPORTER_SYSTEMD_FILES:$ONEPROMETHEUS_SYSTEMD_LOCATION

    ONEPROMETHEUS_PROMETHEUS_BIN_FILES:$BIN_LOCATION
    ONEPROMETHEUS_PROMETHEUS_CONFIG_FILES:$ETC_LOCATION/prometheus
    ONEPROMETHEUS_PROMETHEUS_FILES:$LIB_LOCATION/prometheus
    ONEPROMETHEUS_PROMETHEUS_SHARE_FILES:$SHARE_LOCATION/prometheus
    ONEPROMETHEUS_PROMETHEUS_SYSTEMD_FILES:$ONEPROMETHEUS_SYSTEMD_LOCATION
)

INSTALL_CLIENT_FILES=(
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    CLI_BIN_FILES:$BIN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    CLI_CONF_FILES:$ETC_LOCATION/cli
    OCA_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FLOW_FILES:$LIB_LOCATION/ruby/opennebula/flow
    RUBY_AUTH_LIB_FILES:$LIB_LOCATION/ruby/opennebula
)

INSTALL_ONECFG_FILES=(
    ONECFG_BIN_FILES:$BIN_LOCATION
    ONECFG_LIB_FILES:$LIB_LOCATION/onecfg/lib
    ONECFG_LIB_COMMON_FILES:$LIB_LOCATION/onecfg/lib/common
    ONECFG_LIB_COMMON_HELPERS_FILES:$LIB_LOCATION/onecfg/lib/common/helpers
    ONECFG_LIB_COMMON_LOGGER_FILES:$LIB_LOCATION/onecfg/lib/common/logger
    ONECFG_LIB_CONFIG_FILES:$LIB_LOCATION/onecfg/lib/config
    ONECFG_LIB_CONFIG_TYPE_FILES:$LIB_LOCATION/onecfg/lib/config/type
    ONECFG_LIB_CONFIG_TYPE_AUGEAS_FILES:$LIB_LOCATION/onecfg/lib/config/type/augeas
    ONECFG_LIB_CONFIG_TYPE_YAML_FILES:$LIB_LOCATION/onecfg/lib/config/type/yaml
    ONECFG_LIB_PATCH_FILES:$LIB_LOCATION/onecfg/lib/patch
    ONECFG_SHARE_ETC_FILES:$SHARE_LOCATION/onecfg/etc
    ONECFG_LIB_EE_FILES:$LIB_LOCATION/onecfg/lib/ee
    ONECFG_LIB_EE_MIGRATORS_FILES:$LIB_LOCATION/onecfg/lib/ee/migrators
    ONECFG_LIB_EE_CONFIG_FILES:$LIB_LOCATION/onecfg/lib/ee/config
    ONECFG_LIB_EE_PATCH_FILES:$LIB_LOCATION/onecfg/lib/ee/patch
    ONECFG_SHARE_MIGRATORS_FILES:$SHARE_LOCATION/onecfg/migrators
)

INSTALL_FIREEDGE_FILES=(
  FIREEDGE_MINIFIED_FILES:$FIREEDGE_LOCATION
  FIREEDGE_BIN_FILES:$BIN_LOCATION
)

INSTALL_FIREEDGE_ETC_FILES=(
  FIREEDGE_ETC_FILES:$ETC_LOCATION
  FIREEDGE_SUNSTONE_ETC:$ETC_LOCATION/fireedge/sunstone
  FIREEDGE_SUNSTONE_ETC_PROFILES:$ETC_LOCATION/fireedge/sunstone/profiles
  FIREEDGE_SUNSTONE_ETC_VIEW:$ETC_LOCATION/fireedge/sunstone/views
  FIREEDGE_SUNSTONE_ETC_VIEW_ADMIN:$ETC_LOCATION/fireedge/sunstone/views/admin
  FIREEDGE_SUNSTONE_ETC_VIEW_USER:$ETC_LOCATION/fireedge/sunstone/views/user
  FIREEDGE_SUNSTONE_ETC_VIEW_CLOUD:$ETC_LOCATION/fireedge/sunstone/views/cloud
  FIREEDGE_SUNSTONE_ETC_VIEW_GROUPADMIN:$ETC_LOCATION/fireedge/sunstone/views/groupadmin
 )

INSTALL_FIREEDGE_DEV_DIRS=(
  FIREEDGE_DEV_FILES:$FIREEDGE_LOCATION
)

INSTALL_ONEGATE_FILES=(
    ONEGATE_FILES:$ONEGATE_LOCATION
    ONEGATE_BIN_FILES:$BIN_LOCATION
)

INSTALL_ONEGATE_ETC_FILES=(
    ONEGATE_ETC_FILES:$ETC_LOCATION
)

INSTALL_ONEFLOW_FILES=(
    ONEFLOW_FILES:$ONEFLOW_LOCATION
    ONEFLOW_BIN_FILES:$BIN_LOCATION
    ONEFLOW_LIB_FILES:$ONEFLOW_LOCATION/lib
    ONEFLOW_LIB_STRATEGY_FILES:$ONEFLOW_LOCATION/lib/strategy
    ONEFLOW_LIB_MODELS_FILES:$ONEFLOW_LOCATION/lib/models
)

INSTALL_ONEFLOW_ETC_FILES=(
    ONEFLOW_ETC_FILES:$ETC_LOCATION
)

INSTALL_ONEHEM_FILES=(
    ONEHEM_FILES:$ONEHEM_LOCATION
    ONEHEM_BIN_FILES:$BIN_LOCATION
)

INSTALL_ONEHEM_ETC_FILES=(
    ONEHEM_ETC_FILES:$ETC_LOCATION
)

INSTALL_ETC_FILES=(
    ETC_FILES:$ETC_LOCATION
    SCHED_RANK_ETC_FILES:$ETC_LOCATION/schedulers
    ETC_FILES:$SHARE_LOCATION/conf
    VMM_EXEC_ETC_FILES:$ETC_LOCATION/vmm_exec
    HM_ETC_FILES:$ETC_LOCATION/hm
    AUTH_ETC_FILES:$ETC_LOCATION/auth
    CLI_CONF_FILES:$ETC_LOCATION/cli
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
# C/C++ OpenNebula API Library & Development files
# Include files, to be installed under $INCLUDE_LOCATION
# Library files, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------

INCLUDE_FILES=""
LIB_FILES=""

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
                src/vnm_mad/remotes/elastic/aws_vnm.rb \
                src/vnm_mad/remotes/elastic/equinix_vnm.rb \
                src/vnm_mad/remotes/elastic/equinix.rb \
                src/vnm_mad/remotes/elastic/scaleway_vnm.rb \
                src/vnm_mad/remotes/elastic/scaleway.rb \
                src/vnm_mad/remotes/elastic/vultr_vnm.rb \
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

MAD_SH_LIB_FILES="src/mad/sh/scripts_common.sh \
                  src/mad/sh/create_container_image.sh"

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
VMM_EXEC_LIB="src/vmm_mad/remotes/lib/command.rb \
              src/vmm_mad/remotes/lib/xmlparser.rb \
              src/vmm_mad/remotes/lib/opennebula_vm.rb"

#-------------------------------------------------------------------------------
# VMM SH Driver LXC scripts, to be installed under $REMOTES_LOCATION/vmm/lxc
#-------------------------------------------------------------------------------
VMM_EXEC_LXC_SCRIPTS="src/vmm_mad/remotes/lxc/attach_disk \
                    src/vmm_mad/remotes/lxc/deploy \
                    src/vmm_mad/remotes/lxc/prereconfigure \
                    src/vmm_mad/remotes/lxc/reset \
                    src/vmm_mad/remotes/lxc/restore \
                    src/vmm_mad/remotes/lxc/snapshot_create \
                    src/vmm_mad/remotes/lxc/attach_nic \
                    src/vmm_mad/remotes/lxc/detach_disk \
                    src/vmm_mad/remotes/lxc/migrate \
                    src/vmm_mad/remotes/lxc/reboot \
                    src/vmm_mad/remotes/lxc/resize \
                    src/vmm_mad/remotes/lxc/save \
                    src/vmm_mad/remotes/lxc/snapshot_delete \
                    src/vmm_mad/remotes/lxc/cancel \
                    src/vmm_mad/remotes/lxc/detach_nic \
                    src/vmm_mad/remotes/lxc/migrate_local \
                    src/vmm_mad/remotes/lxc/reconfigure \
                    src/vmm_mad/remotes/lxc/resize_disk \
                    src/vmm_mad/remotes/lxc/shutdown \
                    src/vmm_mad/remotes/lxc/snapshot_revert"


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
# VMM SH Driver KVM scripts, to be installed under $REMOTES_LOCATION/vmm/kvm
#-------------------------------------------------------------------------------

VMM_EXEC_KVM_SCRIPTS="src/vmm_mad/remotes/kvm/cancel \
                    src/vmm_mad/remotes/kvm/deploy \
                    src/vmm_mad/remotes/kvm/migrate \
                    src/vmm_mad/remotes/kvm/migrate_local \
                    src/vmm_mad/remotes/kvm/restore \
                    src/vmm_mad/remotes/kvm/restore.ceph \
                    src/vmm_mad/remotes/kvm/reboot \
                    src/vmm_mad/remotes/kvm/reset \
                    src/vmm_mad/remotes/kvm/save \
                    src/vmm_mad/remotes/kvm/save.ceph \
                    src/vmm_mad/remotes/kvm/attach_disk \
                    src/vmm_mad/remotes/kvm/detach_disk \
                    src/vmm_mad/remotes/kvm/attach_nic \
                    src/vmm_mad/remotes/kvm/detach_nic \
                    src/vmm_mad/remotes/kvm/snapshot_create \
                    src/vmm_mad/remotes/kvm/snapshot_revert \
                    src/vmm_mad/remotes/kvm/snapshot_delete \
                    src/vmm_mad/remotes/kvm/shutdown \
                    src/vmm_mad/remotes/kvm/reconfigure \
                    src/vmm_mad/remotes/kvm/prereconfigure \
                    src/vmm_mad/remotes/kvm/resize \
                    src/vmm_mad/remotes/kvm/resize_disk"

VMM_EXEC_KVM_LIB="src/vmm_mad/remotes/lib/kvm/opennebula_vm.rb"

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

IM_PROBES_LIB_FILES="\
    src/im_mad/remotes/lib/kvm.rb \
    src/im_mad/remotes/lib/lxc.rb \
    src/im_mad/remotes/lib/linux.rb \
    src/im_mad/remotes/lib/numa_common.rb \
    src/im_mad/remotes/lib/probe_db.rb \
    src/im_mad/remotes/lib/monitord_client.rb \
    src/im_mad/remotes/lib/domain.rb \
    src/im_mad/remotes/lib/process_list.rb"

IM_PROBES_LIB_PYTHON_FILES="\
    src/im_mad/remotes/lib/python/models/ \
    src/im_mad/remotes/lib/python/prediction.py \
    src/im_mad/remotes/lib/python/prediction.sh"

IM_PROBES_LIB_PYONEAI_FILES="\
    src/im_mad/remotes/lib/python/pyoneai/__init__.py \
    src/im_mad/remotes/lib/python/pyoneai/core/ \
    src/im_mad/remotes/lib/python/pyoneai/ml/"

# KVM PROBES
IM_PROBES_KVM_FILES="\
    src/im_mad/remotes/kvm.d/monitord-client_control.sh \
    src/im_mad/remotes/kvm.d/monitord-client.rb"

IM_PROBES_KVM_HOST_BEACON_FILES="\
     src/im_mad/remotes/kvm-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/kvm-probes.d/host/beacon/date.sh"

IM_PROBES_KVM_HOST_MONITOR_FILES="\
     src/im_mad/remotes/kvm-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/kvm-probes.d/host/monitor/prediction.sh \
     src/im_mad/remotes/kvm-probes.d/host/monitor/numa_usage.rb"

IM_PROBES_KVM_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/kvm-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/cpu_features.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/machines_models.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/name.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/clean_db.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/wild_vm.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/pci.rb \
     src/im_mad/remotes/kvm-probes.d/host/system/version.sh"

IM_PROBES_KVM_VM_MONITOR_FILES="\
     src/im_mad/remotes/kvm-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/kvm-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_KVM_VM_STATUS_FILES="\
     src/im_mad/remotes/kvm-probes.d/vm/status/state.rb"

IM_PROBES_KVM_VM_SNAPSHOT_FILES="\
     src/im_mad/remotes/kvm-probes.d/vm/snapshot/recovery.rb"

IM_PROBES_ETC_KVM_PROBES_FILES="\
    src/im_mad/remotes/kvm-probes.d/pci.conf \
    src/im_mad/remotes/kvm-probes.d/guestagent.conf \
    src/im_mad/remotes/kvm-probes.d/forecast.conf \
    src/im_mad/remotes/lib/probe_db.conf"

IM_PROBES_QEMU_FILES="\
    src/im_mad/remotes/qemu.d/monitord-client_control.sh \
    src/im_mad/remotes/qemu.d/monitord-client.rb"

IM_PROBES_QEMU_HOST_BEACON_FILES="\
     src/im_mad/remotes/qemu-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/qemu-probes.d/host/beacon/date.sh"

IM_PROBES_QEMU_HOST_MONITOR_FILES="\
     src/im_mad/remotes/qemu-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/qemu-probes.d/host/monitor/numa_usage.rb"

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

IM_PROBES_QEMU_VM_MONITOR_FILES="\
     src/im_mad/remotes/qemu-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/qemu-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_QEMU_VM_STATUS_FILES="\
     src/im_mad/remotes/qemu-probes.d/vm/status/state.rb"

IM_PROBES_QEMU_VM_SNAPSHOT_FILES="\
     src/im_mad/remotes/qemu-probes.d/vm/snapshot/recovery.rb"

IM_PROBES_ETC_QEMU_PROBES_FILES="\
    src/im_mad/remotes/qemu-probes.d/pci.conf \
    src/im_mad/remotes/lib/probe_db.conf"

# DUMMY PROBES
IM_PROBES_DUMMY_FILES="\
    src/im_mad/remotes/dummy.d/monitord-client_control.sh \
    src/im_mad/remotes/dummy.d/monitord-client.rb"

IM_PROBES_DUMMY_HOST_BEACON_FILES="\
     src/im_mad/remotes/dummy-probes.d/host/beacon/monitord-client-shepherd_local.sh \
     src/im_mad/remotes/dummy-probes.d/host/beacon/date.sh"

IM_PROBES_DUMMY_HOST_MONITOR_FILES="\
     src/im_mad/remotes/dummy-probes.d/host/monitor/monitor.rb"

IM_PROBES_DUMMY_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/dummy-probes.d/host/system/system.rb"

IM_PROBES_DUMMY_VM_MONITOR_FILES="\
     src/im_mad/remotes/dummy-probes.d/vm/monitor/monitor.rb"

IM_PROBES_DUMMY_VM_STATUS_FILES=""

# LXC PROBES
IM_PROBES_LXC_FILES="\
    src/im_mad/remotes/lxc.d/monitord-client_control.sh \
    src/im_mad/remotes/lxc.d/monitord-client.rb"

IM_PROBES_LXC_HOST_BEACON_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/lxc-probes.d/host/beacon/date.sh"

IM_PROBES_LXC_HOST_MONITOR_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/lxc-probes.d/host/monitor/prediction.sh \
     src/im_mad/remotes/lxc-probes.d/host/monitor/numa_usage.rb"

IM_PROBES_LXC_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/name.sh \
     src/im_mad/remotes/kvm-probes.d/host/system/clean_db.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/version.sh"

IM_PROBES_LXC_VM_MONITOR_FILES="\
     src/im_mad/remotes/lxc-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/lxc-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_LXC_VM_STATUS_FILES="\
     src/im_mad/remotes/lxc-probes.d/vm/status/state.rb"

IM_PROBES_ETC_LXC_PROBES_FILES="\
    src/im_mad/remotes/lxc-probes.d/forecast.conf \
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

AUTH_DUMMY_FILES="src/authm_mad/remotes/dummy/authenticate"

AUTH_PLAIN_FILES="src/authm_mad/remotes/plain/authenticate"

#-------------------------------------------------------------------------------
# Virtual Network Manager drivers to be installed under $REMOTES_LOCATION/vnm
#-------------------------------------------------------------------------------

NETWORK_FILES="src/vnm_mad/remotes/lib/vnm_driver.rb \
               src/vnm_mad/remotes/lib/vnmmad.rb \
               src/vnm_mad/remotes/lib/sg_driver.rb \
               src/vnm_mad/remotes/lib/address.rb \
               src/vnm_mad/remotes/lib/command.rb \
               src/vnm_mad/remotes/lib/vm.rb \
               src/vnm_mad/remotes/lib/vf.rb \
               src/vnm_mad/remotes/lib/vlan.rb \
               src/vnm_mad/remotes/lib/no_vlan.rb \
               src/vnm_mad/remotes/lib/security_groups.rb \
               src/vnm_mad/remotes/lib/security_groups_iptables.rb \
               src/vnm_mad/remotes/lib/nic.rb \
               src/vnm_mad/remotes/lib/tproxy \
               src/vnm_mad/remotes/lib/tproxy.rb \
               src/vnm_mad/remotes/lib/ip_netns_exec"

NETWORK_8021Q_FILES="src/vnm_mad/remotes/802.1Q/clean \
                    src/vnm_mad/remotes/802.1Q/post \
                    src/vnm_mad/remotes/802.1Q/pre \
                    src/vnm_mad/remotes/802.1Q/update_sg \
                    src/vnm_mad/remotes/802.1Q/update_nic \
                    src/vnm_mad/remotes/802.1Q/vlan_tag_driver.rb \
                    src/vnm_mad/remotes/802.1Q/vnet_create \
                    src/vnm_mad/remotes/802.1Q/vnet_delete"

NETWORK_VXLAN_FILES="src/vnm_mad/remotes/vxlan/clean \
                    src/vnm_mad/remotes/vxlan/post \
                    src/vnm_mad/remotes/vxlan/pre \
                    src/vnm_mad/remotes/vxlan/update_sg \
                    src/vnm_mad/remotes/vxlan/update_nic \
                    src/vnm_mad/remotes/vxlan/vxlan.rb \
                    src/vnm_mad/remotes/vxlan/vxlan_driver.rb \
                    src/vnm_mad/remotes/vxlan/vnet_create \
                    src/vnm_mad/remotes/vxlan/vnet_delete"

NETWORK_DUMMY_FILES="src/vnm_mad/remotes/dummy/clean \
                    src/vnm_mad/remotes/dummy/post \
                    src/vnm_mad/remotes/dummy/update_sg \
                    src/vnm_mad/remotes/dummy/pre \
                    src/vnm_mad/remotes/dummy/update_nic \
                    src/vnm_mad/remotes/dummy/vnet_create \
                    src/vnm_mad/remotes/dummy/vnet_delete"

NETWORK_BRIDGE_FILES="src/vnm_mad/remotes/bridge/clean \
                    src/vnm_mad/remotes/bridge/post \
                    src/vnm_mad/remotes/bridge/update_sg \
                    src/vnm_mad/remotes/bridge/pre \
                    src/vnm_mad/remotes/bridge/update_nic \
                    src/vnm_mad/remotes/bridge/vnet_create \
                    src/vnm_mad/remotes/bridge/vnet_delete"

NETWORK_FW_FILES="src/vnm_mad/remotes/fw/post \
                  src/vnm_mad/remotes/fw/pre \
                  src/vnm_mad/remotes/fw/update_sg \
                  src/vnm_mad/remotes/fw/update_nic \
                  src/vnm_mad/remotes/fw/clean \
                  src/vnm_mad/remotes/fw/vnet_create \
                  src/vnm_mad/remotes/fw/vnet_delete"

NETWORK_OVSWITCH_FILES="src/vnm_mad/remotes/ovswitch/clean \
                    src/vnm_mad/remotes/ovswitch/post \
                    src/vnm_mad/remotes/ovswitch/pre \
                    src/vnm_mad/remotes/ovswitch/update_sg \
                    src/vnm_mad/remotes/ovswitch/update_nic \
                    src/vnm_mad/remotes/ovswitch/OpenvSwitch.rb \
                    src/vnm_mad/remotes/ovswitch/vnet_create \
                    src/vnm_mad/remotes/ovswitch/vnet_delete"

NETWORK_OVSWITCH_VXLAN_FILES="src/vnm_mad/remotes/ovswitch_vxlan/clean \
                    src/vnm_mad/remotes/ovswitch_vxlan/post \
                    src/vnm_mad/remotes/ovswitch_vxlan/pre \
                    src/vnm_mad/remotes/ovswitch_vxlan/update_sg \
                    src/vnm_mad/remotes/ovswitch_vxlan/update_nic \
                    src/vnm_mad/remotes/ovswitch_vxlan/OpenvSwitchVXLAN.rb \
                    src/vnm_mad/remotes/ovswitch_vxlan/vnet_create \
                    src/vnm_mad/remotes/ovswitch_vxlan/vnet_delete"

NETWORK_ELASTIC_FILES="src/vnm_mad/remotes/elastic/elastic.rb \
                       src/vnm_mad/remotes/elastic/clean \
                       src/vnm_mad/remotes/elastic/remote_clean \
                       src/vnm_mad/remotes/elastic/post \
                       src/vnm_mad/remotes/elastic/remote_post \
                       src/vnm_mad/remotes/elastic/pre \
                       src/vnm_mad/remotes/elastic/update_sg \
                       src/vnm_mad/remotes/elastic/update_nic \
                       src/vnm_mad/remotes/elastic/vnet_create \
                       src/vnm_mad/remotes/elastic/vnet_delete"

NETWORK_NODEPORT_FILES="src/vnm_mad/remotes/nodeport/nodeport.rb \
                        src/vnm_mad/remotes/nodeport/clean \
                        src/vnm_mad/remotes/nodeport/post \
                        src/vnm_mad/remotes/nodeport/pre \
                        src/vnm_mad/remotes/nodeport/update_sg \
                        src/vnm_mad/remotes/nodeport/update_nic \
                        src/vnm_mad/remotes/nodeport/vnet_create \
                        src/vnm_mad/remotes/nodeport/vnet_delete"

#-------------------------------------------------------------------------------
# Virtual Network Manager drivers configuration to be installed under $REMOTES_LOCATION/etc/vnm
#-------------------------------------------------------------------------------

NETWORK_ETC_FILES="src/vnm_mad/remotes/OpenNebulaNetwork.conf"

#-------------------------------------------------------------------------------
# IPAM dummy drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
IPAM_DRIVER_DUMMY_SCRIPTS="src/ipamm_mad/remotes/dummy/register_address_range \
                           src/ipamm_mad/remotes/dummy/unregister_address_range \
                           src/ipamm_mad/remotes/dummy/allocate_address \
                           src/ipamm_mad/remotes/dummy/get_address \
                           src/ipamm_mad/remotes/dummy/free_address"

#-------------------------------------------------------------------------------
# IPAM Equinix drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
IPAM_DRIVER_EQUINIX_SCRIPTS="src/ipamm_mad/remotes/equinix/register_address_range \
                            src/ipamm_mad/remotes/equinix/unregister_address_range \
                            src/ipamm_mad/remotes/equinix/allocate_address \
                            src/ipamm_mad/remotes/equinix/get_address \
                            src/ipamm_mad/remotes/equinix/free_address"

#-------------------------------------------------------------------------------
# IPAM Scaleway drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
IPAM_DRIVER_SCALEWAY_SCRIPTS="src/ipamm_mad/remotes/scaleway/register_address_range \
                            src/ipamm_mad/remotes/scaleway/unregister_address_range \
                            src/ipamm_mad/remotes/scaleway/allocate_address \
                            src/ipamm_mad/remotes/scaleway/get_address \
                            src/ipamm_mad/remotes/scaleway/free_address"

#-------------------------------------------------------------------------------
# IPAM Vultr drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
IPAM_DRIVER_VULTR_SCRIPTS="src/ipamm_mad/remotes/vultr/register_address_range \
                           src/ipamm_mad/remotes/vultr/unregister_address_range \
                           src/ipamm_mad/remotes/vultr/allocate_address \
                           src/ipamm_mad/remotes/vultr/get_address \
                           src/ipamm_mad/remotes/vultr/free_address"

#-------------------------------------------------------------------------------
# IPAM EC2 drivers to be installed under $REMOTES_LOCATION/ipam
#-------------------------------------------------------------------------------
IPAM_DRIVER_EC2_SCRIPTS="src/ipamm_mad/remotes/aws/register_address_range \
                         src/ipamm_mad/remotes/aws/unregister_address_range \
                         src/ipamm_mad/remotes/aws/allocate_address \
                         src/ipamm_mad/remotes/aws/get_address \
                         src/ipamm_mad/remotes/aws/free_address"

#-------------------------------------------------------------------------------
# Transfer Manager commands, to be installed under $LIB_LOCATION/tm_commands
#   - SHARED TM, $VAR_LOCATION/tm/shared
#   - FS_LVM TM, $VAR_LOCATION/tm/fs_lvm
#   - QCOW2 TM, $VAR_LOCATION/tm/qcow2
#   - SSH TM, $VAR_LOCATION/tm/ssh
#   - DUMMY TM, $VAR_LOCATION/tm/dummy
#   - CEPH TM, $VAR_LOCATION/tm/ceph
#   - DEV TM, $VAR_LOCATION/tm/dev
#   - ISCSI TM, $VAR_LOCATION/tm/iscsi_libvirt
#-------------------------------------------------------------------------------

TM_FILES="src/tm_mad/tm_common.sh"

TM_LIB_FILES="src/tm_mad/lib/kvm.rb \
              src/tm_mad/lib/ceph.rb \
              src/tm_mad/lib/lvm.rb \
              src/tm_mad/lib/shell.rb \
              src/tm_mad/lib/tm_action.rb \
              src/tm_mad/lib/backup_qcow2.rb \
              src/tm_mad/lib/backup_lvmthin.rb \
              src/tm_mad/lib/backup_rbd.rb \
              src/tm_mad/lib/datastore.rb \
              src/tm_mad/lib/tm_cache.rb \
              src/tm_mad/lib/backup.rb"

TM_SHARED_FILES="src/tm_mad/shared/clone \
                 src/tm_mad/shared/clone.ssh \
                 src/tm_mad/shared/delete \
                 src/tm_mad/shared/ln \
                 src/tm_mad/shared/ln.ssh \
                 src/tm_mad/shared/monitor \
                 src/tm_mad/shared/mkswap \
                 src/tm_mad/shared/mkimage \
                 src/tm_mad/shared/mv \
                 src/tm_mad/shared/mv.ssh \
                 src/tm_mad/shared/context \
                 src/tm_mad/shared/premigrate \
                 src/tm_mad/shared/postmigrate \
                 src/tm_mad/shared/failmigrate \
                 src/tm_mad/shared/mvds \
                 src/tm_mad/shared/mvds.ssh \
                 src/tm_mad/shared/snap_create \
                 src/tm_mad/shared/snap_create.ssh \
                 src/tm_mad/shared/snap_create_live \
                 src/tm_mad/shared/snap_create_live.ssh \
                 src/tm_mad/shared/snap_delete \
                 src/tm_mad/shared/snap_delete.ssh \
                 src/tm_mad/shared/snap_revert \
                 src/tm_mad/shared/snap_revert.ssh \
                 src/tm_mad/shared/cpds \
                 src/tm_mad/shared/cpds.ssh \
                 src/tm_mad/shared/resize \
                 src/tm_mad/shared/prebackup_live \
                 src/tm_mad/shared/prebackup \
                 src/tm_mad/shared/postbackup_live \
                 src/tm_mad/shared/postbackup \
                 src/tm_mad/shared/restore"

TM_QCOW2_FILES="${TM_SHARED_FILES}"

TM_FS_LVM_FILES="src/tm_mad/fs_lvm/activate \
                 src/tm_mad/fs_lvm/clone \
                 src/tm_mad/fs_lvm/context \
                 src/tm_mad/fs_lvm/ln \
                 src/tm_mad/fs_lvm/monitor \
                 src/tm_mad/fs_lvm/mkswap \
                 src/tm_mad/fs_lvm/mkimage \
                 src/tm_mad/fs_lvm/mv \
                 src/tm_mad/fs_lvm/mvds \
                 src/tm_mad/fs_lvm/cpds \
                 src/tm_mad/fs_lvm/premigrate \
                 src/tm_mad/fs_lvm/postmigrate \
                 src/tm_mad/fs_lvm/snap_create \
                 src/tm_mad/fs_lvm/snap_create_live \
                 src/tm_mad/fs_lvm/snap_delete \
                 src/tm_mad/fs_lvm/snap_revert \
                 src/tm_mad/fs_lvm/failmigrate \
                 src/tm_mad/fs_lvm/delete \
                 src/tm_mad/fs_lvm/resize \
                 src/tm_mad/fs_lvm/restore \
                 src/tm_mad/fs_lvm/prebackup_live \
                 src/tm_mad/fs_lvm/prebackup \
                 src/tm_mad/fs_lvm/postbackup_live \
                 src/tm_mad/fs_lvm/postbackup"

TM_FS_LVM_ETC_FILES="src/tm_mad/fs_lvm/fs_lvm.conf"

TM_FS_LVM_SSH_FILES="src/tm_mad/fs_lvm_ssh/activate \
                     src/tm_mad/fs_lvm_ssh/clone \
                     src/tm_mad/fs_lvm_ssh/context \
                     src/tm_mad/fs_lvm_ssh/cpds \
                     src/tm_mad/fs_lvm_ssh/delete \
                     src/tm_mad/fs_lvm_ssh/failmigrate \
                     src/tm_mad/fs_lvm_ssh/ln \
                     src/tm_mad/fs_lvm_ssh/mkimage \
                     src/tm_mad/fs_lvm_ssh/mkswap \
                     src/tm_mad/fs_lvm_ssh/monitor \
                     src/tm_mad/fs_lvm_ssh/mv \
                     src/tm_mad/fs_lvm_ssh/mvds \
                     src/tm_mad/fs_lvm_ssh/postbackup \
                     src/tm_mad/fs_lvm_ssh/postbackup_live \
                     src/tm_mad/fs_lvm_ssh/postmigrate \
                     src/tm_mad/fs_lvm_ssh/prebackup \
                     src/tm_mad/fs_lvm_ssh/prebackup_live \
                     src/tm_mad/fs_lvm_ssh/premigrate \
                     src/tm_mad/fs_lvm_ssh/resize \
                     src/tm_mad/fs_lvm_ssh/restore \
                     src/tm_mad/fs_lvm_ssh/snap_create \
                     src/tm_mad/fs_lvm_ssh/snap_create_live \
                     src/tm_mad/fs_lvm_ssh/snap_delete \
                     src/tm_mad/fs_lvm_ssh/snap_revert"

TM_SSH_FILES="src/tm_mad/ssh/clone \
              src/tm_mad/ssh/clone.replica \
              src/tm_mad/ssh/delete \
              src/tm_mad/ssh/ln \
              src/tm_mad/ssh/ln.replica \
              src/tm_mad/ssh/mkswap \
              src/tm_mad/ssh/mkimage \
              src/tm_mad/ssh/mv \
              src/tm_mad/ssh/context \
              src/tm_mad/ssh/premigrate \
              src/tm_mad/ssh/postmigrate \
              src/tm_mad/ssh/failmigrate \
              src/tm_mad/ssh/mvds \
              src/tm_mad/ssh/snap_create \
              src/tm_mad/ssh/snap_create_live \
              src/tm_mad/ssh/snap_delete \
              src/tm_mad/ssh/snap_revert \
              src/tm_mad/ssh/monitor \
              src/tm_mad/ssh/monitor_ds \
              src/tm_mad/ssh/cpds \
              src/tm_mad/ssh/resize \
              src/tm_mad/ssh/ssh_utils.sh \
              src/tm_mad/ssh/recovery_snap_create_live \
              src/tm_mad/ssh/prebackup_live \
              src/tm_mad/ssh/prebackup \
              src/tm_mad/ssh/postbackup_live \
              src/tm_mad/ssh/postbackup \
              src/tm_mad/ssh/restore"

TM_LOCAL_FILES="src/tm_mad/local/clone \
                src/tm_mad/local/delete \
                src/tm_mad/local/ln \
                src/tm_mad/local/mkswap \
                src/tm_mad/local/mkimage \
                src/tm_mad/local/mv \
                src/tm_mad/local/context \
                src/tm_mad/local/premigrate \
                src/tm_mad/local/postmigrate \
                src/tm_mad/local/failmigrate \
                src/tm_mad/local/mvds \
                src/tm_mad/local/snap_create \
                src/tm_mad/local/snap_create_live \
                src/tm_mad/local/snap_delete \
                src/tm_mad/local/snap_revert \
                src/tm_mad/local/monitor \
                src/tm_mad/local/monitor_ds \
                src/tm_mad/local/cpds \
                src/tm_mad/local/resize \
                src/tm_mad/local/prebackup_live \
                src/tm_mad/local/prebackup \
                src/tm_mad/local/postbackup_live \
                src/tm_mad/local/postbackup \
                src/tm_mad/local/restore"

TM_SSH_ETC_FILES="src/tm_mad/ssh/sshrc"

TM_DUMMY_FILES="src/tm_mad/dummy/clone \
              src/tm_mad/dummy/delete \
              src/tm_mad/dummy/ln \
              src/tm_mad/dummy/mkswap \
              src/tm_mad/dummy/mkimage \
              src/tm_mad/dummy/mv \
              src/tm_mad/dummy/context \
              src/tm_mad/dummy/premigrate \
              src/tm_mad/dummy/postmigrate \
              src/tm_mad/dummy/failmigrate \
              src/tm_mad/dummy/mvds \
              src/tm_mad/dummy/snap_create \
              src/tm_mad/dummy/snap_create_live \
              src/tm_mad/dummy/snap_delete \
              src/tm_mad/dummy/snap_revert \
              src/tm_mad/dummy/monitor \
              src/tm_mad/dummy/cpds \
              src/tm_mad/dummy/resize \
              src/tm_mad/dummy/restore"

TM_CEPH_FILES="src/tm_mad/ceph/clone \
                 src/tm_mad/ceph/clone.ssh \
                 src/tm_mad/ceph/ln \
                 src/tm_mad/ceph/ln.ssh \
                 src/tm_mad/ceph/mv \
                 src/tm_mad/ceph/mvds \
                 src/tm_mad/ceph/mvds.ssh \
                 src/tm_mad/ceph/cpds \
                 src/tm_mad/ceph/cpds.ssh \
                 src/tm_mad/ceph/premigrate \
                 src/tm_mad/ceph/postmigrate \
                 src/tm_mad/ceph/snap_create \
                 src/tm_mad/ceph/snap_create_live \
                 src/tm_mad/ceph/snap_delete \
                 src/tm_mad/ceph/snap_revert \
                 src/tm_mad/ceph/failmigrate \
                 src/tm_mad/ceph/delete \
                 src/tm_mad/ceph/delete.ssh \
                 src/tm_mad/ceph/context \
                 src/tm_mad/ceph/mkimage \
                 src/tm_mad/ceph/monitor \
                 src/tm_mad/ceph/mkswap \
                 src/tm_mad/ceph/resize \
                 src/tm_mad/ceph/resize.ssh \
                 src/tm_mad/ceph/restore \
                 src/tm_mad/ceph/prebackup_live \
                 src/tm_mad/ceph/prebackup \
                 src/tm_mad/ceph/postbackup_live \
                 src/tm_mad/ceph/postbackup"

TM_DEV_FILES="src/tm_mad/dev/clone \
                 src/tm_mad/dev/ln \
                 src/tm_mad/dev/mv \
                 src/tm_mad/dev/mvds \
                 src/tm_mad/dev/cpds \
                 src/tm_mad/dev/premigrate \
                 src/tm_mad/dev/postmigrate \
                 src/tm_mad/dev/snap_create \
                 src/tm_mad/dev/snap_create_live \
                 src/tm_mad/dev/snap_delete \
                 src/tm_mad/dev/snap_revert \
                 src/tm_mad/dev/failmigrate \
                 src/tm_mad/dev/delete \
                 src/tm_mad/dev/resize"

TM_ISCSI_FILES="src/tm_mad/iscsi_libvirt/clone \
                 src/tm_mad/iscsi_libvirt/ln \
                 src/tm_mad/iscsi_libvirt/mv \
                 src/tm_mad/iscsi_libvirt/mvds \
                 src/tm_mad/iscsi_libvirt/cpds \
                 src/tm_mad/iscsi_libvirt/premigrate \
                 src/tm_mad/iscsi_libvirt/postmigrate \
                 src/tm_mad/iscsi_libvirt/snap_create \
                 src/tm_mad/iscsi_libvirt/snap_create_live \
                 src/tm_mad/iscsi_libvirt/snap_delete \
                 src/tm_mad/iscsi_libvirt/snap_revert \
                 src/tm_mad/iscsi_libvirt/failmigrate \
                 src/tm_mad/iscsi_libvirt/delete \
                 src/tm_mad/iscsi_libvirt/resize"

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
                             src/datastore_mad/remotes/url.rb \
                             src/datastore_mad/remotes/libfs.sh"

DATASTORE_DRIVER_DUMMY_SCRIPTS="src/datastore_mad/remotes/dummy/cp \
                         src/datastore_mad/remotes/dummy/mkfs \
                         src/datastore_mad/remotes/dummy/stat \
                         src/datastore_mad/remotes/dummy/clone \
                         src/datastore_mad/remotes/dummy/monitor \
                         src/datastore_mad/remotes/dummy/snap_delete \
                         src/datastore_mad/remotes/dummy/snap_revert \
                         src/datastore_mad/remotes/dummy/snap_flatten \
                         src/datastore_mad/remotes/dummy/rm \
                         src/datastore_mad/remotes/dummy/restore \
                         src/datastore_mad/remotes/dummy/export"

DATASTORE_DRIVER_FS_SCRIPTS="src/datastore_mad/remotes/fs/cp \
                         src/datastore_mad/remotes/fs/mkfs \
                         src/datastore_mad/remotes/fs/stat \
                         src/datastore_mad/remotes/fs/clone \
                         src/datastore_mad/remotes/fs/monitor \
                         src/datastore_mad/remotes/fs/snap_delete \
                         src/datastore_mad/remotes/fs/snap_revert \
                         src/datastore_mad/remotes/fs/snap_flatten \
                         src/datastore_mad/remotes/fs/rm \
                         src/datastore_mad/remotes/fs/export"

DATASTORE_DRIVER_ETC_FS_SCRIPTS="src/datastore_mad/remotes/fs/fs.conf"

DATASTORE_DRIVER_CEPH_SCRIPTS="src/datastore_mad/remotes/ceph/cp \
                         src/datastore_mad/remotes/ceph/mkfs \
                         src/datastore_mad/remotes/ceph/stat \
                         src/datastore_mad/remotes/ceph/rm \
                         src/datastore_mad/remotes/ceph/monitor \
                         src/datastore_mad/remotes/ceph/clone \
                         src/datastore_mad/remotes/ceph/snap_delete \
                         src/datastore_mad/remotes/ceph/snap_revert \
                         src/datastore_mad/remotes/ceph/snap_flatten \
                         src/datastore_mad/remotes/ceph/ceph_utils.sh \
                         src/datastore_mad/remotes/ceph/export"

DATASTORE_DRIVER_ETC_CEPH_SCRIPTS="src/datastore_mad/remotes/ceph/ceph.conf"

DATASTORE_DRIVER_DEV_SCRIPTS="src/datastore_mad/remotes/dev/cp \
                         src/datastore_mad/remotes/dev/mkfs \
                         src/datastore_mad/remotes/dev/stat \
                         src/datastore_mad/remotes/dev/rm \
                         src/datastore_mad/remotes/dev/monitor \
                         src/datastore_mad/remotes/dev/snap_delete \
                         src/datastore_mad/remotes/dev/snap_revert \
                         src/datastore_mad/remotes/dev/snap_flatten \
                         src/datastore_mad/remotes/dev/clone"

DATASTORE_DRIVER_ISCSI_SCRIPTS="src/datastore_mad/remotes/iscsi_libvirt/cp \
                         src/datastore_mad/remotes/iscsi_libvirt/mkfs \
                         src/datastore_mad/remotes/iscsi_libvirt/stat \
                         src/datastore_mad/remotes/iscsi_libvirt/rm \
                         src/datastore_mad/remotes/iscsi_libvirt/monitor \
                         src/datastore_mad/remotes/iscsi_libvirt/snap_delete \
                         src/datastore_mad/remotes/iscsi_libvirt/snap_revert \
                         src/datastore_mad/remotes/iscsi_libvirt/snap_flatten \
                         src/datastore_mad/remotes/iscsi_libvirt/clone"

DATASTORE_DRIVER_RSYNC_SCRIPTS="src/datastore_mad/remotes/rsync/cp \
                         src/datastore_mad/remotes/rsync/mkfs \
                         src/datastore_mad/remotes/rsync/stat \
                         src/datastore_mad/remotes/rsync/clone \
                         src/datastore_mad/remotes/rsync/monitor \
                         src/datastore_mad/remotes/rsync/snap_delete \
                         src/datastore_mad/remotes/rsync/snap_revert \
                         src/datastore_mad/remotes/rsync/snap_flatten \
                         src/datastore_mad/remotes/rsync/rm \
                         src/datastore_mad/remotes/rsync/backup \
                         src/datastore_mad/remotes/rsync/backup_cancel \
                         src/datastore_mad/remotes/rsync/restore \
                         src/datastore_mad/remotes/rsync/export \
                         src/datastore_mad/remotes/rsync/increment_flatten \
                         src/datastore_mad/remotes/rsync/ls"

DATASTORE_DRIVER_RESTIC_SCRIPTS="src/datastore_mad/remotes/restic/cp \
                                 src/datastore_mad/remotes/restic/mkfs \
                                 src/datastore_mad/remotes/restic/stat \
                                 src/datastore_mad/remotes/restic/rm \
                                 src/datastore_mad/remotes/restic/monitor \
                                 src/datastore_mad/remotes/restic/snap_delete \
                                 src/datastore_mad/remotes/restic/snap_revert \
                                 src/datastore_mad/remotes/restic/snap_flatten \
                                 src/datastore_mad/remotes/restic/clone \
                                 src/datastore_mad/remotes/restic/restore \
                                 src/datastore_mad/remotes/restic/restic.rb \
                                 src/datastore_mad/remotes/restic/restic \
                                 src/datastore_mad/remotes/restic/increment_flatten \
                                 src/datastore_mad/remotes/restic/backup \
                                 src/datastore_mad/remotes/restic/backup_cancel \
                                 src/datastore_mad/remotes/restic/ls"

DATASTORE_DRIVER_ETC_SCRIPTS="src/datastore_mad/remotes/datastore.conf"

#-------------------------------------------------------------------------------
# Marketplace drivers, to be installed under $REMOTES_LOCATION/market
#   - HTTP based marketplace, $REMOTES_LOCATION/market/http
#   - OpenNebula public marketplace, $REMOTES_LOCATION/market/one
#   - S3-obeject based marketplace, $REMOTES_LOCATION/market/s3
#   - Linuxcontainers.org marketplace $REMOTE_LOCATION/market/linuxcontainers
#-------------------------------------------------------------------------------

MARKETPLACE_DRIVER_HTTP_SCRIPTS="src/market_mad/remotes/http/import \
            src/market_mad/remotes/http/delete \
            src/market_mad/remotes/http/monitor"

MARKETPLACE_DRIVER_ETC_HTTP_SCRIPTS="src/market_mad/remotes/http/http.conf"

MARKETPLACE_DRIVER_ONE_SCRIPTS="src/market_mad/remotes/one/import \
            src/market_mad/remotes/one/delete \
            src/market_mad/remotes/one/monitor"

MARKETPLACE_DRIVER_S3_SCRIPTS="src/market_mad/remotes/s3/import \
            src/market_mad/remotes/s3/delete \
            src/market_mad/remotes/s3/monitor \
            src/market_mad/remotes/s3/S3.rb"

MARKETPLACE_DRIVER_LXC_SCRIPTS="src/market_mad/remotes/linuxcontainers/import \
            src/market_mad/remotes/linuxcontainers/delete \
            src/market_mad/remotes/linuxcontainers/monitor \
            src/market_mad/remotes/linuxcontainers/lxd.rb"

#-------------------------------------------------------------------------------
# Scheduler drivers, to be installed under $REMOTES_LOCATION/sched
#   - Rank scheduler $REMOTES_LOCATION/scheduler/rank
#   - OpenNebula DRS, $REMOTES_LOCATION/scheduler/one-drs
#-------------------------------------------------------------------------------

SCHEDULER_DRIVER_RANK_SCRIPTS="src/schedm_mad/remotes/rank/src/sched/place \
            src/schedm_mad/remotes/rank/optimize"

SCHEDULER_DRIVER_ONEDRS_SCRIPTS="src/schedm_mad/remotes/one_drs/place \
            src/schedm_mad/remotes/one_drs/optimize"

SCHEDULER_DRIVER_DUMMY_SCRIPTS="src/schedm_mad/remotes/dummy/place \
            src/schedm_mad/remotes/dummy/optimize"

SCHEDULER_DRIVER_ONEDRS_VENDOR="src/schedm_mad/remotes/one_drs/vendor/lib/PuLP-2.9.0.dist-info/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/bin/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/pulp/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/typing_extensions-4.12.2.dist-info/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/typing_extensions.py \
            src/schedm_mad/remotes/one_drs/vendor/lib/xsdata/ \
            src/schedm_mad/remotes/one_drs/vendor/lib/xsdata-24.12.dist-info/"

SCHEDULER_DRIVER_ONEDRS_LIB="src/schedm_mad/remotes/one_drs/lib/optimizer_parser.py \
            src/schedm_mad/remotes/one_drs/lib/optimizer_serializer.py \
            src/schedm_mad/remotes/one_drs/lib/xsd_parser.sh \
            src/schedm_mad/remotes/one_drs/lib/__init__.py"

SCHEDULER_DRIVER_ONEDRS_MAPPER="src/schedm_mad/remotes/one_drs/lib/mapper/ilp_optimizer.py \
            src/schedm_mad/remotes/one_drs/lib/mapper/model.py \
            src/schedm_mad/remotes/one_drs/lib/mapper/mapper.py \
            src/schedm_mad/remotes/one_drs/lib/mapper/__init__.py"

SCHEDULER_DRIVER_ONEDRS_MODELS="src/schedm_mad/remotes/one_drs/lib/models/__init__.py \
            src/schedm_mad/remotes/one_drs/lib/models/cluster.py \
            src/schedm_mad/remotes/one_drs/lib/models/cluster_pool.py \
            src/schedm_mad/remotes/one_drs/lib/models/datastore.py \
            src/schedm_mad/remotes/one_drs/lib/models/datastore_pool.py \
            src/schedm_mad/remotes/one_drs/lib/models/host.py \
            src/schedm_mad/remotes/one_drs/lib/models/host_pool.py \
            src/schedm_mad/remotes/one_drs/lib/models/plan.py \
            src/schedm_mad/remotes/one_drs/lib/models/requirements.py \
            src/schedm_mad/remotes/one_drs/lib/models/scheduler_driver_action.py \
            src/schedm_mad/remotes/one_drs/lib/models/shared.py \
            src/schedm_mad/remotes/one_drs/lib/models/vm_group.py \
            src/schedm_mad/remotes/one_drs/lib/models/vm_group_pool.py \
            src/schedm_mad/remotes/one_drs/lib/models/vm.py \
            src/schedm_mad/remotes/one_drs/lib/models/vm_pool_extended.py \
            src/schedm_mad/remotes/one_drs/lib/models/vnet.py \
            src/schedm_mad/remotes/one_drs/lib/models/vnet_pool_extended.py"

#-------------------------------------------------------------------------------
# Migration scripts for onedb command, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------

ONEDB_FILES="src/onedb/fsck.rb \
            src/onedb/onedb.rb \
            src/onedb/onedb_backend.rb \
            src/onedb/sqlite2mysql.rb \
            src/onedb/database_schema.rb \
            src/onedb/fsck \
            src/onedb/onedb_live.rb"

ONEDB_PATCH_FILES="src/onedb/patches/history_times.rb"

ONEDB_SHARED_MIGRATOR_FILES="src/onedb/shared/2.0_to_2.9.80.rb \
                             src/onedb/shared/2.9.80_to_2.9.85.rb \
                             src/onedb/shared/2.9.85_to_2.9.90.rb \
                             src/onedb/shared/2.9.90_to_3.0.0.rb \
                             src/onedb/shared/3.0.0_to_3.1.0.rb \
                             src/onedb/shared/3.1.0_to_3.1.80.rb \
                             src/onedb/shared/3.1.80_to_3.2.0.rb \
                             src/onedb/shared/3.2.0_to_3.2.1.rb \
                             src/onedb/shared/3.2.1_to_3.3.0.rb \
                             src/onedb/shared/3.3.0_to_3.3.80.rb \
                             src/onedb/shared/3.3.80_to_3.4.0.rb \
                             src/onedb/shared/3.4.0_to_3.4.1.rb \
                             src/onedb/shared/3.4.1_to_3.5.80.rb \
                             src/onedb/shared/3.5.80_to_3.6.0.rb \
                             src/onedb/shared/3.6.0_to_3.7.80.rb \
                             src/onedb/shared/3.7.80_to_3.8.0.rb \
                             src/onedb/shared/3.8.0_to_3.8.1.rb \
                             src/onedb/shared/3.8.1_to_3.8.2.rb \
                             src/onedb/shared/3.8.2_to_3.8.3.rb \
                             src/onedb/shared/3.8.3_to_3.8.4.rb \
                             src/onedb/shared/3.8.4_to_3.8.5.rb \
                             src/onedb/shared/3.8.5_to_3.9.80.rb \
                             src/onedb/shared/3.9.80_to_3.9.90.rb \
                             src/onedb/shared/3.9.90_to_4.0.0.rb \
                             src/onedb/shared/4.0.0_to_4.0.1.rb \
                             src/onedb/shared/4.0.1_to_4.1.80.rb \
                             src/onedb/shared/4.1.80_to_4.2.0.rb \
                             src/onedb/shared/4.2.0_to_4.3.80.rb \
                             src/onedb/shared/4.3.80_to_4.3.85.rb \
                             src/onedb/shared/4.3.85_to_4.3.90.rb \
                             src/onedb/shared/4.3.90_to_4.4.0.rb \
                             src/onedb/shared/4.4.0_to_4.4.1.rb \
                             src/onedb/shared/4.4.1_to_4.5.80.rb\
                             src/onedb/shared/4.5.80_to_4.6.0.rb \
                             src/onedb/shared/4.6.0_to_4.11.80.rb \
                             src/onedb/shared/4.11.80_to_4.90.0.rb \
                             src/onedb/shared/4.90.0_to_5.2.0.rb \
                             src/onedb/shared/5.2.0_to_5.3.80.rb \
                             src/onedb/shared/5.3.80_to_5.4.0.rb \
                             src/onedb/shared/5.4.0_to_5.4.1.rb \
                             src/onedb/shared/5.4.1_to_5.5.80.rb \
                             src/onedb/shared/5.5.80_to_5.6.0.rb \
                             src/onedb/shared/5.6.0_to_5.10.0.rb \
                             src/onedb/shared/5.10.0_to_5.12.0.rb \
                             src/onedb/shared/5.12.0_to_6.0.0.rb \
                             src/onedb/shared/6.0.0_to_6.2.0.rb \
                             src/onedb/shared/6.2.0_to_6.4.0.rb \
                             src/onedb/shared/6.4.0_to_6.6.0.rb \
                             src/onedb/shared/6.6.0_to_6.8.0.rb \
                             src/onedb/shared/6.8.0_to_6.10.0.rb \
                             src/onedb/shared/6.10.0_to_7.0.0.rb \
                             src/onedb/shared/7.0.0_to_7.2.0.rb"

ONEDB_LOCAL_MIGRATOR_FILES="src/onedb/local/4.5.80_to_4.7.80.rb \
                            src/onedb/local/4.7.80_to_4.9.80.rb \
                            src/onedb/local/4.9.80_to_4.10.3.rb \
                            src/onedb/local/4.10.3_to_4.11.80.rb \
                            src/onedb/local/4.11.80_to_4.13.80.rb \
                            src/onedb/local/4.13.80_to_4.13.85.rb \
                            src/onedb/local/4.13.85_to_4.90.0.rb \
                            src/onedb/local/4.90.0_to_5.3.80.rb \
                            src/onedb/local/5.3.80_to_5.4.0.rb \
                            src/onedb/local/5.4.0_to_5.4.1.rb \
                            src/onedb/local/5.4.1_to_5.5.80.rb \
                            src/onedb/local/5.5.80_to_5.6.0.rb \
                            src/onedb/local/5.6.0_to_5.7.80.rb \
                            src/onedb/local/5.7.80_to_5.8.0.rb \
                            src/onedb/local/5.8.0_to_5.10.0.rb \
                            src/onedb/local/5.10.0_to_5.12.0.rb \
                            src/onedb/local/5.12.0_to_6.0.0.rb \
                            src/onedb/local/6.0.0_to_6.2.0.rb \
                            src/onedb/local/6.2.0_to_6.4.0.rb \
                            src/onedb/local/6.4.0_to_6.6.0.rb \
                            src/onedb/local/6.6.0_to_6.8.0.rb \
                            src/onedb/local/6.8.0_to_6.10.0.rb \
                            src/onedb/local/6.10.0_to_7.0.0.rb \
                            src/onedb/local/7.0.0_to_7.2.0.rb"

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
                  src/vmm_mad/exec/vmm_exec_kvm.conf"

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
# HOOK scripts, to be installed under $VAR_LOCATION/remotes/hooks/autostart
#-------------------------------------------------------------------------------

HOOK_AUTOSTART_FILES="share/hooks/autostart/host \
               share/hooks/autostart/vm"

#-------------------------------------------------------------------------------
# HOOK scripts, to be installed under $VAR_LOCATION/remotes/hooks/ft
#-------------------------------------------------------------------------------

HOOK_FT_FILES="share/hooks/ft/host_error.rb \
               share/hooks/ft/fence_host.sh"

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

#-------------------------------------------------------------------------------
# Start script files, to be installed under $SHARE_LOCATION/start-scripts
#-------------------------------------------------------------------------------

START_SCRIPT_SHARE_FILES="share/start-scripts/map_vnets_start_script \
                          share/start-scripts/cron_start_script"

#-------------------------------------------------------------------------------
# OCA Files
#-------------------------------------------------------------------------------
OCA_LIB_FILES="src/oca/ruby/opennebula.rb"

RUBY_OPENNEBULA_LIB_FILES="src/oca/ruby/opennebula/acl_pool.rb \
                            src/oca/ruby/opennebula/acl.rb \
                            src/oca/ruby/opennebula/client.rb \
                            src/oca/ruby/opennebula/cluster_pool.rb \
                            src/oca/ruby/opennebula/cluster.rb \
                            src/oca/ruby/opennebula/datastore_pool.rb \
                            src/oca/ruby/opennebula/datastore.rb \
                            src/oca/ruby/opennebula/document_json.rb \
                            src/oca/ruby/opennebula/document_pool_json.rb \
                            src/oca/ruby/opennebula/document_pool.rb \
                            src/oca/ruby/opennebula/document.rb \
                            src/oca/ruby/opennebula/error.rb \
                            src/oca/ruby/opennebula/group_pool.rb \
                            src/oca/ruby/opennebula/group.rb \
                            src/oca/ruby/opennebula/host_pool.rb \
                            src/oca/ruby/opennebula/host.rb \
                            src/oca/ruby/opennebula/image_pool.rb \
                            src/oca/ruby/opennebula/image.rb \
                            src/oca/ruby/opennebula/lockable_ext.rb \
                            src/oca/ruby/opennebula/wait_ext.rb \
                            src/oca/ruby/opennebula/oneflow_client.rb \
                            src/oca/ruby/opennebula/pool_element.rb \
                            src/oca/ruby/opennebula/pool.rb \
                            src/oca/ruby/opennebula/security_group_pool.rb \
                            src/oca/ruby/opennebula/security_group.rb \
                            src/oca/ruby/opennebula/vm_group_pool.rb \
                            src/oca/ruby/opennebula/vm_group.rb \
                            src/oca/ruby/opennebula/system.rb \
                            src/oca/ruby/opennebula/template_pool.rb \
                            src/oca/ruby/opennebula/template.rb \
                            src/oca/ruby/opennebula/template_ext.rb \
                            src/oca/ruby/opennebula/user_pool.rb \
                            src/oca/ruby/opennebula/user.rb \
                            src/oca/ruby/opennebula/vdc_pool.rb \
                            src/oca/ruby/opennebula/vdc.rb \
                            src/oca/ruby/opennebula/virtual_machine.rb \
                            src/oca/ruby/opennebula/virtual_machine_ext.rb \
                            src/oca/ruby/opennebula/virtual_machine_pool.rb \
                            src/oca/ruby/opennebula/virtual_network_pool.rb \
                            src/oca/ruby/opennebula/virtual_network.rb \
                            src/oca/ruby/opennebula/xml_element.rb \
                            src/oca/ruby/opennebula/xml_pool.rb \
                            src/oca/ruby/opennebula/xml_utils.rb \
                            src/oca/ruby/opennebula/zone_pool.rb \
                            src/oca/ruby/opennebula/zone.rb \
                            src/oca/ruby/opennebula/virtual_router_pool.rb \
                            src/oca/ruby/opennebula/virtual_router.rb \
                            src/oca/ruby/opennebula/marketplace_pool.rb \
                            src/oca/ruby/opennebula/marketplace.rb \
                            src/oca/ruby/opennebula/marketplaceapp_pool.rb \
                            src/oca/ruby/opennebula/marketplaceapp.rb \
                            src/oca/ruby/opennebula/marketplaceapp_ext.rb \
                            src/oca/ruby/opennebula/utils.rb \
                            src/oca/ruby/opennebula/vntemplate_pool.rb \
                            src/oca/ruby/opennebula/vntemplate.rb \
                            src/oca/ruby/opennebula/hook_pool.rb \
                            src/oca/ruby/opennebula/hook.rb \
                            src/oca/ruby/opennebula/backupjob_pool.rb \
                            src/oca/ruby/opennebula/backupjob.rb \
                            src/oca/ruby/opennebula/hook_log.rb \
                            src/oca/ruby/opennebula/flow.rb"

RUBY_OPENNEBULA_LIB_FLOW_FILES="src/oca/ruby/opennebula/flow/grammar.rb \
                                 src/oca/ruby/opennebula/flow/service_pool.rb \
                                 src/oca/ruby/opennebula/flow/service_template_pool.rb \
                                 src/oca/ruby/opennebula/flow/service_template.rb \
                                 src/oca/ruby/opennebula/flow/service_template_ext.rb \
                                 src/oca/ruby/opennebula/flow/validator.rb"

#-------------------------------------------------------------------------------
# Common Cloud Files
#-------------------------------------------------------------------------------

COMMON_CLOUD_LIB_FILES="src/cloud/common/CloudServer.rb \
                        src/cloud/common/CloudClient.rb \
                        src/cloud/common/CloudAuth.rb"

COMMON_CLOUD_CLIENT_LIB_FILES="src/cloud/common/CloudClient.rb"

CLOUD_AUTH_LIB_FILES="src/cloud/common/CloudAuth/X509CloudAuth.rb \
                      src/cloud/common/CloudAuth/RemoteCloudAuth.rb \
                      src/cloud/common/CloudAuth/OneGateCloudAuth.rb \
                      src/cloud/common/CloudAuth/OpenNebulaCloudAuth.rb"

#-----------------------------------------------------------------------------
# CLI files
#-----------------------------------------------------------------------------

CLI_LIB_FILES="src/cli/cli_helper.rb \
               src/cli/command_parser.rb \
               src/cli/one_helper.rb"

ONE_CLI_LIB_FILES="src/cli/one_helper/onegroup_helper.rb \
                   src/cli/one_helper/onehost_helper.rb \
                   src/cli/one_helper/oneimage_helper.rb \
                   src/cli/one_helper/onetemplate_helper.rb \
                   src/cli/one_helper/onequota_helper.rb \
                   src/cli/one_helper/oneuser_helper.rb \
                   src/cli/one_helper/onevm_helper.rb \
                   src/cli/one_helper/onevnet_helper.rb \
                   src/cli/one_helper/oneacl_helper.rb \
                   src/cli/one_helper/onedatastore_helper.rb \
                   src/cli/one_helper/onecluster_helper.rb \
                   src/cli/one_helper/onezone_helper.rb \
                   src/cli/one_helper/onevdc_helper.rb \
                   src/cli/one_helper/oneacct_helper.rb \
                   src/cli/one_helper/onesecgroup_helper.rb \
                   src/cli/one_helper/onevmgroup_helper.rb \
                   src/cli/one_helper/onevrouter_helper.rb \
                   src/cli/one_helper/onemarketapp_helper.rb \
                   src/cli/one_helper/onemarket_helper.rb \
                   src/cli/one_helper/onevntemplate_helper.rb \
                   src/cli/one_helper/onehook_helper.rb \
                   src/cli/one_helper/onebackupjob_helper.rb \
                   src/cli/one_helper/oneflow_helper.rb \
                   src/cli/one_helper/oneflowtemplate_helper.rb"

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

CLI_CONF_FILES="src/cli/etc/onegroup.yaml \
                src/cli/etc/onehost.yaml \
                src/cli/etc/oneimage.yaml \
                src/cli/etc/onetemplate.yaml \
                src/cli/etc/oneuser.yaml \
                src/cli/etc/onevm.yaml \
                src/cli/etc/onevnet.yaml \
                src/cli/etc/oneacl.yaml \
                src/cli/etc/onedatastore.yaml \
                src/cli/etc/onecluster.yaml \
                src/cli/etc/onezone.yaml \
                src/cli/etc/oneacct.yaml \
                src/cli/etc/onesecgroup.yaml \
                src/cli/etc/onevmgroup.yaml \
                src/cli/etc/oneshowback.yaml \
                src/cli/etc/onevdc.yaml \
                src/cli/etc/onevrouter.yaml \
                src/cli/etc/onemarketapp.yaml \
                src/cli/etc/onemarket.yaml \
                src/cli/etc/onevntemplate.yaml \
                src/cli/etc/onehook.yaml \
                src/cli/etc/onebackupjob.yaml \
                src/cli/etc/oneflow.yaml \
                src/cli/etc/oneflowtemplate.yaml"

#-----------------------------------------------------------------------------
# FireEdge files
#-----------------------------------------------------------------------------

FIREEDGE_BIN_FILES="src/fireedge/bin/fireedge-server"

FIREEDGE_MINIFIED_FILES="src/fireedge/dist \
                src/fireedge/node_modules"

FIREEDGE_DEV_FILES="src/fireedge/src \
                src/fireedge/package.json"

FIREEDGE_ETC_FILES="src/fireedge/etc/fireedge-server.conf"

#----------------------------------------------------------------------------
# FireEdge Sunstone files
#----------------------------------------------------------------------------

FIREEDGE_SUNSTONE_ETC="src/fireedge/etc/sunstone/sunstone-server.conf \
                       src/fireedge/etc/sunstone/tab-manifest.yaml \
                       src/fireedge/etc/sunstone/default-labels.yaml \
                       src/fireedge/etc/sunstone/remotes-config.yaml"

FIREEDGE_SUNSTONE_ETC_PROFILES="src/fireedge/etc/sunstone/profiles/windows_optimized.yaml \
                                src/fireedge/etc/sunstone/profiles/base.template"

FIREEDGE_SUNSTONE_ETC_VIEW="src/fireedge/etc/sunstone/views/sunstone-views.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_ADMIN="src/fireedge/etc/sunstone/views/admin/vm-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vm-group-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vnet-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vnet-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/image-tab.yaml\
                                src/fireedge/etc/sunstone/views/admin/file-tab.yaml\
                                src/fireedge/etc/sunstone/views/admin/sec-group-tab.yaml\
                                src/fireedge/etc/sunstone/views/admin/backup-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/datastore-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vdc-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/user-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/service-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/service-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vrouter-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/vrouter-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/backupjobs-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/host-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/group-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/acl-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/cluster-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/support-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/zone-tab.yaml \
                                src/fireedge/etc/sunstone/views/admin/marketplace-tab.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_USER="src/fireedge/etc/sunstone/views/user/vm-tab.yaml \
                                src/fireedge/etc/sunstone/views/user/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/user/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/views/user/image-tab.yaml\
                                src/fireedge/etc/sunstone/views/user/file-tab.yaml\
                                src/fireedge/etc/sunstone/views/user/backup-tab.yaml \
                                src/fireedge/etc/sunstone/views/user/sec-group-tab.yaml \
                                src/fireedge/etc/sunstone/views/user/vnet-tab.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_GROUPADMIN="src/fireedge/etc/sunstone/views/groupadmin/vm-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/sec-group-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vnet-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vnet-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/user-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/service-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/service-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vm-group-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vrouter-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/vrouter-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/groupadmin/group-tab.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_CLOUD="src/fireedge/etc/sunstone/views/cloud/vm-tab.yaml \
                                src/fireedge/etc/sunstone/views/cloud/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/views/cloud/service-tab.yaml \
                                src/fireedge/etc/sunstone/views/cloud/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/views/cloud/dashboard-tab.yaml \
                                src/fireedge/etc/sunstone/views/cloud/user-tab.yaml"

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

ONEFLOW_LIB_FILES="src/flow/lib/grammar.treetop \
                    src/flow/lib/LifeCycleManager.rb \
                    src/flow/lib/ServiceWatchDog.rb \
                    src/flow/lib/ServiceAutoScaler.rb \
                    src/flow/lib/log.rb \
                    src/flow/lib/models.rb \
                    src/flow/lib/strategy.rb \
                    src/flow/lib/EventManager.rb"

ONEFLOW_LIB_STRATEGY_FILES="src/flow/lib/strategy/straight.rb"

ONEFLOW_LIB_MODELS_FILES="src/flow/lib/models/role.rb \
			  src/flow/lib/models/vmrole.rb \
			  src/flow/lib/models/vrrole.rb \
                          src/flow/lib/models/service.rb"

#-----------------------------------------------------------------------------
# Onecfg files
#-----------------------------------------------------------------------------

ONECFG_BIN_FILES="src/onecfg/bin/onecfg"

ONECFG_LIB_FILES="src/onecfg/lib/onecfg.rb
                  src/onecfg/lib/common.rb \
                  src/onecfg/lib/config.rb \
                  src/onecfg/lib/exception.rb \
                  src/onecfg/lib/settings.rb \
                  src/onecfg/lib/transaction.rb \
                  src/onecfg/lib/patch.rb \
                  src/onecfg/lib/version.rb \
                  src/onecfg/lib/ee.rb"

ONECFG_LIB_COMMON_FILES="src/onecfg/lib/common/backup.rb \
                         src/onecfg/lib/common/parser.rb"

ONECFG_LIB_COMMON_HELPERS_FILES="src/onecfg/lib/common/helpers/onecfg_helper.rb"
ONECFG_LIB_COMMON_LOGGER_FILES="src/onecfg/lib/common/logger/cli_logger.rb"

ONECFG_LIB_CONFIG_FILES="src/onecfg/lib/config/exception.rb \
                                    src/onecfg/lib/config/files.rb \
                                    src/onecfg/lib/config/fsops.rb \
                                    src/onecfg/lib/config/type.rb \
                                    src/onecfg/lib/config/utils.rb"

ONECFG_LIB_CONFIG_TYPE_FILES="src/onecfg/lib/config/type/augeas.rb \
                                        src/onecfg/lib/config/type/base.rb \
                                        src/onecfg/lib/config/type/simple.rb \
                                        src/onecfg/lib/config/type/yaml.rb"

ONECFG_LIB_CONFIG_TYPE_AUGEAS_FILES="src/onecfg/lib/config/type/augeas/one.rb \
                                     src/onecfg/lib/config/type/augeas/shell.rb"

ONECFG_LIB_CONFIG_TYPE_YAML_FILES="src/onecfg/lib/config/type/yaml/strict.rb"
ONECFG_LIB_PATCH_FILES="src/onecfg/lib/patch/apply.rb"

ONECFG_SHARE_ETC_FILES="src/onecfg/share/etc/files.yaml"

ONECFG_LIB_EE_FILES="src/onecfg/lib/ee/commands.rb \
                     src/onecfg/lib/ee/config.rb \
                     src/onecfg/lib/ee/migrators.rb \
                     src/onecfg/lib/ee/patch.rb"

ONECFG_LIB_EE_MIGRATORS_FILES="src/onecfg/lib/ee/migrators/apply.rb \
                               src/onecfg/lib/ee/migrators/generate.rb \
                               src/onecfg/lib/ee/migrators/migrator.rb"

ONECFG_LIB_EE_CONFIG_FILES="src/onecfg/lib/ee/config/settings.rb \
                            src/onecfg/lib/ee/config/versions.rb"

ONECFG_LIB_EE_PATCH_FILES="src/onecfg/lib/ee/patch/generate.rb"

ONECFG_SHARE_MIGRATORS_FILES="src/onecfg/share/migrators/5.4.0_to_5.4.1.yaml \
                              src/onecfg/share/migrators/5.4.1_to_5.4.2.yaml \
                              src/onecfg/share/migrators/5.4.2_to_5.4.6.yaml \
                              src/onecfg/share/migrators/5.4.6_to_5.6.0.rb \
                              src/onecfg/share/migrators/5.4.6_to_5.6.0.yaml \
                              src/onecfg/share/migrators/5.6.0_to_5.8.0.rb \
                              src/onecfg/share/migrators/5.6.0_to_5.8.0.yaml \
                              src/onecfg/share/migrators/5.8.0_to_5.10.0.rb \
                              src/onecfg/share/migrators/5.8.0_to_5.10.0.yaml \
                              src/onecfg/share/migrators/5.10.0_to_5.12.0.rb \
                              src/onecfg/share/migrators/5.10.0_to_5.12.0.yaml \
                              src/onecfg/share/migrators/5.12.0_to_6.0.0.rb \
                              src/onecfg/share/migrators/5.12.0_to_6.0.0.yaml \
                              src/onecfg/share/migrators/6.0.0_to_6.2.0.rb \
                              src/onecfg/share/migrators/6.0.0_to_6.2.0.yaml \
                              src/onecfg/share/migrators/6.2.0_to_6.4.0.rb \
                              src/onecfg/share/migrators/6.2.0_to_6.4.0.yaml \
                              src/onecfg/share/migrators/6.4.0_to_6.6.0.rb \
                              src/onecfg/share/migrators/6.4.0_to_6.6.0.yaml \
                              src/onecfg/share/migrators/6.6.0_to_6.8.0.rb \
                              src/onecfg/share/migrators/6.6.0_to_6.8.0.yaml \
                              src/onecfg/share/migrators/6.8.0_to_6.10.0.rb \
                              src/onecfg/share/migrators/6.8.0_to_6.10.0.yaml \
                              src/onecfg/share/migrators/6.10.0_to_6.10.2.rb \
                              src/onecfg/share/migrators/6.10.0_to_6.10.2.yaml \
                              src/onecfg/share/migrators/6.10.2_to_7.0.0.rb \
                              src/onecfg/share/migrators/6.10.2_to_7.0.0.yaml \
                              src/onecfg/share/migrators/7.0.0_to_7.1.80.rb \
                              src/onecfg/share/migrators/7.0.0_to_7.1.80.yaml"

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

SSH_SHARE_FILES="share/ssh/etc/config \
                 share/ssh/etc/config-pre7.6"

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

#-----------------------------------------------------------------------------
# Ruby VENDOR files
#-----------------------------------------------------------------------------

VENDOR_DIRS="share/vendor/ruby/gems/packethost"

#-------------------------------------------------------------------------------
# Libvirt RelaxNG schemas
#-------------------------------------------------------------------------------

LIBVIRT_RNG_SHARE_MODULE_FILES="share/schemas/libvirt/basictypes.rng \
                               share/schemas/libvirt/cputypes.rng \
                               share/schemas/libvirt/domaincaps.rng \
                               share/schemas/libvirt/domaincheckpoint.rng \
                               share/schemas/libvirt/domaincommon.rng \
                               share/schemas/libvirt/domain.rng \
                               share/schemas/libvirt/domainsnapshot.rng \
                               share/schemas/libvirt/networkcommon.rng \
                               share/schemas/libvirt/nwfilter_params.rng \
                               share/schemas/libvirt/storagecommon.rng"

#-------------------------------------------------------------------------------
# XSD
#-------------------------------------------------------------------------------

XSD_FILES="share/doc/xsd/acct.xsd \
           share/doc/xsd/acl_pool.xsd
           share/doc/xsd/api_info.xsd
           share/doc/xsd/backupjob.xsd
           share/doc/xsd/backupjob_pool.xsd
           share/doc/xsd/cluster.xsd
           share/doc/xsd/cluster_pool.xsd
           share/doc/xsd/datastore.xsd
           share/doc/xsd/datastore_pool.xsd
           share/doc/xsd/document.xsd
           share/doc/xsd/document_pool.xsd
           share/doc/xsd/group.xsd
           share/doc/xsd/group_pool.xsd
           share/doc/xsd/hook.xsd
           share/doc/xsd/hook_message_api.xsd
           share/doc/xsd/hook_message_retry.xsd
           share/doc/xsd/hook_message_state.xsd
           share/doc/xsd/hook_pool.xsd
           share/doc/xsd/host.xsd
           share/doc/xsd/host_pool.xsd
           share/doc/xsd/image.xsd
           share/doc/xsd/image_pool.xsd
           share/doc/xsd/index.xsd
           share/doc/xsd/marketplace.xsd
           share/doc/xsd/marketplace_pool.xsd
           share/doc/xsd/marketplaceapp.xsd
           share/doc/xsd/marketplaceapp_pool.xsd
           share/doc/xsd/monitoring_data.xsd
           share/doc/xsd/opennebula_configuration.xsd
           share/doc/xsd/plan.xsd
           share/doc/xsd/raftstatus.xsd
           share/doc/xsd/requirements.xsd
           share/doc/xsd/scheduler_driver_action.xsd
           share/doc/xsd/security_group.xsd
           share/doc/xsd/security_group_pool.xsd
           share/doc/xsd/shared.xsd
           share/doc/xsd/showback.xsd
           share/doc/xsd/user.xsd
           share/doc/xsd/user_pool.xsd
           share/doc/xsd/vdc.xsd
           share/doc/xsd/vdc_pool.xsd
           share/doc/xsd/vm.xsd
           share/doc/xsd/vm_group.xsd
           share/doc/xsd/vm_group_pool.xsd
           share/doc/xsd/vm_pool.xsd
           share/doc/xsd/vm_pool_extended.xsd
           share/doc/xsd/vmtemplate.xsd
           share/doc/xsd/vmtemplate_pool.xsd
           share/doc/xsd/vnet.xsd
           share/doc/xsd/vnet_pool.xsd
           share/doc/xsd/vnet_pool_extended.xsd
           share/doc/xsd/vntemplate.xsd
           share/doc/xsd/vntemplate_pool.xsd
           share/doc/xsd/vrouter.xsd
           share/doc/xsd/vrouter_pool.xsd
           share/doc/xsd/zone.xsd
           share/doc/xsd/zone_pool.xsd"

CONTEXT_SHARE=$(find share/context/ -type f \( ! -iname "*.sh" ! -iname "SConstruct" \))

#-------------------------------------------------------------------------------
# PROMETHEUS
#-------------------------------------------------------------------------------

ALERTMANAGER_VENDOR_DIR='alertmanager'
NODE_EXPORTER_VENDOR_DIR='node_exporter'
PROMETHEUS_VENDOR_DIR='prometheus'
if [ $ARCH = 'arm64' ]; then
    ALERTMANAGER_VENDOR_DIR='alertmanager.arm64'
    NODE_EXPORTER_VENDOR_DIR='node_exporter.arm64'
    PROMETHEUS_VENDOR_DIR='prometheus.arm64'

    # adjust restic binary symlink
    rm src/datastore_mad/remotes/restic/restic
    ln -s ./vendor/bin/restic.arm64 src/datastore_mad/remotes/restic/restic
fi

# ALERTMANAGER
ONEPROMETHEUS_ALERTMANAGER_BIN_FILES="src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/alertmanager \
                                      src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/amtool"
ONEPROMETHEUS_ALERTMANAGER_CONFIG_FILES="src/oneprometheus/alertmanager/etc/alertmanager.yml"
ONEPROMETHEUS_ALERTMANAGER_FILES="src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/LICENSE \
                                  src/oneprometheus/vendor/${ALERTMANAGER_VENDOR_DIR}/NOTICE"
ONEPROMETHEUS_ALERTMANAGER_SYSTEMD_FILES="src/oneprometheus/alertmanager/systemd/opennebula-alertmanager.service"

# GRAFANA
ONEPROMETHEUS_GRAFANA_FILES="src/oneprometheus/grafana/share/dashboards/"

# LIBVIRT-EXPORTER
ONEPROMETHEUS_LIBVIRT_EXPORTER_FILES="src/oneprometheus/opennebula-libvirt-exporter/src/libvirt_collector.rb \
                                      src/oneprometheus/opennebula-libvirt-exporter/src/libvirt_exporter.rb"
ONEPROMETHEUS_LIBVIRT_EXPORTER_SYSTEMD_FILES="src/oneprometheus/opennebula-libvirt-exporter/systemd/opennebula-libvirt-exporter.service"

# NODE-EXPORTER
ONEPROMETHEUS_NODE_EXPORTER_BIN_FILES="src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/node_exporter"
ONEPROMETHEUS_NODE_EXPORTER_FILES="src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/LICENSE \
                                   src/oneprometheus/vendor/${NODE_EXPORTER_VENDOR_DIR}/NOTICE"
ONEPROMETHEUS_NODE_EXPORTER_SYSTEMD_FILES="src/oneprometheus/node_exporter/systemd/opennebula-node-exporter.service"

# OPENNEBULA-EXPORTER
ONEPROMETHEUS_OPENNEBULA_EXPORTER_FILES="src/oneprometheus/opennebula-exporter/src/opennebula_collector.rb \
                                         src/oneprometheus/opennebula-exporter/src/opennebula_datastore_collector.rb \
                                         src/oneprometheus/opennebula-exporter/src/opennebula_exporter.rb \
                                         src/oneprometheus/opennebula-exporter/src/opennebula_host_collector.rb \
                                         src/oneprometheus/opennebula-exporter/src/opennebula_server_collector.rb \
                                         src/oneprometheus/opennebula-exporter/src/opennebula_vm_collector.rb"
ONEPROMETHEUS_OPENNEBULA_EXPORTER_SYSTEMD_FILES="src/oneprometheus/opennebula-exporter/systemd/opennebula-exporter.service"

# PROMETHEUS
ONEPROMETHEUS_PROMETHEUS_BIN_FILES="src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/prometheus \
                                    src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/promtool"
ONEPROMETHEUS_PROMETHEUS_CONFIG_FILES="src/oneprometheus/prometheus/etc/prometheus.yml \
                                       src/oneprometheus/prometheus/etc/rules.yml"
ONEPROMETHEUS_PROMETHEUS_FILES="src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/console_libraries/ \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/consoles/ \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/LICENSE \
                                src/oneprometheus/vendor/${PROMETHEUS_VENDOR_DIR}/NOTICE"
ONEPROMETHEUS_PROMETHEUS_SHARE_FILES="src/oneprometheus/prometheus/share/patch_datasources.rb"
ONEPROMETHEUS_PROMETHEUS_SYSTEMD_FILES="src/oneprometheus/prometheus/systemd/opennebula-prometheus.service"

#-----------------------------------------------------------------------------
#-----------------------------------------------------------------------------
# INSTALL.SH SCRIPT
#-----------------------------------------------------------------------------
#-----------------------------------------------------------------------------

# --- Create OpenNebula directories ---

if [ "$UNINSTALL" = "no" ] ; then
    for d in $MAKE_DIRS; do
        mkdir -p $DESTDIR$d
    done
fi

# --- Install/Uninstall files ---

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm $DESTDIR$2/`basename $1`
    else
        if [ "$LINK" = "yes" ]; then
            ln -s $SRC_DIR/$1 $DESTDIR$2
        else
            cp -RL $SRC_DIR/$1 $DESTDIR$2
        fi
    fi
}

if [ "$CLIENT" = "yes" ]; then
    INSTALL_SET=${INSTALL_CLIENT_FILES[@]}
elif [ "$ONEGATE" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEGATE_FILES[@]}"
elif [ "$FIREEDGE" = "yes" ]; then
  if [ "$FIREEDGE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_FIREEDGE_FILES[@]}"
  else
    INSTALL_SET="${INSTALL_FIREEDGE_DEV_DIRS[@]} \
                 ${INSTALL_FIREEDGE_FILES[@]}"
  fi
elif [ "$ONEFLOW" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEFLOW_FILES[@]}"
elif [ "$FIREEDGE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_FIREEDGE_FILES[@]} \
                 ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEFLOW_FILES[@]} \
                 ${INSTALL_ONEHEM_FILES[@]} \
                 ${INSTALL_ONEPROVISION_FILES[@]} \
                 ${INSTALL_ONECFG_FILES[@]}"
else
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_FIREEDGE_FILES[@]} ${INSTALL_FIREEDGE_DEV_DIRS[@]}\
                 ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEFLOW_FILES[@]} \
                 ${INSTALL_ONEHEM_FILES[@]} \
                 ${INSTALL_ONEPROVISION_FILES[@]} \
                 ${INSTALL_ONECFG_FILES[@]}"
fi

for i in ${INSTALL_SET[@]}; do
    SRC=$`echo $i | cut -d: -f1`
    DST=`echo $i | cut -d: -f2`

    eval SRC_FILES=$SRC

    for f in $SRC_FILES; do
        do_file $f $DST
    done
done

if [ "$INSTALL_ETC" = "yes" ] ; then
    if [ "$FIREEDGE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_FIREEDGE_ETC_FILES[@]}"
    elif [ "$ONEGATE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEGATE_ETC_FILES[@]}"
    elif [ "$ONEFLOW" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEFLOW_ETC_FILES[@]}"
    else
        INSTALL_ETC_SET="${INSTALL_ETC_FILES[@]} \
                         ${INSTALL_FIREEDGE_ETC_FILES[@]} \
                         ${INSTALL_ONEGATE_ETC_FILES[@]} \
                         ${INSTALL_ONEHEM_ETC_FILES[@]} \
                         ${INSTALL_ONEFLOW_ETC_FILES[@]}"
    fi

    for i in ${INSTALL_ETC_SET[@]}; do
        SRC=$`echo $i | cut -d: -f1`
        DST=`echo $i | cut -d: -f2`

        eval SRC_FILES=$SRC

        OLD_LINK=$LINK
        LINK="no"

        for f in $SRC_FILES; do
            do_file $f $DST
        done

        LINK=$OLD_LINK
   done
fi

# --- Set ownership, remove OpenNebula directories or delete other arch files---

if [ "$UNINSTALL" = "no" ] ; then
    for d in $CHOWN_DIRS; do
        chown -R $ONEADMIN_USER:$ONEADMIN_GROUP $DESTDIR$d
    done

	if [ $ARCH = 'x86_64' ]; then
		rm -rf $DESTDIR$LIB_LOCATION/python/pulp/solverdir/cbc/linux/arm64/cbc
	else
		rm -rf $DESTDIR$LIB_LOCATION/python/pulp/solverdir/cbc/linux/64/cbc
	fi
else
    for d in `echo $DELETE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

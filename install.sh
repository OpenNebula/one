#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
 echo "                  [-d ONE_LOCATION] [-c cli|ec2] [-r]"
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
 echo "-c: install client utilities: OpenNebula cli and ec2 client files"
 echo "-s: install OpenNebula Sunstone"
 echo "-p: do not install OpenNebula Sunstone non-minified files"
 echo "-F: install OpenNebula FireEdge"
 echo "-P: do not install OpenNebula FireEdge non-minified files"
 echo "-G: install only OpenNebula Gate"
 echo "-6: install only OpenNebula Gate Proxy"
 echo "-f: install only OpenNebula Flow"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-e: install OpenNebula docker machine driver"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

PARAMETERS=":u:g:d:ehkrlcspFPorlfG6"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
CLIENT="no"
ONEGATE="no"
ONEGATE_PROXY="no"
SUNSTONE="no"
SUNSTONE_DEV="yes"
FIREEDGE="no"
FIREEDGE_DEV="yes"
ONEFLOW="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD
DOCKER_MACHINE="no"

while getopts $PARAMETERS opt; do
    case $opt in
        e) DOCKER_MACHINE="yes" ;;
        h) usage; exit 0;;
        k) INSTALL_ETC="no" ;;
        r) UNINSTALL="yes" ;;
        l) LINK="yes" ;;
        c) CLIENT="yes"; INSTALL_ETC="no" ;;
        G) ONEGATE="yes" ;;
        6) ONEGATE_PROXY="yes" ;;
        s) SUNSTONE="yes" ;;
        p) SUNSTONE_DEV="no" ;;
        F) FIREEDGE="yes" ;;
        P) FIREEDGE_DEV="no" ;;
        f) ONEFLOW="yes" ;;
        u) ONEADMIN_USER="$OPTARG" ;;
        g) ONEADMIN_GROUP="$OPTARG" ;;
        d) ROOT="$OPTARG" ;;
        \?) usage; exit 1 ;;
    esac
done

shift $(($OPTIND - 1))

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
    ONEGATE_PROXY_LOCATION="$LIB_LOCATION/onegate-proxy"
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
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
    SUNSTONE_MAIN_JS_LOCATION="$VAR_LOCATION/sunstone"
    DOCKER_MACHINE_LOCATION="src/docker_machine/src/docker_machine/bin/docker-machine-driver-opennebula"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS=""

        CHOWN_DIRS=""
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION $SUNSTONE_MAIN_JS_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

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
    elif [ "$ONEGATE_PROXY" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_PROXY_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    elif [ "$ONEFLOW" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $ONEFLOW_LOCATION \
                    $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    elif [ "$DOCKER_MACHINE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    else
        MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $DOCS_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
                   $SYSTEM_DS_LOCATION $DEFAULT_DS_LOCATION $MAN_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEGATE_PROXY_LOCATION $ONEFLOW_LOCATION \
                   $SUNSTONE_MAIN_JS_LOCATION $ONEHEM_LOCATION"

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
    ONEGATE_PROXY_LOCATION="$LIB_LOCATION/onegate-proxy"
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
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
    SUNSTONE_MAIN_JS_LOCATION="$VAR_LOCATION/sunstone"
    DOCKER_MACHINE_LOCATION="src/docker_machine/src/docker_machine/bin/docker-machine-driver-opennebula"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEGATE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEGATE_PROXY" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_PROXY_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION $SUNSTONE_MAIN_JS_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$FIREEDGE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $FIREEDGE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEFLOW" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $ONEFLOW_LOCATION \
                   $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$DOCKER_MACHINE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    else
        MAKE_DIRS="$BIN_LOCATION $SBIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $SYSTEM_DS_LOCATION \
                   $DEFAULT_DS_LOCATION $MAN_LOCATION $DOCS_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEGATE_PROXY_LOCATION $ONEFLOW_LOCATION \
                   $SUNSTONE_MAIN_JS_LOCATION $ONEHEM_LOCATION $LOCK_LOCATION $RUN_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS="$ROOT"
    fi

    CHOWN_DIRS="$ROOT"
fi

SHARE_DIRS="$SHARE_LOCATION/examples \
            $SHARE_LOCATION/examples/external_scheduler \
            $SHARE_LOCATION/examples/host_hooks \
            $SHARE_LOCATION/examples/network_hooks \
            $SHARE_LOCATION/websockify \
            $SHARE_LOCATION/websockify/websockify \
            $SHARE_LOCATION/oneprovision \
            $SHARE_LOCATION/dockerhub \
            $SHARE_LOCATION/dockerhub/dockerfiles \
            $SHARE_LOCATION/schemas \
            $SHARE_LOCATION/schemas/libvirt \
            $SHARE_LOCATION/schemas/xsd \
            $SHARE_LOCATION/ssh \
            $SHARE_LOCATION/start-scripts \
            $SHARE_LOCATION/conf \
            $SHARE_LOCATION/context \
            $SHARE_LOCATION/onecfg
            $SHARE_LOCATION/onecfg/etc"

ETC_DIRS="$ETC_LOCATION/vmm_exec \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/auth \
          $ETC_LOCATION/auth/certificates \
          $ETC_LOCATION/sunstone-views \
          $ETC_LOCATION/cli \
          $ETC_LOCATION/sunstone-views/kvm \
          $ETC_LOCATION/sunstone-views/vcenter \
          $ETC_LOCATION/sunstone-views/mixed \
          $ETC_LOCATION/fireedge \
          $ETC_LOCATION/fireedge/provision \
          $ETC_LOCATION/fireedge/provision/providers.d \
          $ETC_LOCATION/fireedge/provision/providers.d-extra \
          $ETC_LOCATION/fireedge/sunstone \
          $ETC_LOCATION/fireedge/sunstone/admin \
          $ETC_LOCATION/fireedge/sunstone/user"

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
          $LIB_LOCATION/mads \
          $LIB_LOCATION/sh \
          $LIB_LOCATION/sh/override \
          $LIB_LOCATION/ruby/cli \
          $LIB_LOCATION/ruby/cli/one_helper \
          $LIB_LOCATION/ruby/vcenter_driver \
          $LIB_LOCATION/ruby/nsx_driver \
          $LIB_LOCATION/oneprovision/lib \
          $LIB_LOCATION/oneprovision/provider_apis \
          $LIB_LOCATION/oneprovision/provider_apis/vultr \
          $LIB_LOCATION/oneprovision/lib/terraform \
          $LIB_LOCATION/oneprovision/lib/terraform/providers \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/aws \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/google \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/digitalocean \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/equinix \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/vultr_metal \
          $LIB_LOCATION/oneprovision/lib/terraform/providers/templates/vultr_virtual \
          $LIB_LOCATION/oneprovision/lib/provision \
          $LIB_LOCATION/oneprovision/lib/provider \
          $LIB_LOCATION/oneprovision/lib/provision/resources \
          $LIB_LOCATION/oneprovision/lib/provision/resources/virtual \
          $LIB_LOCATION/oneprovision/lib/provision/resources/physical
          $LIB_LOCATION/onecfg/lib \
          $LIB_LOCATION/onecfg/lib/common \
          $LIB_LOCATION/onecfg/lib/common/helpers \
          $LIB_LOCATION/onecfg/lib/common/logger \
          $LIB_LOCATION/onecfg/lib/config \
          $LIB_LOCATION/onecfg/lib/config/type \
          $LIB_LOCATION/onecfg/lib/config/type/augeas \
          $LIB_LOCATION/onecfg/lib/config/type/yaml \
          $LIB_LOCATION/onecfg/lib/patch"

VAR_DIRS="$VAR_LOCATION/remotes \
          $VAR_LOCATION/remotes/etc \
          $VAR_LOCATION/remotes/etc/tm/fs_lvm \
          $VAR_LOCATION/remotes/etc/tm/ssh \
          $VAR_LOCATION/remotes/etc/datastore/fs \
          $VAR_LOCATION/remotes/etc/datastore/ceph \
          $VAR_LOCATION/remotes/etc/im/kvm-probes.d \
          $VAR_LOCATION/remotes/etc/im/qemu-probes.d \
          $VAR_LOCATION/remotes/etc/im/lxd-probes.d \
          $VAR_LOCATION/remotes/etc/im/lxc-probes.d \
          $VAR_LOCATION/remotes/etc/im/firecracker-probes.d \
          $VAR_LOCATION/remotes/etc/market/http \
          $VAR_LOCATION/remotes/etc/vmm/kvm \
          $VAR_LOCATION/remotes/etc/vmm/lxd \
          $VAR_LOCATION/remotes/etc/vmm/lxc \
          $VAR_LOCATION/remotes/etc/vmm/lxc/profiles \
          $VAR_LOCATION/remotes/etc/vmm/firecracker \
          $VAR_LOCATION/remotes/etc/vmm/vcenter \
          $VAR_LOCATION/remotes/etc/vnm \
          $VAR_LOCATION/remotes/im \
          $VAR_LOCATION/remotes/im/lib \
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
          $VAR_LOCATION/remotes/im/lxd.d \
          $VAR_LOCATION/remotes/im/lxd-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/lxd-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/lxd-probes.d/host/system \
          $VAR_LOCATION/remotes/im/lxd-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/lxd-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/lxd-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/lxc.d \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/lxc-probes.d/host/system \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/lxc-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/firecracker.d \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/host/system \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/firecracker-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/vcenter.d \
          $VAR_LOCATION/remotes/im/ec2.d \
          $VAR_LOCATION/remotes/im/ec2-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/ec2-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/ec2-probes.d/host/system \
          $VAR_LOCATION/remotes/im/ec2-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/ec2-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/ec2-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/az.d \
          $VAR_LOCATION/remotes/im/az-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/az-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/az-probes.d/host/system \
          $VAR_LOCATION/remotes/im/az-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/az-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/az-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/one.d \
          $VAR_LOCATION/remotes/im/one-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/one-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/one-probes.d/host/system \
          $VAR_LOCATION/remotes/im/one-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/one-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/one-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/im/equinix.d \
          $VAR_LOCATION/remotes/im/equinix-probes.d/host/beacon \
          $VAR_LOCATION/remotes/im/equinix-probes.d/host/monitor \
          $VAR_LOCATION/remotes/im/equinix-probes.d/host/system \
          $VAR_LOCATION/remotes/im/equinix-probes.d/vm/monitor \
          $VAR_LOCATION/remotes/im/equinix-probes.d/vm/status \
          $VAR_LOCATION/remotes/im/equinix-probes.d/vm/snapshot \
          $VAR_LOCATION/remotes/vmm \
          $VAR_LOCATION/remotes/vmm/lib \
          $VAR_LOCATION/remotes/vmm/kvm \
          $VAR_LOCATION/remotes/vmm/vcenter \
          $VAR_LOCATION/remotes/vmm/ec2 \
          $VAR_LOCATION/remotes/vmm/az \
          $VAR_LOCATION/remotes/vmm/one \
          $VAR_LOCATION/remotes/vmm/lxd \
          $VAR_LOCATION/remotes/vmm/lxc \
          $VAR_LOCATION/remotes/vmm/equinix \
          $VAR_LOCATION/remotes/vmm/firecracker \
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
          $VAR_LOCATION/remotes/vnm/ebtables \
          $VAR_LOCATION/remotes/vnm/ebtables/pre.d \
          $VAR_LOCATION/remotes/vnm/ebtables/post.d \
          $VAR_LOCATION/remotes/vnm/ebtables/clean.d \
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
          $VAR_LOCATION/remotes/vnm/vcenter \
          $VAR_LOCATION/remotes/vnm/vcenter/pre.d \
          $VAR_LOCATION/remotes/vnm/vcenter/post.d \
          $VAR_LOCATION/remotes/vnm/vcenter/clean.d \
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
          $VAR_LOCATION/remotes/tm/ceph \
          $VAR_LOCATION/remotes/tm/dev \
          $VAR_LOCATION/remotes/tm/vcenter \
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
          $VAR_LOCATION/remotes/datastore/vcenter \
          $VAR_LOCATION/remotes/datastore/iscsi_libvirt \
          $VAR_LOCATION/remotes/datastore/rsync \
          $VAR_LOCATION/remotes/market \
          $VAR_LOCATION/remotes/market/http \
          $VAR_LOCATION/remotes/market/one \
          $VAR_LOCATION/remotes/market/s3 \
          $VAR_LOCATION/remotes/market/common \
          $VAR_LOCATION/remotes/market/linuxcontainers \
          $VAR_LOCATION/remotes/market/turnkeylinux \
          $VAR_LOCATION/remotes/market/dockerhub \
          $VAR_LOCATION/remotes/market/docker_registry \
          $VAR_LOCATION/remotes/auth \
          $VAR_LOCATION/remotes/auth/plain \
          $VAR_LOCATION/remotes/auth/ssh \
          $VAR_LOCATION/remotes/auth/x509 \
          $VAR_LOCATION/remotes/auth/ldap \
          $VAR_LOCATION/remotes/auth/server_x509 \
          $VAR_LOCATION/remotes/auth/server_cipher \
          $VAR_LOCATION/remotes/auth/dummy \
          $VAR_LOCATION/remotes/ipam/dummy \
          $VAR_LOCATION/remotes/ipam/equinix \
          $VAR_LOCATION/remotes/ipam/vultr \
          $VAR_LOCATION/remotes/ipam/aws"

SUNSTONE_DIRS="$SUNSTONE_LOCATION/routes \
               $SUNSTONE_LOCATION/models \
               $SUNSTONE_LOCATION/models/OpenNebulaJSON \
               $SUNSTONE_LOCATION/views \
               $SUNSTONE_LOCATION/services"

SUNSTONE_MINIFIED_DIRS="$SUNSTONE_LOCATION/public \
               $SUNSTONE_LOCATION/public/dist \
               $SUNSTONE_LOCATION/public/dist/console \
               $SUNSTONE_LOCATION/public/css \
               $SUNSTONE_LOCATION/public/css/opensans \
               $SUNSTONE_LOCATION/public/bower_components/fontawesome \
               $SUNSTONE_LOCATION/public/bower_components/fontawesome/web-fonts-with-css \
               $SUNSTONE_LOCATION/public/bower_components/fontawesome/web-fonts-with-css/webfonts \
               $SUNSTONE_LOCATION/public/locale/languages \
               $SUNSTONE_LOCATION/public/images \
               $SUNSTONE_LOCATION/public/images/logos"

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
elif [ "$ONEGATE_PROXY" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$SUNSTONE" = "yes" ]; then
  if [ "$SUNSTONE_DEV" = "no" ]; then
    MAKE_DIRS="$MAKE_DIRS $SUNSTONE_DIRS $SUNSTONE_MINIFIED_DIRS $LIB_OCA_CLIENT_DIRS"
  else
    MAKE_DIRS="$MAKE_DIRS $SUNSTONE_DIRS $LIB_OCA_CLIENT_DIRS"
  fi
elif [ "$ONEFLOW" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $ONEFLOW_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$SUNSTONE_DEV" = "no" ]; then
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS \
                $SUNSTONE_DIRS $SUNSTONE_MINIFIED_DIRS $ONEFLOW_DIRS"
else
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS \
                $SUNSTONE_DIRS $FIREEDGE_DIRS $ONEFLOW_DIRS"
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
    RUBY_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_AUTH_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FLOW_FILES:$LIB_LOCATION/ruby/opennebula/flow
    MAD_RUBY_LIB_FILES:$LIB_LOCATION/ruby
    MAD_RUBY_LIB_FILES:$VAR_LOCATION/remotes
    MAD_SH_LIB_FILES:$LIB_LOCATION/sh
    MAD_SH_LIB_FILES:$VAR_LOCATION/remotes
    REMOTE_FILES:$VAR_LOCATION/remotes
    ONEDB_FILES:$LIB_LOCATION/ruby/onedb
    ONEDB_PATCH_FILES:$LIB_LOCATION/ruby/onedb/patches
    MADS_LIB_FILES:$LIB_LOCATION/mads
    IM_PROBES_FILES:$VAR_LOCATION/remotes/im
    IM_PROBES_LIB_FILES:$VAR_LOCATION/remotes/im/lib
    IM_PROBES_KVM_FILES:$VAR_LOCATION/remotes/im/kvm.d
    IM_PROBES_QEMU_FILES:$VAR_LOCATION/remotes/im/qemu.d
    IM_PROBES_FIRECRACKER_FILES:$VAR_LOCATION/remotes/im/firecracker.d
    IM_PROBES_DUMMY_FILES:$VAR_LOCATION/remotes/im/dummy.d
    IM_PROBES_LXD_FILES:$VAR_LOCATION/remotes/im/lxd.d
    IM_PROBES_LXC_FILES:$VAR_LOCATION/remotes/im/lxc.d
    IM_PROBES_VCENTER_FILES:$VAR_LOCATION/remotes/im/vcenter.d
    IM_PROBES_EC2_FILES:$VAR_LOCATION/remotes/im/ec2.d
    IM_PROBES_AZ_FILES:$VAR_LOCATION/remotes/im/az.d
    IM_PROBES_ONE_FILES:$VAR_LOCATION/remotes/im/one.d
    IM_PROBES_EQUINIX_FILES:$VAR_LOCATION/remotes/im/equinix.d
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
    IM_PROBES_LXD_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d/host/beacon
    IM_PROBES_LXD_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d/host/monitor
    IM_PROBES_LXD_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d/host/system
    IM_PROBES_LXD_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d/vm/monitor
    IM_PROBES_LXD_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d/vm/status
    IM_PROBES_LXD_PROBES_FILES:$VAR_LOCATION/remotes/im/lxd-probes.d
    IM_PROBES_ETC_LXD_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/lxd-probes.d
    IM_PROBES_LXC_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/beacon
    IM_PROBES_LXC_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/monitor
    IM_PROBES_LXC_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/host/system
    IM_PROBES_LXC_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/vm/monitor
    IM_PROBES_LXC_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d/vm/status
    IM_PROBES_LXC_PROBES_FILES:$VAR_LOCATION/remotes/im/lxc-probes.d
    IM_PROBES_ETC_LXC_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/lxc-probes.d
    IM_PROBES_AZ_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/az-probes.d/host/beacon
    IM_PROBES_AZ_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/az-probes.d/host/monitor
    IM_PROBES_AZ_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/az-probes.d/host/system
    IM_PROBES_AZ_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/az-probes.d/vm/monitor
    IM_PROBES_AZ_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/az-probes.d/vm/status
    IM_PROBES_EC2_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/ec2-probes.d/host/beacon
    IM_PROBES_EC2_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/ec2-probes.d/host/monitor
    IM_PROBES_EC2_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/ec2-probes.d/host/system
    IM_PROBES_EC2_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/ec2-probes.d/vm/monitor
    IM_PROBES_EC2_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/ec2-probes.d/vm/status
    IM_PROBES_ONE_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/one-probes.d/host/beacon
    IM_PROBES_ONE_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/one-probes.d/host/monitor
    IM_PROBES_ONE_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/one-probes.d/host/system
    IM_PROBES_ONE_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/one-probes.d/vm/monitor
    IM_PROBES_ONE_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/one-probes.d/vm/status
    IM_PROBES_EQUINIX_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/equinix-probes.d/host/beacon
    IM_PROBES_EQUINIX_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/equinix-probes.d/host/monitor
    IM_PROBES_EQUINIX_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/equinix-probes.d/host/system
    IM_PROBES_EQUINIX_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/equinix-probes.d/vm/monitor
    IM_PROBES_EQUINIX_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/equinix-probes.d/vm/status
    IM_PROBES_VERSION:$VAR_LOCATION/remotes
    IM_PROBES_FIRECRACKER_HOST_BEACON_FILES:$VAR_LOCATION/remotes/im/firecracker-probes.d/host/beacon
    IM_PROBES_FIRECRACKER_HOST_MONITOR_FILES:$VAR_LOCATION/remotes/im/firecracker-probes.d/host/monitor
    IM_PROBES_FIRECRACKER_HOST_SYSTEM_FILES:$VAR_LOCATION/remotes/im/firecracker-probes.d/host/system
    IM_PROBES_FIRECRACKER_VM_MONITOR_FILES:$VAR_LOCATION/remotes/im/firecracker-probes.d/vm/monitor
    IM_PROBES_FIRECRACKER_VM_STATUS_FILES:$VAR_LOCATION/remotes/im/firecracker-probes.d/vm/status
    IM_PROBES_ETC_FIRECRACKER_PROBES_FILES:$VAR_LOCATION/remotes/etc/im/firecracker-probes.d
    AUTH_SSH_FILES:$VAR_LOCATION/remotes/auth/ssh
    AUTH_X509_FILES:$VAR_LOCATION/remotes/auth/x509
    AUTH_LDAP_FILES:$VAR_LOCATION/remotes/auth/ldap
    AUTH_SERVER_X509_FILES:$VAR_LOCATION/remotes/auth/server_x509
    AUTH_SERVER_CIPHER_FILES:$VAR_LOCATION/remotes/auth/server_cipher
    AUTH_DUMMY_FILES:$VAR_LOCATION/remotes/auth/dummy
    AUTH_PLAIN_FILES:$VAR_LOCATION/remotes/auth/plain
    VMM_EXEC_LIB_VCENTER_FILES:$LIB_LOCATION/ruby/vcenter_driver
    VMM_EXEC_LIB_NSX_FILES:$LIB_LOCATION/ruby/nsx_driver
    VMM_EXEC_LIB:$VAR_LOCATION/remotes/vmm/lib
    VMM_EXEC_KVM_SCRIPTS:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_KVM_LIB:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_LXD_SCRIPTS:$VAR_LOCATION/remotes/vmm/lxd
    VMM_EXEC_LXD_LIB:$VAR_LOCATION/remotes/vmm/lxd
    VMM_EXEC_LXC_SCRIPTS:$VAR_LOCATION/remotes/vmm/lxc
    VMM_EXEC_LXC_LIB:$VAR_LOCATION/remotes/vmm/lxc
    VMM_EXEC_FIRECRACKER_SCRIPTS:$VAR_LOCATION/remotes/vmm/firecracker
    VMM_EXEC_FIRECRACKER_LIB:$VAR_LOCATION/remotes/vmm/firecracker
    VMM_EXEC_ETC_KVM_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/kvm
    VMM_EXEC_ETC_LXD_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/lxd
    VMM_EXEC_ETC_LXC_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/lxc
    VMM_EXEC_ETC_LXC_PROFILES:$VAR_LOCATION/remotes/etc/vmm/lxc/profiles
    VMM_EXEC_ETC_FIRECRACKER_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/firecracker
    VMM_EXEC_VCENTER_SCRIPTS:$VAR_LOCATION/remotes/vmm/vcenter
    VMM_EXEC_ETC_VCENTER_SCRIPTS:$VAR_LOCATION/remotes/etc/vmm/vcenter
    VMM_EXEC_EC2_SCRIPTS:$VAR_LOCATION/remotes/vmm/ec2
    VMM_EXEC_AZ_SCRIPTS:$VAR_LOCATION/remotes/vmm/az
    VMM_EXEC_ONE_SCRIPTS:$VAR_LOCATION/remotes/vmm/one
    VMM_EXEC_EQUINIX_SCRIPTS:$VAR_LOCATION/remotes/vmm/equinix
    TM_FILES:$VAR_LOCATION/remotes/tm
    TM_LIB_FILES:$VAR_LOCATION/remotes/tm/lib
    TM_SHARED_FILES:$VAR_LOCATION/remotes/tm/shared
    TM_FS_LVM_FILES:$VAR_LOCATION/remotes/tm/fs_lvm
    TM_FS_LVM_ETC_FILES:$VAR_LOCATION/remotes/etc/tm/fs_lvm/fs_lvm.conf
    TM_FS_LVM_SSH_FILES:$VAR_LOCATION/remotes/tm/fs_lvm_ssh
    TM_QCOW2_FILES:$VAR_LOCATION/remotes/tm/qcow2
    TM_SSH_FILES:$VAR_LOCATION/remotes/tm/ssh
    TM_SSH_ETC_FILES:$VAR_LOCATION/remotes/etc/tm/ssh
    TM_CEPH_FILES:$VAR_LOCATION/remotes/tm/ceph
    TM_DEV_FILES:$VAR_LOCATION/remotes/tm/dev
    TM_ISCSI_FILES:$VAR_LOCATION/remotes/tm/iscsi_libvirt
    TM_DUMMY_FILES:$VAR_LOCATION/remotes/tm/dummy
    TM_VCENTER_FILES:$VAR_LOCATION/remotes/tm/vcenter
    DATASTORE_DRIVER_COMMON_SCRIPTS:$VAR_LOCATION/remotes/datastore/
    DATASTORE_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/datastore/dummy
    DATASTORE_DRIVER_FS_SCRIPTS:$VAR_LOCATION/remotes/datastore/fs
    DATASTORE_DRIVER_ETC_FS_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore/fs
    DATASTORE_DRIVER_CEPH_SCRIPTS:$VAR_LOCATION/remotes/datastore/ceph
    DATASTORE_DRIVER_ETC_CEPH_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore/ceph
    DATASTORE_DRIVER_DEV_SCRIPTS:$VAR_LOCATION/remotes/datastore/dev
    DATASTORE_DRIVER_VCENTER_SCRIPTS:$VAR_LOCATION/remotes/datastore/vcenter
    DATASTORE_DRIVER_ISCSI_SCRIPTS:$VAR_LOCATION/remotes/datastore/iscsi_libvirt
    DATASTORE_DRIVER_RSYNC_SCRIPTS:$VAR_LOCATION/remotes/datastore/rsync
    DATASTORE_DRIVER_ETC_SCRIPTS:$VAR_LOCATION/remotes/etc/datastore
    MARKETPLACE_DRIVER_HTTP_SCRIPTS:$VAR_LOCATION/remotes/market/http
    MARKETPLACE_DRIVER_ETC_HTTP_SCRIPTS:$VAR_LOCATION/remotes/etc/market/http
    MARKETPLACE_DRIVER_ONE_SCRIPTS:$VAR_LOCATION/remotes/market/one
    MARKETPLACE_DRIVER_S3_SCRIPTS:$VAR_LOCATION/remotes/market/s3
    MARKETPLACE_DRIVER_COMMON_SCRIPTS:$VAR_LOCATION/remotes/market/common
    MARKETPLACE_DRIVER_LXC_SCRIPTS:$VAR_LOCATION/remotes/market/linuxcontainers
    MARKETPLACE_DRIVER_TK_SCRIPTS:$VAR_LOCATION/remotes/market/turnkeylinux
    MARKETPLACE_DRIVER_DH_SCRIPTS:$VAR_LOCATION/remotes/market/dockerhub
    MARKETPLACE_DRIVER_REGISTRY_SCRIPTS:$VAR_LOCATION/remotes/market/docker_registry
    IPAM_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/ipam/dummy
    IPAM_DRIVER_EQUINIX_SCRIPTS:$VAR_LOCATION/remotes/ipam/equinix
    IPAM_DRIVER_VULTR_SCRIPTS:$VAR_LOCATION/remotes/ipam/vultr
    IPAM_DRIVER_EC2_SCRIPTS:$VAR_LOCATION/remotes/ipam/aws
    NETWORK_FILES:$VAR_LOCATION/remotes/vnm
    NETWORK_HOOKS_PRE_FILES:$VAR_LOCATION/remotes/vnm/hooks/pre
    NETWORK_HOOKS_CLEAN_FILES:$VAR_LOCATION/remotes/vnm/hooks/clean
    NETWORK_ETC_FILES:$VAR_LOCATION/remotes/etc/vnm
    NETWORK_8021Q_FILES:$VAR_LOCATION/remotes/vnm/802.1Q
    NETWORK_VXLAN_FILES:$VAR_LOCATION/remotes/vnm/vxlan
    NETWORK_DUMMY_FILES:$VAR_LOCATION/remotes/vnm/dummy
    NETWORK_BRIDGE_FILES:$VAR_LOCATION/remotes/vnm/bridge
    NETWORK_EBTABLES_FILES:$VAR_LOCATION/remotes/vnm/ebtables
    NETWORK_FW_FILES:$VAR_LOCATION/remotes/vnm/fw
    NETWORK_OVSWITCH_FILES:$VAR_LOCATION/remotes/vnm/ovswitch
    NETWORK_OVSWITCH_VXLAN_FILES:$VAR_LOCATION/remotes/vnm/ovswitch_vxlan
    NETWORK_VCENTER_FILES:$VAR_LOCATION/remotes/vnm/vcenter
    NETWORK_ELASTIC_FILES:$VAR_LOCATION/remotes/vnm/elastic
    NETWORK_NODEPORT_FILES:$VAR_LOCATION/remotes/vnm/nodeport
    EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples
    EXAMPLE_HOST_HOOKS_SHARE_FILES:$SHARE_LOCATION/examples/host_hooks
    EXAMPLE_EXTERNAL_SCHED_FILES:$SHARE_LOCATION/examples/external_scheduler
    LXD_NETWORK_HOOKS:$SHARE_LOCATION/examples/network_hooks
    WEBSOCKIFY_SHARE_RUN_FILES:$SHARE_LOCATION/websockify
    WEBSOCKIFY_SHARE_MODULE_FILES:$SHARE_LOCATION/websockify/websockify
    INSTALL_GEMS_SHARE_FILES:$SHARE_LOCATION
    ONETOKEN_SHARE_FILE:$SHARE_LOCATION
    FOLLOWER_CLEANUP_SHARE_FILE:$SHARE_LOCATION
    PRE_CLEANUP_SHARE_FILE:$SHARE_LOCATION
    HOOK_AUTOSTART_FILES:$VAR_LOCATION/remotes/hooks/autostart
    HOOK_FT_FILES:$VAR_LOCATION/remotes/hooks/ft
    HOOK_RAFT_FILES:$VAR_LOCATION/remotes/hooks/raft
    COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud
    CLOUD_AUTH_LIB_FILES:$LIB_LOCATION/ruby/cloud/CloudAuth
    MAN_FILES:$MAN_LOCATION
    DOCS_FILES:$DOCS_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    VENDOR_DIRS:$LIB_LOCATION/ruby/vendors
    START_SCRIPT_SHARE_FILES:$SHARE_LOCATION/start-scripts
    LIBVIRT_RNG_SHARE_MODULE_FILES:$SHARE_LOCATION/schemas/libvirt
    XSD_FILES:$SHARE_LOCATION/schemas/xsd
    SSH_SH_LIB_FILES:$LIB_LOCATION/sh
    SSH_SH_OVERRIDE_LIB_FILES:$LIB_LOCATION/sh/override
    SSH_SHARE_FILES:$SHARE_LOCATION/ssh
    CONTEXT_SHARE:$SHARE_LOCATION/context
    DOCKERFILE_TEMPLATE:$SHARE_LOCATION/dockerhub
    DOCKERFILES_TEMPLATES:$SHARE_LOCATION/dockerhub/dockerfiles
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

INSTALL_ONEPROVISION_FILES=(
    ONEPROVISION_BIN_FILES:$BIN_LOCATION
    ONEPROVISION_ONE_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    ONEPROVISION_CONF_FILES:$ETC_LOCATION/cli
    ONEPROVISION_ANSIBLE_FILES:$SHARE_LOCATION/oneprovision
    ONEPROVISION_TEMPLATES_FILES:$SHARE_LOCATION/oneprovision
    ONEPROVISION_LIB_FILES:$LIB_LOCATION/oneprovision/lib
    ONEPROVISION_LIB_API_FILES:$LIB_LOCATION/oneprovision/provider_apis
    ONEPROVISION_LIB_API_VULTR_FILES:$LIB_LOCATION/oneprovision/provider_apis/vultr
    ONEPROVISION_LIB_TF_FILES:$LIB_LOCATION/oneprovision/lib/terraform
    ONEPROVISION_LIB_PROVIDERS_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers
    ONEPROVISION_LIB_AWS_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/aws
    ONEPROVISION_LIB_GOOGLE_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/google
    ONEPROVISION_LIB_DIGITALOCEAN_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/digitalocean
    ONEPROVISION_LIB_EQUINIX_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/equinix
    ONEPROVISION_LIB_VULTR_METAL_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/vultr_metal
    ONEPROVISION_LIB_VULTR_VIRTUAL_ERB_FILES:$LIB_LOCATION/oneprovision/lib/terraform/providers/templates/vultr_virtual
    ONEPROVISION_LIB_PROVISION_FILES:$LIB_LOCATION/oneprovision/lib/provision
    ONEPROVISION_LIB_RESOURCES_FILES:$LIB_LOCATION/oneprovision/lib/provision/resources
    ONEPROVISION_LIB_PHYSICAL_R_FILES:$LIB_LOCATION/oneprovision/lib/provision/resources/physical
    ONEPROVISION_LIB_VIRTUAL_R_FILES:$LIB_LOCATION/oneprovision/lib/provision/resources/virtual
    ONEPROVISION_LIB_PROVIDER_FILES:$LIB_LOCATION/oneprovision/lib/provider
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
)

INSTALL_SUNSTONE_RUBY_FILES=(
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FLOW_FILES:$LIB_LOCATION/ruby/opennebula/flow
    OCA_LIB_FILES:$LIB_LOCATION/ruby
)

INSTALL_SUNSTONE_FILES=(
    SUNSTONE_FILES:$SUNSTONE_LOCATION
    SUNSTONE_BIN_FILES:$BIN_LOCATION
    SUNSTONE_MODELS_FILES:$SUNSTONE_LOCATION/models
    SUNSTONE_MODELS_JSON_FILES:$SUNSTONE_LOCATION/models/OpenNebulaJSON
    SUNSTONE_VIEWS_FILES:$SUNSTONE_LOCATION/views
    SUNSTONE_ROUTES_FILES:$SUNSTONE_LOCATION/routes
    SUNSTONE_SERVICES_FILES:$SUNSTONE_LOCATION/services
)

INSTALL_SUNSTONE_PUBLIC_MINIFIED_FILES=(
  SUNSTONE_PUBLIC_JS_FILES:$SUNSTONE_LOCATION/public/dist
  SUNSTONE_PUBLIC_JS_CONSOLE_FILES:$SUNSTONE_LOCATION/public/dist/console
  SUNSTONE_PUBLIC_FONT_AWSOME:$SUNSTONE_LOCATION/public/bower_components/fontawesome/web-fonts-with-css/webfonts
  SUNSTONE_PUBLIC_CSS_FILES:$SUNSTONE_LOCATION/public/css
  SUNSTONE_PUBLIC_IMAGES_FILES:$SUNSTONE_LOCATION/public/images
  SUNSTONE_PUBLIC_LOGOS_FILES:$SUNSTONE_LOCATION/public/images/logos
  SUNSTONE_PUBLIC_LOCALE_CA:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_CS_CZ:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_DE:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_DA:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_EN_US:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_ES_ES:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_FA_IR:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_FR_FR:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_IT_IT:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_JA:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_LT_LT:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_NL_NL:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_PL:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_PT_PT:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_PT_BR:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_RU_RU:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_SK_SK:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_ZH_CN:$SUNSTONE_LOCATION/public/locale/languages
  SUNSTONE_PUBLIC_LOCALE_TR_TR:$SUNSTONE_LOCATION/public/locale/languages
)

INSTALL_SUNSTONE_PUBLIC_DEV_DIR=(
  SUNSTONE_PUBLIC_DEV_DIR:$SUNSTONE_LOCATION
)

INSTALL_SUNSTONE_ETC_FILES=(
    SUNSTONE_ETC_FILES:$ETC_LOCATION
    SUNSTONE_ETC_VIEW_KVM:$ETC_LOCATION/sunstone-views/kvm
    SUNSTONE_ETC_VIEW_VCENTER:$ETC_LOCATION/sunstone-views/vcenter
    SUNSTONE_ETC_VIEW_MIXED:$ETC_LOCATION/sunstone-views/mixed
)

INSTALL_FIREEDGE_FILES=(
  FIREEDGE_MINIFIED_FILES:$FIREEDGE_LOCATION
  PROVISION_ETC:$ETC_LOCATION/fireedge/provision
  PROVISION_ETC_PROVIDERS:$ETC_LOCTION/fireedge/provision/providers.d
  PROVISION_ETC_PROVIDERS_EXTRA:$ETC_LOCTION/fireedge/provision/providers.d-extra
  SUNSTONE_ETC_VIEWS:$ETC_LOCATION/fireedge/sunstone
  SUNSTONE_ETC_VIEWS_ADMIN:$ETC_LOCTION/fireedge/sunstone/admin
  SUNSTONE_ETC_VIEWS_USER:$ETC_LOCTION/fireedge/sunstone/user
  FIREEDGE_BIN_FILES:$BIN_LOCATION
)

INSTALL_FIREEDGE_ETC_FILES=(
  FIREEDGE_ETC_FILES:$ETC_LOCATION
  FIREEDGE_PROVISION_ETC:$ETC_LOCATION/fireedge/provision
  FIREEDGE_PROVISION_ETC_PROVIDERS:$ETC_LOCATION/fireedge/provision/providers.d
  FIREEDGE_PROVISION_ETC_PROVIDERS_EXTRA:$ETC_LOCATION/fireedge/provision/providers.d-extra
  FIREEDGE_SUNSTONE_ETC:$ETC_LOCATION/fireedge/sunstone
  FIREEDGE_SUNSTONE_ETC_VIEW_ADMIN:$ETC_LOCATION/fireedge/sunstone/admin
  FIREEDGE_SUNSTONE_ETC_VIEW_USER:$ETC_LOCATION/fireedge/sunstone/user
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

INSTALL_ONEGATE_PROXY_FILES=(
    ONEGATE_PROXY_FILES:$ONEGATE_PROXY_LOCATION
    ONEGATE_PROXY_BIN_FILES:$BIN_LOCATION
)

INSTALL_ONEGATE_PROXY_ETC_FILES=(
    ONEGATE_PROXY_REMOTES_ETC_FILES:$VAR_LOCATION/remotes/etc
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

INSTALL_DOCKER_MACHINE_FILES=(
    DOCKER_MACHINE_BIN_FILES:$BIN_LOCATION
)

INSTALL_ETC_FILES=(
    ETC_FILES:$ETC_LOCATION
    ETC_FILES:$SHARE_LOCATION/conf
    EC2_ETC_FILES:$ETC_LOCATION
    VCENTER_ETC_FILES:$ETC_LOCATION
    AZ_ETC_FILES:$ETC_LOCATION
    VMM_EXEC_ETC_FILES:$ETC_LOCATION/vmm_exec
    HM_ETC_FILES:$ETC_LOCATION/hm
    AUTH_ETC_FILES:$ETC_LOCATION/auth
    CLI_CONF_FILES:$ETC_LOCATION/cli
)

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/scheduler/src/sched/mm_sched \
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
           src/cli/onevcenter \
           src/cli/onevntemplate \
           src/cli/onehook \
           src/cli/onebackupjob \
           src/cli/onelog \
           src/cli/oneirb \
           src/onedb/onedb \
           share/scripts/qemu-kvm-one-gen \
           share/scripts/one"

#-------------------------------------------------------------------------------
# Binary files, to be installed under $SBIN_LOCATION
#-------------------------------------------------------------------------------

SBIN_FILES="src/vmm_mad/remotes/lib/firecracker/install-firecracker"

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
                src/mad/ruby/CommandManager.rb \
                src/mad/ruby/OpenNebulaDriver.rb \
                src/mad/ruby/VirtualMachineDriver.rb \
                src/mad/ruby/PublicCloudDriver.rb \
                src/mad/ruby/HostSyncManager.rb \
                src/mad/ruby/DriverExecHelper.rb \
                src/mad/ruby/ssh_stream.rb \
                src/vnm_mad/one_vnm.rb \
                src/oca/ruby/opennebula.rb \
                src/sunstone/OpenNebulaAddons.rb \
                src/vmm_mad/remotes/vcenter/vcenter_driver.rb \
                src/vmm_mad/remotes/nsx/nsx_driver.rb \
                src/vmm_mad/remotes/az/az_driver.rb \
                src/vmm_mad/remotes/ec2/ec2_driver.rb \
                src/vmm_mad/remotes/one/opennebula_driver.rb \
                src/vmm_mad/remotes/equinix/equinix_driver.rb \
                src/vnm_mad/remotes/elastic/aws_vnm.rb \
                src/vnm_mad/remotes/elastic/equinix_vnm.rb \
                src/vnm_mad/remotes/elastic/equinix.rb \
                src/vnm_mad/remotes/elastic/vultr_vnm.rb"

#-------------------------------------------------------------------------------
# Ruby auth library files, to be installed under $LIB_LOCATION/ruby/opennebula
#-------------------------------------------------------------------------------

RUBY_AUTH_LIB_FILES="src/authm_mad/remotes/ssh/ssh_auth.rb \
                src/authm_mad/remotes/server_x509/server_x509_auth.rb \
                src/authm_mad/remotes/server_cipher/server_cipher_auth.rb \
                src/authm_mad/remotes/ldap/ldap_auth.rb \
                src/authm_mad/remotes/x509/x509_auth.rb"

#-----------------------------------------------------------------------------
# MAD Script library files, to be installed under $LIB_LOCATION/<script lang>
# and remotes directory
#-----------------------------------------------------------------------------

REMOTE_FILES="src/vmm_mad/remotes/kvm/vgpu"

MAD_SH_LIB_FILES="src/mad/sh/scripts_common.sh \
                src/mad/sh/create_container_image.sh \
                src/mad/sh/create_docker_image.sh"

MAD_RUBY_LIB_FILES="src/mad/ruby/scripts_common.rb"

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
              src/ipamm_mad/one_ipam.rb"

#-------------------------------------------------------------------------------
# Common library files for VMM drivers
#-------------------------------------------------------------------------------
VMM_EXEC_LIB="src/vmm_mad/remotes/lib/command.rb \
              src/vmm_mad/remotes/lib/xmlparser.rb \
              src/vmm_mad/remotes/lib/opennebula_vm.rb"

#-------------------------------------------------------------------------------
# VMM Lib vcenter files, used by the vCenter Driver to be installed in
# $REMOTES_LOCATION/vmm/lib/vcenter
#-------------------------------------------------------------------------------

VMM_EXEC_LIB_VCENTER_FILES="src/vmm_mad/remotes/lib/vcenter_driver/datastore.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vi_client.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/rest_client.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vcenter_importer.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/file_helper.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/host.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vi_helper.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/memoize.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/datacenter.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vm_template.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/network.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vm_folder.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/vmm_importer.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine_device/vm_device.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine_device/vm_disk.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine_device/vm_nic.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine_helper/vm_helper.rb \
                    src/vmm_mad/remotes/lib/vcenter_driver/virtual_machine_monitor/vm_monitor.rb"

#-------------------------------------------------------------------------------
# VMM Lib nsx files, used by the NSX Driver to be installed in
# $REMOTES_LOCATION/vmm/lib/nsx
#-------------------------------------------------------------------------------

VMM_EXEC_LIB_NSX_FILES="src/vmm_mad/remotes/lib/nsx_driver/logical_switch.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsx_client.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxt_client.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxv_client.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsx_component.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsx_constants.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsx_error.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/opaque_network.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/transport_zone.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxt_tz.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxv_tz.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/virtual_wire.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/distributed_firewall.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxt_dfw.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxv_dfw.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/logical_port.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxt_logical_port.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxv_logical_port.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsx_rule.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxt_rule.rb \
                    src/vmm_mad/remotes/lib/nsx_driver/nsxv_rule.rb"

#-------------------------------------------------------------------------------
# VMM SH Driver LXD scripts, to be installed under $REMOTES_LOCATION/vmm/lxd
#-------------------------------------------------------------------------------
VMM_EXEC_LXD_SCRIPTS="src/vmm_mad/remotes/lxd/cancel \
                    src/vmm_mad/remotes/lxd/deploy \
                    src/vmm_mad/remotes/lxd/migrate \
                    src/vmm_mad/remotes/lxd/migrate_local \
                    src/vmm_mad/remotes/lxd/restore \
                    src/vmm_mad/remotes/lxd/reboot \
                    src/vmm_mad/remotes/lxd/reset \
                    src/vmm_mad/remotes/lxd/save \
                    src/vmm_mad/remotes/lxd/attach_disk \
                    src/vmm_mad/remotes/lxd/detach_disk \
                    src/vmm_mad/remotes/lxd/attach_nic \
                    src/vmm_mad/remotes/lxd/detach_nic \
                    src/vmm_mad/remotes/lxd/snapshot_create \
                    src/vmm_mad/remotes/lxd/snapshot_revert \
                    src/vmm_mad/remotes/lxd/snapshot_delete \
                    src/vmm_mad/remotes/lxd/shutdown \
                    src/vmm_mad/remotes/lxd/reconfigure \
                    src/vmm_mad/remotes/lxd/prereconfigure \
                    src/vmm_mad/remotes/lxd/resize_disk"

VMM_EXEC_LXD_LIB="src/vmm_mad/remotes/lib/lxd/opennebula_vm.rb \
                src/vmm_mad/remotes/lib/lxd/mapper/mapper.rb \
                src/vmm_mad/remotes/lib/lxd/mapper/qcow2.rb \
                src/vmm_mad/remotes/lib/lxd/mapper/raw.rb \
                src/vmm_mad/remotes/lib/lxd/mapper/rbd.rb \
                src/vmm_mad/remotes/lib/lxd/client.rb \
                src/vmm_mad/remotes/lib/lxd/command.rb \
                src/vmm_mad/remotes/lib/lxd/container.rb"

#-------------------------------------------------------------------------------
# VMM SH Driver LXC scripts, to be installed under $REMOTES_LOCATION/vmm/lxc
#-------------------------------------------------------------------------------
VMM_EXEC_LXC_SCRIPTS="
                    src/vmm_mad/remotes/lxc/attach_disk \
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
# VMM SH Driver Firecracker scripts, to be installed under $REMOTES_LOCATION/vmm/firecracker
#-------------------------------------------------------------------------------
VMM_EXEC_FIRECRACKER_SCRIPTS="src/vmm_mad/remotes/firecracker/deploy \
                            src/vmm_mad/remotes/firecracker/shutdown \
                            src/vmm_mad/remotes/firecracker/cancel \
                            src/vmm_mad/remotes/firecracker/migrate \
                            src/vmm_mad/remotes/firecracker/migrate_local \
                            src/vmm_mad/remotes/firecracker/restore \
                            src/vmm_mad/remotes/firecracker/reboot \
                            src/vmm_mad/remotes/firecracker/reset \
                            src/vmm_mad/remotes/firecracker/save \
                            src/vmm_mad/remotes/firecracker/attach_disk \
                            src/vmm_mad/remotes/firecracker/detach_disk \
                            src/vmm_mad/remotes/firecracker/attach_nic \
                            src/vmm_mad/remotes/firecracker/detach_nic \
                            src/vmm_mad/remotes/firecracker/snapshot_create \
                            src/vmm_mad/remotes/firecracker/snapshot_revert \
                            src/vmm_mad/remotes/firecracker/snapshot_delete \
                            src/vmm_mad/remotes/firecracker/reconfigure \
                            src/vmm_mad/remotes/firecracker/prereconfigure \
                            src/vmm_mad/remotes/firecracker/resize \
                            src/vmm_mad/remotes/firecracker/resize_disk"

VMM_EXEC_FIRECRACKER_LIB="src/vmm_mad/remotes/lib/firecracker/opennebula_vm.rb \
                        src/vmm_mad/remotes/lib/firecracker/client.rb \
                        src/vmm_mad/remotes/lib/firecracker/microvm.rb \
                        src/vmm_mad/remotes/lib/firecracker/map_context \
                        src/vmm_mad/remotes/lib/firecracker/command.rb"
#-------------------------------------------------------------------------------
# VMM configuration LXD scripts, to be installed under $REMOTES_LOCATION/etc/vmm/lxd
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_LXD_SCRIPTS="src/vmm_mad/remotes/lxd/lxdrc"

#-------------------------------------------------------------------------------
# VMM configuration LXC scripts, to be installed under $REMOTES_LOCATION/etc/vmm/lxc
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_LXC_SCRIPTS="src/vmm_mad/remotes/lxc/lxcrc"

#-------------------------------------------------------------------------------
# LXC profiles, to be installed under $REMOTES_LOCATION/etc/vmm/lxc/profiles
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_LXC_PROFILES="src/vmm_mad/remotes/lxc/profile_privileged"
#-------------------------------------------------------------------------------
# VMM configuration Firecracker scripts, to be installed under $REMOTES_LOCATION/etc/vmm/firecracker
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_FIRECRACKER_SCRIPTS="src/vmm_mad/remotes/firecracker/firecrackerrc"

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
# VMM Driver vCenter scripts, installed under $REMOTES_LOCATION/vmm/vcenter
#-------------------------------------------------------------------------------

VMM_EXEC_VCENTER_SCRIPTS="src/vmm_mad/remotes/vcenter/cancel \
                         src/vmm_mad/remotes/vcenter/attach_disk \
                         src/vmm_mad/remotes/vcenter/detach_disk \
                         src/vmm_mad/remotes/vcenter/attach_nic \
                         src/vmm_mad/remotes/vcenter/detach_nic \
                         src/vmm_mad/remotes/vcenter/snapshot_create \
                         src/vmm_mad/remotes/vcenter/snapshot_revert \
                         src/vmm_mad/remotes/vcenter/snapshot_delete \
                         src/vmm_mad/remotes/vcenter/deploy \
                         src/vmm_mad/remotes/vcenter/migrate \
                         src/vmm_mad/remotes/vcenter/restore \
                         src/vmm_mad/remotes/vcenter/reboot \
                         src/vmm_mad/remotes/vcenter/reset \
                         src/vmm_mad/remotes/vcenter/save \
                         src/vmm_mad/remotes/vcenter/resize_disk \
                         src/vmm_mad/remotes/vcenter/resize \
                         src/vmm_mad/remotes/vcenter/shutdown \
                         src/vmm_mad/remotes/vcenter/reconfigure \
                         src/vmm_mad/remotes/vcenter/preconfigure \
                         src/vmm_mad/remotes/vcenter/prereconfigure"

#-------------------------------------------------------------------------------
# VMM configuration VCENTER scripts, to be installed under $REMOTES_LOCATION/etc/vmm/vcenter
#-------------------------------------------------------------------------------

VMM_EXEC_ETC_VCENTER_SCRIPTS="src/vmm_mad/remotes/vcenter/vcenterrc"

#------------------------------------------------------------------------------
# VMM Driver EC2 scripts, to be installed under $REMOTES_LOCATION/vmm/ec2
#------------------------------------------------------------------------------

VMM_EXEC_EC2_SCRIPTS="src/vmm_mad/remotes/ec2/cancel \
                      src/vmm_mad/remotes/ec2/attach_disk \
                      src/vmm_mad/remotes/ec2/detach_disk \
                      src/vmm_mad/remotes/ec2/attach_nic \
                      src/vmm_mad/remotes/ec2/detach_nic \
                      src/vmm_mad/remotes/ec2/snapshot_create \
                      src/vmm_mad/remotes/ec2/snapshot_revert \
                      src/vmm_mad/remotes/ec2/snapshot_delete \
                      src/vmm_mad/remotes/ec2/deploy \
                      src/vmm_mad/remotes/ec2/migrate \
                      src/vmm_mad/remotes/ec2/restore \
                      src/vmm_mad/remotes/ec2/reboot \
                      src/vmm_mad/remotes/ec2/reset \
                      src/vmm_mad/remotes/ec2/save \
                      src/vmm_mad/remotes/ec2/shutdown \
                      src/vmm_mad/remotes/ec2/reconfigure \
                      src/vmm_mad/remotes/ec2/prereconfigure \
                      src/vmm_mad/remotes/ec2/resize_disk"

#------------------------------------------------------------------------------
# VMM Driver Azure scripts, to be installed under $REMOTES_LOCATION/vmm/az
#------------------------------------------------------------------------------

VMM_EXEC_AZ_SCRIPTS="src/vmm_mad/remotes/az/cancel \
                     src/vmm_mad/remotes/az/attach_disk \
                     src/vmm_mad/remotes/az/detach_disk \
                     src/vmm_mad/remotes/az/attach_nic \
                     src/vmm_mad/remotes/az/detach_nic \
                     src/vmm_mad/remotes/az/snapshot_create \
                     src/vmm_mad/remotes/az/snapshot_revert \
                     src/vmm_mad/remotes/az/snapshot_delete \
                     src/vmm_mad/remotes/az/deploy \
                     src/vmm_mad/remotes/az/migrate \
                     src/vmm_mad/remotes/az/restore \
                     src/vmm_mad/remotes/az/reboot \
                     src/vmm_mad/remotes/az/reset \
                     src/vmm_mad/remotes/az/save \
                     src/vmm_mad/remotes/az/shutdown \
                     src/vmm_mad/remotes/az/reconfigure \
                     src/vmm_mad/remotes/az/prereconfigure \
                     src/vmm_mad/remotes/az/resize_disk"

#------------------------------------------------------------------------------
# VMM Driver opennebula scripts, to be installed under $REMOTES_LOCATION/vmm/one
#------------------------------------------------------------------------------

VMM_EXEC_ONE_SCRIPTS="src/vmm_mad/remotes/one/cancel \
                     src/vmm_mad/remotes/one/attach_disk \
                     src/vmm_mad/remotes/one/detach_disk \
                     src/vmm_mad/remotes/one/attach_nic \
                     src/vmm_mad/remotes/one/detach_nic \
                     src/vmm_mad/remotes/one/snapshot_create \
                     src/vmm_mad/remotes/one/snapshot_revert \
                     src/vmm_mad/remotes/one/snapshot_delete \
                     src/vmm_mad/remotes/one/deploy \
                     src/vmm_mad/remotes/one/migrate \
                     src/vmm_mad/remotes/one/migrate_local \
                     src/vmm_mad/remotes/one/restore \
                     src/vmm_mad/remotes/one/reboot \
                     src/vmm_mad/remotes/one/reset \
                     src/vmm_mad/remotes/one/save \
                     src/vmm_mad/remotes/one/shutdown \
                     src/vmm_mad/remotes/one/reconfigure \
                     src/vmm_mad/remotes/one/prereconfigure"

#------------------------------------------------------------------------------
# VMM Driver Equinix scripts, to be installed under $REMOTES_LOCATION/vmm/equinix
#------------------------------------------------------------------------------

VMM_EXEC_EQUINIX_SCRIPTS="src/vmm_mad/remotes/equinix/cancel \
                     src/vmm_mad/remotes/equinix/deploy \
                     src/vmm_mad/remotes/equinix/reboot \
                     src/vmm_mad/remotes/equinix/reset \
                     src/vmm_mad/remotes/equinix/poll \
                     src/vmm_mad/remotes/equinix/shutdown"

#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $REMOTES_LOCATION/im
#-------------------------------------------------------------------------------
IM_PROBES_FILES="\
    src/im_mad/remotes/run_monitord_client \
    src/im_mad/remotes/stop_monitord_client"

IM_PROBES_LIB_FILES="\
    src/im_mad/remotes/lib/kvm.rb \
    src/im_mad/remotes/lib/lxd.rb \
    src/im_mad/remotes/lib/lxc.rb \
    src/im_mad/remotes/lib/linux.rb \
    src/im_mad/remotes/lib/firecracker.rb\
    src/im_mad/remotes/lib/numa_common.rb \
    src/im_mad/remotes/lib/probe_db.rb \
    src/im_mad/remotes/lib/vcenter_monitor.rb \
    src/im_mad/remotes/lib/vcenter_cluster.rb \
    src/im_mad/remotes/lib/vcenter_monitor_vms.rb \
    src/im_mad/remotes/lib/monitord_client.rb \
    src/im_mad/remotes/lib/domain.rb \
    src/im_mad/remotes/lib/process_list.rb"

# KVM PROBES
IM_PROBES_KVM_FILES="\
    src/im_mad/remotes/kvm.d/monitord-client_control.sh \
    src/im_mad/remotes/kvm.d/monitord-client.rb"

IM_PROBES_KVM_HOST_BEACON_FILES="\
     src/im_mad/remotes/kvm-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/kvm-probes.d/host/beacon/date.sh"

IM_PROBES_KVM_HOST_MONITOR_FILES="\
     src/im_mad/remotes/kvm-probes.d/host/monitor/linux_usage.rb \
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

# LXD PROBES
IM_PROBES_LXD_FILES="\
    src/im_mad/remotes/lxd.d/monitord-client_control.sh \
    src/im_mad/remotes/lxd.d/monitord-client.rb"

IM_PROBES_LXD_HOST_BEACON_FILES="\
     src/im_mad/remotes/lxd-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/lxd-probes.d/host/beacon/date.sh"

IM_PROBES_LXD_HOST_MONITOR_FILES="\
     src/im_mad/remotes/lxd-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/lxd-probes.d/host/monitor/numa_usage.rb"

IM_PROBES_LXD_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/lxd-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/lxd-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/lxd-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/lxd-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/lxd-probes.d/host/system/name.sh \
     src/im_mad/remotes/lxd-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/lxd-probes.d/host/system/wild_vm.rb \
     src/im_mad/remotes/lxd-probes.d/host/system/pci.rb \
     src/im_mad/remotes/lxd-probes.d/host/system/profiles.sh \
     src/im_mad/remotes/lxd-probes.d/host/system/version.sh"

IM_PROBES_LXD_VM_MONITOR_FILES="\
     src/im_mad/remotes/lxd-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/lxd-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_LXD_VM_STATUS_FILES="\
     src/im_mad/remotes/lxd-probes.d/vm/status/state.rb"

IM_PROBES_ETC_LXD_PROBES_FILES="\
    src/im_mad/remotes/lxd-probes.d/pci.conf \
    src/im_mad/remotes/lib/probe_db.conf"

# LXC PROBES
IM_PROBES_LXC_FILES="\
    src/im_mad/remotes/lxc.d/monitord-client_control.sh \
    src/im_mad/remotes/lxc.d/monitord-client.rb"

IM_PROBES_LXC_HOST_BEACON_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/lxc-probes.d/host/beacon/date.sh"

IM_PROBES_LXC_HOST_MONITOR_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/lxc-probes.d/host/monitor/numa_usage.rb"

IM_PROBES_LXC_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/lxc-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/name.sh \
     src/im_mad/remotes/lxc-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/lxc-probes.d/host/system/version.sh"

IM_PROBES_LXC_VM_MONITOR_FILES="\
     src/im_mad/remotes/lxc-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/lxc-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_LXC_VM_STATUS_FILES="\
     src/im_mad/remotes/lxc-probes.d/vm/status/state.rb"

IM_PROBES_ETC_LXC_PROBES_FILES="\
    src/im_mad/remotes/lib/probe_db.conf"

# Firecracker PROBES
IM_PROBES_FIRECRACKER_FILES="\
    src/im_mad/remotes/firecracker.d/monitord-client_control.sh \
    src/im_mad/remotes/firecracker.d/monitord-client.rb"

IM_PROBES_FIRECRACKER_HOST_BEACON_FILES="\
     src/im_mad/remotes/firecracker-probes.d/host/beacon/monitord-client-shepherd.sh \
     src/im_mad/remotes/firecracker-probes.d/host/beacon/date.sh"

IM_PROBES_FIRECRACKER_HOST_MONITOR_FILES="\
     src/im_mad/remotes/firecracker-probes.d/host/monitor/linux_usage.rb \
     src/im_mad/remotes/firecracker-probes.d/host/monitor/numa_usage.rb"

IM_PROBES_FIRECRACKER_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/firecracker-probes.d/host/system/architecture.sh \
     src/im_mad/remotes/firecracker-probes.d/host/system/cpu.sh \
     src/im_mad/remotes/firecracker-probes.d/host/system/linux_host.rb \
     src/im_mad/remotes/firecracker-probes.d/host/system/monitor_ds.rb \
     src/im_mad/remotes/firecracker-probes.d/host/system/name.sh \
     src/im_mad/remotes/firecracker-probes.d/host/system/numa_host.rb \
     src/im_mad/remotes/firecracker-probes.d/host/system/version.sh"

IM_PROBES_FIRECRACKER_VM_MONITOR_FILES="\
     src/im_mad/remotes/firecracker-probes.d/vm/monitor/poll.rb \
     src/im_mad/remotes/firecracker-probes.d/vm/monitor/monitor_ds_vm.rb"

IM_PROBES_FIRECRACKER_VM_STATUS_FILES="\
     src/im_mad/remotes/firecracker-probes.d/vm/status/state.rb"

IM_PROBES_ETC_FIRECRACKER_PROBES_FILES="src/im_mad/remotes/lib/probe_db.conf"

IM_PROBES_VCENTER_FILES="src/im_mad/remotes/vcenter.d/monitord-client_control.sh"

# EC2 monitord-client
IM_PROBES_EC2_FILES="\
    src/im_mad/remotes/ec2.d/monitord-client_control.sh \
    src/im_mad/remotes/ec2.d/monitord-client.rb"

# EC2 probes
IM_PROBES_EC2_HOST_BEACON_FILES="\
     src/im_mad/remotes/ec2-probes.d/host/beacon/monitord-client-shepherd_local.sh"

IM_PROBES_EC2_HOST_MONITOR_FILES="\
     src/im_mad/remotes/ec2-probes.d/host/monitor/probe_host_monitor.rb"

IM_PROBES_EC2_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/ec2-probes.d/host/system/probe_host_system.rb"

IM_PROBES_EC2_VM_MONITOR_FILES="\
     src/im_mad/remotes/ec2-probes.d/vm/monitor/probe_vm_monitor.rb"

IM_PROBES_EC2_VM_STATUS_FILES="\
     src/im_mad/remotes/ec2-probes.d/vm/status/probe_vm_status.rb"

# AZ monitord-client
IM_PROBES_AZ_FILES="\
    src/im_mad/remotes/az.d/monitord-client_control.sh \
    src/im_mad/remotes/az.d/monitord-client.rb"

# AZ probes
IM_PROBES_AZ_HOST_BEACON_FILES="\
     src/im_mad/remotes/az-probes.d/host/beacon/monitord-client-shepherd_local.sh"

IM_PROBES_AZ_HOST_MONITOR_FILES="\
     src/im_mad/remotes/az-probes.d/host/monitor/probe_host_monitor.rb"

IM_PROBES_AZ_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/az-probes.d/host/system/probe_host_system.rb"

IM_PROBES_AZ_VM_MONITOR_FILES="\
     src/im_mad/remotes/az-probes.d/vm/monitor/probe_vm_monitor.rb"

IM_PROBES_AZ_VM_STATUS_FILES="\
     src/im_mad/remotes/az-probes.d/vm/status/probe_vm_status.rb"

# ONE monitord-client
IM_PROBES_ONE_FILES="\
    src/im_mad/remotes/one.d/monitord-client_control.sh \
    src/im_mad/remotes/one.d/monitord-client.rb"

# ONE probes
IM_PROBES_ONE_HOST_BEACON_FILES="\
     src/im_mad/remotes/one-probes.d/host/beacon/monitord-client-shepherd_local.sh"

IM_PROBES_ONE_HOST_MONITOR_FILES="\
     src/im_mad/remotes/one-probes.d/host/monitor/probe_host_monitor.rb"

IM_PROBES_ONE_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/one-probes.d/host/system/probe_host_system.rb"

IM_PROBES_ONE_VM_MONITOR_FILES="\
     src/im_mad/remotes/one-probes.d/vm/monitor/probe_vm_monitor.rb"

IM_PROBES_ONE_VM_STATUS_FILES="\
     src/im_mad/remotes/one-probes.d/vm/status/probe_vm_status.rb"

IM_PROBES_EQUINIX_FILES="src/im_mad/remotes/equinix.d/poll"

# EQUINIX monitord-client
IM_PROBES_EQUINIX_FILES="\
    src/im_mad/remotes/equinix.d/monitord-client_control.sh \
    src/im_mad/remotes/equinix.d/monitord-client.rb"

# EQUINIX probes
IM_PROBES_EQUINIX_HOST_BEACON_FILES="\
     src/im_mad/remotes/equinix-probes.d/host/beacon/monitord-client-shepherd_local.sh"

IM_PROBES_EQUINIX_HOST_MONITOR_FILES="\
     src/im_mad/remotes/equinix-probes.d/host/monitor/probe_host_monitor.rb"

IM_PROBES_EQUINIX_HOST_SYSTEM_FILES="\
     src/im_mad/remotes/equinix-probes.d/host/system/probe_host_system.rb"

IM_PROBES_EQUINIX_VM_MONITOR_FILES="\
     src/im_mad/remotes/equinix-probes.d/vm/monitor/probe_vm_monitor.rb"

IM_PROBES_EQUINIX_VM_STATUS_FILES="\
     src/im_mad/remotes/equinix-probes.d/vm/status/probe_vm_status.rb"

IM_PROBES_VERSION="src/im_mad/remotes/VERSION"

#-------------------------------------------------------------------------------
# Auth Manager drivers to be installed under $REMOTES_LOCATION/auth
#-------------------------------------------------------------------------------

AUTH_SERVER_CIPHER_FILES="src/authm_mad/remotes/server_cipher/authenticate"

AUTH_SERVER_X509_FILES="src/authm_mad/remotes/server_x509/authenticate"

AUTH_X509_FILES="src/authm_mad/remotes/x509/authenticate"

AUTH_LDAP_FILES="src/authm_mad/remotes/ldap/authenticate"

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
               src/vnm_mad/remotes/lib/nic.rb"

NETWORK_HOOKS_PRE_FILES="src/vnm_mad/remotes/hooks/pre/firecracker"

NETWORK_HOOKS_CLEAN_FILES="src/vnm_mad/remotes/hooks/clean/firecracker"

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

NETWORK_EBTABLES_FILES="src/vnm_mad/remotes/ebtables/clean \
                    src/vnm_mad/remotes/ebtables/post \
                    src/vnm_mad/remotes/ebtables/pre \
                    src/vnm_mad/remotes/ebtables/update_sg \
                    src/vnm_mad/remotes/ebtables/Ebtables.rb \
                    src/vnm_mad/remotes/ebtables/vnet_create \
                    src/vnm_mad/remotes/ebtables/vnet_delete"

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

NETWORK_VCENTER_FILES="src/vnm_mad/remotes/vcenter/pre \
                       src/vnm_mad/remotes/vcenter/post \
                       src/vnm_mad/remotes/vcenter/clean \
                       src/vnm_mad/remotes/vcenter/update_sg \
                       src/vnm_mad/remotes/vcenter/update_nic \
                       src/vnm_mad/remotes/vcenter/virtual_network_xml.rb \
                       src/vnm_mad/remotes/vcenter/vnet_create \
                       src/vnm_mad/remotes/vcenter/vnet_delete"

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
              src/tm_mad/lib/tm_action.rb \
              src/tm_mad/lib/backup_qcow2.rb \
              src/tm_mad/lib/datastore.rb \
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
                 src/tm_mad/shared/postbackup"

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
                 src/tm_mad/fs_lvm/prebackup_live \
                 src/tm_mad/fs_lvm/prebackup \
                 src/tm_mad/fs_lvm/postbackup_live \
                 src/tm_mad/fs_lvm/postbackup"

TM_FS_LVM_ETC_FILES="src/tm_mad/fs_lvm/fs_lvm.conf"

TM_FS_LVM_SSH_FILES="src/tm_mad/fs_lvm_ssh/activate \
                     src/tm_mad/fs_lvm_ssh/clone \
                     src/tm_mad/fs_lvm_ssh/context \
                     src/tm_mad/fs_lvm_ssh/ln \
                     src/tm_mad/fs_lvm_ssh/monitor \
                     src/tm_mad/fs_lvm_ssh/mkswap \
                     src/tm_mad/fs_lvm_ssh/mkimage \
                     src/tm_mad/fs_lvm_ssh/mv \
                     src/tm_mad/fs_lvm_ssh/mvds \
                     src/tm_mad/fs_lvm_ssh/cpds \
                     src/tm_mad/fs_lvm_ssh/premigrate \
                     src/tm_mad/fs_lvm_ssh/postmigrate \
                     src/tm_mad/fs_lvm_ssh/snap_create \
                     src/tm_mad/fs_lvm_ssh/snap_create_live \
                     src/tm_mad/fs_lvm_ssh/snap_delete \
                     src/tm_mad/fs_lvm_ssh/snap_revert \
                     src/tm_mad/fs_lvm_ssh/failmigrate \
                     src/tm_mad/fs_lvm_ssh/delete \
                     src/tm_mad/fs_lvm_ssh/resize \
                     src/tm_mad/fs_lvm_ssh/prebackup_live \
                     src/tm_mad/fs_lvm_ssh/prebackup \
                     src/tm_mad/fs_lvm_ssh/postbackup_live \
                     src/tm_mad/fs_lvm_ssh/postbackup"

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
              src/tm_mad/ssh/postbackup"

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
              src/tm_mad/dummy/resize"

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

TM_VCENTER_FILES="src/tm_mad/vcenter/clone \
                 src/tm_mad/vcenter/ln \
                 src/tm_mad/vcenter/mv \
                 src/tm_mad/vcenter/mvds \
                 src/tm_mad/vcenter/cpds \
                 src/tm_mad/vcenter/premigrate \
                 src/tm_mad/vcenter/postmigrate \
                 src/tm_mad/vcenter/resize \
                 src/tm_mad/vcenter/snap_create \
                 src/tm_mad/vcenter/snap_create_live \
                 src/tm_mad/vcenter/snap_delete \
                 src/tm_mad/vcenter/snap_revert \
                 src/tm_mad/vcenter/failmigrate \
                 src/tm_mad/vcenter/context \
                 src/tm_mad/vcenter/monitor \
                 src/tm_mad/vcenter/mkimage \
                 src/tm_mad/vcenter/mkswap \
                 src/tm_mad/vcenter/delete"

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
                             src/datastore_mad/remotes/docker_downloader.sh \
                             src/datastore_mad/remotes/restic_downloader.rb \
                             src/datastore_mad/remotes/rsync_downloader.rb \
                             src/datastore_mad/remotes/vcenter_uploader.rb \
                             src/datastore_mad/remotes/vcenter_downloader.rb \
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

DATASTORE_DRIVER_VCENTER_SCRIPTS="src/datastore_mad/remotes/vcenter/cp \
                         src/datastore_mad/remotes/vcenter/mkfs \
                         src/datastore_mad/remotes/vcenter/stat \
                         src/datastore_mad/remotes/vcenter/rm \
                         src/datastore_mad/remotes/vcenter/monitor \
                         src/datastore_mad/remotes/vcenter/snap_delete \
                         src/datastore_mad/remotes/vcenter/snap_revert \
                         src/datastore_mad/remotes/vcenter/snap_flatten \
                         src/datastore_mad/remotes/vcenter/clone \
                         src/datastore_mad/remotes/vcenter/export"

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
                         src/datastore_mad/remotes/rsync/increment_flatten"

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

MARKETPLACE_DRIVER_COMMON_SCRIPTS="src/market_mad/remotes/common/lxd.rb \
                                   src/market_mad/remotes/common/docker.rb"

MARKETPLACE_DRIVER_LXC_SCRIPTS="src/market_mad/remotes/linuxcontainers/import \
            src/market_mad/remotes/linuxcontainers/delete \
            src/market_mad/remotes/linuxcontainers/monitor"

MARKETPLACE_DRIVER_TK_SCRIPTS="src/market_mad/remotes/turnkeylinux/import \
            src/market_mad/remotes/turnkeylinux/delete \
            src/market_mad/remotes/turnkeylinux/monitor"

MARKETPLACE_DRIVER_DH_SCRIPTS="src/market_mad/remotes/dockerhub/import \
            src/market_mad/remotes/dockerhub/delete \
            src/market_mad/remotes/dockerhub/monitor"

MARKETPLACE_DRIVER_REGISTRY_SCRIPTS="src/market_mad/remotes/docker_registry/import \
                                     src/market_mad/remotes/docker_registry/delete \
                                     src/market_mad/remotes/docker_registry/monitor"

#-------------------------------------------------------------------------------
# Migration scripts for onedb command, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------

ONEDB_FILES="src/onedb/fsck.rb \
            src/onedb/onedb.rb \
            src/onedb/onedb_backend.rb \
            src/onedb/vcenter_one54.rb \
            src/onedb/sqlite2mysql.rb \
            src/onedb/database_schema.rb \
            src/onedb/fsck \
            src/onedb/onedb_live.rb"

ONEDB_PATCH_FILES="src/onedb/patches/4.14_monitoring.rb \
                   src/onedb/patches/history_times.rb"

#-------------------------------------------------------------------------------
# Configuration files for OpenNebula, to be installed under $ETC_LOCATION
#-------------------------------------------------------------------------------

ETC_FILES="share/etc/oned.conf \
           share/etc/defaultrc \
           share/etc/guacd \
           src/tm_mad/tmrc \
           src/scheduler/etc/sched.conf \
           src/monitor/etc/monitord.conf "

EC2_ETC_FILES="src/vmm_mad/remotes/ec2/ec2_driver.conf \
               src/vmm_mad/remotes/ec2/ec2_driver.default"

AZ_ETC_FILES="src/vmm_mad/remotes/az/az_driver.conf \
              src/vmm_mad/remotes/az/az_driver.default"

VCENTER_ETC_FILES="src/vmm_mad/remotes/lib/vcenter_driver/vcenter_driver.default"

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
                src/authm_mad/remotes/x509/x509_auth.conf"

#-------------------------------------------------------------------------------
# Sample files, to be installed under $SHARE_LOCATION/examples
#-------------------------------------------------------------------------------

EXAMPLE_SHARE_FILES="share/examples/vm.template \
                     share/examples/private.net \
                     share/examples/public.net"

#-------------------------------------------------------------------------------
# Sample files, to be installed under $SHARE_LOCATION/examples/external_scheduler
#-------------------------------------------------------------------------------
EXAMPLE_EXTERNAL_SCHED_FILES="share/examples/external_scheduler/external_scheduler_server.rb"

#-------------------------------------------------------------------------------
# Sample files, to be installed under $SHARE_LOCATION/examples/host_hooks
#-------------------------------------------------------------------------------

EXAMPLE_HOST_HOOKS_SHARE_FILES="share/examples/host_hooks/error_hook"

#-------------------------------------------------------------------------------
# LXD network issues vnm hook patches
#-------------------------------------------------------------------------------

LXD_NETWORK_HOOKS="share/examples/network_hooks/99-lxd_clean.rb"

#-------------------------------------------------------------------------------
# Files required to interact with the websockify server
#-------------------------------------------------------------------------------

WEBSOCKIFY_SHARE_RUN_FILES="share/websockify/run"
WEBSOCKIFY_SHARE_MODULE_FILES="share/websockify/websockify/__init__.py \
                               share/websockify/websockify/auth_plugins.py \
                               share/websockify/websockify/token_plugins.py \
                               share/websockify/websockify/websocket.py \
                               share/websockify/websockify/websocketproxy.py"

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

CLOUD_AUTH_LIB_FILES="src/cloud/common/CloudAuth/SunstoneCloudAuth.rb \
                      src/cloud/common/CloudAuth/X509CloudAuth.rb \
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
                   src/cli/one_helper/onevcenter_helper.rb \
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
# Provision files
#-----------------------------------------------------------------------------

ONEPROVISION_BIN_FILES="src/cli/oneprovision \
                        src/cli/oneprovider"

ONEPROVISION_ONE_LIB_FILES="src/cli/one_helper/oneprovision_helper.rb \
                            src/cli/one_helper/oneprovider_helper.rb"

ONEPROVISION_CONF_FILES="src/cli/etc/oneprovision.yaml \
                         src/cli/etc/oneprovider.yaml"

ONEPROVISION_ANSIBLE_FILES="share/oneprovision/ansible"

ONEPROVISION_TEMPLATES_FILES="share/oneprovision/edge-clusters/ \
                              share/oneprovision/edge-clusters-extra/ "

ONEPROVISION_LIB_FILES="src/oneprovision/lib/oneprovision.rb \
                        src/oneprovision/lib/provision_element.rb"

ONEPROVISION_LIB_API_VULTR_FILES="src/oneprovision/provider_apis/vultr/lib/vultr.rb"

ONEPROVISION_LIB_PROVISION_FILES="src/oneprovision/lib/provision/ansible.rb \
                                  src/oneprovision/lib/provision/oneprovision.rb \
                                  src/oneprovision/lib/provision/driver.rb \
                                  src/oneprovision/lib/provision/provision.rb \
                                  src/oneprovision/lib/provision/provision_config.rb \
                                  src/oneprovision/lib/provision/provision_pool.rb \
                                  src/oneprovision/lib/provision/resources.rb \
                                  src/oneprovision/lib/provision/utils.rb"

ONEPROVISION_LIB_RESOURCES_FILES="src/oneprovision/lib/provision/resources/virtual.rb \
                                  src/oneprovision/lib/provision/resources/resource.rb \
                                  src/oneprovision/lib/provision/resources/physical.rb"

ONEPROVISION_LIB_PHYSICAL_R_FILES="src/oneprovision/lib/provision/resources/physical/cluster.rb \
                                   src/oneprovision/lib/provision/resources/physical/datastore.rb \
                                   src/oneprovision/lib/provision/resources/physical/host.rb \
                                   src/oneprovision/lib/provision/resources/physical/physical_resource.rb \
                                   src/oneprovision/lib/provision/resources/physical/network.rb"

ONEPROVISION_LIB_VIRTUAL_R_FILES="src/oneprovision/lib/provision/resources/virtual/virtual_resource.rb \
                                  src/oneprovision/lib/provision/resources/virtual/virtual_sync_resource.rb \
                                  src/oneprovision/lib/provision/resources/virtual/image.rb \
                                  src/oneprovision/lib/provision/resources/virtual/marketplaceapp.rb \
                                  src/oneprovision/lib/provision/resources/virtual/template.rb \
                                  src/oneprovision/lib/provision/resources/virtual/flowtemplate.rb \
                                  src/oneprovision/lib/provision/resources/virtual/vntemplate.rb"

ONEPROVISION_LIB_PROVIDER_FILES="src/oneprovision/lib/provider/provider.rb \
                                 src/oneprovision/lib/provider/provider_pool.rb"

ONEPROVISION_LIB_TF_FILES="src/oneprovision/lib/terraform/terraform.rb"

ONEPROVISION_LIB_PROVIDERS_FILES="src/oneprovision/lib/terraform/providers/aws.rb \
                                  src/oneprovision/lib/terraform/providers/google.rb \
                                  src/oneprovision/lib/terraform/providers/digitalocean.rb \
                                  src/oneprovision/lib/terraform/providers/onprem.rb \
                                  src/oneprovision/lib/terraform/providers/example \
                                  src/oneprovision/lib/terraform/providers/equinix.rb \
                                  src/oneprovision/lib/terraform/providers/vultr.rb \
                                  src/oneprovision/lib/terraform/providers/vultr_metal.rb \
                                  src/oneprovision/lib/terraform/providers/vultr_virtual.rb"

ONEPROVISION_LIB_AWS_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/aws/cluster.erb \
                                src/oneprovision/lib/terraform/providers/templates/aws/datastore.erb \
                                src/oneprovision/lib/terraform/providers/templates/aws/host.erb \
                                src/oneprovision/lib/terraform/providers/templates/aws/network.erb \
                                src/oneprovision/lib/terraform/providers/templates/aws/provider.erb"

ONEPROVISION_LIB_GOOGLE_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/google/cluster.erb \
                                   src/oneprovision/lib/terraform/providers/templates/google/datastore.erb \
                                   src/oneprovision/lib/terraform/providers/templates/google/host.erb \
                                   src/oneprovision/lib/terraform/providers/templates/google/network.erb \
                                   src/oneprovision/lib/terraform/providers/templates/google/provider.erb"

ONEPROVISION_LIB_DIGITALOCEAN_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/digitalocean/cluster.erb \
                                         src/oneprovision/lib/terraform/providers/templates/digitalocean/datastore.erb \
                                         src/oneprovision/lib/terraform/providers/templates/digitalocean/host.erb \
                                         src/oneprovision/lib/terraform/providers/templates/digitalocean/network.erb \
                                         src/oneprovision/lib/terraform/providers/templates/digitalocean/provider.erb"

ONEPROVISION_LIB_EQUINIX_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/equinix/cluster.erb \
                                   src/oneprovision/lib/terraform/providers/templates/equinix/datastore.erb \
                                   src/oneprovision/lib/terraform/providers/templates/equinix/host.erb \
                                   src/oneprovision/lib/terraform/providers/templates/equinix/network.erb \
                                   src/oneprovision/lib/terraform/providers/templates/equinix/provider.erb"

ONEPROVISION_LIB_VULTR_METAL_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/vultr_metal/cluster.erb \
                                        src/oneprovision/lib/terraform/providers/templates/vultr_metal/datastore.erb \
                                        src/oneprovision/lib/terraform/providers/templates/vultr_metal/host.erb \
                                        src/oneprovision/lib/terraform/providers/templates/vultr_metal/network.erb \
                                        src/oneprovision/lib/terraform/providers/templates/vultr_metal/provider.erb"

ONEPROVISION_LIB_VULTR_VIRTUAL_ERB_FILES="src/oneprovision/lib/terraform/providers/templates/vultr_virtual/cluster.erb \
                                          src/oneprovision/lib/terraform/providers/templates/vultr_virtual/datastore.erb \
                                          src/oneprovision/lib/terraform/providers/templates/vultr_virtual/host.erb \
                                          src/oneprovision/lib/terraform/providers/templates/vultr_virtual/network.erb \
                                          src/oneprovision/lib/terraform/providers/templates/vultr_virtual/provider.erb"

#-----------------------------------------------------------------------------
# Sunstone files
#-----------------------------------------------------------------------------

SUNSTONE_FILES="src/sunstone/sunstone-server.rb \
                src/sunstone/config.ru"

SUNSTONE_BIN_FILES="src/sunstone/bin/sunstone-server \
                    src/sunstone/bin/novnc-server"

SUNSTONE_ETC_FILES="src/sunstone/etc/sunstone-server.conf \
                    src/sunstone/etc/sunstone-views.yaml \
                    src/sunstone/etc/sunstone-logos.yaml"

SUNSTONE_ETC_VIEW_KVM="src/sunstone/etc/sunstone-views/kvm/admin.yaml \
                    src/sunstone/etc/sunstone-views/kvm/user.yaml \
                    src/sunstone/etc/sunstone-views/kvm/cloud.yaml \
                    src/sunstone/etc/sunstone-views/kvm/groupadmin.yaml"

SUNSTONE_ETC_VIEW_VCENTER="src/sunstone/etc/sunstone-views/vcenter/admin.yaml \
                    src/sunstone/etc/sunstone-views/vcenter/user.yaml \
                    src/sunstone/etc/sunstone-views/vcenter/cloud.yaml \
                    src/sunstone/etc/sunstone-views/vcenter/groupadmin.yaml"

SUNSTONE_ETC_VIEW_MIXED="src/sunstone/etc/sunstone-views/mixed/admin.yaml \
                    src/sunstone/etc/sunstone-views/mixed/user.yaml \
                    src/sunstone/etc/sunstone-views/mixed/cloud.yaml \
                    src/sunstone/etc/sunstone-views/mixed/groupadmin.yaml"

SUNSTONE_MODELS_FILES="src/sunstone/models/OpenNebulaJSON.rb \
                    src/sunstone/models/SunstoneServer.rb \
                    src/sunstone/models/SunstoneViews.rb \
                    src/sunstone/models/sunstone_vm_helper.rb \
                    src/sunstone/models/sunstone_remotes.rb \
                    src/sunstone/models/sunstone_vnc.rb \
                    src/sunstone/models/sunstone_guac.rb \
                    src/sunstone/models/sunstone_vmrc.rb \
                    src/sunstone/models/OpenNebula2FA/SunstoneWebAuthn.rb \
                    src/sunstone/models/OpenNebula2FA/sunstone_qr_code.rb \
                    src/sunstone/models/OpenNebula2FA/sunstone_optp.rb \
                    src/sunstone/models/OpenNebula2FA/sunstone_2f_auth.rb"

SUNSTONE_MODELS_JSON_FILES="src/sunstone/models/OpenNebulaJSON/HostJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ImageJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/GroupJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/JSONUtils.rb \
                    src/sunstone/models/OpenNebulaJSON/PoolJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/UserJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VMGroupJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualMachineJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/TemplateJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/AclJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ClusterJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/DatastoreJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualNetworkJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualNetworkTemplateJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ZoneJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/SecurityGroupJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VdcJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualRouterJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/BackupJobJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/MarketPlaceJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/MarketPlaceAppJSON.rb"

SUNSTONE_VIEWS_FILES="src/sunstone/views/index.erb \
                      src/sunstone/views/login.erb \
                      src/sunstone/views/vnc.erb \
                      src/sunstone/views/vmrc.erb \
                      src/sunstone/views/spice.erb \
                      src/sunstone/views/guac.erb \
                      src/sunstone/views/_login_standard.erb \
                      src/sunstone/views/_login_x509.erb"

SUNSTONE_PUBLIC_JS_FILES="src/sunstone/public/dist/login.js \
                        src/sunstone/public/dist/login.js.map \
                        src/sunstone/public/dist/main.js \
                        src/sunstone/public/dist/main.js.map \
                        src/sunstone/public/dist/main-dist.js"

SUNSTONE_PUBLIC_JS_CONSOLE_FILES="src/sunstone/public/dist/console/vnc.js \
                        src/sunstone/public/dist/console/vnc.js.map \
                        src/sunstone/public/dist/console/spice.js \
                        src/sunstone/public/dist/console/spice.js.map \
                        src/sunstone/public/dist/console/guacamole.js \
                        src/sunstone/public/dist/console/guacamole.js.map \
                        src/sunstone/public/dist/console/vmrc.js \
                        src/sunstone/public/dist/console/vmrc.js.map"

SUNSTONE_PUBLIC_DEV_DIR="src/sunstone/public"

SUNSTONE_ROUTES_FILES="src/sunstone/routes/oneflow.rb \
  src/sunstone/routes/vcenter.rb \
  src/sunstone/routes/support.rb \
  src/sunstone/routes/nsx.rb"

SUNSTONE_PUBLIC_CSS_FILES="src/sunstone/public/css/app.min.css \
                src/sunstone/public/css/opensans/opensans.woff \
                src/sunstone/public/css/vmrc-custom.css \
                src/sunstone/public/css/novnc-custom.css \
                src/sunstone/public/css/guac-custom.css \
                src/sunstone/public/css/spice-custom.css"

SUNSTONE_PUBLIC_FONT_AWSOME="src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-brands-400.eot \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-brands-400.svg \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-brands-400.ttf \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-brands-400.woff \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-brands-400.woff2 \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-regular-400.eot \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-regular-400.svg \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-regular-400.ttf \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-regular-400.woff \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-regular-400.woff2 \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-solid-900.eot \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-solid-900.svg \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-solid-900.ttf \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-solid-900.woff \
                src/sunstone/public/bower_components/fontawesome/web-fonts-with-css/webfonts/fa-solid-900.woff2"

SUNSTONE_PUBLIC_IMAGES_FILES="src/sunstone/public/images/ajax-loader.gif \
                        src/sunstone/public/images/favicon.svg \
                        src/sunstone/public/images/advanced_layout.png \
                        src/sunstone/public/images/cloud_layout.png \
                        src/sunstone/public/images/vcenter_layout.png \
                        src/sunstone/public/images/opennebula-5.0.png \
                        src/sunstone/public/images/opennebula-sunstone-v4.0.png \
                        src/sunstone/public/images/opennebula-sunstone-v4.14-small.png \
                        src/sunstone/public/images/panel.png \
                        src/sunstone/public/images/panel_short.png \
                        src/sunstone/public/images/pbar.gif \
"

SUNSTONE_PUBLIC_LOGOS_FILES="src/sunstone/public/images/logos/alt.png \
                        src/sunstone/public/images/logos/arch.png \
                        src/sunstone/public/images/logos/centos.png \
                        src/sunstone/public/images/logos/debian.png \
                        src/sunstone/public/images/logos/fedora.png \
                        src/sunstone/public/images/logos/linux.png \
                        src/sunstone/public/images/logos/redhat.png \
                        src/sunstone/public/images/logos/ubuntu.png \
                        src/sunstone/public/images/logos/windowsxp.png \
                        src/sunstone/public/images/logos/windows8.png \
"

SUNSTONE_PUBLIC_LOCALE_CA="\
src/sunstone/public/locale/languages/ca.js \
src/sunstone/public/locale/languages/ca_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_CS_CZ="\
src/sunstone/public/locale/languages/cs_CZ.js \
src/sunstone/public/locale/languages/cs_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_DE="\
src/sunstone/public/locale/languages/de.js \
src/sunstone/public/locale/languages/de_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_DA="\
src/sunstone/public/locale/languages/da.js \
src/sunstone/public/locale/languages/da_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_EN_US="\
src/sunstone/public/locale/languages/en_US.js \
src/sunstone/public/locale/languages/en_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_ES_ES="\
src/sunstone/public/locale/languages/es_ES.js \
src/sunstone/public/locale/languages/es_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_FA_IR="\
src/sunstone/public/locale/languages/fa_IR.js \
src/sunstone/public/locale/languages/fa_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_FR_FR="\
src/sunstone/public/locale/languages/fr_FR.js \
src/sunstone/public/locale/languages/fr_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_IT_IT="\
src/sunstone/public/locale/languages/it_IT.js \
src/sunstone/public/locale/languages/it_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_JA="\
src/sunstone/public/locale/languages/ja.js \
src/sunstone/public/locale/languages/ja_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_LT_LT="\
src/sunstone/public/locale/languages/lt_LT.js \
src/sunstone/public/locale/languages/lt_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_NL_NL="\
src/sunstone/public/locale/languages/nl_NL.js \
src/sunstone/public/locale/languages/nl_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PL="\
src/sunstone/public/locale/languages/pl.js \
src/sunstone/public/locale/languages/pl_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PT_PT="\
src/sunstone/public/locale/languages/pt_PT.js \
src/sunstone/public/locale/languages/pt_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PT_BR="\
src/sunstone/public/locale/languages/pt_BR.js"

SUNSTONE_PUBLIC_LOCALE_RU_RU="\
src/sunstone/public/locale/languages/ru_RU.js \
src/sunstone/public/locale/languages/ru_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_SK_SK="\
src/sunstone/public/locale/languages/sk_SK.js \
src/sunstone/public/locale/languages/sk_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_ZH_CN="\
src/sunstone/public/locale/languages/zh_CN.js \
src/sunstone/public/locale/languages/zh_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_TR_TR="\
src/sunstone/public/locale/languages/tr_TR.js \
src/sunstone/public/locale/languages/tr_datatable.txt"

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
# FireEdge Provision files
#----------------------------------------------------------------------------

FIREEDGE_PROVISION_ETC="src/fireedge/etc/provision/provision-server.conf"

FIREEDGE_PROVISION_ETC_PROVIDERS="src/fireedge/etc/provision/providers.d/aws.yaml \
                                src/fireedge/etc/provision/providers.d/onprem.yaml \
                                src/fireedge/etc/provision/providers.d/equinix.yaml"

FIREEDGE_PROVISION_ETC_PROVIDERS_EXTRA="src/fireedge/etc/provision/providers.d-extra/digitalocean.yaml \
                                        src/fireedge/etc/provision/providers.d-extra/google.yaml \
                                        src/fireedge/etc/provision/providers.d-extra/vultr_metal.yaml \
                                        src/fireedge/etc/provision/providers.d-extra/vultr_virtual.yaml"

#----------------------------------------------------------------------------
# FireEdge Sunstone files
#----------------------------------------------------------------------------

FIREEDGE_SUNSTONE_ETC="src/fireedge/etc/sunstone/sunstone-server.conf \
                       src/fireedge/etc/sunstone/sunstone-views.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_ADMIN="src/fireedge/etc/sunstone/admin/vm-tab.yaml \
                                src/fireedge/etc/sunstone/admin/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/admin/vm-group-tab.yaml \
                                src/fireedge/etc/sunstone/admin/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/admin/vnet-tab.yaml \
                                src/fireedge/etc/sunstone/admin/image-tab.yaml\
                                src/fireedge/etc/sunstone/admin/file-tab.yaml\
                                src/fireedge/etc/sunstone/admin/sec-group-tab.yaml\
                                src/fireedge/etc/sunstone/admin/backup-tab.yaml \
                                src/fireedge/etc/sunstone/admin/datastore-tab.yaml \
                                src/fireedge/etc/sunstone/admin/vdc-tab.yaml \
				src/fireedge/etc/sunstone/admin/user-tab.yaml \
                                src/fireedge/etc/sunstone/admin/host-tab.yaml"

FIREEDGE_SUNSTONE_ETC_VIEW_USER="src/fireedge/etc/sunstone/user/vm-tab.yaml \
                                src/fireedge/etc/sunstone/user/vm-template-tab.yaml \
                                src/fireedge/etc/sunstone/user/marketplace-app-tab.yaml \
                                src/fireedge/etc/sunstone/user/image-tab.yaml\
                                src/fireedge/etc/sunstone/user/file-tab.yaml\
                                src/fireedge/etc/sunstone/user/backup-tab.yaml \
                                src/fireedge/etc/sunstone/user/sec-group-tab.yaml \
                                src/fireedge/etc/sunstone/user/vnet-tab.yaml"

#-----------------------------------------------------------------------------
# OneGate files
#-----------------------------------------------------------------------------

ONEGATE_FILES="src/onegate/onegate-server.rb \
               src/onegate/config.ru \
               share/onegate/onegate"

ONEGATE_BIN_FILES="src/onegate/bin/onegate-server"

ONEGATE_ETC_FILES="src/onegate/etc/onegate-server.conf"

#-----------------------------------------------------------------------------
# OneGateProxy files
#-----------------------------------------------------------------------------

ONEGATE_PROXY_FILES="src/onegate-proxy/onegate-proxy.rb"

ONEGATE_PROXY_BIN_FILES="src/onegate-proxy/bin/onegate-proxy"

ONEGATE_PROXY_REMOTES_ETC_FILES="src/onegate-proxy/etc/onegate-proxy.conf"

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
                    src/onecfg/lib/version.rb"
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


#-----------------------------------------------------------------------------
# OneHem files
#-----------------------------------------------------------------------------
ONEHEM_FILES="src/hem/onehem-server.rb"

ONEHEM_BIN_FILES="src/hem/bin/onehem-server"

ONEHEM_ETC_FILES="src/hem/etc/onehem-server.conf"

#-----------------------------------------------------------------------------
# Dockerfiles templates
#-----------------------------------------------------------------------------

DOCKERFILES_TEMPLATES="src/datastore_mad/remotes/dockerhub/dockerfiles/alpine \
                       src/datastore_mad/remotes/dockerhub/dockerfiles/centos7 \
                       src/datastore_mad/remotes/dockerhub/dockerfiles/centos8 \
                       src/datastore_mad/remotes/dockerhub/dockerfiles/debian"

DOCKERFILE_TEMPLATE="src/datastore_mad/remotes/dockerhub/dockerfile"

#-----------------------------------------------------------------------------
# Docker Machine files
#-----------------------------------------------------------------------------

DOCKER_MACHINE_BIN_FILES="src/docker_machine/src/docker_machine/bin/docker-machine-driver-opennebula"

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
        share/man/onevcenter.1.gz \
        share/man/oneflow.1.gz \
        share/man/oneflow-template.1.gz \
        share/man/oneprovision.1.gz \
        share/man/oneprovider.1.gz \
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
           share/doc/xsd/raftstatus.xsd
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
           share/doc/xsd/vmtemplate.xsd
           share/doc/xsd/vmtemplate_pool.xsd
           share/doc/xsd/vnet.xsd
           share/doc/xsd/vnet_pool.xsd
           share/doc/xsd/vntemplate.xsd
           share/doc/xsd/vntemplate_pool.xsd
           share/doc/xsd/vrouter.xsd
           share/doc/xsd/vrouter_pool.xsd
           share/doc/xsd/zone.xsd
           share/doc/xsd/zone_pool.xsd"

CONTEXT_SHARE=$(find share/context/ -type f \( ! -iname "*.sh" ! -iname "SConstruct" \))

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
elif [ "$ONEGATE_PROXY" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEGATE_PROXY_FILES[@]}"
elif [ "$SUNSTONE" = "yes" ]; then
  if [ "$SUNSTONE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_SUNSTONE_RUBY_FILES[@]} \
                 ${INSTALL_SUNSTONE_PUBLIC_MINIFIED_FILES[@]}
                 ${INSTALL_SUNSTONE_FILES[@]}"
  else
    INSTALL_SET="${INSTALL_SUNSTONE_RUBY_FILES[@]} \
                 ${INSTALL_SUNSTONE_PUBLIC_DEV_DIR[@]}
                 ${INSTALL_SUNSTONE_FILES[@]}"
  fi
elif [ "$FIREEDGE" = "yes" ]; then
  if [ "$FIREEDGE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_FIREEDGE_FILES[@]}"
  else
    INSTALL_SET="${INSTALL_FIREEDGE_DEV_DIRS[@]} \
                 ${INSTALL_FIREEDGE_FILES[@]}"
  fi
elif [ "$ONEFLOW" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEFLOW_FILES[@]}"
elif [ "$DOCKER_MACHINE" = "yes" ]; then
    INSTALL_SET="${INSTALL_DOCKER_MACHINE_FILES[@]}"
elif [ "$SUNSTONE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_SUNSTONE_FILES[@]} ${INSTALL_SUNSTONE_PUBLIC_MINIFIED_FILES[@]}\
                 ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEFLOW_FILES[@]} \
                 ${INSTALL_ONEHEM_FILES[@]} \
                 ${INSTALL_ONEPROVISION_FILES[@]} \
                 ${INSTALL_ONECFG_FILES[@]}"
elif [ "$FIREEDGE_DEV" = "no" ]; then
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_FIREEDGE_MINIFIED_DIRS[@]}\
                 ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEFLOW_FILES[@]} \
                 ${INSTALL_ONEHEM_FILES[@]} \
                 ${INSTALL_ONEPROVISION_FILES[@]} \
                 ${INSTALL_ONECFG_FILES[@]}"
else
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_SUNSTONE_FILES[@]} ${INSTALL_SUNSTONE_PUBLIC_DEV_DIR[@]}\
                 ${INSTALL_FIREEDGE_FILES[@]} ${INSTALL_FIREEDGE_DEV_DIRS[@]}\
                 ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEGATE_PROXY_FILES[@]} \
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
    if [ "$SUNSTONE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_SUNSTONE_ETC_FILES[@]}"
    elif [ "$FIREEDGE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_FIREEDGE_ETC_FILES[@]}"
    elif [ "$ONEGATE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEGATE_ETC_FILES[@]}"
    elif [ "$ONEGATE_PROXY" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEGATE_PROXY_ETC_FILES[@]}"
    elif [ "$ONEFLOW" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEFLOW_ETC_FILES[@]}"
    else
        INSTALL_ETC_SET="${INSTALL_ETC_FILES[@]} \
                         ${INSTALL_SUNSTONE_ETC_FILES[@]} \
                         ${INSTALL_FIREEDGE_ETC_FILES[@]} \
                         ${INSTALL_ONEGATE_ETC_FILES[@]} \
                         ${INSTALL_ONEGATE_PROXY_ETC_FILES[@]} \
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

# --- Set ownership or remove OpenNebula directories ---

if [ "$UNINSTALL" = "no" ] ; then
    if [ "$SUNSTONE" = "yes" ] || [ "$SUNSTONE_DEV" = "yes" ] ; then
        touch $DESTDIR$VAR_LOCATION/sunstone/main.js
        rm -f $DESTDIR$SUNSTONE_LOCATION/public/dist/main.js
        ln -s $VAR_LOCATION/sunstone/main.js $DESTDIR$SUNSTONE_LOCATION/public/dist/main.js
    fi
    for d in $CHOWN_DIRS; do
        chown -R $ONEADMIN_USER:$ONEADMIN_GROUP $DESTDIR$d
    done
else
    for d in `echo $DELETE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

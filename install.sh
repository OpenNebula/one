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
 echo "                  [-d ONE_LOCATION] [-c cli|ec2] [-r] [-h]"
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
 echo "-G: install OpenNebula Gate"
 echo "-f: install OpenNebula Flow"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

PARAMETERS="hkrlcsou:g:d:"

if [ $(getopt --version | tr -d " ") = "--" ]; then
    TEMP_OPT=`getopt $PARAMETERS "$@"`
else
    TEMP_OPT=`getopt -o $PARAMETERS -n 'install.sh' -- "$@"`
fi

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
CLIENT="no"
ONEGATE="no"
SUNSTONE="no"
ONEFLOW="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -k) INSTALL_ETC="no"   ; shift ;;
        -r) UNINSTALL="yes"   ; shift ;;
        -l) LINK="yes" ; shift ;;
        -c) CLIENT="yes"; INSTALL_ETC="no" ; shift ;;
        -G) ONEGATE="yes"; shift ;;
        -s) SUNSTONE="yes"; shift ;;
        -f) ONEFLOW="yes"; shift ;;
        -u) ONEADMIN_USER="$2" ; shift 2;;
        -g) ONEADMIN_GROUP="$2"; shift 2;;
        -d) ROOT="$2" ; shift 2 ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

#-------------------------------------------------------------------------------
# Definition of locations
#-------------------------------------------------------------------------------

CONF_LOCATION="$HOME/.one"

if [ -z "$ROOT" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    RUN_LOCATION="/var/run/one"
    LOCK_LOCATION="/var/lock/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/one"
    MAN_LOCATION="/usr/share/man/man1"
    VM_LOCATION="/var/lib/one/vms"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS=""

        CHOWN_DIRS=""
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION"

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
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
                   $SYSTEM_DS_LOCATION $DEFAULT_DS_LOCATION $MAN_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION"

        DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                     $RUN_LOCATION $SHARE_DIRS"

        CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION $LOCK_LOCATION"
    fi

else
    BIN_LOCATION="$ROOT/bin"
    LIB_LOCATION="$ROOT/lib"
    ETC_LOCATION="$ROOT/etc"
    VAR_LOCATION="$ROOT/var"
    ONEGATE_LOCATION="$LIB_LOCATION/onegate"
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
    ONEFLOW_LOCATION="$LIB_LOCATION/oneflow"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    INCLUDE_LOCATION="$ROOT/include"
    SHARE_LOCATION="$ROOT/share"
    MAN_LOCATION="$ROOT/share/man/man1"
    VM_LOCATION="$VAR_LOCATION/vms"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEGATE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $ONEGATE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$ONEFLOW" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $ONEFLOW_LOCATION \
                   $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    else
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $SYSTEM_DS_LOCATION \
                   $DEFAULT_DS_LOCATION $MAN_LOCATION \
                   $VM_LOCATION $ONEGATE_LOCATION $ONEFLOW_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS="$ROOT"
    fi

    CHOWN_DIRS="$ROOT"
fi

SHARE_DIRS="$SHARE_LOCATION/examples \
            $SHARE_LOCATION/websockify"

ETC_DIRS="$ETC_LOCATION/vmm_exec \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/auth \
          $ETC_LOCATION/auth/certificates \
          $ETC_LOCATION/ec2query_templates \
          $ETC_LOCATION/sunstone-views \
          $ETC_LOCATION/cli"

LIB_DIRS="$LIB_LOCATION/ruby \
          $LIB_LOCATION/ruby/opennebula \
          $LIB_LOCATION/ruby/cloud/ \
          $LIB_LOCATION/ruby/cloud/econe \
          $LIB_LOCATION/ruby/cloud/econe/views \
          $LIB_LOCATION/ruby/cloud/marketplace \
          $LIB_LOCATION/ruby/cloud/CloudAuth \
          $LIB_LOCATION/ruby/onedb \
          $LIB_LOCATION/ruby/onedb/shared \
          $LIB_LOCATION/ruby/onedb/local \
          $LIB_LOCATION/ruby/vendors \
          $LIB_LOCATION/ruby/vendors/rbvmomi \
          $LIB_LOCATION/ruby/vendors/rbvmomi/lib \
          $LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi \
          $LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi/utils \
          $LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi/vim \
          $LIB_LOCATION/mads \
          $LIB_LOCATION/sh \
          $LIB_LOCATION/ruby/cli \
          $LIB_LOCATION/ruby/cli/one_helper"

VAR_DIRS="$VAR_LOCATION/remotes \
          $VAR_LOCATION/remotes/im \
          $VAR_LOCATION/remotes/im/kvm.d \
          $VAR_LOCATION/remotes/im/xen3.d \
          $VAR_LOCATION/remotes/im/xen4.d \
          $VAR_LOCATION/remotes/im/kvm-probes.d \
          $VAR_LOCATION/remotes/im/xen3-probes.d \
          $VAR_LOCATION/remotes/im/xen4-probes.d \
          $VAR_LOCATION/remotes/im/vmware.d \
          $VAR_LOCATION/remotes/im/ec2.d \
          $VAR_LOCATION/remotes/im/sl.d \
          $VAR_LOCATION/remotes/im/az.d \
          $VAR_LOCATION/remotes/vmm \
          $VAR_LOCATION/remotes/vmm/kvm \
          $VAR_LOCATION/remotes/vmm/xen3 \
          $VAR_LOCATION/remotes/vmm/xen4 \
          $VAR_LOCATION/remotes/vmm/vmware \
          $VAR_LOCATION/remotes/vmm/ec2 \
          $VAR_LOCATION/remotes/vmm/sl \
          $VAR_LOCATION/remotes/vmm/az \
          $VAR_LOCATION/remotes/vnm \
          $VAR_LOCATION/remotes/vnm/802.1Q \
          $VAR_LOCATION/remotes/vnm/dummy \
          $VAR_LOCATION/remotes/vnm/ebtables \
          $VAR_LOCATION/remotes/vnm/fw \
          $VAR_LOCATION/remotes/vnm/ovswitch \
          $VAR_LOCATION/remotes/vnm/ovswitch_brcompat \
          $VAR_LOCATION/remotes/vnm/vmware \
          $VAR_LOCATION/remotes/tm/ \
          $VAR_LOCATION/remotes/tm/dummy \
          $VAR_LOCATION/remotes/tm/shared \
          $VAR_LOCATION/remotes/tm/fs_lvm \
          $VAR_LOCATION/remotes/tm/qcow2 \
          $VAR_LOCATION/remotes/tm/ssh \
          $VAR_LOCATION/remotes/tm/vmfs \
          $VAR_LOCATION/remotes/tm/lvm \
          $VAR_LOCATION/remotes/tm/ceph \
          $VAR_LOCATION/remotes/tm/dev \
          $VAR_LOCATION/remotes/hooks \
          $VAR_LOCATION/remotes/hooks/ft \
          $VAR_LOCATION/remotes/datastore \
          $VAR_LOCATION/remotes/datastore/dummy \
          $VAR_LOCATION/remotes/datastore/fs \
          $VAR_LOCATION/remotes/datastore/vmfs \
          $VAR_LOCATION/remotes/datastore/lvm \
          $VAR_LOCATION/remotes/datastore/ceph \
          $VAR_LOCATION/remotes/datastore/dev \
          $VAR_LOCATION/remotes/auth \
          $VAR_LOCATION/remotes/auth/plain \
          $VAR_LOCATION/remotes/auth/ssh \
          $VAR_LOCATION/remotes/auth/x509 \
          $VAR_LOCATION/remotes/auth/ldap \
          $VAR_LOCATION/remotes/auth/server_x509 \
          $VAR_LOCATION/remotes/auth/server_cipher \
          $VAR_LOCATION/remotes/auth/dummy"

SUNSTONE_DIRS="$SUNSTONE_LOCATION/routes \
               $SUNSTONE_LOCATION/models \
               $SUNSTONE_LOCATION/models/OpenNebulaJSON \
               $SUNSTONE_LOCATION/public \
               $SUNSTONE_LOCATION/public/js \
               $SUNSTONE_LOCATION/public/js/plugins \
               $SUNSTONE_LOCATION/public/js/user-plugins \
               $SUNSTONE_LOCATION/public/css \
               $SUNSTONE_LOCATION/public/locale \
               $SUNSTONE_LOCATION/public/locale/ca \
               $SUNSTONE_LOCATION/public/locale/cs_CZ \
               $SUNSTONE_LOCATION/public/locale/da \
               $SUNSTONE_LOCATION/public/locale/de \
               $SUNSTONE_LOCATION/public/locale/el_GR \
               $SUNSTONE_LOCATION/public/locale/en_US \
               $SUNSTONE_LOCATION/public/locale/es_ES \
               $SUNSTONE_LOCATION/public/locale/da \
               $SUNSTONE_LOCATION/public/locale/fa_IR \
               $SUNSTONE_LOCATION/public/locale/fr_FR \
               $SUNSTONE_LOCATION/public/locale/it_IT \
               $SUNSTONE_LOCATION/public/locale/nl_NL \
               $SUNSTONE_LOCATION/public/locale/pl \
               $SUNSTONE_LOCATION/public/locale/pt_BR \
               $SUNSTONE_LOCATION/public/locale/pt_PT \
               $SUNSTONE_LOCATION/public/locale/ru_RU \
               $SUNSTONE_LOCATION/public/locale/sk_SK \
               $SUNSTONE_LOCATION/public/locale/zh_TW \
               $SUNSTONE_LOCATION/public/locale/zh_CN \
               $SUNSTONE_LOCATION/public/vendor \
               $SUNSTONE_LOCATION/public/vendor/crypto-js \
               $SUNSTONE_LOCATION/public/vendor/explorercanvas \
               $SUNSTONE_LOCATION/public/vendor/flot \
               $SUNSTONE_LOCATION/public/vendor/fileuploader \
               $SUNSTONE_LOCATION/public/vendor/noVNC \
               $SUNSTONE_LOCATION/public/vendor/noVNC/web-socket-js \
               $SUNSTONE_LOCATION/public/vendor/4.0 \
               $SUNSTONE_LOCATION/public/vendor/4.0/datatables \
               $SUNSTONE_LOCATION/public/vendor/4.0/foundation_datatables \
               $SUNSTONE_LOCATION/public/vendor/4.0/jquery_layout \
               $SUNSTONE_LOCATION/public/vendor/4.0/fontawesome \
               $SUNSTONE_LOCATION/public/vendor/4.0/fontawesome/css \
               $SUNSTONE_LOCATION/public/vendor/4.0/fontawesome/fonts \
               $SUNSTONE_LOCATION/public/vendor/4.0/jgrowl \
               $SUNSTONE_LOCATION/public/vendor/4.0/foundation \
               $SUNSTONE_LOCATION/public/vendor/4.0/nouislider \
               $SUNSTONE_LOCATION/public/vendor/4.0/jdpicker_1.1 \
               $SUNSTONE_LOCATION/public/vendor/4.0/jdpicker_1.1/images \
               $SUNSTONE_LOCATION/public/images \
               $SUNSTONE_LOCATION/public/images/logos \
               $SUNSTONE_LOCATION/views"

ONEFLOW_DIRS="$ONEFLOW_LOCATION/lib \
              $ONEFLOW_LOCATION/lib/strategy \
              $ONEFLOW_LOCATION/lib/models"

LIB_ECO_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/opennebula \
                 $LIB_LOCATION/ruby/cloud/ \
                 $LIB_LOCATION/ruby/cloud/econe"

LIB_MARKET_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/opennebula \
                 $LIB_LOCATION/ruby/cloud/marketplace"

LIB_OCA_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/opennebula"

LIB_CLI_CLIENT_DIRS="$LIB_LOCATION/ruby/cli \
                     $LIB_LOCATION/ruby/cli/one_helper"

CONF_CLI_DIRS="$ETC_LOCATION/cli"

if [ "$CLIENT" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_ECO_CLIENT_DIRS $LIB_MARKET_CLIENT_DIRS \
               $LIB_OCA_CLIENT_DIRS $LIB_CLI_CLIENT_DIRS $CONF_CLI_DIRS \
               $ETC_LOCATION"
elif [ "$ONEGATE" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$SUNSTONE" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $SUNSTONE_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$ONEFLOW" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $ONEFLOW_DIRS $LIB_OCA_CLIENT_DIRS"
else
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS \
                $SUNSTONE_DIRS $ONEFLOW_DIRS"
fi

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# FILE DEFINITION, WHAT IS GOING TO BE INSTALLED AND WHERE
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
INSTALL_FILES=(
    BIN_FILES:$BIN_LOCATION
    INCLUDE_FILES:$INCLUDE_LOCATION
    LIB_FILES:$LIB_LOCATION
    RUBY_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_AUTH_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    MAD_RUBY_LIB_FILES:$LIB_LOCATION/ruby
    MAD_RUBY_LIB_FILES:$VAR_LOCATION/remotes
    MAD_SH_LIB_FILES:$LIB_LOCATION/sh
    MAD_SH_LIB_FILES:$VAR_LOCATION/remotes
    ONEDB_FILES:$LIB_LOCATION/ruby/onedb
    ONEDB_SHARED_MIGRATOR_FILES:$LIB_LOCATION/ruby/onedb/shared
    ONEDB_LOCAL_MIGRATOR_FILES:$LIB_LOCATION/ruby/onedb/local
    MADS_LIB_FILES:$LIB_LOCATION/mads
    IM_PROBES_FILES:$VAR_LOCATION/remotes/im
    IM_PROBES_KVM_FILES:$VAR_LOCATION/remotes/im/kvm.d
    IM_PROBES_KVM_PROBES_FILES:$VAR_LOCATION/remotes/im/kvm-probes.d
    IM_PROBES_XEN3_FILES:$VAR_LOCATION/remotes/im/xen3.d
    IM_PROBES_XEN3_PROBES_FILES:$VAR_LOCATION/remotes/im/xen3-probes.d
    IM_PROBES_XEN4_FILES:$VAR_LOCATION/remotes/im/xen4.d
    IM_PROBES_XEN4_PROBES_FILES:$VAR_LOCATION/remotes/im/xen4-probes.d
    IM_PROBES_VMWARE_FILES:$VAR_LOCATION/remotes/im/vmware.d
    IM_PROBES_EC2_FILES:$VAR_LOCATION/remotes/im/ec2.d
    IM_PROBES_SL_FILES:$VAR_LOCATION/remotes/im/sl.d
    IM_PROBES_AZ_FILES:$VAR_LOCATION/remotes/im/az.d
    IM_PROBES_VERSION:$VAR_LOCATION/remotes
    AUTH_SSH_FILES:$VAR_LOCATION/remotes/auth/ssh
    AUTH_X509_FILES:$VAR_LOCATION/remotes/auth/x509
    AUTH_LDAP_FILES:$VAR_LOCATION/remotes/auth/ldap
    AUTH_SERVER_X509_FILES:$VAR_LOCATION/remotes/auth/server_x509
    AUTH_SERVER_CIPHER_FILES:$VAR_LOCATION/remotes/auth/server_cipher
    AUTH_DUMMY_FILES:$VAR_LOCATION/remotes/auth/dummy
    AUTH_PLAIN_FILES:$VAR_LOCATION/remotes/auth/plain
    VMM_EXEC_KVM_SCRIPTS:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_XEN3_SCRIPTS:$VAR_LOCATION/remotes/vmm/xen3
    VMM_EXEC_XEN4_SCRIPTS:$VAR_LOCATION/remotes/vmm/xen4
    VMM_EXEC_VMWARE_SCRIPTS:$VAR_LOCATION/remotes/vmm/vmware
    VMM_EXEC_EC2_SCRIPTS:$VAR_LOCATION/remotes/vmm/ec2
    VMM_EXEC_SL_SCRIPTS:$VAR_LOCATION/remotes/vmm/sl
    VMM_EXEC_AZ_SCRIPTS:$VAR_LOCATION/remotes/vmm/az
    TM_FILES:$VAR_LOCATION/remotes/tm
    TM_SHARED_FILES:$VAR_LOCATION/remotes/tm/shared
    TM_FS_LVM_FILES:$VAR_LOCATION/remotes/tm/fs_lvm
    TM_QCOW2_FILES:$VAR_LOCATION/remotes/tm/qcow2
    TM_SSH_FILES:$VAR_LOCATION/remotes/tm/ssh
    TM_VMFS_FILES:$VAR_LOCATION/remotes/tm/vmfs
    TM_LVM_FILES:$VAR_LOCATION/remotes/tm/lvm
    TM_CEPH_FILES:$VAR_LOCATION/remotes/tm/ceph
    TM_DEV_FILES:$VAR_LOCATION/remotes/tm/dev
    TM_DUMMY_FILES:$VAR_LOCATION/remotes/tm/dummy
    DATASTORE_DRIVER_COMMON_SCRIPTS:$VAR_LOCATION/remotes/datastore/
    DATASTORE_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/datastore/dummy
    DATASTORE_DRIVER_FS_SCRIPTS:$VAR_LOCATION/remotes/datastore/fs
    DATASTORE_DRIVER_VMFS_SCRIPTS:$VAR_LOCATION/remotes/datastore/vmfs
    DATASTORE_DRIVER_LVM_SCRIPTS:$VAR_LOCATION/remotes/datastore/lvm
    DATASTORE_DRIVER_CEPH_SCRIPTS:$VAR_LOCATION/remotes/datastore/ceph
    DATASTORE_DRIVER_DEV_SCRIPTS:$VAR_LOCATION/remotes/datastore/dev
    NETWORK_FILES:$VAR_LOCATION/remotes/vnm
    NETWORK_8021Q_FILES:$VAR_LOCATION/remotes/vnm/802.1Q
    NETWORK_DUMMY_FILES:$VAR_LOCATION/remotes/vnm/dummy
    NETWORK_EBTABLES_FILES:$VAR_LOCATION/remotes/vnm/ebtables
    NETWORK_FW_FILES:$VAR_LOCATION/remotes/vnm/fw
    NETWORK_OVSWITCH_FILES:$VAR_LOCATION/remotes/vnm/ovswitch
    NETWORK_OVSWITCH_BRCOMPAT_FILES:$VAR_LOCATION/remotes/vnm/ovswitch_brcompat
    NETWORK_VMWARE_FILES:$VAR_LOCATION/remotes/vnm/vmware
    EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples
    WEBSOCKIFY_SHARE_FILES:$SHARE_LOCATION/websockify
    INSTALL_GEMS_SHARE_FILE:$SHARE_LOCATION
    HOOK_FT_FILES:$VAR_LOCATION/remotes/hooks/ft
    COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud
    CLOUD_AUTH_LIB_FILES:$LIB_LOCATION/ruby/cloud/CloudAuth
    ECO_LIB_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_LIB_VIEW_FILES:$LIB_LOCATION/ruby/cloud/econe/views
    ECO_BIN_FILES:$BIN_LOCATION
    MARKET_LIB_FILES:$LIB_LOCATION/ruby/cloud/marketplace
    MARKET_BIN_FILES:$BIN_LOCATION
    MAN_FILES:$MAN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    RBVMOMI_VENDOR_RUBY_FILES:$LIB_LOCATION/ruby/vendors/rbvmomi
    RBVMOMI_VENDOR_RUBY_LIB_FILES:$LIB_LOCATION/ruby/vendors/rbvmomi/lib
    RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_FILES:$LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi
    RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_VIM_FILES:$LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi/vim
    RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_UTILS_FILES:$LIB_LOCATION/ruby/vendors/rbvmomi/lib/rbvmomi/utils
)

INSTALL_CLIENT_FILES=(
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    ECO_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_BIN_CLIENT_FILES:$BIN_LOCATION
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    MARKET_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/marketplace
    MARKET_BIN_CLIENT_FILES:$BIN_LOCATION
    CLI_BIN_FILES:$BIN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    CLI_CONF_FILES:$ETC_LOCATION/cli
    OCA_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    RUBY_AUTH_LIB_FILES:$LIB_LOCATION/ruby/opennebula
)

INSTALL_SUNSTONE_RUBY_FILES=(
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/opennebula
    OCA_LIB_FILES:$LIB_LOCATION/ruby
)

INSTALL_SUNSTONE_FILES=(
    SUNSTONE_FILES:$SUNSTONE_LOCATION
    SUNSTONE_BIN_FILES:$BIN_LOCATION
    SUNSTONE_MODELS_FILES:$SUNSTONE_LOCATION/models
    SUNSTONE_MODELS_JSON_FILES:$SUNSTONE_LOCATION/models/OpenNebulaJSON
    SUNSTONE_VIEWS_FILES:$SUNSTONE_LOCATION/views
    SUNSTONE_PUBLIC_JS_FILES:$SUNSTONE_LOCATION/public/js
    SUNSTONE_PUBLIC_JS_PLUGINS_FILES:$SUNSTONE_LOCATION/public/js/plugins
    SUNSTONE_ROUTES_FILES:$SUNSTONE_LOCATION/routes
    SUNSTONE_PUBLIC_CSS_FILES:$SUNSTONE_LOCATION/public/css
    SUNSTONE_PUBLIC_VENDOR_CRYPTOJS:$SUNSTONE_LOCATION/public/vendor/crypto-js
    SUNSTONE_PUBLIC_VENDOR_EXPLORERCANVAS:$SUNSTONE_LOCATION/public/vendor/explorercanvas
    SUNSTONE_PUBLIC_VENDOR_FLOT:$SUNSTONE_LOCATION/public/vendor/flot
    SUNSTONE_PUBLIC_VENDOR_FILEUPLOADER:$SUNSTONE_LOCATION/public/vendor/fileuploader
    SUNSTONE_PUBLIC_VENDOR_NOVNC:$SUNSTONE_LOCATION/public/vendor/noVNC
    SUNSTONE_PUBLIC_VENDOR_NOVNC_WEBSOCKET:$SUNSTONE_LOCATION/public/vendor/noVNC/web-socket-js
    SUNSTONE_PUBLIC_NEW_VENDOR_DATATABLES:$SUNSTONE_LOCATION/public/vendor/4.0/datatables
    SUNSTONE_PUBLIC_NEW_VENDOR_FOUNDATION_DATATABLES:$SUNSTONE_LOCATION/public/vendor/4.0/foundation_datatables
    SUNSTONE_PUBLIC_NEW_VENDOR_JGROWL:$SUNSTONE_LOCATION/public/vendor/4.0/jgrowl
    SUNSTONE_PUBLIC_NEW_VENDOR_JQUERY:$SUNSTONE_LOCATION/public/vendor/4.0/
    SUNSTONE_PUBLIC_NEW_VENDOR_FOUNDATION:$SUNSTONE_LOCATION/public/vendor/4.0/foundation
    SUNSTONE_PUBLIC_NEW_VENDOR_JQUERYLAYOUT:$SUNSTONE_LOCATION/public/vendor/4.0/jquery_layout
    SUNSTONE_PUBLIC_NEW_VENDOR_FONTAWESOME:$SUNSTONE_LOCATION/public/vendor/4.0/fontawesome
    SUNSTONE_PUBLIC_NEW_VENDOR_FONTAWESOME_FONT:$SUNSTONE_LOCATION/public/vendor/4.0/fontawesome/fonts
    SUNSTONE_PUBLIC_NEW_VENDOR_FONTAWESOME_CSS:$SUNSTONE_LOCATION/public/vendor/4.0/fontawesome/css
    SUNSTONE_PUBLIC_NEW_VENDOR_NOUISLIDER:$SUNSTONE_LOCATION/public/vendor/4.0/nouislider
    SUNSTONE_PUBLIC_NEW_VENDOR_JDPICKER:$SUNSTONE_LOCATION/public/vendor/4.0/jdpicker_1.1
    SUNSTONE_PUBLIC_NEW_VENDOR_JDPICKER_IMAGES:$SUNSTONE_LOCATION/public/vendor/4.0/jdpicker_1.1/images
    SUNSTONE_PUBLIC_IMAGES_FILES:$SUNSTONE_LOCATION/public/images
    SUNSTONE_PUBLIC_LOGOS_FILES:$SUNSTONE_LOCATION/public/images/logos
    SUNSTONE_PUBLIC_LOCALE_CA:$SUNSTONE_LOCATION/public/locale/ca
    SUNSTONE_PUBLIC_LOCALE_CS_CZ:$SUNSTONE_LOCATION/public/locale/cs_CZ
    SUNSTONE_PUBLIC_LOCALE_DE:$SUNSTONE_LOCATION/public/locale/de
    SUNSTONE_PUBLIC_LOCALE_DA:$SUNSTONE_LOCATION/public/locale/da
    SUNSTONE_PUBLIC_LOCALE_EL_GR:$SUNSTONE_LOCATION/public/locale/el_GR
    SUNSTONE_PUBLIC_LOCALE_EN_US:$SUNSTONE_LOCATION/public/locale/en_US
    SUNSTONE_PUBLIC_LOCALE_ES_ES:$SUNSTONE_LOCATION/public/locale/es_ES
    SUNSTONE_PUBLIC_LOCALE_FA_IR:$SUNSTONE_LOCATION/public/locale/fa_IR
    SUNSTONE_PUBLIC_LOCALE_FR_FR:$SUNSTONE_LOCATION/public/locale/fr_FR
    SUNSTONE_PUBLIC_LOCALE_IT_IT:$SUNSTONE_LOCATION/public/locale/it_IT
    SUNSTONE_PUBLIC_LOCALE_NL_NL:$SUNSTONE_LOCATION/public/locale/nl_NL
    SUNSTONE_PUBLIC_LOCALE_PL:$SUNSTONE_LOCATION/public/locale/pl
    SUNSTONE_PUBLIC_LOCALE_PT_PT:$SUNSTONE_LOCATION/public/locale/pt_PT
    SUNSTONE_PUBLIC_LOCALE_PT_BR:$SUNSTONE_LOCATION/public/locale/pt_BR
    SUNSTONE_PUBLIC_LOCALE_RU_RU:$SUNSTONE_LOCATION/public/locale/ru_RU
    SUNSTONE_PUBLIC_LOCALE_SK_SK:$SUNSTONE_LOCATION/public/locale/sk_SK
    SUNSTONE_PUBLIC_LOCALE_ZH_CN:$SUNSTONE_LOCATION/public/locale/zh_CN
    SUNSTONE_PUBLIC_LOCALE_ZH_TW:$SUNSTONE_LOCATION/public/locale/zh_TW
)

INSTALL_SUNSTONE_ETC_FILES=(
    SUNSTONE_ETC_FILES:$ETC_LOCATION
    SUNSTONE_ETC_VIEW_FILES:$ETC_LOCATION/sunstone-views
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

INSTALL_ETC_FILES=(
    ETC_FILES:$ETC_LOCATION
    VMWARE_ETC_FILES:$ETC_LOCATION
    EC2_ETC_FILES:$ETC_LOCATION
    SL_ETC_FILES:$ETC_LOCATION
    AZ_ETC_FILES:$ETC_LOCATION
    VMM_EXEC_ETC_FILES:$ETC_LOCATION/vmm_exec
    HM_ETC_FILES:$ETC_LOCATION/hm
    AUTH_ETC_FILES:$ETC_LOCATION/auth
    ECO_ETC_FILES:$ETC_LOCATION
    ECO_ETC_TEMPLATE_FILES:$ETC_LOCATION/ec2query_templates
    CLI_CONF_FILES:$ETC_LOCATION/cli
)

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/scheduler/src/sched/mm_sched \
           src/cli/onevm \
           src/cli/oneacct \
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
           src/onedb/onedb \
           src/mad/utils/tty_expect \
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
                src/mad/ruby/CommandManager.rb \
                src/mad/ruby/OpenNebulaDriver.rb \
                src/mad/ruby/VirtualMachineDriver.rb \
                src/mad/ruby/DriverExecHelper.rb \
                src/mad/ruby/ssh_stream.rb \
                src/vnm_mad/one_vnm.rb \
                src/oca/ruby/deprecated/OpenNebula.rb \
                src/oca/ruby/opennebula.rb \
                src/sunstone/OpenNebulaVNC.rb"

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

MAD_SH_LIB_FILES="src/mad/sh/scripts_common.sh"
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
              src/im_mad/dummy/one_im_dummy.rb \
              src/im_mad/dummy/one_im_dummy \
              src/im_mad/collectd/collectd \
              src/tm_mad/one_tm \
              src/tm_mad/one_tm.rb \
              src/hm_mad/one_hm.rb \
              src/hm_mad/one_hm \
              src/authm_mad/one_auth_mad.rb \
              src/authm_mad/one_auth_mad \
              src/datastore_mad/one_datastore.rb \
              src/datastore_mad/one_datastore"

#-------------------------------------------------------------------------------
# VMM SH Driver KVM scripts, to be installed under $REMOTES_LOCATION/vmm/kvm
#-------------------------------------------------------------------------------

VMM_EXEC_KVM_SCRIPTS="src/vmm_mad/remotes/kvm/cancel \
                    src/vmm_mad/remotes/kvm/deploy \
                    src/vmm_mad/remotes/kvm/kvmrc \
                    src/vmm_mad/remotes/kvm/migrate \
                    src/vmm_mad/remotes/kvm/migrate_local \
                    src/vmm_mad/remotes/kvm/restore \
                    src/vmm_mad/remotes/kvm/reboot \
                    src/vmm_mad/remotes/kvm/reset \
                    src/vmm_mad/remotes/kvm/save \
                    src/vmm_mad/remotes/kvm/poll \
                    src/vmm_mad/remotes/kvm/attach_disk \
                    src/vmm_mad/remotes/kvm/detach_disk \
                    src/vmm_mad/remotes/kvm/attach_nic \
                    src/vmm_mad/remotes/kvm/detach_nic \
                    src/vmm_mad/remotes/kvm/snapshot_create \
                    src/vmm_mad/remotes/kvm/snapshot_revert \
                    src/vmm_mad/remotes/kvm/snapshot_delete \
                    src/vmm_mad/remotes/kvm/shutdown"

#-------------------------------------------------------------------------------
# VMM SH Driver Xen scripts, to be installed under $REMOTES_LOCATION/vmm/xen
#-------------------------------------------------------------------------------

VMM_EXEC_XEN3_SCRIPTS="src/vmm_mad/remotes/xen/cancel \
                    src/vmm_mad/remotes/xen/deploy \
                    src/vmm_mad/remotes/xen/xen3/xenrc \
                    src/vmm_mad/remotes/xen/xen3/migrate \
                    src/vmm_mad/remotes/xen/restore \
                    src/vmm_mad/remotes/xen/reboot \
                    src/vmm_mad/remotes/xen/reset \
                    src/vmm_mad/remotes/xen/save \
                    src/vmm_mad/remotes/xen/poll \
                    src/vmm_mad/remotes/xen/attach_disk \
                    src/vmm_mad/remotes/xen/detach_disk \
                    src/vmm_mad/remotes/xen/attach_nic \
                    src/vmm_mad/remotes/xen/detach_nic \
                    src/vmm_mad/remotes/xen/snapshot_create \
                    src/vmm_mad/remotes/xen/snapshot_revert \
                    src/vmm_mad/remotes/xen/snapshot_delete \
                    src/vmm_mad/remotes/xen/shutdown"

VMM_EXEC_XEN4_SCRIPTS="src/vmm_mad/remotes/xen/cancel \
                    src/vmm_mad/remotes/xen/deploy \
                    src/vmm_mad/remotes/xen/xen4/xenrc \
                    src/vmm_mad/remotes/xen/xen4/migrate \
                    src/vmm_mad/remotes/xen/restore \
                    src/vmm_mad/remotes/xen/reboot \
                    src/vmm_mad/remotes/xen/reset \
                    src/vmm_mad/remotes/xen/save \
                    src/vmm_mad/remotes/xen/poll \
                    src/vmm_mad/remotes/xen/attach_disk \
                    src/vmm_mad/remotes/xen/detach_disk \
                    src/vmm_mad/remotes/xen/attach_nic \
                    src/vmm_mad/remotes/xen/detach_nic \
                    src/vmm_mad/remotes/xen/snapshot_create \
                    src/vmm_mad/remotes/xen/snapshot_revert \
                    src/vmm_mad/remotes/xen/snapshot_delete \
                    src/vmm_mad/remotes/xen/shutdown"
#-------------------------------------------------------------------------------
# VMM Driver VMWARE scripts, to be installed under $REMOTES_LOCATION/vmm/vmware
#-------------------------------------------------------------------------------

VMM_EXEC_VMWARE_SCRIPTS="src/vmm_mad/remotes/vmware/cancel \
                         src/vmm_mad/remotes/vmware/attach_disk \
                         src/vmm_mad/remotes/vmware/detach_disk \
                         src/vmm_mad/remotes/vmware/attach_nic \
                         src/vmm_mad/remotes/vmware/detach_nic \
                         src/vmm_mad/remotes/vmware/snapshot_create \
                         src/vmm_mad/remotes/vmware/snapshot_revert \
                         src/vmm_mad/remotes/vmware/snapshot_delete \
                         src/vmm_mad/remotes/vmware/scripts_common_sh.sh \
                         src/vmm_mad/remotes/vmware/deploy \
                         src/vmm_mad/remotes/vmware/migrate \
                         src/vmm_mad/remotes/vmware/restore \
                         src/vmm_mad/remotes/vmware/reboot \
                         src/vmm_mad/remotes/vmware/reset \
                         src/vmm_mad/remotes/vmware/save \
                         src/vmm_mad/remotes/vmware/poll \
                         src/vmm_mad/remotes/vmware/checkpoint \
                         src/vmm_mad/remotes/vmware/shutdown \
                         src/vmm_mad/remotes/vmware/vmware_driver.rb \
                         src/vmm_mad/remotes/vmware/vi_driver.rb"

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
                      src/vmm_mad/remotes/ec2/poll \
                      src/vmm_mad/remotes/ec2/shutdown \
                      src/vmm_mad/remotes/ec2/ec2_driver.rb"

#------------------------------------------------------------------------------
# VMM Driver SoftLayer scripts, to be installed under $REMOTES_LOCATION/vmm/sl
#------------------------------------------------------------------------------

VMM_EXEC_SL_SCRIPTS="src/vmm_mad/remotes/sl/cancel \
                     src/vmm_mad/remotes/sl/attach_disk \
                     src/vmm_mad/remotes/sl/detach_disk \
                     src/vmm_mad/remotes/sl/attach_nic \
                     src/vmm_mad/remotes/sl/detach_nic \
                     src/vmm_mad/remotes/sl/snapshot_create \
                     src/vmm_mad/remotes/sl/snapshot_revert \
                     src/vmm_mad/remotes/sl/snapshot_delete \
                     src/vmm_mad/remotes/sl/deploy \
                     src/vmm_mad/remotes/sl/migrate \
                     src/vmm_mad/remotes/sl/restore \
                     src/vmm_mad/remotes/sl/reboot \
                     src/vmm_mad/remotes/sl/reset \
                     src/vmm_mad/remotes/sl/save \
                     src/vmm_mad/remotes/sl/poll \
                     src/vmm_mad/remotes/sl/shutdown \
                     src/vmm_mad/remotes/sl/sl_driver.rb"

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
                     src/vmm_mad/remotes/az/poll \
                     src/vmm_mad/remotes/az/shutdown \
                     src/vmm_mad/remotes/az/az_driver.rb"

#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $REMOTES_LOCATION/im
#-------------------------------------------------------------------------------

IM_PROBES_FILES="src/im_mad/remotes/run_probes \
                 src/im_mad/remotes/stop_probes"

IM_PROBES_KVM_FILES="src/im_mad/remotes/kvm.d/collectd-client_control.sh \
                     src/im_mad/remotes/kvm.d/collectd-client.rb"

IM_PROBES_KVM_PROBES_FILES="src/im_mad/remotes/kvm-probes.d/kvm.rb \
                     src/im_mad/remotes/kvm-probes.d/architecture.sh \
                     src/im_mad/remotes/kvm-probes.d/cpu.sh \
                     src/im_mad/remotes/kvm-probes.d/poll.sh \
                     src/im_mad/remotes/kvm-probes.d/name.sh \
                     src/im_mad/remotes/common.d/monitor_ds.sh \
                     src/im_mad/remotes/common.d/version.sh \
                     src/im_mad/remotes/common.d/collectd-client-shepherd.sh"

IM_PROBES_XEN3_FILES="src/im_mad/remotes/xen.d/collectd-client_control.sh \
                      src/im_mad/remotes/xen.d/collectd-client.rb"

IM_PROBES_XEN3_PROBES_FILES="src/im_mad/remotes/xen-probes.d/xen.rb \
                      src/im_mad/remotes/xen-probes.d/architecture.sh \
                      src/im_mad/remotes/xen-probes.d/cpu.sh \
                      src/im_mad/remotes/xen-probes.d/poll3.sh \
                      src/im_mad/remotes/xen-probes.d/name.sh
                      src/im_mad/remotes/common.d/monitor_ds.sh \
                      src/im_mad/remotes/common.d/version.sh \
                      src/im_mad/remotes/common.d/collectd-client-shepherd.sh"

IM_PROBES_XEN4_FILES="src/im_mad/remotes/xen.d/collectd-client_control.sh \
                      src/im_mad/remotes/xen.d/collectd-client.rb"

IM_PROBES_XEN4_PROBES_FILES="src/im_mad/remotes/xen-probes.d/xen.rb \
                      src/im_mad/remotes/xen-probes.d/architecture.sh \
                      src/im_mad/remotes/xen-probes.d/cpu.sh \
                      src/im_mad/remotes/xen-probes.d/poll4.sh \
                      src/im_mad/remotes/xen-probes.d/name.sh \
                      src/im_mad/remotes/common.d/monitor_ds.sh \
                      src/im_mad/remotes/common.d/version.sh \
                      src/im_mad/remotes/common.d/collectd-client-shepherd.sh"

IM_PROBES_VMWARE_FILES="src/im_mad/remotes/vmware.d/vmware.rb"

IM_PROBES_EC2_FILES="src/im_mad/remotes/ec2.d/poll"

IM_PROBES_SL_FILES="src/im_mad/remotes/sl.d/poll"
IM_PROBES_AZ_FILES="src/im_mad/remotes/az.d/poll"

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

NETWORK_FILES="src/vnm_mad/remotes/OpenNebulaNetwork.rb \
               src/vnm_mad/remotes/OpenNebulaNetwork.conf \
               src/vnm_mad/remotes/Firewall.rb \
               src/vnm_mad/remotes/OpenNebulaNic.rb"

NETWORK_8021Q_FILES="src/vnm_mad/remotes/802.1Q/clean \
                    src/vnm_mad/remotes/802.1Q/post \
                    src/vnm_mad/remotes/802.1Q/pre \
                    src/vnm_mad/remotes/802.1Q/HostManaged.rb"

NETWORK_DUMMY_FILES="src/vnm_mad/remotes/dummy/clean \
                    src/vnm_mad/remotes/dummy/post \
                    src/vnm_mad/remotes/dummy/pre"

NETWORK_EBTABLES_FILES="src/vnm_mad/remotes/ebtables/clean \
                    src/vnm_mad/remotes/ebtables/post \
                    src/vnm_mad/remotes/ebtables/pre \
                    src/vnm_mad/remotes/ebtables/Ebtables.rb"

NETWORK_FW_FILES="src/vnm_mad/remotes/fw/post \
                          src/vnm_mad/remotes/fw/pre \
                          src/vnm_mad/remotes/fw/clean"

NETWORK_OVSWITCH_FILES="src/vnm_mad/remotes/ovswitch/clean \
                    src/vnm_mad/remotes/ovswitch/post \
                    src/vnm_mad/remotes/ovswitch/pre \
                    src/vnm_mad/remotes/ovswitch/OpenvSwitch.rb"

NETWORK_OVSWITCH_BRCOMPAT_FILES="src/vnm_mad/remotes/ovswitch_brcompat/clean \
                    src/vnm_mad/remotes/ovswitch_brcompat/post \
                    src/vnm_mad/remotes/ovswitch_brcompat/pre \
                    src/vnm_mad/remotes/ovswitch_brcompat/OpenvSwitch.rb"

NETWORK_VMWARE_FILES="src/vnm_mad/remotes/vmware/clean \
                    src/vnm_mad/remotes/vmware/post \
                    src/vnm_mad/remotes/vmware/pre \
                    src/vnm_mad/remotes/vmware/VMware.rb"

#-------------------------------------------------------------------------------
# Transfer Manager commands, to be installed under $LIB_LOCATION/tm_commands
#   - SHARED TM, $VAR_LOCATION/tm/shared
#   - FS_LVM TM, $VAR_LOCATION/tm/fs_lvm
#   - QCOW2 TM, $VAR_LOCATION/tm/qcow2
#   - SSH TM, $VAR_LOCATION/tm/ssh
#   - DUMMY TM, $VAR_LOCATION/tm/dummy
#   - VMWARE TM, $VAR_LOCATION/tm/vmware
#   - LVM TM, $VAR_LOCATION/tm/lvm
#   - CEPH TM, $VAR_LOCATION/tm/ceph
#   - DEV TM, $VAR_LOCATION/tm/dev
#-------------------------------------------------------------------------------

TM_FILES="src/tm_mad/tm_common.sh"

TM_SHARED_FILES="src/tm_mad/shared/clone \
                 src/tm_mad/shared/delete \
                 src/tm_mad/shared/ln \
                 src/tm_mad/shared/mkswap \
                 src/tm_mad/shared/mkimage \
                 src/tm_mad/shared/mv \
                 src/tm_mad/shared/context \
                 src/tm_mad/shared/premigrate \
                 src/tm_mad/shared/postmigrate \
                 src/tm_mad/shared/mvds \
                 src/tm_mad/shared/cpds"

TM_FS_LVM_FILES="src/tm_mad/fs_lvm/clone \
                 src/tm_mad/fs_lvm/ln \
                 src/tm_mad/fs_lvm/mv \
                 src/tm_mad/fs_lvm/mvds \
                 src/tm_mad/fs_lvm/cpds \
                 src/tm_mad/fs_lvm/premigrate \
                 src/tm_mad/fs_lvm/postmigrate \
                 src/tm_mad/fs_lvm/delete"

TM_QCOW2_FILES="src/tm_mad/qcow2/clone \
                 src/tm_mad/qcow2/delete \
                 src/tm_mad/qcow2/ln \
                 src/tm_mad/qcow2/mkswap \
                 src/tm_mad/qcow2/mkimage \
                 src/tm_mad/qcow2/mv \
                 src/tm_mad/qcow2/context \
                 src/tm_mad/qcow2/premigrate \
                 src/tm_mad/qcow2/postmigrate \
                 src/tm_mad/qcow2/mvds \
                 src/tm_mad/qcow2/cpds"

TM_SSH_FILES="src/tm_mad/ssh/clone \
              src/tm_mad/ssh/delete \
              src/tm_mad/ssh/ln \
              src/tm_mad/ssh/mkswap \
              src/tm_mad/ssh/mkimage \
              src/tm_mad/ssh/mv \
              src/tm_mad/ssh/context \
              src/tm_mad/ssh/premigrate \
              src/tm_mad/ssh/postmigrate \
              src/tm_mad/ssh/mvds \
              src/tm_mad/ssh/cpds"

TM_DUMMY_FILES="src/tm_mad/dummy/clone \
              src/tm_mad/dummy/delete \
              src/tm_mad/dummy/ln \
              src/tm_mad/dummy/mkswap \
              src/tm_mad/dummy/mkimage \
              src/tm_mad/dummy/mv \
              src/tm_mad/dummy/context \
              src/tm_mad/dummy/premigrate \
              src/tm_mad/dummy/postmigrate \
              src/tm_mad/dummy/mvds \
              src/tm_mad/dummy/cpds"

TM_VMFS_FILES="src/tm_mad/vmfs/clone \
                 src/tm_mad/vmfs/delete
                 src/tm_mad/vmfs/ln \
                 src/tm_mad/vmfs/mkswap \
                 src/tm_mad/vmfs/mkimage \
                 src/tm_mad/vmfs/mv \
                 src/tm_mad/vmfs/context \
                 src/tm_mad/vmfs/mvds \
                 src/tm_mad/vmfs/cpds \
                 src/tm_mad/vmfs/postmigrate \
                 src/tm_mad/vmfs/premigrate"

TM_LVM_FILES="src/tm_mad/lvm/clone \
                 src/tm_mad/lvm/ln \
                 src/tm_mad/lvm/mv \
                 src/tm_mad/lvm/mvds \
                 src/tm_mad/lvm/cpds \
                 src/tm_mad/lvm/premigrate \
                 src/tm_mad/lvm/postmigrate \
                 src/tm_mad/lvm/delete"

TM_CEPH_FILES="src/tm_mad/ceph/clone \
                 src/tm_mad/ceph/ln \
                 src/tm_mad/ceph/mv \
                 src/tm_mad/ceph/mvds \
                 src/tm_mad/ceph/cpds \
                 src/tm_mad/ceph/premigrate \
                 src/tm_mad/ceph/postmigrate \
                 src/tm_mad/ceph/delete"

TM_DEV_FILES="src/tm_mad/dev/clone \
                 src/tm_mad/dev/ln \
                 src/tm_mad/dev/mv \
                 src/tm_mad/dev/mvds \
                 src/tm_mad/dev/cpds \
                 src/tm_mad/dev/premigrate \
                 src/tm_mad/dev/postmigrate \
                 src/tm_mad/dev/delete"

#-------------------------------------------------------------------------------
# Datastore drivers, to be installed under $REMOTES_LOCATION/datastore
#   - Dummy Image Repository, $REMOTES_LOCATION/datastore/dummy
#   - FS based Image Repository, $REMOTES_LOCATION/datastore/fs
#   - VMFS based Image Repository, $REMOTES_LOCATION/datastore/vmfs
#   - LVM based Image Repository, $REMOTES_LOCATION/datastore/lvm
#-------------------------------------------------------------------------------

DATASTORE_DRIVER_COMMON_SCRIPTS="src/datastore_mad/remotes/xpath.rb \
                             src/datastore_mad/remotes/downloader.sh \
                             src/datastore_mad/remotes/libfs.sh"

DATASTORE_DRIVER_DUMMY_SCRIPTS="src/datastore_mad/remotes/dummy/cp \
                         src/datastore_mad/remotes/dummy/mkfs \
                         src/datastore_mad/remotes/dummy/stat \
                         src/datastore_mad/remotes/dummy/clone \
                         src/datastore_mad/remotes/dummy/monitor \
                         src/datastore_mad/remotes/dummy/rm"

DATASTORE_DRIVER_FS_SCRIPTS="src/datastore_mad/remotes/fs/cp \
                         src/datastore_mad/remotes/fs/mkfs \
                         src/datastore_mad/remotes/fs/stat \
                         src/datastore_mad/remotes/fs/clone \
                         src/datastore_mad/remotes/fs/monitor \
                         src/datastore_mad/remotes/fs/rm"

DATASTORE_DRIVER_VMFS_SCRIPTS="src/datastore_mad/remotes/vmfs/cp \
                         src/datastore_mad/remotes/vmfs/mkfs \
                         src/datastore_mad/remotes/vmfs/stat \
                         src/datastore_mad/remotes/vmfs/clone \
                         src/datastore_mad/remotes/vmfs/monitor \
                         src/datastore_mad/remotes/vmfs/rm \
                         src/datastore_mad/remotes/vmfs/vmfs.conf"

DATASTORE_DRIVER_LVM_SCRIPTS="src/datastore_mad/remotes/lvm/cp \
                         src/datastore_mad/remotes/lvm/mkfs \
                         src/datastore_mad/remotes/lvm/stat \
                         src/datastore_mad/remotes/lvm/rm \
                         src/datastore_mad/remotes/lvm/monitor \
                         src/datastore_mad/remotes/lvm/clone \
                         src/datastore_mad/remotes/lvm/lvm.conf"

DATASTORE_DRIVER_CEPH_SCRIPTS="src/datastore_mad/remotes/ceph/cp \
                         src/datastore_mad/remotes/ceph/mkfs \
                         src/datastore_mad/remotes/ceph/stat \
                         src/datastore_mad/remotes/ceph/rm \
                         src/datastore_mad/remotes/ceph/monitor \
                         src/datastore_mad/remotes/ceph/clone \
                         src/datastore_mad/remotes/ceph/ceph.conf"

DATASTORE_DRIVER_DEV_SCRIPTS="src/datastore_mad/remotes/dev/cp \
                         src/datastore_mad/remotes/dev/mkfs \
                         src/datastore_mad/remotes/dev/stat \
                         src/datastore_mad/remotes/dev/rm \
                         src/datastore_mad/remotes/dev/monitor \
                         src/datastore_mad/remotes/dev/clone"

#-------------------------------------------------------------------------------
# Migration scripts for onedb command, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------


ONEDB_FILES="src/onedb/fsck.rb \
            src/onedb/import_slave.rb \
            src/onedb/onedb.rb \
            src/onedb/onedb_backend.rb"

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
                             src/onedb/shared/4.5.80_to_4.6.0.rb"

ONEDB_LOCAL_MIGRATOR_FILES="src/onedb/local/4.5.80_to_4.7.80.rb"

#-------------------------------------------------------------------------------
# Configuration files for OpenNebula, to be installed under $ETC_LOCATION
#-------------------------------------------------------------------------------

ETC_FILES="share/etc/oned.conf \
           share/etc/defaultrc \
           src/scheduler/etc/sched.conf"

VMWARE_ETC_FILES="src/vmm_mad/remotes/vmware/vmwarerc"

EC2_ETC_FILES="src/vmm_mad/remotes/ec2/ec2_driver.conf \
               src/vmm_mad/remotes/ec2/ec2_driver.default"

SL_ETC_FILES="src/vmm_mad/remotes/sl/sl_driver.conf \
              src/vmm_mad/remotes/sl/sl_driver.default"

AZ_ETC_FILES="src/vmm_mad/remotes/az/az_driver.conf \
              src/vmm_mad/remotes/az/az_driver.default"


#-------------------------------------------------------------------------------
# Virtualization drivers config. files, to be installed under $ETC_LOCATION
#   - ssh, $ETC_LOCATION/vmm_exec
#-------------------------------------------------------------------------------


VMM_EXEC_ETC_FILES="src/vmm_mad/exec/vmm_execrc \
                  src/vmm_mad/exec/vmm_exec_kvm.conf \
                  src/vmm_mad/exec/vmm_exec_xen3.conf \
                  src/vmm_mad/exec/vmm_exec_xen4.conf \
                  src/vmm_mad/exec/vmm_exec_vmware.conf"

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
# Files required to interact with the websockify server
#-------------------------------------------------------------------------------

WEBSOCKIFY_SHARE_FILES="share/websockify/websocketproxy.py \
                        share/websockify/websocket.py \
                        share/websockify/websockify"

#-------------------------------------------------------------------------------
# HOOK scripts, to be installed under $VAR_LOCATION/remotes/hooks
#-------------------------------------------------------------------------------

HOOK_FT_FILES="share/hooks/host_error.rb"

#-------------------------------------------------------------------------------
# Installation scripts, to be installed under $SHARE_LOCATION
#-------------------------------------------------------------------------------

INSTALL_GEMS_SHARE_FILE="share/install_gems/install_gems"

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
                            src/oca/ruby/opennebula/pool_element.rb \
                            src/oca/ruby/opennebula/pool.rb \
                            src/oca/ruby/opennebula/system.rb \
                            src/oca/ruby/opennebula/template_pool.rb \
                            src/oca/ruby/opennebula/template.rb \
                            src/oca/ruby/opennebula/user_pool.rb \
                            src/oca/ruby/opennebula/user.rb \
                            src/oca/ruby/opennebula/zone_pool.rb \
                            src/oca/ruby/opennebula/zone.rb \
                            src/oca/ruby/opennebula/virtual_machine_pool.rb \
                            src/oca/ruby/opennebula/virtual_machine.rb \
                            src/oca/ruby/opennebula/virtual_network_pool.rb \
                            src/oca/ruby/opennebula/virtual_network.rb \
                            src/oca/ruby/opennebula/xml_element.rb \
                            src/oca/ruby/opennebula/xml_pool.rb \
                            src/oca/ruby/opennebula/xml_utils.rb \
                            src/oca/ruby/opennebula/oneflow_client.rb"

#-------------------------------------------------------------------------------
# Common Cloud Files
#-------------------------------------------------------------------------------

COMMON_CLOUD_LIB_FILES="src/cloud/common/CloudServer.rb \
                        src/cloud/common/CloudClient.rb \
                        src/cloud/common/CloudAuth.rb"

COMMON_CLOUD_CLIENT_LIB_FILES="src/cloud/common/CloudClient.rb"

CLOUD_AUTH_LIB_FILES="src/cloud/common/CloudAuth/SunstoneCloudAuth.rb \
                      src/cloud/common/CloudAuth/EC2CloudAuth.rb \
                      src/cloud/common/CloudAuth/X509CloudAuth.rb \
                      src/cloud/common/CloudAuth/OneGateCloudAuth.rb \
                      src/cloud/common/CloudAuth/OpenNebulaCloudAuth.rb"

#-------------------------------------------------------------------------------
# EC2 Query for OpenNebula
#-------------------------------------------------------------------------------

ECO_LIB_FILES="src/cloud/ec2/lib/EC2QueryClient.rb \
               src/cloud/ec2/lib/EC2QueryServer.rb \
               src/cloud/ec2/lib/ImageEC2.rb \
               src/cloud/ec2/lib/elastic_ip.rb \
               src/cloud/ec2/lib/ebs.rb \
               src/cloud/ec2/lib/tags.rb \
               src/cloud/ec2/lib/instance.rb \
               src/cloud/ec2/lib/keypair.rb \
               src/cloud/ec2/lib/net_ssh_replacement.rb \
               src/cloud/ec2/lib/econe_application.rb \
               src/cloud/ec2/lib/econe-server.rb"

ECO_LIB_CLIENT_FILES="src/cloud/ec2/lib/EC2QueryClient.rb"

ECO_LIB_VIEW_FILES="src/cloud/ec2/lib/views/describe_images.erb \
                    src/cloud/ec2/lib/views/describe_instances.erb \
                    src/cloud/ec2/lib/views/describe_regions.erb \
                    src/cloud/ec2/lib/views/describe_availability_zones.erb \
                    src/cloud/ec2/lib/views/create_tags.erb \
                    src/cloud/ec2/lib/views/delete_tags.erb \
                    src/cloud/ec2/lib/views/describe_tags.erb \
                    src/cloud/ec2/lib/views/create_volume.erb \
                    src/cloud/ec2/lib/views/create_snapshot.erb \
                    src/cloud/ec2/lib/views/delete_snapshot.erb \
                    src/cloud/ec2/lib/views/describe_snapshots.erb \
                    src/cloud/ec2/lib/views/create_image.erb \
                    src/cloud/ec2/lib/views/describe_volumes.erb \
                    src/cloud/ec2/lib/views/attach_volume.erb \
                    src/cloud/ec2/lib/views/detach_volume.erb \
                    src/cloud/ec2/lib/views/delete_volume.erb \
                    src/cloud/ec2/lib/views/register_image.erb \
                    src/cloud/ec2/lib/views/run_instances.erb \
                    src/cloud/ec2/lib/views/allocate_address.erb \
                    src/cloud/ec2/lib/views/associate_address.erb \
                    src/cloud/ec2/lib/views/disassociate_address.erb \
                    src/cloud/ec2/lib/views/describe_addresses.erb \
                    src/cloud/ec2/lib/views/release_address.erb \
                    src/cloud/ec2/lib/views/create_keypair.erb \
                    src/cloud/ec2/lib/views/delete_keypair.erb \
                    src/cloud/ec2/lib/views/describe_keypairs.erb \
                    src/cloud/ec2/lib/views/terminate_instances.erb \
                    src/cloud/ec2/lib/views/stop_instances.erb \
                    src/cloud/ec2/lib/views/reboot_instances.erb \
                    src/cloud/ec2/lib/views/start_instances.erb"

ECO_BIN_FILES="src/cloud/ec2/bin/econe-server \
               src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-volumes \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-describe-keypairs \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-attach-volume \
               src/cloud/ec2/bin/econe-detach-volume \
               src/cloud/ec2/bin/econe-delete-volume \
               src/cloud/ec2/bin/econe-delete-keypair \
               src/cloud/ec2/bin/econe-create-volume \
               src/cloud/ec2/bin/econe-create-keypair \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
               src/cloud/ec2/bin/econe-start-instances \
               src/cloud/ec2/bin/econe-stop-instances \
               src/cloud/ec2/bin/econe-reboot-instances \
               src/cloud/ec2/bin/econe-describe-addresses \
               src/cloud/ec2/bin/econe-allocate-address \
               src/cloud/ec2/bin/econe-release-address \
               src/cloud/ec2/bin/econe-associate-address \
               src/cloud/ec2/bin/econe-disassociate-address \
               src/cloud/ec2/bin/econe-upload"

ECO_BIN_CLIENT_FILES="src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-describe-volumes \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-attach-volume \
               src/cloud/ec2/bin/econe-detach-volume \
               src/cloud/ec2/bin/econe-delete-volume \
               src/cloud/ec2/bin/econe-create-volume \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
               src/cloud/ec2/bin/econe-start-instances \
               src/cloud/ec2/bin/econe-stop-instances \
               src/cloud/ec2/bin/econe-reboot-instances \
               src/cloud/ec2/bin/econe-describe-addresses \
               src/cloud/ec2/bin/econe-allocate-address \
               src/cloud/ec2/bin/econe-release-address \
               src/cloud/ec2/bin/econe-associate-address \
               src/cloud/ec2/bin/econe-disassociate-address \
               src/cloud/ec2/bin/econe-upload"

ECO_ETC_FILES="src/cloud/ec2/etc/econe.conf"

ECO_ETC_TEMPLATE_FILES="src/cloud/ec2/etc/templates/m1.small.erb"

#-------------------------------------------------------------------------------
# Marketplace Client
#-------------------------------------------------------------------------------

MARKET_LIB_FILES="src/cloud/marketplace/lib/marketplace_client.rb"

MARKET_LIB_CLIENT_FILES="src/cloud/marketplace/lib/marketplace_client.rb"

MARKET_BIN_FILES="src/cloud/marketplace/bin/onemarket"

MARKET_BIN_CLIENT_FILES="src/cloud/marketplace/bin/onemarket"


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
                   src/cli/one_helper/oneacct_helper.rb"

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
               src/cli/oneacct"

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
                src/cli/etc/oneacct.yaml"

#-----------------------------------------------------------------------------
# Sunstone files
#-----------------------------------------------------------------------------

SUNSTONE_FILES="src/sunstone/sunstone-server.rb \
                src/sunstone/config.ru"

SUNSTONE_BIN_FILES="src/sunstone/bin/sunstone-server \
                    src/sunstone/bin/novnc-server"

SUNSTONE_ETC_FILES="src/sunstone/etc/sunstone-server.conf \
                    src/sunstone/etc/sunstone-views.yaml"

SUNSTONE_ETC_VIEW_FILES="src/sunstone/etc/sunstone-views/admin.yaml \
                    src/sunstone/etc/sunstone-views/user.yaml \
                    src/sunstone/etc/sunstone-views/cloud.yaml \
                    src/sunstone/etc/sunstone-views/vdcadmin46.yaml \
                     src/sunstone/etc/sunstone-views/vdcadmin.yaml"

SUNSTONE_MODELS_FILES="src/sunstone/models/OpenNebulaJSON.rb \
                       src/sunstone/models/SunstoneServer.rb \
                       src/sunstone/models/SunstoneMarketplace.rb \
                       src/sunstone/models/SunstoneViews.rb"

SUNSTONE_MODELS_JSON_FILES="src/sunstone/models/OpenNebulaJSON/HostJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ImageJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/GroupJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/JSONUtils.rb \
                    src/sunstone/models/OpenNebulaJSON/PoolJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/UserJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualMachineJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/TemplateJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/AclJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ClusterJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/DatastoreJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/VirtualNetworkJSON.rb \
                    src/sunstone/models/OpenNebulaJSON/ZoneJSON.rb"

SUNSTONE_VIEWS_FILES="src/sunstone/views/index.erb \
                      src/sunstone/views/login.erb \
                      src/sunstone/views/vnc.erb \
                      src/sunstone/views/_login_standard.erb \
                      src/sunstone/views/_login_x509.erb"

SUNSTONE_PUBLIC_JS_FILES="src/sunstone/public/js/login.js \
                        src/sunstone/public/js/sunstone.js \
                        src/sunstone/public/js/opennebula.js \
                        src/sunstone/public/js/locale.js"

SUNSTONE_PUBLIC_JS_PLUGINS_FILES="\
                        src/sunstone/public/js/plugins/dashboard-tab.js \
                        src/sunstone/public/js/plugins/hosts-tab.js \
                        src/sunstone/public/js/plugins/clusters-tab.js \
                        src/sunstone/public/js/plugins/datastores-tab.js \
                        src/sunstone/public/js/plugins/system-tab.js \
                        src/sunstone/public/js/plugins/vresources-tab.js \
                        src/sunstone/public/js/plugins/infra-tab.js \
                        src/sunstone/public/js/plugins/groups-tab.js \
                        src/sunstone/public/js/plugins/images-tab.js \
                        src/sunstone/public/js/plugins/files-tab.js \
                        src/sunstone/public/js/plugins/templates-tab.js \
                        src/sunstone/public/js/plugins/users-tab.js \
                        src/sunstone/public/js/plugins/vms-tab.js \
                        src/sunstone/public/js/plugins/acls-tab.js \
                        src/sunstone/public/js/plugins/vnets-tab.js \
                        src/sunstone/public/js/plugins/marketplace-tab.js \
                        src/sunstone/public/js/plugins/provision-tab.js \
                        src/sunstone/public/js/plugins/config-tab.js \
                        src/sunstone/public/js/plugins/oneflow-dashboard.js \
                        src/sunstone/public/js/plugins/oneflow-services.js \
                        src/sunstone/public/js/plugins/oneflow-templates.js \
                        src/sunstone/public/js/plugins/support-tab.js \
                        src/sunstone/public/js/plugins/zones-tab.js"

SUNSTONE_ROUTES_FILES="src/sunstone/routes/oneflow.rb"

SUNSTONE_PUBLIC_CSS_FILES="src/sunstone/public/css/app.css \
                src/sunstone/public/css/opensans.woff \
                src/sunstone/public/css/login.css"

SUNSTONE_PUBLIC_VENDOR_FLOT="\
src/sunstone/public/vendor/flot/jquery.flot.min.js \
src/sunstone/public/vendor/flot/jquery.flot.navigate.min.js \
src/sunstone/public/vendor/flot/jquery.flot.pie.min.js \
src/sunstone/public/vendor/flot/jquery.flot.resize.min.js \
src/sunstone/public/vendor/flot/jquery.flot.stack.min.js \
src/sunstone/public/vendor/flot/jquery.flot.tooltip.min.js \
src/sunstone/public/vendor/flot/LICENSE.txt \
src/sunstone/public/vendor/flot/NOTICE"

SUNSTONE_PUBLIC_VENDOR_CRYPTOJS="\
src/sunstone/public/vendor/crypto-js/NOTICE \
src/sunstone/public/vendor/crypto-js/sha1-min.js \
src/sunstone/public/vendor/crypto-js/core-min.js \
src/sunstone/public/vendor/crypto-js/enc-base64-min.js \
src/sunstone/public/vendor/crypto-js/NEW-BSD-LICENSE.txt"

SUNSTONE_PUBLIC_VENDOR_EXPLORERCANVAS="\
src/sunstone/public/vendor/explorercanvas/excanvas.compiled.js \
src/sunstone/public/vendor/explorercanvas/NOTICE \
src/sunstone/public/vendor/explorercanvas/LICENSE.txt"

SUNSTONE_PUBLIC_VENDOR_FILEUPLOADER="\
src/sunstone/public/vendor/fileuploader/NOTICE \
src/sunstone/public/vendor/fileuploader/fileuploader.js"

SUNSTONE_PUBLIC_VENDOR_NOVNC="\
src/sunstone/public/vendor/noVNC/LICENSE.txt \
src/sunstone/public/vendor/noVNC/black.css \
src/sunstone/public/vendor/noVNC/playback.js \
src/sunstone/public/vendor/noVNC/websock.js \
src/sunstone/public/vendor/noVNC/util.js \
src/sunstone/public/vendor/noVNC/des.js \
src/sunstone/public/vendor/noVNC/jsunzip.js \
src/sunstone/public/vendor/noVNC/Orbitron700.ttf \
src/sunstone/public/vendor/noVNC/display.js \
src/sunstone/public/vendor/noVNC/input.js \
src/sunstone/public/vendor/noVNC/rfb.js \
src/sunstone/public/vendor/noVNC/base64.js \
src/sunstone/public/vendor/noVNC/Orbitron700.woff \
src/sunstone/public/vendor/noVNC/logo.js \
src/sunstone/public/vendor/noVNC/blue.css \
src/sunstone/public/vendor/noVNC/ui.js \
src/sunstone/public/vendor/noVNC/vnc.js \
src/sunstone/public/vendor/noVNC/base.css \
src/sunstone/public/vendor/noVNC/webutil.js"

SUNSTONE_PUBLIC_VENDOR_NOVNC_WEBSOCKET="\
src/sunstone/public/vendor/noVNC/web-socket-js/web_socket.js \
src/sunstone/public/vendor/noVNC/web-socket-js/README.txt \
src/sunstone/public/vendor/noVNC/web-socket-js/swfobject.js \
src/sunstone/public/vendor/noVNC/web-socket-js/WebSocketMain.swf"

SUNSTONE_PUBLIC_VENDOR_XML2JSON="\
src/sunstone/public/vendor/xml2json/NOTICE \
src/sunstone/public/vendor/xml2json/jquery.xml2json.pack.js"

SUNSTONE_PUBLIC_NEW_VENDOR_DATATABLES="\
                src/sunstone/public/vendor/4.0/datatables/media/js/jquery.dataTables.min.js \
                src/sunstone/public/vendor/4.0/datatables/license-bsd.txt"

SUNSTONE_PUBLIC_NEW_VENDOR_FOUNDATION_DATATABLES="\
                src/sunstone/public/vendor/4.0/foundation_datatables/javascripts/datatables.foundation.js \
                src/sunstone/public/vendor/4.0/foundation_datatables/javascripts/responsive-tables.js"

SUNSTONE_PUBLIC_NEW_VENDOR_JGROWL="\
                src/sunstone/public/vendor/4.0/jgrowl/jquery.jgrowl.js \
                src/sunstone/public/vendor/4.0/jgrowl/jquery.jgrowl.css \
                src/sunstone/public/vendor/4.0/jgrowl/LICENSE"

SUNSTONE_PUBLIC_NEW_VENDOR_FOUNDATION="\
  src/sunstone/public/bower_components/modernizr/modernizr.js \
  src/sunstone/public/bower_components/foundation/js/foundation.min.js"

SUNSTONE_PUBLIC_NEW_VENDOR_JQUERY="\
                        src/sunstone/public/vendor/4.0/jquery-2.1.1.min.js \
                        src/sunstone/public/vendor/4.0/jquery-1.11.0.min.map \
                        src/sunstone/public/vendor/4.0/jquery-migrate-1.2.1.js"

SUNSTONE_PUBLIC_NEW_VENDOR_JQUERYLAYOUT="\
            src/sunstone/public/vendor/4.0/jquery_layout/layout-default-latest.css \
            src/sunstone/public/vendor/4.0/jquery_layout/jquery.layout-latest.min.js"


SUNSTONE_PUBLIC_NEW_VENDOR_FONTAWESOME_CSS="\
  src/sunstone/public/vendor/4.0/fontawesome/css/font-awesome.min.css"

SUNSTONE_PUBLIC_NEW_VENDOR_FONTAWESOME_FONT="\
src/sunstone/public/vendor/4.0/fontawesome/fonts/fontawesome-webfont.eot \
src/sunstone/public/vendor/4.0/fontawesome/fonts/fontawesome-webfont.woff \
src/sunstone/public/vendor/4.0/fontawesome/fonts/fontawesome-webfont.ttf \
src/sunstone/public/vendor/4.0/fontawesome/fonts/fontawesome-webfont.svg \
src/sunstone/public/vendor/4.0/fontawesome/fonts/FontAwesome.otf \
"

SUNSTONE_PUBLIC_NEW_VENDOR_NOUISLIDER="\
                src/sunstone/public/vendor/4.0/nouislider/jquery.nouislider.min.js \
                src/sunstone/public/vendor/4.0/nouislider/nouislider.css"

SUNSTONE_PUBLIC_NEW_VENDOR_JDPICKER="\
                src/sunstone/public/vendor/4.0/jdpicker_1.1/jdpicker.css \
                src/sunstone/public/vendor/4.0/jdpicker_1.1/jquery.jdpicker.js"

SUNSTONE_PUBLIC_NEW_VENDOR_JDPICKER_IMAGES="\
                src/sunstone/public/vendor/4.0/jdpicker_1.1/images/bg_hover.png \
                src/sunstone/public/vendor/4.0/jdpicker_1.1/images/bg_selectable.png \
                src/sunstone/public/vendor/4.0/jdpicker_1.1/images/bg_selected.png"

SUNSTONE_PUBLIC_IMAGES_FILES="src/sunstone/public/images/ajax-loader.gif \
                        src/sunstone/public/images/favicon.ico \
                        src/sunstone/public/images/login_over.png \
                        src/sunstone/public/images/login.png \
                        src/sunstone/public/images/opennebula-sunstone-big.png \
                        src/sunstone/public/images/opennebula-sunstone-small.png \
                        src/sunstone/public/images/opennebula-sunstone-v4.0.png \
                        src/sunstone/public/images/opennebula-sunstone-v4.0-small.png \
                        src/sunstone/public/images/one_small_logo.png \
                        src/sunstone/public/images/panel.png \
                        src/sunstone/public/images/panel_short.png \
                        src/sunstone/public/images/pbar.gif \
                        src/sunstone/public/images/Refresh-icon.png \
                        src/sunstone/public/images/red_bullet.png \
                        src/sunstone/public/images/yellow_bullet.png \
                        src/sunstone/public/images/green_bullet.png \
                        src/sunstone/public/images/vnc_off.png \
                        src/sunstone/public/images/vnc_on.png \
                        src/sunstone/public/images/network_icon.png \
                        src/sunstone/public/images/system_icon.png \
                        src/sunstone/public/images/server_icon.png  \
                        src/sunstone/public/images/sort_asc.png \
                        src/sunstone/public/images/sort_asc_disabled.png \
                        src/sunstone/public/images/sort_both.png \
                        src/sunstone/public/images/sort_desc.png \
                        src/sunstone/public/images/sort_desc_disabled.png\
"

SUNSTONE_PUBLIC_LOGOS_FILES="src/sunstone/public/images/logos/arch.png \
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
src/sunstone/locale/languages/ca.js \
src/sunstone/locale/languages/ca_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_CS_CZ="\
src/sunstone/locale/languages/cs_CZ.js \
src/sunstone/locale/languages/cs_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_DE="\
src/sunstone/locale/languages/de.js \
src/sunstone/locale/languages/de_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_DA="\
src/sunstone/locale/languages/da.js \
src/sunstone/locale/languages/da_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_EL_GR="\
src/sunstone/locale/languages/el_GR.js \
src/sunstone/locale/languages/el_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_EN_US="\
src/sunstone/locale/languages/en_US.js \
src/sunstone/locale/languages/en_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_ES_ES="\
src/sunstone/locale/languages/es_ES.js \
src/sunstone/locale/languages/es_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_FA_IR="\
src/sunstone/locale/languages/fa_IR.js \
src/sunstone/locale/languages/fa_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_FR_FR="\
src/sunstone/locale/languages/fr_FR.js \
src/sunstone/locale/languages/fr_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_IT_IT="\
src/sunstone/locale/languages/it_IT.js \
src/sunstone/locale/languages/it_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_NL_NL="\
src/sunstone/locale/languages/nl_NL.js \
src/sunstone/locale/languages/nl_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PL="\
src/sunstone/locale/languages/pl.js \
src/sunstone/locale/languages/pl_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PT_PT="\
src/sunstone/locale/languages/pt_PT.js \
src/sunstone/locale/languages/pt_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PT_BR="\
src/sunstone/locale/languages/pt_BR.js \
src/sunstone/locale/languages/pt_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_RU_RU="\
src/sunstone/locale/languages/ru_RU.js \
src/sunstone/locale/languages/ru_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_SK_SK="\
src/sunstone/locale/languages/sk_SK.js \
src/sunstone/locale/languages/sk_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_ZH_CN="\
src/sunstone/locale/languages/zh_CN.js \
src/sunstone/locale/languages/zh_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_ZH_TW="\
src/sunstone/locale/languages/zh_TW.js \
src/sunstone/locale/languages/zh_datatable.txt"

#-----------------------------------------------------------------------------
# OneGate files
#-----------------------------------------------------------------------------

ONEGATE_FILES="src/onegate/onegate-server.rb \
                src/onegate/config.ru"

ONEGATE_BIN_FILES="src/onegate/bin/onegate-server"

ONEGATE_ETC_FILES="src/onegate/etc/onegate-server.conf"

#-----------------------------------------------------------------------------
# OneFlow files
#-----------------------------------------------------------------------------


ONEFLOW_FILES="src/flow/oneflow-server.rb \
                src/flow/config.ru"

ONEFLOW_BIN_FILES="src/flow/bin/oneflow-server"

ONEFLOW_ETC_FILES="src/flow/etc/oneflow-server.conf"

ONEFLOW_LIB_FILES="src/flow/lib/grammar.rb \
                    src/flow/lib/grammar.treetop \
                    src/flow/lib/LifeCycleManager.rb \
                    src/flow/lib/log.rb \
                    src/flow/lib/models.rb \
                    src/flow/lib/strategy.rb \
                    src/flow/lib/validator.rb"

ONEFLOW_LIB_STRATEGY_FILES="src/flow/lib/strategy/straight.rb"

ONEFLOW_LIB_MODELS_FILES="src/flow/lib/models/role.rb \
                          src/flow/lib/models/service_pool.rb \
                          src/flow/lib/models/service.rb \
                          src/flow/lib/models/service_template_pool.rb \
                          src/flow/lib/models/service_template.rb"


#-----------------------------------------------------------------------------
# MAN files
#-----------------------------------------------------------------------------

MAN_FILES="share/man/oneacct.1.gz \
        share/man/oneacl.1.gz \
        share/man/onehost.1.gz \
        share/man/oneimage.1.gz \
        share/man/oneuser.1.gz \
        share/man/onevm.1.gz \
        share/man/onevnet.1.gz \
        share/man/onetemplate.1.gz \
        share/man/onegroup.1.gz \
        share/man/onedb.1.gz \
        share/man/onedatastore.1.gz \
        share/man/onecluster.1.gz \
        share/man/onezone.1.gz \
        share/man/oneflow.1.gz \
        share/man/oneflow-template.1.gz \
        share/man/econe-allocate-address.1.gz \
        share/man/econe-associate-address.1.gz \
        share/man/econe-attach-volume.1.gz \
        share/man/econe-create-keypair.1.gz \
        share/man/econe-create-volume.1.gz \
        share/man/econe-delete-keypair.1.gz \
        share/man/econe-delete-volume.1.gz \
        share/man/econe-describe-addresses.1.gz \
        share/man/econe-describe-images.1.gz \
        share/man/econe-describe-instances.1.gz \
        share/man/econe-describe-keypairs.1.gz \
        share/man/econe-describe-volumes.1.gz \
        share/man/econe-detach-volume.1.gz \
        share/man/econe-disassociate-address.1.gz \
        share/man/econe-reboot-instances.1.gz \
        share/man/econe-register.1.gz \
        share/man/econe-release-address.1.gz \
        share/man/econe-run-instances.1.gz \
        share/man/econe-start-instances.1.gz \
        share/man/econe-stop-instances.1.gz \
        share/man/econe-terminate-instances.1.gz \
        share/man/econe-upload.1.gz"

#-----------------------------------------------------------------------------
# Ruby VENDOR files
#-----------------------------------------------------------------------------

RBVMOMI_VENDOR_RUBY_FILES="share/vendor/ruby/gems/rbvmomi/LICENSE \
share/vendor/ruby/gems/rbvmomi/README.rdoc \
share/vendor/ruby/gems/rbvmomi/VERSION \
share/vendor/ruby/gems/rbvmomi/vmodl.db"

RBVMOMI_VENDOR_RUBY_LIB_FILES="share/vendor/ruby/gems/rbvmomi/lib/rbvmomi.rb"

RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_FILES="share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/basic_types.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/connection.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/deserialization.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/fault.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/pbm.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/trivial_soap.rb
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/trollop.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/type_loader.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim.rb"

RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_UTILS_FILES="share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/utils/admission_control.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/utils/deploy.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/utils/leases.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/utils/perfdump.rb"

RBVMOMI_VENDOR_RUBY_LIB_RBVMOMI_VIM_FILES="share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ComputeResource.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/Datacenter.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/Datastore.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/DynamicTypeMgrAllTypeInfo.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/DynamicTypeMgrDataTypeInfo.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/DynamicTypeMgrManagedTypeInfo.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/Folder.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/HostSystem.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ManagedEntity.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ManagedObject.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ObjectContent.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ObjectUpdate.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/OvfManager.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/PerfCounterInfo.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/PerformanceManager.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/PropertyCollector.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ReflectManagedMethodExecuter.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ResourcePool.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/ServiceInstance.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/Task.rb \
share/vendor/ruby/gems/rbvmomi/lib/rbvmomi/vim/VirtualMachine.rb"

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
            cp $SRC_DIR/$1 $DESTDIR$2
        fi
    fi
}


if [ "$CLIENT" = "yes" ]; then
    INSTALL_SET=${INSTALL_CLIENT_FILES[@]}
elif [ "$ONEGATE" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEGATE_FILES[@]}"
elif [ "$SUNSTONE" = "yes" ]; then
    INSTALL_SET="${INSTALL_SUNSTONE_RUBY_FILES[@]} ${INSTALL_SUNSTONE_FILES[@]}"
elif [ "$ONEFLOW" = "yes" ]; then
    INSTALL_SET="${INSTALL_ONEFLOW_FILES[@]}"
else
    INSTALL_SET="${INSTALL_FILES[@]} \
                 ${INSTALL_SUNSTONE_FILES[@]} ${INSTALL_ONEGATE_FILES[@]} \
                 ${INSTALL_ONEFLOW_FILES[@]}"
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
    elif [ "$ONEGATE" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEGATE_ETC_FILES[@]}"
    elif [ "$ONEFLOW" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_ONEFLOW_ETC_FILES[@]}"
    else
        INSTALL_ETC_SET="${INSTALL_ETC_FILES[@]} \
                         ${INSTALL_SUNSTONE_ETC_FILES[@]} \
                         ${INSTALL_ONEGATE_ETC_FILES[@]} \
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
    for d in $CHOWN_DIRS; do
        chown -R $ONEADMIN_USER:$ONEADMIN_GROUP $DESTDIR$d
    done
else
    for d in `echo $DELETE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

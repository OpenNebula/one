#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
 echo "                  [-d ONE_LOCATION] [-c occi|ec2] [-r] [-h]"
 echo
 echo "-u: user that will run opennebula, defaults to user executing install.sh"
 echo "-g: group of the user that will run opennebula, defaults to user"
 echo "    executing install.sh"
 echo "-k: keep configuration files of existing OpenNebula installation, useful"
 echo "    when upgrading. This flag should not be set when installing"
 echo "    OpenNebula for the first time"
 echo "-d: target installation directory, if not defined it'd be root. Must be"
 echo "    an absolute path."
 echo "-c: install client utilities: OpenNebula cli, occi and ec2 client files"
 echo "-s: install OpenNebula Sunstone"
 echo "-o: install OpenNebula Zones (OZones)"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o hkrlcsou:g:d: -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
CLIENT="no"
SUNSTONE="no"
OZONES="no"
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
        -s) SUNSTONE="yes"; shift ;;
        -o) OZONES="yes"; shift ;;
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
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
    OZONES_LOCATION="$LIB_LOCATION/ozones"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    RUN_LOCATION="/var/run/one"
    LOCK_LOCATION="/var/lock/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/one"
    MAN_LOCATION="/usr/share/man/man1"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS=""

        CHOWN_DIRS=""
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    elif [ "$OZONES" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $OZONES_LOCATION \
                    $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS=""
    else
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
                   $SYSTEM_DS_LOCATION $DEFAULT_DS_LOCATION $MAN_LOCATION"

        DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                     $RUN_LOCATION $SHARE_DIRS"

        CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION $LOCK_LOCATION"
    fi

else
    BIN_LOCATION="$ROOT/bin"
    LIB_LOCATION="$ROOT/lib"
    ETC_LOCATION="$ROOT/etc"
    VAR_LOCATION="$ROOT/var"
    SUNSTONE_LOCATION="$LIB_LOCATION/sunstone"
    OZONES_LOCATION="$LIB_LOCATION/ozones"
    SYSTEM_DS_LOCATION="$VAR_LOCATION/datastores/0"
    DEFAULT_DS_LOCATION="$VAR_LOCATION/datastores/1"
    INCLUDE_LOCATION="$ROOT/include"
    SHARE_LOCATION="$ROOT/share"
    MAN_LOCATION="$ROOT/share/man/man1"

    if [ "$CLIENT" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$SUNSTONE" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION \
                   $SUNSTONE_LOCATION $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    elif [ "$OZONES" = "yes" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $VAR_LOCATION $OZONES_LOCATION \
                   $ETC_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    else
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $SYSTEM_DS_LOCATION \
                   $DEFAULT_DS_LOCATION $MAN_LOCATION $OZONES_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS="$ROOT"
    fi

    CHOWN_DIRS="$ROOT"
fi

SHARE_DIRS="$SHARE_LOCATION/examples"

ETC_DIRS="$ETC_LOCATION/im_ec2 \
          $ETC_LOCATION/vmm_ec2 \
          $ETC_LOCATION/vmm_exec \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/auth \
          $ETC_LOCATION/auth/certificates \
          $ETC_LOCATION/ec2query_templates \
          $ETC_LOCATION/occi_templates \
          $ETC_LOCATION/cli"

LIB_DIRS="$LIB_LOCATION/ruby \
          $LIB_LOCATION/ruby/OpenNebula \
          $LIB_LOCATION/ruby/zona \
          $LIB_LOCATION/ruby/cloud/ \
          $LIB_LOCATION/ruby/cloud/econe \
          $LIB_LOCATION/ruby/cloud/econe/views \
          $LIB_LOCATION/ruby/cloud/occi \
          $LIB_LOCATION/ruby/cloud/CloudAuth \
          $LIB_LOCATION/ruby/onedb \
          $LIB_LOCATION/mads \
          $LIB_LOCATION/sh \
          $LIB_LOCATION/ruby/cli \
          $LIB_LOCATION/ruby/cli/one_helper"

VAR_DIRS="$VAR_LOCATION/remotes \
          $VAR_LOCATION/remotes/im \
          $VAR_LOCATION/remotes/im/kvm.d \
          $VAR_LOCATION/remotes/im/xen.d \
          $VAR_LOCATION/remotes/im/vmware.d \
          $VAR_LOCATION/remotes/im/ganglia.d \
          $VAR_LOCATION/remotes/vmm \
          $VAR_LOCATION/remotes/vmm/kvm \
          $VAR_LOCATION/remotes/vmm/xen \
          $VAR_LOCATION/remotes/vmm/vmware \
          $VAR_LOCATION/remotes/vnm \
          $VAR_LOCATION/remotes/vnm/802.1Q \
          $VAR_LOCATION/remotes/vnm/dummy \
          $VAR_LOCATION/remotes/vnm/ebtables \
          $VAR_LOCATION/remotes/vnm/fw \
          $VAR_LOCATION/remotes/vnm/ovswitch \
          $VAR_LOCATION/remotes/vnm/vmware \
          $VAR_LOCATION/remotes/tm/ \
          $VAR_LOCATION/remotes/tm/dummy \
          $VAR_LOCATION/remotes/tm/shared \
          $VAR_LOCATION/remotes/tm/qcow2 \
          $VAR_LOCATION/remotes/tm/ssh \
          $VAR_LOCATION/remotes/tm/vmware \
          $VAR_LOCATION/remotes/tm/iscsi \
          $VAR_LOCATION/remotes/tm/lvm \
          $VAR_LOCATION/remotes/hooks \
          $VAR_LOCATION/remotes/hooks/ft \
          $VAR_LOCATION/remotes/datastore \
          $VAR_LOCATION/remotes/datastore/dummy \
          $VAR_LOCATION/remotes/datastore/fs \
          $VAR_LOCATION/remotes/datastore/vmware \
          $VAR_LOCATION/remotes/datastore/iscsi \
          $VAR_LOCATION/remotes/datastore/lvm \
          $VAR_LOCATION/remotes/auth \
          $VAR_LOCATION/remotes/auth/plain \
          $VAR_LOCATION/remotes/auth/ssh \
          $VAR_LOCATION/remotes/auth/x509 \
          $VAR_LOCATION/remotes/auth/ldap \
          $VAR_LOCATION/remotes/auth/server_x509 \
          $VAR_LOCATION/remotes/auth/server_cipher \
          $VAR_LOCATION/remotes/auth/dummy"

SUNSTONE_DIRS="$SUNSTONE_LOCATION/models \
               $SUNSTONE_LOCATION/models/OpenNebulaJSON \
               $SUNSTONE_LOCATION/public \
               $SUNSTONE_LOCATION/public/js \
               $SUNSTONE_LOCATION/public/js/plugins \
               $SUNSTONE_LOCATION/public/js/user-plugins \
               $SUNSTONE_LOCATION/public/css \
               $SUNSTONE_LOCATION/public/locale \
               $SUNSTONE_LOCATION/public/locale/en_US \
               $SUNSTONE_LOCATION/public/locale/ru \
               $SUNSTONE_LOCATION/public/locale/it_IT \
               $SUNSTONE_LOCATION/public/locale/pt_PT \
               $SUNSTONE_LOCATION/public/locale/fr_FR \
               $SUNSTONE_LOCATION/public/vendor \
               $SUNSTONE_LOCATION/public/vendor/jQueryLayout \
               $SUNSTONE_LOCATION/public/vendor/dataTables \
               $SUNSTONE_LOCATION/public/vendor/jQueryUI \
               $SUNSTONE_LOCATION/public/vendor/jQueryUI/images \
               $SUNSTONE_LOCATION/public/vendor/jQuery \
               $SUNSTONE_LOCATION/public/vendor/jGrowl \
               $SUNSTONE_LOCATION/public/vendor/flot \
               $SUNSTONE_LOCATION/public/vendor/fileuploader \
               $SUNSTONE_LOCATION/public/vendor/FontAwesome \
               $SUNSTONE_LOCATION/public/vendor/FontAwesome/css \
               $SUNSTONE_LOCATION/public/vendor/FontAwesome/font \
               $SUNSTONE_LOCATION/public/images \
               $SUNSTONE_LOCATION/templates \
               $SUNSTONE_LOCATION/views"

OZONES_DIRS="$OZONES_LOCATION/lib \
             $OZONES_LOCATION/lib/OZones \
             $OZONES_LOCATION/models \
             $OZONES_LOCATION/templates \
             $OZONES_LOCATION/public \
             $OZONES_LOCATION/public/vendor \
             $OZONES_LOCATION/public/vendor/jQuery \
             $OZONES_LOCATION/public/vendor/jQueryLayout \
             $OZONES_LOCATION/public/vendor/dataTables \
             $OZONES_LOCATION/public/vendor/jQueryUI \
             $OZONES_LOCATION/public/vendor/jQueryUI/images \
             $OZONES_LOCATION/public/vendor/jGrowl \
             $OZONES_LOCATION/public/vendor/FontAwesome \
             $OZONES_LOCATION/public/vendor/FontAwesome/css \
             $OZONES_LOCATION/public/vendor/FontAwesome/font \
             $OZONES_LOCATION/public/js \
             $OZONES_LOCATION/public/js/plugins \
             $OZONES_LOCATION/public/images \
             $OZONES_LOCATION/public/css"

SELF_SERVICE_DIRS="\
                 $LIB_LOCATION/ruby/cloud/occi/ui \
                 $LIB_LOCATION/ruby/cloud/occi/ui/templates \
                 $LIB_LOCATION/ruby/cloud/occi/ui/views \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/css \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/customize \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/images \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/js \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/js/plugins \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/locale \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/locale/en_US \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/locale/es_ES \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/locale/fr_FR \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/locale/fr_CA \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryLayout \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/dataTables \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryUI \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryUI/images \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQuery \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jGrowl \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/flot \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/crypto-js \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/fileuploader \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/xml2json \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome/css \
                 $LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome/font"

OZONES_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula \
                 $LIB_LOCATION/ruby/cli \
                 $LIB_LOCATION/ruby/cli/ozones_helper \
                 $LIB_LOCATION/ruby/zona"

LIB_ECO_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula \
                 $LIB_LOCATION/ruby/cloud/ \
                 $LIB_LOCATION/ruby/cloud/econe"

LIB_OCCI_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula \
                 $LIB_LOCATION/ruby/cloud/occi"

LIB_OCA_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula"

LIB_CLI_CLIENT_DIRS="$LIB_LOCATION/ruby/cli \
                     $LIB_LOCATION/ruby/cli/one_helper"

CONF_CLI_DIRS="$ETC_LOCATION/cli"

if [ "$CLIENT" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_ECO_CLIENT_DIRS $LIB_OCCI_CLIENT_DIRS \
               $LIB_OCA_CLIENT_DIRS $LIB_CLI_CLIENT_DIRS $CONF_CLI_DIRS \
               $ETC_LOCATION $OZONES_CLIENT_DIRS $SELF_SERVICE_DIRS"
elif [ "$SUNSTONE" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $SUNSTONE_DIRS $LIB_OCA_CLIENT_DIRS"
elif [ "$OZONES" = "yes" ]; then
    MAKE_DIRS="$MAKE_DIRS $OZONES_DIRS $OZONES_CLIENT_DIRS $LIB_OCA_CLIENT_DIRS"
else
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS \
                $OZONES_DIRS $OZONES_CLIENT_DIRS $SUNSTONE_DIRS $SELF_SERVICE_DIRS"
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
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula
    MAD_RUBY_LIB_FILES:$LIB_LOCATION/ruby
    MAD_RUBY_LIB_FILES:$VAR_LOCATION/remotes
    MAD_SH_LIB_FILES:$LIB_LOCATION/sh
    MAD_SH_LIB_FILES:$VAR_LOCATION/remotes
    ONEDB_MIGRATOR_FILES:$LIB_LOCATION/ruby/onedb
    MADS_LIB_FILES:$LIB_LOCATION/mads
    IM_PROBES_FILES:$VAR_LOCATION/remotes/im
    IM_PROBES_KVM_FILES:$VAR_LOCATION/remotes/im/kvm.d
    IM_PROBES_XEN_FILES:$VAR_LOCATION/remotes/im/xen.d
    IM_PROBES_VMWARE_FILES:$VAR_LOCATION/remotes/im/vmware.d
    IM_PROBES_GANGLIA_FILES:$VAR_LOCATION/remotes/im/ganglia.d
    AUTH_SSH_FILES:$VAR_LOCATION/remotes/auth/ssh
    AUTH_X509_FILES:$VAR_LOCATION/remotes/auth/x509
    AUTH_LDAP_FILES:$VAR_LOCATION/remotes/auth/ldap
    AUTH_SERVER_X509_FILES:$VAR_LOCATION/remotes/auth/server_x509
    AUTH_SERVER_CIPHER_FILES:$VAR_LOCATION/remotes/auth/server_cipher
    AUTH_DUMMY_FILES:$VAR_LOCATION/remotes/auth/dummy
    AUTH_PLAIN_FILES:$VAR_LOCATION/remotes/auth/plain
    VMM_EXEC_KVM_SCRIPTS:$VAR_LOCATION/remotes/vmm/kvm
    VMM_EXEC_XEN_SCRIPTS:$VAR_LOCATION/remotes/vmm/xen
    VMM_EXEC_VMWARE_SCRIPTS:$VAR_LOCATION/remotes/vmm/vmware
    TM_FILES:$VAR_LOCATION/remotes/tm
    TM_SHARED_FILES:$VAR_LOCATION/remotes/tm/shared
    TM_QCOW2_FILES:$VAR_LOCATION/remotes/tm/qcow2
    TM_SSH_FILES:$VAR_LOCATION/remotes/tm/ssh
    TM_VMWARE_FILES:$VAR_LOCATION/remotes/tm/vmware
    TM_ISCSI_FILES:$VAR_LOCATION/remotes/tm/iscsi
    TM_LVM_FILES:$VAR_LOCATION/remotes/tm/lvm
    TM_DUMMY_FILES:$VAR_LOCATION/remotes/tm/dummy
    DATASTORE_DRIVER_COMMON_SCRIPTS:$VAR_LOCATION/remotes/datastore/
    DATASTORE_DRIVER_DUMMY_SCRIPTS:$VAR_LOCATION/remotes/datastore/dummy
    DATASTORE_DRIVER_FS_SCRIPTS:$VAR_LOCATION/remotes/datastore/fs
    DATASTORE_DRIVER_VMWARE_SCRIPTS:$VAR_LOCATION/remotes/datastore/vmware
    DATASTORE_DRIVER_ISCSI_SCRIPTS:$VAR_LOCATION/remotes/datastore/iscsi
    DATASTORE_DRIVER_LVM_SCRIPTS:$VAR_LOCATION/remotes/datastore/lvm
    NETWORK_FILES:$VAR_LOCATION/remotes/vnm
    NETWORK_8021Q_FILES:$VAR_LOCATION/remotes/vnm/802.1Q
    NETWORK_DUMMY_FILES:$VAR_LOCATION/remotes/vnm/dummy
    NETWORK_EBTABLES_FILES:$VAR_LOCATION/remotes/vnm/ebtables
    NETWORK_FW_FILES:$VAR_LOCATION/remotes/vnm/fw
    NETWORK_OVSWITCH_FILES:$VAR_LOCATION/remotes/vnm/ovswitch
    NETWORK_VMWARE_FILES:$VAR_LOCATION/remotes/vnm/vmware
    EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples
    INSTALL_NOVNC_SHARE_FILE:$SHARE_LOCATION
    INSTALL_GEMS_SHARE_FILE:$SHARE_LOCATION
    HOOK_FT_FILES:$VAR_LOCATION/remotes/hooks/ft
    COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud
    CLOUD_AUTH_LIB_FILES:$LIB_LOCATION/ruby/cloud/CloudAuth
    ECO_LIB_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_LIB_VIEW_FILES:$LIB_LOCATION/ruby/cloud/econe/views
    ECO_BIN_FILES:$BIN_LOCATION
    OCCI_LIB_FILES:$LIB_LOCATION/ruby/cloud/occi
    OCCI_BIN_FILES:$BIN_LOCATION
    MAN_FILES:$MAN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
)

INSTALL_CLIENT_FILES=(
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    ECO_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_BIN_CLIENT_FILES:$BIN_LOCATION
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    OCCI_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/occi
    OCCI_BIN_CLIENT_FILES:$BIN_LOCATION
    CLI_BIN_FILES:$BIN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby/cli
    ONE_CLI_LIB_FILES:$LIB_LOCATION/ruby/cli/one_helper
    ETC_CLIENT_FILES:$ETC_LOCATION
    OZONES_BIN_CLIENT_FILES:$BIN_LOCATION
    OZONES_LIB_CLIENT_CLI_FILES:$LIB_LOCATION/ruby/cli
    OZONES_LIB_CLIENT_CLI_HELPER_FILES:$LIB_LOCATION/ruby/cli/ozones_helper
    OZONES_LIB_API_FILES:$LIB_LOCATION/ruby
    OZONES_LIB_API_ZONA_FILES:$LIB_LOCATION/ruby/zona
    CLI_CONF_FILES:$ETC_LOCATION/cli
    OCA_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula
)

INSTALL_SUNSTONE_RUBY_FILES=(
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula
    OCA_LIB_FILES:$LIB_LOCATION/ruby
)

INSTALL_SUNSTONE_FILES=(
    SUNSTONE_FILES:$SUNSTONE_LOCATION
    SUNSTONE_BIN_FILES:$BIN_LOCATION
    SUNSTONE_MODELS_FILES:$SUNSTONE_LOCATION/models
    SUNSTONE_MODELS_JSON_FILES:$SUNSTONE_LOCATION/models/OpenNebulaJSON
    SUNSTONE_TEMPLATE_FILES:$SUNSTONE_LOCATION/templates
    SUNSTONE_VIEWS_FILES:$SUNSTONE_LOCATION/views
    SUNSTONE_PUBLIC_JS_FILES:$SUNSTONE_LOCATION/public/js
    SUNSTONE_PUBLIC_JS_PLUGINS_FILES:$SUNSTONE_LOCATION/public/js/plugins
    SUNSTONE_PUBLIC_CSS_FILES:$SUNSTONE_LOCATION/public/css
    SUNSTONE_PUBLIC_VENDOR_DATATABLES:$SUNSTONE_LOCATION/public/vendor/dataTables
    SUNSTONE_PUBLIC_VENDOR_JGROWL:$SUNSTONE_LOCATION/public/vendor/jGrowl
    SUNSTONE_PUBLIC_VENDOR_JQUERY:$SUNSTONE_LOCATION/public/vendor/jQuery
    SUNSTONE_PUBLIC_VENDOR_JQUERYUI:$SUNSTONE_LOCATION/public/vendor/jQueryUI
    SUNSTONE_PUBLIC_VENDOR_JQUERYUIIMAGES:$SUNSTONE_LOCATION/public/vendor/jQueryUI/images
    SUNSTONE_PUBLIC_VENDOR_JQUERYLAYOUT:$SUNSTONE_LOCATION/public/vendor/jQueryLayout
    SUNSTONE_PUBLIC_VENDOR_FLOT:$SUNSTONE_LOCATION/public/vendor/flot
    SUNSTONE_PUBLIC_VENDOR_FILEUPLOADER:$SUNSTONE_LOCATION/public/vendor/fileuploader
    SUNSTONE_PUBLIC_VENDOR_FONTAWESOME:$SUNSTONE_LOCATION/public/vendor/FontAwesome
    SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_FONT:$SUNSTONE_LOCATION/public/vendor/FontAwesome/font
    SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_CSS:$SUNSTONE_LOCATION/public/vendor/FontAwesome/css
    SUNSTONE_PUBLIC_IMAGES_FILES:$SUNSTONE_LOCATION/public/images
    SUNSTONE_PUBLIC_LOCALE_EN_US:$SUNSTONE_LOCATION/public/locale/en_US
    SUNSTONE_PUBLIC_LOCALE_RU:$SUNSTONE_LOCATION/public/locale/ru
    SUNSTONE_PUBLIC_LOCALE_IT_IT:$SUNSTONE_LOCATION/public/locale/it_IT
    SUNSTONE_PUBLIC_LOCALE_PT_PT:$SUNSTONE_LOCATION/public/locale/pt_PT
    SUNSTONE_PUBLIC_LOCALE_PT_PT:$SUNSTONE_LOCATION/public/locale/fr_FR
)

INSTALL_SUNSTONE_ETC_FILES=(
    SUNSTONE_ETC_FILES:$ETC_LOCATION
)

INSTALL_OZONES_RUBY_FILES=(
    OZONES_RUBY_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula
)

INSTALL_OZONES_FILES=(
    OZONES_FILES:$OZONES_LOCATION
    OZONES_BIN_FILES:$BIN_LOCATION
    OZONES_MODELS_FILES:$OZONES_LOCATION/models
    OZONES_TEMPLATE_FILES:$OZONES_LOCATION/templates
    OZONES_LIB_FILES:$OZONES_LOCATION/lib
    OZONES_LIB_ZONE_FILES:$OZONES_LOCATION/lib/OZones
    OZONES_PUBLIC_VENDOR_JQUERY:$OZONES_LOCATION/public/vendor/jQuery
    OZONES_PUBLIC_VENDOR_DATATABLES:$OZONES_LOCATION/public/vendor/dataTables
    OZONES_PUBLIC_VENDOR_JGROWL:$OZONES_LOCATION/public/vendor/jGrowl
    OZONES_PUBLIC_VENDOR_JQUERYUI:$OZONES_LOCATION/public/vendor/jQueryUI
    OZONES_PUBLIC_VENDOR_JQUERYUIIMAGES:$OZONES_LOCATION/public/vendor/jQueryUI/images
    OZONES_PUBLIC_VENDOR_JQUERYLAYOUT:$OZONES_LOCATION/public/vendor/jQueryLayout
    OZONES_PUBLIC_VENDOR_FONTAWESOME:$OZONES_LOCATION/public/vendor/FontAwesome
    OZONES_PUBLIC_VENDOR_FONTAWESOME_FONT:$OZONES_LOCATION/public/vendor/FontAwesome/font
    OZONES_PUBLIC_VENDOR_FONTAWESOME_CSS:$OZONES_LOCATION/public/vendor/FontAwesome/css
    OZONES_PUBLIC_JS_FILES:$OZONES_LOCATION/public/js
    OZONES_PUBLIC_IMAGES_FILES:$OZONES_LOCATION/public/images
    OZONES_PUBLIC_CSS_FILES:$OZONES_LOCATION/public/css
    OZONES_PUBLIC_JS_PLUGINS_FILES:$OZONES_LOCATION/public/js/plugins
    OZONES_BIN_CLIENT_FILES:$BIN_LOCATION
    OZONES_LIB_CLIENT_CLI_FILES:$LIB_LOCATION/ruby/cli
    OZONES_LIB_CLIENT_CLI_HELPER_FILES:$LIB_LOCATION/ruby/cli/ozones_helper
    OZONES_LIB_API_FILES:$LIB_LOCATION/ruby
    OZONES_LIB_API_ZONA_FILES:$LIB_LOCATION/ruby/zona
)

INSTALL_OZONES_ETC_FILES=(
    OZONES_ETC_FILES:$ETC_LOCATION
)

INSTALL_SELF_SERVICE_FILES=(
    SELF_SERVICE_TEMPLATE_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/templates
    SELF_SERVICE_VIEWS_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/views
    SELF_SERVICE_PUBLIC_JS_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/public/js
    SELF_SERVICE_PUBLIC_JS_PLUGINS_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/public/js/plugins
    SELF_SERVICE_PUBLIC_CSS_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/public/css
    SELF_SERVICE_PUBLIC_CUSTOMIZE_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/public/customize
    SELF_SERVICE_PUBLIC_VENDOR_DATATABLES:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/dataTables
    SELF_SERVICE_PUBLIC_VENDOR_JGROWL:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jGrowl
    SELF_SERVICE_PUBLIC_VENDOR_JQUERY:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQuery
    SELF_SERVICE_PUBLIC_VENDOR_JQUERYUI:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryUI
    SELF_SERVICE_PUBLIC_VENDOR_JQUERYUIIMAGES:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryUI/images
    SELF_SERVICE_PUBLIC_VENDOR_JQUERYLAYOUT:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/jQueryLayout
    SELF_SERVICE_PUBLIC_VENDOR_FLOT:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/flot
    SELF_SERVICE_PUBLIC_VENDOR_CRYPTOJS:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/crypto-js
    SELF_SERVICE_PUBLIC_VENDOR_FILEUPLOADER:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/fileuploader
    SELF_SERVICE_PUBLIC_VENDOR_XML2JSON:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/xml2json
    SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome
    SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME_CSS:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome/css
    SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME_FONT:$LIB_LOCATION/ruby/cloud/occi/ui/public/vendor/FontAwesome/font
    SELF_SERVICE_PUBLIC_IMAGES_FILES:$LIB_LOCATION/ruby/cloud/occi/ui/public/images
    SELF_SERVICE_PUBLIC_LOCALE_EN_US:$LIB_LOCATION/ruby/cloud/occi/ui/public/locale/en_US
    SELF_SERVICE_PUBLIC_LOCALE_ES_ES:$LIB_LOCATION/ruby/cloud/occi/ui/public/locale/es_ES
    SELF_SERVICE_PUBLIC_LOCALE_FR_FR:$LIB_LOCATION/ruby/cloud/occi/ui/public/locale/fr_FR
    SELF_SERVICE_PUBLIC_LOCALE_FR_CA:$LIB_LOCATION/ruby/cloud/occi/ui/public/locale/fr_CA
)

INSTALL_ETC_FILES=(
    ETC_FILES:$ETC_LOCATION
    VMWARE_ETC_FILES:$ETC_LOCATION
    VMM_EC2_ETC_FILES:$ETC_LOCATION/vmm_ec2
    VMM_EXEC_ETC_FILES:$ETC_LOCATION/vmm_exec
    IM_EC2_ETC_FILES:$ETC_LOCATION/im_ec2
    HM_ETC_FILES:$ETC_LOCATION/hm
    AUTH_ETC_FILES:$ETC_LOCATION/auth
    ECO_ETC_FILES:$ETC_LOCATION
    ECO_ETC_TEMPLATE_FILES:$ETC_LOCATION/ec2query_templates
    OCCI_ETC_FILES:$ETC_LOCATION
    OCCI_ETC_TEMPLATE_FILES:$ETC_LOCATION/occi_templates
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
           src/onedb/onedb \
           src/onedb/onezonedb/onezonedb \
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
                src/mad/ruby/Ganglia.rb \
                src/oca/ruby/OpenNebula.rb \
                src/authm_mad/remotes/ssh/ssh_auth.rb \
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
              src/vmm_mad/ec2/one_vmm_ec2.rb \
              src/vmm_mad/ec2/one_vmm_ec2 \
              src/vmm_mad/dummy/one_vmm_dummy.rb \
              src/vmm_mad/dummy/one_vmm_dummy \
              src/im_mad/im_exec/one_im_exec.rb \
              src/im_mad/im_exec/one_im_exec \
              src/im_mad/im_exec/one_im_ssh \
              src/im_mad/im_exec/one_im_sh \
              src/im_mad/ec2/one_im_ec2.rb \
              src/im_mad/ec2/one_im_ec2 \
              src/im_mad/dummy/one_im_dummy.rb \
              src/im_mad/dummy/one_im_dummy \
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
                    src/vmm_mad/remotes/kvm/poll_ganglia \
                    src/vmm_mad/remotes/kvm/shutdown"

#-------------------------------------------------------------------------------
# VMM SH Driver Xen scripts, to be installed under $REMOTES_LOCATION/vmm/xen
#-------------------------------------------------------------------------------

VMM_EXEC_XEN_SCRIPTS="src/vmm_mad/remotes/xen/cancel \
                    src/vmm_mad/remotes/xen/deploy \
                    src/vmm_mad/remotes/xen/xenrc \
                    src/vmm_mad/remotes/xen/migrate \
                    src/vmm_mad/remotes/xen/restore \
                    src/vmm_mad/remotes/xen/reboot \
                    src/vmm_mad/remotes/xen/reset \
                    src/vmm_mad/remotes/xen/save \
                    src/vmm_mad/remotes/xen/poll \
                    src/vmm_mad/remotes/xen/poll_ganglia \
                    src/vmm_mad/remotes/xen/shutdown"

#-------------------------------------------------------------------------------
# VMM Driver VMWARE scripts, to be installed under $REMOTES_LOCATION/vmm/vmware
#-------------------------------------------------------------------------------

VMM_EXEC_VMWARE_SCRIPTS="src/vmm_mad/remotes/vmware/cancel \
                         src/vmm_mad/remotes/vmware/deploy \
                         src/vmm_mad/remotes/vmware/migrate \
                         src/vmm_mad/remotes/vmware/restore \
                         src/vmm_mad/remotes/vmware/reboot \
                         src/vmm_mad/remotes/vmware/reset \
                         src/vmm_mad/remotes/vmware/save \
                         src/vmm_mad/remotes/vmware/poll \
                         src/vmm_mad/remotes/vmware/checkpoint \
                         src/vmm_mad/remotes/vmware/shutdown \
                         src/vmm_mad/remotes/vmware/vmware_driver.rb"

#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $REMOTES_LOCATION/im
#-------------------------------------------------------------------------------

IM_PROBES_FILES="src/im_mad/remotes/run_probes"

IM_PROBES_KVM_FILES="src/im_mad/remotes/kvm.d/kvm.rb \
                     src/im_mad/remotes/kvm.d/architecture.sh \
                     src/im_mad/remotes/kvm.d/cpu.sh \
                     src/im_mad/remotes/kvm.d/name.sh"

IM_PROBES_XEN_FILES="src/im_mad/remotes/xen.d/xen.rb \
                     src/im_mad/remotes/xen.d/architecture.sh \
                     src/im_mad/remotes/xen.d/cpu.sh \
                     src/im_mad/remotes/xen.d/name.sh"

IM_PROBES_VMWARE_FILES="src/im_mad/remotes/vmware.d/vmware.rb"

IM_PROBES_GANGLIA_FILES="src/im_mad/remotes/ganglia.d/ganglia_probe"

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

NETWORK_VMWARE_FILES="src/vnm_mad/remotes/vmware/clean \
                    src/vnm_mad/remotes/vmware/post \
                    src/vnm_mad/remotes/vmware/pre \
                    src/vnm_mad/remotes/vmware/VMware.rb"

#-------------------------------------------------------------------------------
# Transfer Manager commands, to be installed under $LIB_LOCATION/tm_commands
#   - SHARED TM, $VAR_LOCATION/tm/shared
#   - QCOW2 TM, $VAR_LOCATION/tm/qcow2
#   - SSH TM, $VAR_LOCATION/tm/ssh
#   - DUMMY TM, $VAR_LOCATION/tm/dummy
#   - VMWARE TM, $VAR_LOCATION/tm/vmware
#   - ISCSI TM, $VAR_LOCATION/tm/iscsi
#   - LVM TM, $VAR_LOCATION/tm/lvm
#-------------------------------------------------------------------------------

TM_FILES="src/tm_mad/tm_common.sh"

TM_SHARED_FILES="src/tm_mad/shared/clone \
                 src/tm_mad/shared/delete \
                 src/tm_mad/shared/ln \
                 src/tm_mad/shared/mkswap \
                 src/tm_mad/shared/mkimage \
                 src/tm_mad/shared/mv \
                 src/tm_mad/shared/context \
                 src/tm_mad/shared/mvds"

TM_QCOW2_FILES="src/tm_mad/qcow2/clone \
                 src/tm_mad/qcow2/delete \
                 src/tm_mad/qcow2/ln \
                 src/tm_mad/qcow2/mkswap \
                 src/tm_mad/qcow2/mkimage \
                 src/tm_mad/qcow2/mv \
                 src/tm_mad/qcow2/context \
                 src/tm_mad/qcow2/mvds"

TM_SSH_FILES="src/tm_mad/ssh/clone \
              src/tm_mad/ssh/delete \
              src/tm_mad/ssh/ln \
              src/tm_mad/ssh/mkswap \
              src/tm_mad/ssh/mkimage \
              src/tm_mad/ssh/mv \
              src/tm_mad/ssh/context \
              src/tm_mad/ssh/mvds"

TM_DUMMY_FILES="src/tm_mad/dummy/clone \
              src/tm_mad/dummy/delete \
              src/tm_mad/dummy/ln \
              src/tm_mad/dummy/mkswap \
              src/tm_mad/dummy/mkimage \
              src/tm_mad/dummy/mv \
              src/tm_mad/dummy/context \
              src/tm_mad/dummy/mvds"

TM_VMWARE_FILES="src/tm_mad/vmware/clone \
                 src/tm_mad/vmware/delete
                 src/tm_mad/vmware/ln \
                 src/tm_mad/vmware/mkswap \
                 src/tm_mad/vmware/mkimage \
                 src/tm_mad/vmware/mv \
                 src/tm_mad/vmware/context \
                 src/tm_mad/vmware/mvds"

TM_ISCSI_FILES="src/tm_mad/iscsi/clone \
                 src/tm_mad/iscsi/ln \
                 src/tm_mad/iscsi/mv \
                 src/tm_mad/iscsi/mvds \
                 src/tm_mad/iscsi/delete"

TM_LVM_FILES="src/tm_mad/lvm/clone \
                 src/tm_mad/lvm/ln \
                 src/tm_mad/lvm/mv \
                 src/tm_mad/lvm/mvds \
                 src/tm_mad/lvm/delete"

#-------------------------------------------------------------------------------
# Datastore drivers, to be installed under $REMOTES_LOCATION/datastore
#   - Dummy Image Repository, $REMOTES_LOCATION/datastore/dummy
#   - FS based Image Repository, $REMOTES_LOCATION/datastore/fs
#   - VMware based Image Repository, $REMOTES_LOCATION/datastore/vmware
#   - iSCSI based Image Repository, $REMOTES_LOCATION/datastore/iscsi
#   - LVM based Image Repository, $REMOTES_LOCATION/datastore/lvm
#-------------------------------------------------------------------------------

DATASTORE_DRIVER_COMMON_SCRIPTS="src/datastore_mad/remotes/xpath.rb \
                             src/datastore_mad/remotes/libfs.sh"

DATASTORE_DRIVER_DUMMY_SCRIPTS="src/datastore_mad/remotes/dummy/cp \
                         src/datastore_mad/remotes/dummy/mkfs \
                         src/datastore_mad/remotes/dummy/stat \
                         src/datastore_mad/remotes/dummy/rm"

DATASTORE_DRIVER_FS_SCRIPTS="src/datastore_mad/remotes/fs/cp \
                         src/datastore_mad/remotes/fs/mkfs \
                         src/datastore_mad/remotes/fs/stat \
                         src/datastore_mad/remotes/fs/rm"

DATASTORE_DRIVER_VMWARE_SCRIPTS="src/datastore_mad/remotes/vmware/cp \
                         src/datastore_mad/remotes/vmware/mkfs \
                         src/datastore_mad/remotes/vmware/stat \
                         src/datastore_mad/remotes/vmware/rm"

DATASTORE_DRIVER_ISCSI_SCRIPTS="src/datastore_mad/remotes/iscsi/cp \
                         src/datastore_mad/remotes/iscsi/mkfs \
                         src/datastore_mad/remotes/iscsi/stat \
                         src/datastore_mad/remotes/iscsi/rm \
                         src/datastore_mad/remotes/iscsi/iscsi.conf"

DATASTORE_DRIVER_LVM_SCRIPTS="src/datastore_mad/remotes/lvm/cp \
                         src/datastore_mad/remotes/lvm/mkfs \
                         src/datastore_mad/remotes/lvm/stat \
                         src/datastore_mad/remotes/lvm/rm \
                         src/datastore_mad/remotes/lvm/lvm.conf"

#-------------------------------------------------------------------------------
# Migration scripts for onedb command, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------
ONEDB_MIGRATOR_FILES="src/onedb/2.0_to_2.9.80.rb \
                      src/onedb/2.9.80_to_2.9.85.rb \
                      src/onedb/2.9.85_to_2.9.90.rb \
                      src/onedb/2.9.90_to_3.0.0.rb \
                      src/onedb/3.0.0_to_3.1.0.rb \
                      src/onedb/3.1.0_to_3.1.80.rb \
                      src/onedb/3.1.80_to_3.2.0.rb \
                      src/onedb/3.2.0_to_3.2.1.rb \
                      src/onedb/3.2.1_to_3.3.0.rb \
                      src/onedb/3.3.0_to_3.3.80.rb \
                      src/onedb/3.3.80_to_3.4.0.rb \
                      src/onedb/3.4.0_to_3.4.1.rb \
                      src/onedb/3.4.1_to_3.5.80.rb \
                      src/onedb/onedb.rb \
                      src/onedb/onedb_backend.rb"

#-------------------------------------------------------------------------------
# Configuration files for OpenNebula, to be installed under $ETC_LOCATION
#-------------------------------------------------------------------------------

ETC_FILES="share/etc/oned.conf \
           share/etc/defaultrc \
           src/scheduler/etc/sched.conf \
           src/cli/etc/group.default"

VMWARE_ETC_FILES="src/vmm_mad/remotes/vmware/vmwarerc"

#-------------------------------------------------------------------------------
# Virtualization drivers config. files, to be installed under $ETC_LOCATION
#   - ec2, $ETC_LOCATION/vmm_ec2
#   - ssh, $ETC_LOCATION/vmm_exec
#-------------------------------------------------------------------------------

VMM_EC2_ETC_FILES="src/vmm_mad/ec2/vmm_ec2rc \
                   src/vmm_mad/ec2/vmm_ec2.conf"

VMM_EXEC_ETC_FILES="src/vmm_mad/exec/vmm_execrc \
                  src/vmm_mad/exec/vmm_exec_kvm.conf \
                  src/vmm_mad/exec/vmm_exec_xen.conf \
                  src/vmm_mad/exec/vmm_exec_vmware.conf"

#-------------------------------------------------------------------------------
# Information drivers config. files, to be installed under $ETC_LOCATION
#   - ec2, $ETC_LOCATION/im_ec2
#-------------------------------------------------------------------------------

IM_EC2_ETC_FILES="src/im_mad/ec2/im_ec2rc \
                  src/im_mad/ec2/im_ec2.conf"

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
# HOOK scripts, to be installed under $VAR_LOCATION/remotes/hooks
#-------------------------------------------------------------------------------

HOOK_FT_FILES="share/hooks/host_error.rb"

#-------------------------------------------------------------------------------
# Installation scripts, to be installed under $SHARE_LOCATION
#-------------------------------------------------------------------------------

INSTALL_NOVNC_SHARE_FILE="share/install_novnc.sh"
INSTALL_GEMS_SHARE_FILE="share/install_gems/install_gems"

#-------------------------------------------------------------------------------
# OCA Files
#-------------------------------------------------------------------------------
OCA_LIB_FILES="src/oca/ruby/OpenNebula.rb"

RUBY_OPENNEBULA_LIB_FILES="src/oca/ruby/OpenNebula/Host.rb \
                           src/oca/ruby/OpenNebula/HostPool.rb \
                           src/oca/ruby/OpenNebula/Pool.rb \
                           src/oca/ruby/OpenNebula/User.rb \
                           src/oca/ruby/OpenNebula/UserPool.rb \
                           src/oca/ruby/OpenNebula/VirtualMachine.rb \
                           src/oca/ruby/OpenNebula/VirtualMachinePool.rb \
                           src/oca/ruby/OpenNebula/VirtualNetwork.rb \
                           src/oca/ruby/OpenNebula/VirtualNetworkPool.rb \
                           src/oca/ruby/OpenNebula/Image.rb \
                           src/oca/ruby/OpenNebula/ImagePool.rb \
                           src/oca/ruby/OpenNebula/Template.rb \
                           src/oca/ruby/OpenNebula/TemplatePool.rb \
                           src/oca/ruby/OpenNebula/Group.rb \
                           src/oca/ruby/OpenNebula/GroupPool.rb \
                           src/oca/ruby/OpenNebula/Acl.rb \
                           src/oca/ruby/OpenNebula/AclPool.rb \
                           src/oca/ruby/OpenNebula/Datastore.rb \
                           src/oca/ruby/OpenNebula/DatastorePool.rb \
                           src/oca/ruby/OpenNebula/Cluster.rb \
                           src/oca/ruby/OpenNebula/ClusterPool.rb \
                           src/oca/ruby/OpenNebula/XMLUtils.rb"

#-------------------------------------------------------------------------------
# Common Cloud Files
#-------------------------------------------------------------------------------

COMMON_CLOUD_LIB_FILES="src/cloud/common/CloudServer.rb \
                        src/cloud/common/CloudClient.rb \
                        src/cloud/common/CloudAuth.rb"

COMMON_CLOUD_CLIENT_LIB_FILES="src/cloud/common/CloudClient.rb"

CLOUD_AUTH_LIB_FILES="src/cloud/common/CloudAuth/OCCICloudAuth.rb \
                      src/cloud/common/CloudAuth/SunstoneCloudAuth.rb \
                      src/cloud/common/CloudAuth/EC2CloudAuth.rb \
                      src/cloud/common/CloudAuth/X509CloudAuth.rb \
                      src/cloud/common/CloudAuth/OpenNebulaCloudAuth.rb"

#-------------------------------------------------------------------------------
# EC2 Query for OpenNebula
#-------------------------------------------------------------------------------

ECO_LIB_FILES="src/cloud/ec2/lib/EC2QueryClient.rb \
               src/cloud/ec2/lib/EC2QueryServer.rb \
               src/cloud/ec2/lib/ImageEC2.rb \
               src/cloud/ec2/lib/elastic_ip.rb \
               src/cloud/ec2/lib/econe-server.rb"

ECO_LIB_CLIENT_FILES="src/cloud/ec2/lib/EC2QueryClient.rb"

ECO_LIB_VIEW_FILES="src/cloud/ec2/lib/views/describe_images.erb \
                    src/cloud/ec2/lib/views/describe_instances.erb \
                    src/cloud/ec2/lib/views/register_image.erb \
                    src/cloud/ec2/lib/views/run_instances.erb \
                    src/cloud/ec2/lib/views/allocate_address.erb \
                    src/cloud/ec2/lib/views/associate_address.erb \
                    src/cloud/ec2/lib/views/disassociate_address.erb \
                    src/cloud/ec2/lib/views/describe_addresses.erb \
                    src/cloud/ec2/lib/views/release_address.erb \
                    src/cloud/ec2/lib/views/terminate_instances.erb"

ECO_BIN_FILES="src/cloud/ec2/bin/econe-server \
               src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
               src/cloud/ec2/bin/econe-describe-addresses \
               src/cloud/ec2/bin/econe-allocate-address \
               src/cloud/ec2/bin/econe-release-address \
               src/cloud/ec2/bin/econe-associate-address \
               src/cloud/ec2/bin/econe-disassociate-address \
               src/cloud/ec2/bin/econe-upload"

ECO_BIN_CLIENT_FILES="src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
               src/cloud/ec2/bin/econe-describe-addresses \
               src/cloud/ec2/bin/econe-allocate-address \
               src/cloud/ec2/bin/econe-release-address \
               src/cloud/ec2/bin/econe-associate-address \
               src/cloud/ec2/bin/econe-disassociate-address \
               src/cloud/ec2/bin/econe-upload"

ECO_ETC_FILES="src/cloud/ec2/etc/econe.conf"

ECO_ETC_TEMPLATE_FILES="src/cloud/ec2/etc/templates/m1.small.erb"

#-----------------------------------------------------------------------------
# OCCI files
#-----------------------------------------------------------------------------

OCCI_LIB_FILES="src/cloud/occi/lib/OCCIServer.rb \
                src/cloud/occi/lib/occi-server.rb \
                src/cloud/occi/lib/OCCIClient.rb \
                src/cloud/occi/lib/VirtualMachineOCCI.rb \
                src/cloud/occi/lib/VirtualMachinePoolOCCI.rb \
                src/cloud/occi/lib/VirtualNetworkOCCI.rb \
                src/cloud/occi/lib/VirtualNetworkPoolOCCI.rb \
                src/cloud/occi/lib/UserOCCI.rb \
                src/cloud/occi/lib/UserPoolOCCI.rb \
                src/cloud/occi/lib/ImageOCCI.rb \
                src/cloud/occi/lib/ImagePoolOCCI.rb \
                src/sunstone/OpenNebulaVNC.rb"

OCCI_LIB_CLIENT_FILES="src/cloud/occi/lib/OCCIClient.rb"

OCCI_BIN_FILES="src/cloud/occi/bin/occi-server \
               src/cloud/occi/bin/occi-compute \
               src/cloud/occi/bin/occi-network \
               src/cloud/occi/bin/occi-instance-type \
               src/cloud/occi/bin/occi-storage"

OCCI_BIN_CLIENT_FILES="src/cloud/occi/bin/occi-compute \
               src/cloud/occi/bin/occi-network \
               src/cloud/occi/bin/occi-instance-type \
               src/cloud/occi/bin/occi-storage"

OCCI_ETC_FILES="src/cloud/occi/etc/occi-server.conf"

OCCI_ETC_TEMPLATE_FILES="src/cloud/occi/etc/templates/common.erb \
                    src/cloud/occi/etc/templates/custom.erb \
                    src/cloud/occi/etc/templates/small.erb \
                    src/cloud/occi/etc/templates/medium.erb \
                    src/cloud/occi/etc/templates/network.erb \
                    src/cloud/occi/etc/templates/large.erb"

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
                   src/cli/one_helper/onecluster_helper.rb"

CLI_BIN_FILES="src/cli/onevm \
               src/cli/onehost \
               src/cli/onevnet \
               src/cli/oneuser \
               src/cli/oneimage \
               src/cli/onetemplate \
               src/cli/onegroup \
               src/cli/oneacl \
               src/cli/onedatastore \
               src/cli/onecluster"

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
                src/cli/etc/oneacct.yaml"

ETC_CLIENT_FILES="src/cli/etc/group.default"

#-----------------------------------------------------------------------------
# Sunstone files
#-----------------------------------------------------------------------------

SUNSTONE_FILES="src/sunstone/sunstone-server.rb \
                src/sunstone/OpenNebulaVNC.rb"

SUNSTONE_BIN_FILES="src/sunstone/bin/sunstone-server"

SUNSTONE_ETC_FILES="src/sunstone/etc/sunstone-server.conf \
                    src/sunstone/etc/sunstone-plugins.yaml"

SUNSTONE_MODELS_FILES="src/sunstone/models/OpenNebulaJSON.rb \
                       src/sunstone/models/SunstoneServer.rb \
                       src/sunstone/models/SunstonePlugins.rb"

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
                    src/sunstone/models/OpenNebulaJSON/VirtualNetworkJSON.rb"

SUNSTONE_TEMPLATE_FILES="src/sunstone/templates/login.html \
                         src/sunstone/templates/login_x509.html"

SUNSTONE_VIEWS_FILES="src/sunstone/views/index.erb"

SUNSTONE_PUBLIC_JS_FILES="src/sunstone/public/js/layout.js \
                        src/sunstone/public/js/login.js \
                        src/sunstone/public/js/sunstone.js \
                        src/sunstone/public/js/sunstone-util.js \
                        src/sunstone/public/js/opennebula.js \
                        src/sunstone/public/js/monitoring.js \
                        src/sunstone/public/js/locale.js"

SUNSTONE_PUBLIC_JS_PLUGINS_FILES="\
                        src/sunstone/public/js/plugins/dashboard-tab.js \
                        src/sunstone/public/js/plugins/dashboard-users-tab.js \
                        src/sunstone/public/js/plugins/hosts-tab.js \
                        src/sunstone/public/js/plugins/clusters-tab.js \
                        src/sunstone/public/js/plugins/datastores-tab.js \
                        src/sunstone/public/js/plugins/system-tab.js \
                        src/sunstone/public/js/plugins/vresources-tab.js \
                        src/sunstone/public/js/plugins/infra-tab.js \
                        src/sunstone/public/js/plugins/groups-tab.js \
                        src/sunstone/public/js/plugins/images-tab.js \
                        src/sunstone/public/js/plugins/templates-tab.js \
                        src/sunstone/public/js/plugins/users-tab.js \
                        src/sunstone/public/js/plugins/vms-tab.js \
                        src/sunstone/public/js/plugins/acls-tab.js \
                        src/sunstone/public/js/plugins/vnets-tab.js \
                        src/sunstone/public/js/plugins/config-tab.js"

SUNSTONE_PUBLIC_CSS_FILES="src/sunstone/public/css/application.css \
                           src/sunstone/public/css/layout.css \
                           src/sunstone/public/css/login.css"

SUNSTONE_PUBLIC_VENDOR_DATATABLES="\
                src/sunstone/public/vendor/dataTables/jquery.dataTables.min.js \
                src/sunstone/public/vendor/dataTables/ColVis.min.js \
                src/sunstone/public/vendor/dataTables/ColReorderWithResize.js \
                src/sunstone/public/vendor/dataTables/demo_table_jui.css \
                src/sunstone/public/vendor/dataTables/ColVis.css \
                src/sunstone/public/vendor/dataTables/BSD-LICENSE.txt \
                src/sunstone/public/vendor/dataTables/NOTICE"

SUNSTONE_PUBLIC_VENDOR_JGROWL="\
                src/sunstone/public/vendor/jGrowl/jquery.jgrowl_minimized.js \
                src/sunstone/public/vendor/jGrowl/jquery.jgrowl.css \
                src/sunstone/public/vendor/jGrowl/NOTICE"

SUNSTONE_PUBLIC_VENDOR_JQUERY="\
                        src/sunstone/public/vendor/jQuery/jquery-1.7.2.min.js \
                        src/sunstone/public/vendor/jQuery/MIT-LICENSE.txt \
                        src/sunstone/public/vendor/jQuery/NOTICE"

SUNSTONE_PUBLIC_VENDOR_JQUERYUI="\
src/sunstone/public/vendor/jQueryUI/jquery-ui-1.8.16.custom.css \
src/sunstone/public/vendor/jQueryUI/MIT-LICENSE.txt \
src/sunstone/public/vendor/jQueryUI/jquery-ui-1.8.16.custom.min.js \
src/sunstone/public/vendor/jQueryUI/NOTICE \
"

SUNSTONE_PUBLIC_VENDOR_JQUERYUIIMAGES="\
src/sunstone/public/vendor/jQueryUI/images/ui-bg_flat_0_aaaaaa_40x100.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_flat_75_ffffff_40x100.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_glass_55_fbf9ee_1x400.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_glass_65_ffffff_1x400.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_glass_75_dadada_1x400.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_glass_75_e6e6e6_1x400.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_glass_95_fef1ec_1x400.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-bg_highlight-soft_75_cccccc_1x100.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-icons_222222_256x240.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-icons_2e83ff_256x240.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-icons_454545_256x240.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-icons_888888_256x240.png  \
src/sunstone/public/vendor/jQueryUI/images/ui-icons_cd0a0a_256x240.png  \
"

SUNSTONE_PUBLIC_VENDOR_JQUERYLAYOUT="\
            src/sunstone/public/vendor/jQueryLayout/layout-default-latest.css \
            src/sunstone/public/vendor/jQueryLayout/jquery.layout-latest.min.js \
            src/sunstone/public/vendor/jQueryLayout/NOTICE"

SUNSTONE_PUBLIC_VENDOR_FLOT="\
src/sunstone/public/vendor/flot/jquery.flot.min.js \
src/sunstone/public/vendor/flot/jquery.flot.navigate.min.js \
src/sunstone/public/vendor/flot/jquery.flot.pie.min.js \
src/sunstone/public/vendor/flot/LICENSE.txt \
src/sunstone/public/vendor/flot/NOTICE \
src/sunstone/public/vendor/flot/README.txt"

SUNSTONE_PUBLIC_VENDOR_CRYPTOJS="\
src/sunstone/public/vendor/crypto-js/NOTICE \
src/sunstone/public/vendor/crypto-js/2.3.0-crypto-sha1.js \
src/sunstone/public/vendor/crypto-js/NEW-BSD-LICENSE.txt"

SUNSTONE_PUBLIC_VENDOR_FILEUPLOADER="\
src/sunstone/public/vendor/fileuploader/NOTICE \
src/sunstone/public/vendor/fileuploader/fileuploader.js"

SUNSTONE_PUBLIC_VENDOR_XML2JSON="\
src/sunstone/public/vendor/xml2json/NOTICE \
src/sunstone/public/vendor/xml2json/jquery.xml2json.pack.js"

SUNSTONE_PUBLIC_VENDOR_FONTAWESOME="\
src/sunstone/public/vendor/FontAwesome/NOTICE \
"

SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_CSS="\
src/sunstone/public/vendor/FontAwesome/css/font-awesome.css \
"

SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_FONT="\
src/sunstone/public/vendor/FontAwesome/font/fontawesome-webfont.eot \
src/sunstone/public/vendor/FontAwesome/font/fontawesome-webfont.woff \
src/sunstone/public/vendor/FontAwesome/font/fontawesome-webfont.ttf \
src/sunstone/public/vendor/FontAwesome/font/fontawesome-webfont.svgz \
src/sunstone/public/vendor/FontAwesome/font/fontawesome-webfont.svg \
"

SUNSTONE_PUBLIC_IMAGES_FILES="src/sunstone/public/images/ajax-loader.gif \
                        src/sunstone/public/images/login_over.png \
                        src/sunstone/public/images/login.png \
                        src/sunstone/public/images/opennebula-sunstone-big.png \
                        src/sunstone/public/images/opennebula-sunstone-small.png \
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
                        src/sunstone/public/images/server_icon.png \
"

SUNSTONE_PUBLIC_LOCALE_EN_US="\
src/sunstone/locale/languages/en_US.js \
src/sunstone/locale/languages/en_datatable.txt \
"

SUNSTONE_PUBLIC_LOCALE_RU="
src/sunstone/locale/languages/ru.js \
src/sunstone/locale/languages/ru_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_IT_IT="
src/sunstone/locale/languages/it_IT.js \
src/sunstone/locale/languages/it_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_PT_PT="
src/sunstone/locale/languages/pt_PT.js \
src/sunstone/locale/languages/pt_datatable.txt"

SUNSTONE_PUBLIC_LOCALE_FR_FR="
src/sunstone/locale/languages/fr_FR.js \
src/sunstone/locale/languages/fr_datatable.txt"

#-----------------------------------------------------------------------------
# Ozones files
#-----------------------------------------------------------------------------

OZONES_FILES="src/ozones/Server/ozones-server.rb"

OZONES_BIN_FILES="src/ozones/Server/bin/ozones-server"

OZONES_ETC_FILES="src/ozones/Server/etc/ozones-server.conf"

OZONES_MODELS_FILES="src/ozones/Server/models/OzonesServer.rb \
                     src/ozones/Server/models/Auth.rb \
                     src/sunstone/models/OpenNebulaJSON/JSONUtils.rb"

OZONES_TEMPLATE_FILES="src/ozones/Server/templates/index.html \
                       src/ozones/Server/templates/login.html"

OZONES_LIB_FILES="src/ozones/Server/lib/OZones.rb"

OZONES_LIB_ZONE_FILES="src/ozones/Server/lib/OZones/Zones.rb \
                src/ozones/Server/lib/OZones/VDC.rb \
                src/ozones/Server/lib/OZones/ProxyRules.rb \
                src/ozones/Server/lib/OZones/ApacheWritter.rb \
                src/ozones/Server/lib/OZones/AggregatedHosts.rb \
                src/ozones/Server/lib/OZones/AggregatedUsers.rb \
                src/ozones/Server/lib/OZones/AggregatedVirtualMachines.rb \
                src/ozones/Server/lib/OZones/AggregatedVirtualNetworks.rb \
                src/ozones/Server/lib/OZones/AggregatedPool.rb \
                src/ozones/Server/lib/OZones/AggregatedImages.rb \
                src/ozones/Server/lib/OZones/AggregatedDatastores.rb \
                src/ozones/Server/lib/OZones/AggregatedClusters.rb \
                src/ozones/Server/lib/OZones/AggregatedTemplates.rb"

OZONES_LIB_API_FILES="src/ozones/Client/lib/zona.rb"

OZONES_LIB_API_ZONA_FILES="src/ozones/Client/lib/zona/ZoneElement.rb \
                src/ozones/Client/lib/zona/OZonesPool.rb \
                src/ozones/Client/lib/zona/OZonesJSON.rb \
                src/ozones/Client/lib/zona/VDCPool.rb \
                src/ozones/Client/lib/zona/VDCElement.rb \
                src/ozones/Client/lib/zona/OZonesElement.rb \
                src/ozones/Client/lib/zona/ZonePool.rb"

OZONES_PUBLIC_VENDOR_JQUERY=$SUNSTONE_PUBLIC_VENDOR_JQUERY

OZONES_PUBLIC_VENDOR_DATATABLES=$SUNSTONE_PUBLIC_VENDOR_DATATABLES

OZONES_PUBLIC_VENDOR_JGROWL=$SUNSTONE_PUBLIC_VENDOR_JGROWL

OZONES_PUBLIC_VENDOR_JQUERYUI=$SUNSTONE_PUBLIC_VENDOR_JQUERYUI

OZONES_PUBLIC_VENDOR_JQUERYUIIMAGES=$SUNSTONE_PUBLIC_VENDOR_JQUERYUIIMAGES

OZONES_PUBLIC_VENDOR_JQUERYLAYOUT=$SUNSTONE_PUBLIC_VENDOR_JQUERYLAYOUT

OZONES_PUBLIC_VENDOR_FONTAWESOME=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME

OZONES_PUBLIC_VENDOR_FONTAWESOME_FONT=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_FONT

OZONES_PUBLIC_VENDOR_FONTAWESOME_CSS=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_CSS

OZONES_PUBLIC_JS_FILES="src/ozones/Server/public/js/ozones.js \
                        src/ozones/Server/public/js/login.js \
                        src/ozones/Server/public/js/ozones-util.js \
                        src/sunstone/public/js/layout.js \
                        src/sunstone/public/js/sunstone.js \
                        src/sunstone/public/js/sunstone-util.js \
                        src/sunstone/public/js/locale.js"

OZONES_PUBLIC_CSS_FILES="src/ozones/Server/public/css/application.css \
                         src/ozones/Server/public/css/layout.css \
                         src/ozones/Server/public/css/login.css"

OZONES_PUBLIC_IMAGES_FILES="src/ozones/Server/public/images/panel.png \
                        src/ozones/Server/public/images/login.png \
                        src/ozones/Server/public/images/login_over.png \
                        src/ozones/Server/public/images/Refresh-icon.png \
                        src/ozones/Server/public/images/ajax-loader.gif \
                        src/ozones/Server/public/images/opennebula-zones-small.png \
                        src/ozones/Server/public/images/opennebula-zones-big.png \
                        src/ozones/Server/public/images/pbar.gif"

OZONES_PUBLIC_JS_PLUGINS_FILES="src/ozones/Server/public/js/plugins/zones-tab.js \
                               src/ozones/Server/public/js/plugins/vdcs-tab.js \
                               src/ozones/Server/public/js/plugins/aggregated-tab.js \
                               src/ozones/Server/public/js/plugins/dashboard-tab.js"

OZONES_LIB_CLIENT_CLI_FILES="src/ozones/Client/lib/cli/ozones_helper.rb"

OZONES_LIB_CLIENT_CLI_HELPER_FILES="\
                src/ozones/Client/lib/cli/ozones_helper/vdc_helper.rb \
                src/ozones/Client/lib/cli/ozones_helper/zones_helper.rb"

OZONES_BIN_CLIENT_FILES="src/ozones/Client/bin/onevdc \
                         src/ozones/Client/bin/onezone"

OZONES_RUBY_LIB_FILES="src/oca/ruby/OpenNebula.rb"

#-----------------------------------------------------------------------------
# Self-Service files
#-----------------------------------------------------------------------------

SELF_SERVICE_TEMPLATE_FILES="src/cloud/occi/lib/ui/templates/login.html"
SELF_SERVICE_VIEWS_FILES="src/cloud/occi/lib/ui/views/index.erb"
SELF_SERVICE_PUBLIC_JS_FILES="src/cloud/occi/lib/ui/public/js/layout.js \
                    src/cloud/occi/lib/ui/public/js/occi.js \
                    src/cloud/occi/lib/ui/public/js/locale.js \
                    src/cloud/occi/lib/ui/public/js/login.js \
                    src/sunstone/public/js/sunstone.js \
                    src/sunstone/public/js/sunstone-util.js"

SELF_SERVICE_PUBLIC_JS_PLUGINS_FILES="src/cloud/occi/lib/ui/public/js/plugins/compute.js \
                    src/cloud/occi/lib/ui/public/js/plugins/configuration.js \
                    src/cloud/occi/lib/ui/public/js/plugins/dashboard.js \
                    src/cloud/occi/lib/ui/public/js/plugins/network.js \
                    src/cloud/occi/lib/ui/public/js/plugins/storage.js"


SELF_SERVICE_PUBLIC_CSS_FILES="src/cloud/occi/lib/ui/public/css/application.css \
                    src/cloud/occi/lib/ui/public/css/layout.css \
                    src/cloud/occi/lib/ui/public/css/login.css"

SELF_SERVICE_PUBLIC_CUSTOMIZE_FILES="src/cloud/occi/lib/ui/public/customize/custom.js"


SELF_SERVICE_PUBLIC_VENDOR_DATATABLES=$SUNSTONE_PUBLIC_VENDOR_DATATABLES
SELF_SERVICE_PUBLIC_VENDOR_JGROWL=$SUNSTONE_PUBLIC_VENDOR_JGROWL
SELF_SERVICE_PUBLIC_VENDOR_JQUERY=$SUNSTONE_PUBLIC_VENDOR_JQUERY
SELF_SERVICE_PUBLIC_VENDOR_JQUERYUI=$SUNSTONE_PUBLIC_VENDOR_JQUERYUI
SELF_SERVICE_PUBLIC_VENDOR_JQUERYUIIMAGES=$SUNSTONE_PUBLIC_VENDOR_JQUERYUIIMAGES
SELF_SERVICE_PUBLIC_VENDOR_JQUERYLAYOUT=$SUNSTONE_PUBLIC_VENDOR_JQUERYLAYOUT
SELF_SERVICE_PUBLIC_VENDOR_FLOT=$SUNSTONE_PUBLIC_VENDOR_FLOT
SELF_SERVICE_PUBLIC_VENDOR_CRYPTOJS=$SUNSTONE_PUBLIC_VENDOR_CRYPTOJS
SELF_SERVICE_PUBLIC_VENDOR_FILEUPLOADER=$SUNSTONE_PUBLIC_VENDOR_FILEUPLOADER
SELF_SERVICE_PUBLIC_VENDOR_XML2JSON=$SUNSTONE_PUBLIC_VENDOR_XML2JSON
SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME
SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME_FONT=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_FONT
SELF_SERVICE_PUBLIC_VENDOR_FONTAWESOME_CSS=$SUNSTONE_PUBLIC_VENDOR_FONTAWESOME_CSS

SELF_SERVICE_PUBLIC_IMAGES_FILES="\
src/cloud/occi/lib/ui/public/images/ajax-loader.gif \
src/cloud/occi/lib/ui/public/images/green_bullet.png \
src/cloud/occi/lib/ui/public/images/login_over.png \
src/cloud/occi/lib/ui/public/images/login.png \
src/cloud/occi/lib/ui/public/images/network_icon.png \
src/cloud/occi/lib/ui/public/images/one-compute.png \
src/cloud/occi/lib/ui/public/images/one-network.png \
src/cloud/occi/lib/ui/public/images/one-storage.png \
src/cloud/occi/lib/ui/public/images/opennebula-selfservice-big.png \
src/cloud/occi/lib/ui/public/images/opennebula-selfservice-icon.png \
src/cloud/occi/lib/ui/public/images/opennebula-selfservice-small.png \
src/cloud/occi/lib/ui/public/images/panel.png \
src/cloud/occi/lib/ui/public/images/panel_short.png \
src/cloud/occi/lib/ui/public/images/pbar.gif \
src/cloud/occi/lib/ui/public/images/red_bullet.png \
src/cloud/occi/lib/ui/public/images/Refresh-icon.png \
src/cloud/occi/lib/ui/public/images/server_icon.png \
src/cloud/occi/lib/ui/public/images/storage_icon.png \
src/cloud/occi/lib/ui/public/images/vnc_off.png \
src/cloud/occi/lib/ui/public/images/vnc_on.png \
src/cloud/occi/lib/ui/public/images/yellow_bullet.png"

SELF_SERVICE_PUBLIC_LOCALE_EN_US="src/cloud/occi/lib/ui/locale/languages/en_US.js"
SELF_SERVICE_PUBLIC_LOCALE_ES_ES="src/cloud/occi/lib/ui/locale/languages/es_ES.js \
                                  src/cloud/occi/lib/ui/locale/languages/es_datatable.txt"
SELF_SERVICE_PUBLIC_LOCALE_FR_FR="src/cloud/occi/lib/ui/locale/languages/fr_FR.js \
                                  src/cloud/occi/lib/ui/locale/languages/fr_datatable.txt"
SELF_SERVICE_PUBLIC_LOCALE_FR_CA="src/cloud/occi/lib/ui/locale/languages/fr_CA.js \
                                  src/cloud/occi/lib/ui/locale/languages/fr_datatable.txt"

#-----------------------------------------------------------------------------
# MAN files
#-----------------------------------------------------------------------------

MAN_FILES="share/man/oneauth.1.gz \
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
        share/man/econe-describe-images.1.gz \
        share/man/econe-describe-instances.1.gz \
        share/man/econe-register.1.gz \
        share/man/econe-run-instances.1.gz \
        share/man/econe-terminate-instances.1.gz \
        share/man/econe-upload.1.gz \
        share/man/occi-compute.1.gz \
        share/man/occi-network.1.gz \
        share/man/occi-storage.1.gz \
        share/man/onezone.1.gz \
        share/man/onevdc.1.gz"

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

    # Remove old migrators
    rm $LIB_LOCATION/ruby/onedb/*.rb &> /dev/null
fi

# --- Install/Uninstall files ---

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm $2/`basename $1`
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
elif [ "$SUNSTONE" = "yes" ]; then
    INSTALL_SET="${INSTALL_SUNSTONE_RUBY_FILES[@]} ${INSTALL_SUNSTONE_FILES[@]}"
elif [ "$OZONES" = "yes" ]; then
    INSTALL_SET="${INSTALL_OZONES_RUBY_FILES[@]} ${INSTALL_OZONES_FILES[@]}"
else
    INSTALL_SET="${INSTALL_FILES[@]} ${INSTALL_OZONES_FILES[@]} \
                 ${INSTALL_SUNSTONE_FILES[@]} ${INSTALL_SELF_SERVICE_FILES[@]}"
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
    elif [ "$OZONES" = "yes" ]; then
        INSTALL_ETC_SET="${INSTALL_OZONES_ETC_FILES[@]}"
    else
        INSTALL_ETC_SET="${INSTALL_ETC_FILES[@]} \
                         ${INSTALL_SUNSTONE_ETC_FILES[@]} \
                         ${INSTALL_OZONES_ETC_FILES[@]}"
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

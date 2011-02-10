#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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
# not need run the OpenNebula daemon with root priviledges
#-------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: install.sh [-u install_user] [-g install_group] [-k keep conf]"
 echo "                  [-d ONE_LOCATION] [-c occi|ec2] [-r] [-h]"
 echo
 echo "-u: user that will run opennebula, defults to user executing install.sh"
 echo "-g: group of the user that will run opennebula, defults to user"
 echo "    executing install.sh"
 echo "-k: keep configuration files of existing OpenNebula installation, useful"
 echo "    when upgrading. This flag should not be set when installing" 
 echo "    OpenNebula for the first time"
 echo "-d: target installation directory, if not defined it'd be root. Must be"
 echo "    an absolute path."
 echo "-c: install client utilities: OpenNebula cli, occi and ec2 client files"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o hkrlcu:g:d: -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

INSTALL_ETC="yes"
UNINSTALL="no"
LINK="no"
CLIENT="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -k) INSTALL_ETC="no"   ; shift ;;
        -r) UNINSTALL="yes"   ; shift ;;
        -l) LINK="yes" ; shift ;;
        -c) CLIENT="yes" ; shift ;;
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

if [ -z "$ROOT" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    IMAGES_LOCATION="$VAR_LOCATION/images"
    RUN_LOCATION="/var/run/one"
    LOCK_LOCATION="/var/lock/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/one"
    MAN_LOCATION="/usr/share/man/man8"

    if [ "$CLIENT" = "no" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION $LOCK_LOCATION \
                   $IMAGES_LOCATION $MAN_LOCATION"

        DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                     $RUN_LOCATION $SHARE_DIRS"

        CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION $LOCK_LOCATION"
    else
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION"

        DELETE_DIRS=""

        CHOWN_DIRS=""
    fi

else
    BIN_LOCATION="$ROOT/bin"
    LIB_LOCATION="$ROOT/lib"
    ETC_LOCATION="$ROOT/etc"
    VAR_LOCATION="$ROOT/var"
    IMAGES_LOCATION="$VAR_LOCATION/images"
    INCLUDE_LOCATION="$ROOT/include"
    SHARE_LOCATION="$ROOT/share"
    MAN_LOCATION="$ROOT/share/man/man8"

    if [ "$CLIENT" = "no" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION $IMAGES_LOCATION \
                   $MAN_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"

        CHOWN_DIRS="$ROOT"
    else
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION"

        DELETE_DIRS="$MAKE_DIRS"
    fi

    CHOWN_DIRS="$ROOT"
fi

SHARE_DIRS="$SHARE_LOCATION/examples \
            $SHARE_LOCATION/examples/tm \
            $SHARE_LOCATION/hooks"

ETC_DIRS="$ETC_LOCATION/im_kvm \
          $ETC_LOCATION/im_xen \
          $ETC_LOCATION/im_ec2 \
          $ETC_LOCATION/vmm_ec2 \
          $ETC_LOCATION/vmm_ssh \
          $ETC_LOCATION/vmm_sh \
          $ETC_LOCATION/tm_nfs \
          $ETC_LOCATION/tm_ssh \
          $ETC_LOCATION/tm_dummy \
          $ETC_LOCATION/tm_lvm \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/auth \
          $ETC_LOCATION/ec2query_templates \
          $ETC_LOCATION/occi_templates"

LIB_DIRS="$LIB_LOCATION/ruby \
          $LIB_LOCATION/ruby/OpenNebula \
          $LIB_LOCATION/ruby/cloud/ \
          $LIB_LOCATION/ruby/cloud/econe \
          $LIB_LOCATION/ruby/cloud/econe/views \
          $LIB_LOCATION/ruby/cloud/occi \
          $LIB_LOCATION/tm_commands \
          $LIB_LOCATION/tm_commands/nfs \
          $LIB_LOCATION/tm_commands/ssh \
          $LIB_LOCATION/tm_commands/dummy \
          $LIB_LOCATION/tm_commands/lvm \
          $LIB_LOCATION/mads \
          $LIB_LOCATION/remotes \
          $LIB_LOCATION/remotes/im \
          $LIB_LOCATION/remotes/im/kvm.d \
          $LIB_LOCATION/remotes/im/xen.d \
          $LIB_LOCATION/remotes/vmm/xen \
          $LIB_LOCATION/remotes/vmm/kvm"

VAR_DIRS="$VAR_LOCATION/remotes \
          $VAR_LOCATION/remotes/im \
          $VAR_LOCATION/remotes/im/kvm.d \
          $VAR_LOCATION/remotes/im/xen.d \
          $VAR_LOCATION/remotes/vmm/xen \
          $VAR_LOCATION/remotes/vmm/kvm"

LIB_ECO_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula \
                 $LIB_LOCATION/ruby/cloud/ \
                 $LIB_LOCATION/ruby/cloud/econe"

LIB_OCCI_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula \
                 $LIB_LOCATION/ruby/cloud/occi"

LIB_CLI_DIRS="$LIB_LOCATION/ruby \
              $LIB_LOCATION/ruby/OpenNebula"

if [ "$CLIENT" = "no" ]; then
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS $VAR_DIRS"
else
    MAKE_DIRS="$MAKE_DIRS $LIB_ECO_CLIENT_DIRS $LIB_OCCI_CLIENT_DIRS \
               $LIB_CLI_DIRS"
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
    MADS_LIB_FILES:$LIB_LOCATION/mads
    IM_PROBES_FILES:$VAR_LOCATION/remotes/im
    IM_PROBES_KVM_FILES:$VAR_LOCATION/remotes/im/kvm.d
    IM_PROBES_XEN_FILES:$VAR_LOCATION/remotes/im/xen.d
    VMM_SSH_KVM_SCRIPTS:$VAR_LOCATION/remotes/vmm/kvm
    VMM_SSH_XEN_SCRIPTS:$VAR_LOCATION/remotes/vmm/xen
    IM_PROBES_FILES:$LIB_LOCATION/remotes/im
    IM_PROBES_KVM_FILES:$LIB_LOCATION/remotes/im/kvm.d
    IM_PROBES_XEN_FILES:$LIB_LOCATION/remotes/im/xen.d
    VMM_SSH_KVM_SCRIPTS:$LIB_LOCATION/remotes/vmm/kvm
    VMM_SSH_XEN_SCRIPTS:$LIB_LOCATION/remotes/vmm/xen
    NFS_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/nfs
    SSH_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/ssh
    DUMMY_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/dummy
    LVM_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/lvm
    EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples
    TM_EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples/tm
    HOOK_SHARE_FILES:$SHARE_LOCATION/hooks
    COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud
    ECO_LIB_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_LIB_VIEW_FILES:$LIB_LOCATION/ruby/cloud/econe/views
    ECO_BIN_FILES:$BIN_LOCATION
    OCCI_LIB_FILES:$LIB_LOCATION/ruby/cloud/occi
    OCCI_BIN_FILES:$BIN_LOCATION
    MAN_FILES:$MAN_LOCATION
)

INSTALL_CLIENT_FILES=(
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    ECO_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/econe
    ECO_BIN_CLIENT_FILES:$BIN_LOCATION
    COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud
    OCCI_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/occi
    OCCI_BIN_CLIENT_FILES:$BIN_LOCATION
    CLI_BIN_FILES:$BIN_LOCATION
    CLI_LIB_FILES:$LIB_LOCATION/ruby
    RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula
)

INSTALL_ETC_FILES=(
    ETC_FILES:$ETC_LOCATION
    VMM_EC2_ETC_FILES:$ETC_LOCATION/vmm_ec2
    VMM_SSH_ETC_FILES:$ETC_LOCATION/vmm_ssh
    VMM_SH_ETC_FILES:$ETC_LOCATION/vmm_sh
    IM_EC2_ETC_FILES:$ETC_LOCATION/im_ec2
    TM_NFS_ETC_FILES:$ETC_LOCATION/tm_nfs
    TM_SSH_ETC_FILES:$ETC_LOCATION/tm_ssh
    TM_DUMMY_ETC_FILES:$ETC_LOCATION/tm_dummy
    TM_LVM_ETC_FILES:$ETC_LOCATION/tm_lvm
    HM_ETC_FILES:$ETC_LOCATION/hm
    AUTH_ETC_FILES:$ETC_LOCATION/auth
    ECO_ETC_FILES:$ETC_LOCATION
    ECO_ETC_TEMPLATE_FILES:$ETC_LOCATION/ec2query_templates
    OCCI_ETC_FILES:$ETC_LOCATION
    OCCI_ETC_TEMPLATE_FILES:$ETC_LOCATION/occi_templates
)

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/scheduler/src/sched/mm_sched \
           src/cli/onevm \
           src/cli/onehost \
           src/cli/onevnet \
           src/cli/oneuser \
           src/cli/oneimage \
           src/cli/onecluster \
           share/scripts/one \
           src/authm_mad/oneauth"

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
                src/cli/client_utilities.rb \
                src/cli/command_parse.rb \
                src/oca/ruby/OpenNebula.rb \
                src/tm_mad/TMScript.rb \
                src/authm_mad/one_usage.rb \
                src/authm_mad/quota.rb \
                src/authm_mad/simple_auth.rb \
                src/authm_mad/simple_permissions.rb \
                src/authm_mad/ssh_auth.rb"

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
                           src/oca/ruby/OpenNebula/ImageRepository.rb \
                           src/oca/ruby/OpenNebula/Cluster.rb \
                           src/oca/ruby/OpenNebula/ClusterPool.rb \
                           src/oca/ruby/OpenNebula/XMLUtils.rb"

#-------------------------------------------------------------------------------
# Driver executable files, to be installed under $LIB_LOCATION/mads
#-------------------------------------------------------------------------------

MADS_LIB_FILES="src/mad/sh/madcommon.sh \
              src/tm_mad/tm_common.sh \
              src/vmm_mad/ssh/one_vmm_ssh.rb \
              src/vmm_mad/ssh/one_vmm_ssh \
              src/vmm_mad/sh/one_vmm_sh.rb \
              src/vmm_mad/sh/one_vmm_sh \
              src/vmm_mad/ec2/one_vmm_ec2.rb \
              src/vmm_mad/ec2/one_vmm_ec2 \
              src/vmm_mad/dummy/one_vmm_dummy.rb \
              src/vmm_mad/dummy/one_vmm_dummy \
              src/im_mad/im_ssh/one_im_ssh.rb \
              src/im_mad/im_ssh/one_im_ssh \
              src/im_mad/im_sh/one_im_sh.rb \
              src/im_mad/im_sh/one_im_sh \
              src/im_mad/ec2/one_im_ec2.rb \
              src/im_mad/ec2/one_im_ec2 \
              src/im_mad/dummy/one_im_dummy.rb \
              src/im_mad/dummy/one_im_dummy \
              src/tm_mad/one_tm \
              src/tm_mad/one_tm.rb \
              src/hm_mad/one_hm.rb \
              src/hm_mad/one_hm \
              src/authm_mad/one_auth_mad.rb \
              src/authm_mad/one_auth_mad"

#-------------------------------------------------------------------------------
# VMM SH Driver KVM scripts, to be installed under $REMOTES_LOCATION/vmm/kvm
#-------------------------------------------------------------------------------

VMM_SSH_KVM_SCRIPTS="src/vmm_mad/remotes/kvm/cancel \
                    src/vmm_mad/remotes/kvm/deploy \
                    src/vmm_mad/remotes/kvm/kvmrc \
                    src/vmm_mad/remotes/kvm/migrate \
                    src/vmm_mad/remotes/kvm/poll \
                    src/vmm_mad/remotes/kvm/restore \
                    src/vmm_mad/remotes/kvm/save \
                    src/vmm_mad/remotes/kvm/shutdown"

#-------------------------------------------------------------------------------
# VMM SH Driver Xen scripts, to be installed under $REMOTES_LOCATION/vmm/xen
#-------------------------------------------------------------------------------

VMM_SSH_XEN_SCRIPTS="src/vmm_mad/remotes/xen/cancel \
                    src/vmm_mad/remotes/xen/deploy \
                    src/vmm_mad/remotes/xen/xenrc \
                    src/vmm_mad/remotes/xen/migrate \
                    src/vmm_mad/remotes/xen/poll \
                    src/vmm_mad/remotes/xen/restore \
                    src/vmm_mad/remotes/xen/save \
                    src/vmm_mad/remotes/xen/shutdown"

#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $LIB_LOCATION/remotes
#-------------------------------------------------------------------------------

IM_PROBES_FILES="src/im_mad/remotes/run_probes"

IM_PROBES_XEN_FILES="src/im_mad/remotes/xen.d/xen.rb \
                    src/im_mad/remotes/xen.d/architecture.sh \
                    src/im_mad/remotes/xen.d/cpu.sh \
                    src/im_mad/remotes/xen.d/name.sh"

IM_PROBES_KVM_FILES="src/im_mad/remotes/kvm.d/kvm.rb \
                    src/im_mad/remotes/kvm.d/architecture.sh \
                    src/im_mad/remotes/kvm.d/cpu.sh \
                    src/im_mad/remotes/kvm.d/name.sh"


#-------------------------------------------------------------------------------
# Transfer Manager commands, to be installed under $LIB_LOCATION/tm_commands
#   - NFS TM, $LIB_LOCATION/tm_commands/nfs
#   - SSH TM, $LIB_LOCATION/tm_commands/ssh
#   - dummy TM, $LIB_LOCATION/tm_commands/dummy
#   - LVM TM, $LIB_LOCATION/tm_commands/lvm
#-------------------------------------------------------------------------------

NFS_TM_COMMANDS_LIB_FILES="src/tm_mad/nfs/tm_clone.sh \
                           src/tm_mad/nfs/tm_delete.sh \
                           src/tm_mad/nfs/tm_ln.sh \
                           src/tm_mad/nfs/tm_mkswap.sh \
                           src/tm_mad/nfs/tm_mkimage.sh \
                           src/tm_mad/nfs/tm_mv.sh \
                           src/tm_mad/nfs/tm_context.sh"

SSH_TM_COMMANDS_LIB_FILES="src/tm_mad/ssh/tm_clone.sh \
                           src/tm_mad/ssh/tm_delete.sh \
                           src/tm_mad/ssh/tm_ln.sh \
                           src/tm_mad/ssh/tm_mkswap.sh \
                           src/tm_mad/ssh/tm_mkimage.sh \
                           src/tm_mad/ssh/tm_mv.sh \
                           src/tm_mad/ssh/tm_context.sh"

DUMMY_TM_COMMANDS_LIB_FILES="src/tm_mad/dummy/tm_dummy.sh"

LVM_TM_COMMANDS_LIB_FILES="src/tm_mad/lvm/tm_clone.sh \
                           src/tm_mad/lvm/tm_delete.sh \
                           src/tm_mad/lvm/tm_ln.sh \
                           src/tm_mad/lvm/tm_mkswap.sh \
                           src/tm_mad/lvm/tm_mkimage.sh \
                           src/tm_mad/lvm/tm_mv.sh \
                           src/tm_mad/lvm/tm_context.sh"

#-------------------------------------------------------------------------------
# Configuration files for OpenNebula, to be installed under $ETC_LOCATION
#-------------------------------------------------------------------------------

ETC_FILES="share/etc/oned.conf \
           share/etc/defaultrc"

#-------------------------------------------------------------------------------
# Virtualization drivers config. files, to be installed under $ETC_LOCATION
#   - ec2, $ETC_LOCATION/vmm_ec2
#   - sh, $ETC_LOCATION/vmm_sh
#   - ssh, $ETC_LOCATION/vmm_ssh
#-------------------------------------------------------------------------------

VMM_EC2_ETC_FILES="src/vmm_mad/ec2/vmm_ec2rc \
                   src/vmm_mad/ec2/vmm_ec2.conf"

VMM_SSH_ETC_FILES="src/vmm_mad/ssh/vmm_sshrc \
                  src/vmm_mad/ssh/vmm_ssh_kvm.conf \
                  src/vmm_mad/ssh/vmm_ssh_xen.conf"
                  
VMM_SH_ETC_FILES="src/vmm_mad/sh/vmm_shrc"

#-------------------------------------------------------------------------------
# Information drivers config. files, to be installed under $ETC_LOCATION
#   - ec2, $ETC_LOCATION/im_ec2
#-------------------------------------------------------------------------------

IM_EC2_ETC_FILES="src/im_mad/ec2/im_ec2rc \
                  src/im_mad/ec2/im_ec2.conf"

#-------------------------------------------------------------------------------
# Storage drivers config. files, to be installed under $ETC_LOCATION
#   - nfs, $ETC_LOCATION/tm_nfs
#   - ssh, $ETC_LOCATION/tm_ssh
#   - dummy, $ETC_LOCATION/tm_dummy
#   - lvm, $ETC_LOCATION/tm_lvm
#-------------------------------------------------------------------------------

TM_NFS_ETC_FILES="src/tm_mad/nfs/tm_nfs.conf \
                  src/tm_mad/nfs/tm_nfsrc"

TM_SSH_ETC_FILES="src/tm_mad/ssh/tm_ssh.conf \
                  src/tm_mad/ssh/tm_sshrc"

TM_DUMMY_ETC_FILES="src/tm_mad/dummy/tm_dummy.conf \
                    src/tm_mad/dummy/tm_dummyrc"

TM_LVM_ETC_FILES="src/tm_mad/lvm/tm_lvm.conf \
                  src/tm_mad/lvm/tm_lvmrc"

#-------------------------------------------------------------------------------
# Hook Manager driver config. files, to be installed under $ETC_LOCATION/hm
#-------------------------------------------------------------------------------

HM_ETC_FILES="src/hm_mad/hmrc"

#-------------------------------------------------------------------------------
# Hook Manager driver config. files, to be installed under $ETC_LOCATION/hm
#-------------------------------------------------------------------------------

AUTH_ETC_FILES="src/authm_mad/auth_mad \
                src/authm_mad/auth.conf"

#-------------------------------------------------------------------------------
# Sample files, to be installed under $SHARE_LOCATION/examples
#-------------------------------------------------------------------------------

EXAMPLE_SHARE_FILES="share/examples/vm.template \
                     share/examples/vm.schema \
                     share/examples/private.net \
                     share/examples/public.net"

#-------------------------------------------------------------------------------
# TM Sample files, to be installed under $SHARE_LOCATION/examples/tm
#-------------------------------------------------------------------------------

TM_EXAMPLE_SHARE_FILES="share/examples/tm/tm_clone.sh \
                        share/examples/tm/tm_delete.sh \
                        share/examples/tm/tm_ln.sh \
                        share/examples/tm/tm_mkimage.sh \
                        share/examples/tm/tm_mkswap.sh \
                        share/examples/tm/tm_mv.sh"

#-------------------------------------------------------------------------------
# HOOK scripts, to be installed under $SHARE_LOCATION/hooks
#-------------------------------------------------------------------------------

HOOK_SHARE_FILES="share/hooks/ebtables-xen \
                  share/hooks/ebtables-kvm \
                  share/hooks/ebtables-flush \
                  share/hooks/host_error.rb \
                  share/hooks/image.rb"

#-------------------------------------------------------------------------------
# Common Cloud Files
#-------------------------------------------------------------------------------

COMMON_CLOUD_LIB_FILES="src/cloud/common/CloudServer.rb \
                        src/cloud/common/CloudClient.rb \
                        src/cloud/common/Configuration.rb"

COMMON_CLOUD_CLIENT_LIB_FILES="src/cloud/common/CloudClient.rb"

#-------------------------------------------------------------------------------
# EC2 Query for OpenNebula
#-------------------------------------------------------------------------------

ECO_LIB_FILES="src/cloud/ec2/lib/EC2QueryClient.rb \
               src/cloud/ec2/lib/EC2QueryServer.rb \
               src/cloud/ec2/lib/ImageEC2.rb \
               src/cloud/ec2/lib/econe-server.rb"

ECO_LIB_CLIENT_FILES="src/cloud/ec2/lib/EC2QueryClient.rb"

ECO_LIB_VIEW_FILES="src/cloud/ec2/lib/views/describe_images.erb \
                    src/cloud/ec2/lib/views/describe_instances.erb \
                    src/cloud/ec2/lib/views/register_image.erb \
                    src/cloud/ec2/lib/views/run_instances.erb \
                    src/cloud/ec2/lib/views/terminate_instances.erb"

ECO_BIN_FILES="src/cloud/ec2/bin/econe-server \
               src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
               src/cloud/ec2/bin/econe-upload"

ECO_BIN_CLIENT_FILES="src/cloud/ec2/bin/econe-describe-images \
               src/cloud/ec2/bin/econe-describe-instances \
               src/cloud/ec2/bin/econe-register \
               src/cloud/ec2/bin/econe-run-instances \
               src/cloud/ec2/bin/econe-terminate-instances \
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
                src/cloud/occi/lib/ImageOCCI.rb \
                src/cloud/occi/lib/ImagePoolOCCI.rb"

OCCI_LIB_CLIENT_FILES="src/cloud/occi/lib/OCCIClient.rb"

OCCI_BIN_FILES="src/cloud/occi/bin/occi-server \
               src/cloud/occi/bin/occi-compute \
               src/cloud/occi/bin/occi-network \
               src/cloud/occi/bin/occi-storage"

OCCI_BIN_CLIENT_FILES="src/cloud/occi/bin/occi-compute \
               src/cloud/occi/bin/occi-network \
               src/cloud/occi/bin/occi-storage"

OCCI_ETC_FILES="src/cloud/occi/etc/occi-server.conf"

OCCI_ETC_TEMPLATE_FILES="src/cloud/occi/etc/templates/common.erb \
                    src/cloud/occi/etc/templates/custom.erb \
                    src/cloud/occi/etc/templates/small.erb \
                    src/cloud/occi/etc/templates/medium.erb \
                    src/cloud/occi/etc/templates/large.erb"

#-----------------------------------------------------------------------------
# CLI files
#-----------------------------------------------------------------------------

CLI_LIB_FILES="src/mad/ruby/CommandManager.rb \
               src/cli/client_utilities.rb \
               src/cli/command_parse.rb \
               src/oca/ruby/OpenNebula.rb"

CLI_BIN_FILES="src/cli/onevm \
               src/cli/onehost \
               src/cli/onevnet \
               src/cli/oneuser \
               src/cli/oneimage \
               src/cli/onecluster"

#-----------------------------------------------------------------------------
# MAN files
#-----------------------------------------------------------------------------

MAN_FILES="share/man/oneauth.8.gz \
        share/man/onecluster.8.gz \
        share/man/onehost.8.gz \
        share/man/oneimage.8.gz \
        share/man/oneuser.8.gz \
        share/man/onevm.8.gz \
        share/man/onevnet.8.gz \
        share/man/econe-describe-images.8.gz \
        share/man/econe-describe-instances.8.gz \
        share/man/econe-register.8.gz \
        share/man/econe-run-instances.8.gz \
        share/man/econe-terminate-instances.8.gz \
        share/man/econe-upload.8.gz \
        share/man/occi-compute.8.gz \
        share/man/occi-network.8.gz \
        share/man/occi-storage.8.gz"

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
        rm $2/`basename $1`
    else
        if [ "$LINK" = "yes" ]; then
            ln -s $SRC_DIR/$1 $DESTDIR$2
        else
            cp $SRC_DIR/$1 $DESTDIR$2
        fi
    fi
}


if [ "$CLIENT" = "no" ]; then
    INSTALL_SET=${INSTALL_FILES[@]}
else
    INSTALL_SET=${INSTALL_CLIENT_FILES[@]}
fi

for i in ${INSTALL_SET[@]}; do
    SRC=$`echo $i | cut -d: -f1`
    DST=`echo $i | cut -d: -f2`

    eval SRC_FILES=$SRC

    for f in $SRC_FILES; do
        do_file $f $DST
    done
done

if [ "$CLIENT" = "no" -a "$INSTALL_ETC" = "yes" ] ; then
    for i in ${INSTALL_ETC_FILES[@]}; do
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

    # --- Set correct permissions for Image Repository ---

    if [ -d "$DESTDIR$IMAGES_LOCATION" ]; then
        chmod 3770 $DESTDIR$IMAGES_LOCATION
    fi
else
    for d in `echo $DELETE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

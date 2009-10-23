#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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
 echo "-k: keep current configuration files, useful when upgrading"
 echo "-d: target installation directory, if not defined it'd be root"
 echo "-c: install only 'occi' or 'ec2' client files"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o hkrlc:u:g:d: -n 'install.sh' -- "$@"`

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
        -c) CLIENT="$2" ; shift 2;;
        -u) ONEADMIN_USER="$2" ; shift 2;;
        -g) ONEADMIN_GROUP="$2"; shift 2;;
        -d) ROOT="$2" ; shift 2 ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

if echo "$CLIENT" | egrep -ivq '^(no|occi|ec2)$'; then
    echo "ERROR: client '$CLIENT' not valid. Use either 'occi' or 'ec2'."
    usage
    exit 1
else
    CLIENT=`echo $CLIENT | tr [:upper:] [:lower:]`
fi

#-------------------------------------------------------------------------------
# Definition of locations
#-------------------------------------------------------------------------------

if [ -z "$ROOT" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    RUN_LOCATION="/var/run/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/doc/opennebula"
    
    if [ "$CLIENT" = "no" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION \
                   $LOG_LOCATION $RUN_LOCATION"
        
        DELETE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION $VAR_LOCATION \
                     $RUN_LOCATION $SHARE_DIRS"

        CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION"
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
    INCLUDE_LOCATION="$ROOT/include"
    SHARE_LOCATION="$ROOT/share"

    if [ "$CLIENT" = "no" ]; then
        MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
                   $INCLUDE_LOCATION $SHARE_LOCATION"
                   
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
          $ETC_LOCATION/im_eh \
          $ETC_LOCATION/vmm_kvm \
          $ETC_LOCATION/vmm_xen \
          $ETC_LOCATION/vmm_ec2 \
          $ETC_LOCATION/vmm_eh \
          $ETC_LOCATION/tm_nfs \
          $ETC_LOCATION/tm_ssh \
          $ETC_LOCATION/tm_dummy \
          $ETC_LOCATION/tm_lvm \
          $ETC_LOCATION/hm \
          $ETC_LOCATION/ec2query_templates \
          $ETC_LOCATION/occi_templates"

LIB_DIRS="$LIB_LOCATION/im_probes \
          $LIB_LOCATION/ruby \
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
          $LIB_LOCATION/mads"

LIB_ECO_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula
                 $LIB_LOCATION/ruby/cloud/ \
                 $LIB_LOCATION/ruby/cloud/econe"

LIB_OCCI_CLIENT_DIRS="$LIB_LOCATION/ruby \
                 $LIB_LOCATION/ruby/OpenNebula
                 $LIB_LOCATION/ruby/cloud/occi"

if [ "$CLIENT" = "no" ]; then
    MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS"
elif [ "$CLIENT" = "ec2" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_ECO_CLIENT_DIRS"
elif [ "$CLIENT" = "occi" ]; then
    MAKE_DIRS="$MAKE_DIRS $LIB_OCCI_CLIENT_DIRS"
fi

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# FILE DEFINITION, WHAT IS GOING TO BE INSTALLED AND WHERE
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------

INSTALL_FILES[0]="BIN_FILES:$BIN_LOCATION"
INSTALL_FILES[1]="INCLUDE_FILES:$INCLUDE_LOCATION"
INSTALL_FILES[2]="LIB_FILES:$LIB_LOCATION"
INSTALL_FILES[3]="RUBY_LIB_FILES:$LIB_LOCATION/ruby"
INSTALL_FILES[4]="RUBY_OPENNEBULA_LIB_FILES:$LIB_LOCATION/ruby/OpenNebula"
INSTALL_FILES[5]="MADS_LIB_FILES:$LIB_LOCATION/mads"
INSTALL_FILES[6]="IM_PROBES_LIB_FILES:$LIB_LOCATION/im_probes"
INSTALL_FILES[7]="NFS_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/nfs"
INSTALL_FILES[8]="SSH_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/ssh"
INSTALL_FILES[9]="DUMMY_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/dummy"
INSTALL_FILES[10]="LVM_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/lvm"
INSTALL_FILES[11]="EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples"
INSTALL_FILES[12]="TM_EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples/tm"
INSTALL_FILES[13]="HOOK_SHARE_FILES:$SHARE_LOCATION/hooks"
INSTALL_FILES[14]="COMMON_CLOUD_LIB_FILES:$LIB_LOCATION/ruby/cloud"
INSTALL_FILES[15]="ECO_LIB_FILES:$LIB_LOCATION/ruby/cloud/econe"
INSTALL_FILES[16]="ECO_LIB_VIEW_FILES:$LIB_LOCATION/ruby/cloud/econe/views"
INSTALL_FILES[17]="ECO_BIN_FILES:$BIN_LOCATION"
INSTALL_FILES[18]="OCCI_LIB_FILES:$LIB_LOCATION/ruby/cloud/occi"
INSTALL_FILES[19]="OCCI_BIN_FILES:$BIN_LOCATION"

INSTALL_ECO_CLIENT_FILES[0]="COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud"
INSTALL_ECO_CLIENT_FILES[1]="ECO_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/econe"
INSTALL_ECO_CLIENT_FILES[2]="ECO_BIN_CLIENT_FILES:$BIN_LOCATION"

INSTALL_OCCI_CLIENT_FILES[0]="COMMON_CLOUD_CLIENT_LIB_FILES:$LIB_LOCATION/ruby/cloud"
INSTALL_OCCI_CLIENT_FILES[1]="OCCI_LIB_CLIENT_FILES:$LIB_LOCATION/ruby/cloud/occi"
INSTALL_OCCI_CLIENT_FILES[2]="OCCI_BIN_CLIENT_FILES:$BIN_LOCATION"

INSTALL_ETC_FILES[0]="ETC_FILES:$ETC_LOCATION"
INSTALL_ETC_FILES[1]="VMM_XEN_ETC_FILES:$ETC_LOCATION/vmm_xen"
INSTALL_ETC_FILES[2]="VMM_KVM_ETC_FILES:$ETC_LOCATION/vmm_kvm"
INSTALL_ETC_FILES[3]="VMM_EC2_ETC_FILES:$ETC_LOCATION/vmm_ec2"
INSTALL_ETC_FILES[4]="VMM_EH_ETC_FILES:$ETC_LOCATION/vmm_eh"
INSTALL_ETC_FILES[5]="IM_XEN_ETC_FILES:$ETC_LOCATION/im_xen"
INSTALL_ETC_FILES[6]="IM_KVM_ETC_FILES:$ETC_LOCATION/im_kvm"
INSTALL_ETC_FILES[7]="IM_EC2_ETC_FILES:$ETC_LOCATION/im_ec2"
INSTALL_ETC_FILES[8]="IM_EH_ETC_FILES:$ETC_LOCATION/im_eh"
INSTALL_ETC_FILES[9]="TM_NFS_ETC_FILES:$ETC_LOCATION/tm_nfs"
INSTALL_ETC_FILES[10]="TM_SSH_ETC_FILES:$ETC_LOCATION/tm_ssh"
INSTALL_ETC_FILES[11]="TM_DUMMY_ETC_FILES:$ETC_LOCATION/tm_dummy"
INSTALL_ETC_FILES[12]="TM_LVM_ETC_FILES:$ETC_LOCATION/tm_lvm"
INSTALL_ETC_FILES[13]="HM_ETC_FILES:$ETC_LOCATION/hm"
INSTALL_ETC_FILES[14]="ECO_ETC_FILES:$ETC_LOCATION"
INSTALL_ETC_FILES[15]="ECO_ETC_TEMPLATE_FILES:$ETC_LOCATION/ec2query_templates"
INSTALL_ETC_FILES[16]="OCCI_ETC_FILES:$ETC_LOCATION"
INSTALL_ETC_FILES[17]="OCCI_ETC_TEMPLATE_FILES:$ETC_LOCATION/occi_templates"

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/scheduler/mm_sched \
           src/client/ruby/onevm \
           src/client/ruby/onehost \
           src/client/ruby/onevnet \
           src/client/ruby/oneuser \
           share/scripts/one"

#-------------------------------------------------------------------------------
# C/C++ OpenNebula API Library & Development files
# Include files, to be installed under $INCLUDE_LOCATION
# Library files, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------

INCLUDE_FILES="include/OneClient.h"
LIB_FILES="src/client/liboneapi.a \
           src/client/liboneapi.so"

#-------------------------------------------------------------------------------
# Ruby library files, to be installed under $LIB_LOCATION/ruby
#-------------------------------------------------------------------------------

RUBY_LIB_FILES="src/mad/ruby/one_mad.rb \
                src/mad/ruby/one_ssh.rb \
                src/mad/ruby/ThreadScheduler.rb \
                src/mad/ruby/ActionManager.rb \
                src/mad/ruby/CommandManager.rb \
                src/mad/ruby/OpenNebulaDriver.rb \
                src/mad/ruby/VirtualMachineDriver.rb \
                src/client/ruby/client_utilities.rb \
                src/client/ruby/command_parse.rb \
                src/oca/ruby/OpenNebula.rb \
                src/tm_mad/TMScript.rb"

RUBY_OPENNEBULA_LIB_FILES="src/oca/ruby/OpenNebula/Host.rb \
                           src/oca/ruby/OpenNebula/HostPool.rb \
                           src/oca/ruby/OpenNebula/Pool.rb \
                           src/oca/ruby/OpenNebula/User.rb \
                           src/oca/ruby/OpenNebula/UserPool.rb \
                           src/oca/ruby/OpenNebula/VirtualMachine.rb \
                           src/oca/ruby/OpenNebula/VirtualMachinePool.rb \
                           src/oca/ruby/OpenNebula/VirtualNetwork.rb \
                           src/oca/ruby/OpenNebula/VirtualNetworkPool.rb \
                           src/oca/ruby/OpenNebula/XMLUtils.rb"
#-------------------------------------------------------------------------------
# Driver executable files, to be installed under $LIB_LOCATION/mads
#-------------------------------------------------------------------------------

MADS_LIB_FILES="src/mad/sh/madcommon.sh \
              src/tm_mad/tm_common.sh \
              src/vmm_mad/xen/one_vmm_xen.rb \
              src/vmm_mad/xen/one_vmm_xen \
              src/vmm_mad/kvm/one_vmm_kvm.rb \
              src/vmm_mad/kvm/one_vmm_kvm \
              src/vmm_mad/ec2/one_vmm_ec2.rb \
              src/vmm_mad/ec2/one_vmm_ec2 \
              src/vmm_mad/eh/one_vmm_eh.rb \
              src/vmm_mad/eh/one_vmm_eh \
              src/im_mad/im_ssh/one_im_ssh.rb \
              src/im_mad/im_ssh/one_im_ssh \
              src/im_mad/ec2/one_im_ec2.rb \
              src/im_mad/ec2/one_im_ec2 \
              src/im_mad/eh/one_im_eh.rb \
              src/im_mad/eh/one_im_eh \
              src/tm_mad/one_tm \
              src/tm_mad/one_tm.rb \
              src/hm_mad/one_hm.rb \
              src/hm_mad/one_hm"
              
#-------------------------------------------------------------------------------
# Information Manager Probes, to be installed under $LIB_LOCATION/im_probes
#-------------------------------------------------------------------------------

IM_PROBES_LIB_FILES="src/im_mad/xen/xen.rb \
                     src/im_mad/kvm/kvm.rb \
                     src/im_mad/host_probes/architecture.sh \
                     src/im_mad/host_probes/cpu.sh \
                     src/im_mad/host_probes/name.sh"

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
#   - xen, $ETC_LOCATION/vmm_xen
#   - kvm, $ETC_LOCATION/vmm_kvm
#   - ec2, $ETC_LOCATION/vmm_ec2
#   - eh, $ETC_LOCATION/vmm_eh
#-------------------------------------------------------------------------------

VMM_XEN_ETC_FILES="src/vmm_mad/xen/vmm_xenrc \
                   src/vmm_mad/xen/vmm_xen.conf"

VMM_KVM_ETC_FILES="src/vmm_mad/kvm/vmm_kvmrc \
                   src/vmm_mad/kvm/vmm_kvm.conf"

VMM_EC2_ETC_FILES="src/vmm_mad/ec2/vmm_ec2rc \
                   src/vmm_mad/ec2/vmm_ec2.conf"

VMM_EH_ETC_FILES="src/vmm_mad/eh/vmm_ehrc \
                  src/vmm_mad/eh/vmm_eh.conf"

#-------------------------------------------------------------------------------
# Information drivers config. files, to be installed under $ETC_LOCATION
#   - xen, $ETC_LOCATION/im_xen
#   - kvm, $ETC_LOCATION/im_kvm
#   - ec2, $ETC_LOCATION/im_ec2
#-------------------------------------------------------------------------------

IM_XEN_ETC_FILES="src/im_mad/xen/im_xenrc \
                  src/im_mad/xen/im_xen.conf"

IM_KVM_ETC_FILES="src/im_mad/kvm/im_kvmrc \
                  src/im_mad/kvm/im_kvm.conf"

IM_EC2_ETC_FILES="src/im_mad/ec2/im_ec2rc \
                  src/im_mad/ec2/im_ec2.conf"

IM_EH_ETC_FILES="src/im_mad/eh/im_ehrc \
                 src/im_mad/eh/im_eh.conf"

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
                  share/hooks/ebtables-flush"

#-------------------------------------------------------------------------------
# Common Cloud Files
#-------------------------------------------------------------------------------

COMMON_CLOUD_LIB_FILES="src/cloud/common/CloudServer.rb \
                        src/cloud/common/CloudClient.rb \
                        src/cloud/common/Configuration.rb \
                        src/cloud/rm/image.rb \
                        src/cloud/rm/repo_manager.rb"

COMMON_CLOUD_CLIENT_LIB_FILES="src/cloud/common/CloudClient.rb"

#-------------------------------------------------------------------------------
# EC2 Query for OpenNebula 
#-------------------------------------------------------------------------------

ECO_LIB_FILES="src/cloud/ec2/lib/EC2QueryClient.rb \
               src/cloud/ec2/lib/EC2QueryServer.rb \
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

OCCI_ETC_TEMPLATE_FILES="src/cloud/occi/etc/templates/small.erb \
                    src/cloud/occi/etc/templates/medium.erb \
                    src/cloud/occi/etc/templates/large.erb"

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
elif [ "$CLIENT" = "occi" ]; then
    INSTALL_SET=${INSTALL_OCCI_CLIENT_FILES[@]}
elif [ "$CLIENT" = "ec2" ]; then
    INSTALL_SET=${INSTALL_ECO_CLIENT_FILES[@]}
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
    # Create library links
    if [ "$CLIENT" = "no" ] ; then
        ln -s $DESTDIR$LIB_LOCATION/liboneapi.so \
              $DESTDIR$LIB_LOCATION/liboneapi.so.1
        ln -s $DESTDIR$LIB_LOCATION/liboneapi.so.1 \
              $DESTDIR$LIB_LOCATION/liboneapi.so.1.3
    fi
else
    for d in `echo $DELETE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

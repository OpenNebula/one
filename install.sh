Proff
#!/bin/bash

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
 echo "                  [-d ONE_LOCATION] [-r] [-h]"
 echo 
 echo "-u: user that will run opennebula, defults to user executing install.sh"
 echo "-g: group of the user that will run opennebula, defults to user"
 echo "    executing install.sh"
 echo "-k: keep current configuration files, useful when upgrading"
 echo "-d: target installation directory, if not defined it'd be root"
 echo "-r: remove Opennebula, only useful if -d was not specified, otherwise"
 echo "    rm -rf \$ONE_LOCATION would do the job"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o hkru:g:d: -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then 
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

INSTALL_ETC="yes"
UNINSTALL="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -k) INSTALL_ETC="no"   ; shift ;;
        -r) UNINSTALL="yes"   ; shift ;;
        -u) ONEADMIN_USER="$2" ; shift 2;;
        -g) ONEADMIN_GROUP="$2"; shift 2;;
        -d) DST_DIR="$2" ; shift 2 ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

#-------------------------------------------------------------------------------
# Definition of locations
#-------------------------------------------------------------------------------

if [ -z "$DST_DIR" ] ; then
    BIN_LOCATION="/usr/bin"
    LIB_LOCATION="/usr/lib/one"
    ETC_LOCATION="/etc/one"
    LOG_LOCATION="/var/log/one"
    VAR_LOCATION="/var/lib/one"
    RUN_LOCATION="/var/run/one"
    INCLUDE_LOCATION="/usr/include"
    SHARE_LOCATION="/usr/share/doc/opennebula"

    MAKE_DIRS="$LIB_LOCATION $ETC_LOCATION $LOG_LOCATION \
               $VAR_LOCATION $RUN_LOCATION $SHARE_LOCATION"

    CHOWN_DIRS="$LOG_LOCATION $VAR_LOCATION $RUN_LOCATION"
else
    BIN_LOCATION="$DST_DIR/bin"
    LIB_LOCATION="$DST_DIR/lib"
    ETC_LOCATION="$DST_DIR/etc"
    VAR_LOCATION="$DST_DIR/var"
    INCLUDE_LOCATION="$DST_DIR/include"
    SHARE_LOCATION="$DST_DIR/share"

    MAKE_DIRS="$BIN_LOCATION $LIB_LOCATION $ETC_LOCATION $VAR_LOCATION \
               $INCLUDE_LOCATION $SHARE_LOCATION"

    CHOWN_DIRS="$DST_DIR"
fi

SHARE_DIRS="$SHARE_LOCATION/examples \
            $SHARE_LOCATION/examples/tm"

ETC_DIRS="$ETC_LOCATION/im_kvm \
          $ETC_LOCATION/im_xen \
          $ETC_LOCATION/im_ec2 \
          $ETC_LOCATION/vmm_kvm \
          $ETC_LOCATION/vmm_xen \
          $ETC_LOCATION/vmm_ec2 \
          $ETC_LOCATION/tm_nfs \
          $ETC_LOCATION/tm_ssh \
          $ETC_LOCATION/tm_dummy"

LIB_DIRS="$LIB_LOCATION/im_probes \
          $LIB_LOCATION/ruby \
          $LIB_LOCATION/tm_commands \
          $LIB_LOCATION/tm_commands/nfs \
          $LIB_LOCATION/tm_commands/ssh \
          $LIB_LOCATION/tm_commands/dummy \
          $LIB_LOCATION/mads"

MAKE_DIRS="$MAKE_DIRS $SHARE_DIRS $ETC_DIRS $LIB_DIRS"

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# FILE DEFINITION, WHAT IS GOING TO BE INSTALLED AND WHERE
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------

INSTALL_FILES[0]="BIN_FILES:$BIN_LOCATION"
INSTALL_FILES[1]="INCLUDE_FILES:$INCLUDE_LOCATION"
INSTALL_FILES[2]="LIB_FILES:$LIB_LOCATION"
INSTALL_FILES[3]="RUBY_LIB_FILES:$LIB_LOCATION/ruby"
INSTALL_FILES[4]="MADS_LIB_FILES:$LIB_LOCATION/mads"
INSTALL_FILES[5]="IM_PROBES_LIB_FILES:$LIB_LOCATION/im_probes"
INSTALL_FILES[6]="NFS_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/nfs"
INSTALL_FILES[7]="SSH_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/ssh"
INSTALL_FILES[8]="DUMMY_TM_COMMANDS_LIB_FILES:$LIB_LOCATION/tm_commands/dummy"
INSTALL_FILES[9]="EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples"
INSTALL_FILES[10]="TM_EXAMPLE_SHARE_FILES:$SHARE_LOCATION/examples/tm"

INSTALL_ETC_FILES[0]="ETC_FILES:$ETC_LOCATION"
INSTALL_ETC_FILES[1]="VMM_XEN_ETC_FILES:$ETC_LOCATION/vmm_xen"
INSTALL_ETC_FILES[2]="VMM_KVM_ETC_FILES:$ETC_LOCATION/vmm_kvm"
INSTALL_ETC_FILES[3]="VMM_EC2_ETC_FILES:$ETC_LOCATION/vmm_ec2"
INSTALL_ETC_FILES[4]="IM_XEN_ETC_FILES:$ETC_LOCATION/im_xen"
INSTALL_ETC_FILES[5]="IM_KVM_ETC_FILES:$ETC_LOCATION/im_kvm"
INSTALL_ETC_FILES[6]="IM_EC2_ETC_FILES:$ETC_LOCATION/im_ec2"
INSTALL_ETC_FILES[7]="TM_NFS_ETC_FILES:$ETC_LOCATION/tm_nfs"
INSTALL_ETC_FILES[8]="TM_SSH_ETC_FILES:$ETC_LOCATION/tm_ssh"
INSTALL_ETC_FILES[9]="TM_DUMMY_ETC_FILES:$ETC_LOCATION/tm_dummy"

#-------------------------------------------------------------------------------
# Binary files, to be installed under $BIN_LOCATION
#-------------------------------------------------------------------------------

BIN_FILES="src/nebula/oned \
           src/scheduler/mm_sched \
           src/client/ruby/onevm \
           src/client/ruby/onehost \
           src/client/ruby/onevnet \
           share/scripts/one"

#-------------------------------------------------------------------------------
# C/C++ OpenNebula API Library & Development files
# Include files, to be installed under $INCLUDE_LOCATION
# Library files, to be installed under $LIB_LOCATION
#-------------------------------------------------------------------------------

INCLUDE_FILES="include/OneClient.h"
LIB_FILES="src/client/liboneapi.a"

#-------------------------------------------------------------------------------
# Ruby library files, to be installed under $LIB_LOCATION/ruby
#-------------------------------------------------------------------------------

RUBY_LIB_FILES="src/mad/ruby/one_mad.rb \
                src/mad/ruby/one_ssh.rb \
                src/mad/ruby/ThreadScheduler.rb \
                src/client/ruby/one.rb \
                src/client/ruby/client_utilities.rb \
                src/client/ruby/command_parse.rb \
                src/tm_mad/TMScript.rb"

#-------------------------------------------------------------------------------
# Driver executable files, to be installed under $LIB_LOCATION/mads
#-------------------------------------------------------------------------------

MADS_LIB_FILES="share/scripts/madcommon.sh \
              src/tm_mad/tm_common.sh \
              src/vmm_mad/xen/one_vmm_xen.rb \
              src/vmm_mad/xen/one_vmm_xen \
              src/vmm_mad/kvm/one_vmm_kvm.rb \
              src/vmm_mad/kvm/one_vmm_kvm \
              src/vmm_mad/ec2/one_vmm_ec2.rb \
              src/vmm_mad/ec2/one_vmm_ec2 \
              src/im_mad/im_ssh/one_im_ssh.rb \
              src/im_mad/im_ssh/one_im_ssh \
              src/im_mad/ec2/one_im_ec2.rb \
              src/im_mad/ec2/one_im_ec2 \
              src/tm_mad/one_tm \
              src/tm_mad/one_tm.rb"
              
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
#-------------------------------------------------------------------------------

NFS_TM_COMMANDS_LIB_FILES="src/tm_mad/nfs/tm_clone.sh \
                           src/tm_mad/nfs/tm_delete.sh \
                           src/tm_mad/nfs/tm_ln.sh \
                           src/tm_mad/nfs/tm_mkswap.sh \
                           src/tm_mad/nfs/tm_mkimage.sh \
                           src/tm_mad/nfs/tm_mv.sh"

SSH_TM_COMMANDS_LIB_FILES="src/tm_mad/ssh/tm_clone.sh \
                           src/tm_mad/ssh/tm_delete.sh \
                           src/tm_mad/ssh/tm_ln.sh \
                           src/tm_mad/ssh/tm_mkswap.sh \
                           src/tm_mad/ssh/tm_mkimage.sh \
                           src/tm_mad/ssh/tm_mv.sh"

DUMMY_TM_COMMANDS_LIB_FILES="src/tm_mad/dummy/tm_dummy.sh"

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
#-------------------------------------------------------------------------------

VMM_XEN_ETC_FILES="src/vmm_mad/xen/vmm_xenrc \
                   src/vmm_mad/xen/vmm_xen.conf"

VMM_KVM_ETC_FILES="src/vmm_mad/kvm/vmm_kvmrc \
                   src/vmm_mad/kvm/vmm_kvm.conf"

VMM_EC2_ETC_FILES="src/vmm_mad/ec2/vmm_ec2rc \
                   src/vmm_mad/ec2/vmm_ec2.conf"

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

#-------------------------------------------------------------------------------
# Storage drivers config. files, to be installed under $ETC_LOCATION
#   - nfs, $ETC_LOCATION/tm_nfs
#   - ssh, $ETC_LOCATION/tm_ssh
#   - dummy, $ETC_LOCATION/tm_dummy
#-------------------------------------------------------------------------------

TM_NFS_ETC_FILES="src/tm_mad/nfs/tm_nfs.conf \
                  src/tm_mad/nfs/tm_nfsrc"

TM_SSH_ETC_FILES="src/tm_mad/ssh/tm_ssh.conf \
                  src/tm_mad/ssh/tm_sshrc"

TM_DUMMY_ETC_FILES="src/tm_mad/dummy/tm_dummy.conf \
                    src/tm_mad/dummy/tm_dummyrc"

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
#-------------------------------------------------------------------------------
# INSTALL.SH SCRIPT
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------

# --- Create OpenNebula directories ---

if [ "$UNINSTALL" = "no" ] ; then 
    for d in $MAKE_DIRS; do
        mkdir -p $d
    done
fi

# --- Install/Uninstall files ---

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm $2/`basename $1`
    else
        cp $SRC_DIR/$1 $2
    fi
}

for i in ${INSTALL_FILES[@]}; do
    SRC=$`echo $i | cut -d: -f1`
    DST=`echo $i | cut -d: -f2`
    
    eval SRC_FILES=$SRC 
   
    for f in $SRC_FILES; do 
        do_file $f $DST
    done
done

if [ "$INSTALL_ETC" = "yes" ] ; then
    for i in ${INSTALL_ETC_FILES[@]}; do
        SRC=$`echo $i | cut -d: -f1`
        DST=`echo $i | cut -d: -f2`
    
        eval SRC_FILES=$SRC 
   
        for f in $SRC_FILES; do 
            do_file $f $DST
        done
   done
fi

# --- Set ownership or remove OpenNebula directories ---

if [ "$UNINSTALL" = "no" ] ; then 
    /bin/chown -R $ONEADMIN_USER:$ONEADMIN_GROUP $CHOWN_DIRS
else
    for d in `echo $MAKE_DIRS | awk '{for (i=NF;i>=1;i--) printf $i" "}'`; do
        rmdir $d
    done
fi

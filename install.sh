#!/bin/sh

MAKE_LINKS="no"

if [ "$1" = "-l" ]; then
    MAKE_LINKS="yes"
    shift
fi

SRC_DIR=$PWD
DST_DIR=$1

echo $SRC_DIR
echo $DST_DIR

inst_ln() {
    if [ "$MAKE_LINKS" = "yes" ]; then
        ln -s $SRC_DIR/$1 $DST_DIR/$2
    else
        cp $SRC_DIR/$1 $DST_DIR/$2
    fi
}

inst_cp() {
    cp $SRC_DIR/$1 $DST_DIR/$2
}

if [ -z "$SRC_DIR" -o -z "$DST_DIR" ]; then
    echo Must supply a destination directory
    exit -1
fi

DIRS="/bin /include /etc /etc/im_kvm /etc/im_xen /etc/vmm_kvm /etc/vmm_xen /libexec /lib/ruby /var /share/examples /lib/im_probes /lib/tm_commands/nfs /lib/tm_commands/ssh /etc/vmm_ec2 /etc/im_ec2 /etc/tm_nfs /etc/tm_ssh"

for d in $DIRS; do
    mkdir -p $DST_DIR$d
done

# --- Programs & Scripts---

inst_ln src/nebula/oned bin
inst_ln src/scheduler/mm_sched bin

inst_ln src/client/ruby/onevm bin
inst_ln src/client/ruby/onehost bin
inst_ln src/client/ruby/onevnet bin

inst_ln share/scripts/madcommon.sh libexec
inst_ln share/scripts/one bin

# --- C/C++ OpenNebula API Library & Development files

inst_ln src/client/liboneapi.a lib/
inst_ln include/OneClient.h include/

# --- Ruby Libraries

inst_ln src/mad/ruby/one_mad.rb lib/ruby
inst_ln src/mad/ruby/one_ssh.rb lib/ruby
inst_ln src/mad/ruby/ThreadScheduler.rb lib/ruby

inst_ln src/client/ruby/one.rb lib/ruby
inst_ln src/client/ruby/client_utilities.rb lib/ruby
inst_ln src/client/ruby/command_parse.rb lib/ruby

# --- ONE configuration files ---

inst_cp share/etc/oned.conf etc
inst_cp share/etc/defaultrc etc

# --- XEN driver & configuration files ---

inst_ln src/vmm_mad/xen/one_vmm_xen.rb bin
inst_ln src/vmm_mad/xen/one_vmm_xen bin

inst_ln src/im_mad/xen/xen.rb lib/im_probes

inst_cp src/vmm_mad/xen/vmm_xenrc etc/vmm_xen
inst_cp src/vmm_mad/xen/vmm_xen.conf etc/vmm_xen

inst_cp src/im_mad/xen/im_xenrc etc/im_xen
inst_cp src/im_mad/xen/im_xen.conf etc/im_xen

# --- KVM driver & configuration files ---

inst_ln src/vmm_mad/kvm/one_vmm_kvm.rb bin
inst_ln src/vmm_mad/kvm/one_vmm_kvm bin

inst_ln src/im_mad/kvm/kvm.rb lib/im_probes

inst_cp src/vmm_mad/kvm/vmm_kvmrc etc/vmm_kvm
inst_cp src/vmm_mad/kvm/vmm_kvm.conf etc/vmm_kvm

inst_cp src/im_mad/kvm/im_kvmrc etc/im_kvm
inst_cp src/im_mad/kvm/im_kvm.conf etc/im_kvm

# --- EC2 driver & configuration files ---

inst_ln src/vmm_mad/ec2/one_vmm_ec2.rb bin
inst_ln src/vmm_mad/ec2/one_vmm_ec2 bin

inst_ln src/im_mad/ec2/one_im_ec2.rb bin
inst_ln src/im_mad/ec2/one_im_ec2 bin

inst_cp src/vmm_mad/ec2/vmm_ec2rc etc/vmm_ec2
inst_cp src/vmm_mad/ec2/vmm_ec2.conf etc/vmm_ec2

inst_cp src/im_mad/ec2/im_ec2rc etc/im_ec2
inst_cp src/im_mad/ec2/im_ec2.conf etc/im_ec2

# --- Information driver & probes ---

inst_ln src/im_mad/im_ssh/one_im_ssh.rb bin
inst_ln src/im_mad/im_ssh/one_im_ssh bin

inst_ln src/im_mad/host_probes/architecture.sh lib/im_probes
inst_ln src/im_mad/host_probes/cpu.sh lib/im_probes
inst_ln src/im_mad/host_probes/name.sh lib/im_probes

# -- Transfer manager --

inst_ln src/tm_mad/one_tm               bin
inst_ln src/tm_mad/one_tm.rb            bin

inst_ln src/tm_mad/TMScript.rb          lib/ruby
inst_ln src/tm_mad/tm_common.sh         libexec

inst_ln src/tm_mad/nfs/tm_nfs.conf      etc/tm_nfs
inst_ln src/tm_mad/nfs/tm_nfsrc         etc/tm_nfs

inst_ln src/tm_mad/nfs/tm_clone.sh      lib/tm_commands/nfs
inst_ln src/tm_mad/nfs/tm_delete.sh     lib/tm_commands/nfs
inst_ln src/tm_mad/nfs/tm_ln.sh         lib/tm_commands/nfs
inst_ln src/tm_mad/nfs/tm_mkswap.sh     lib/tm_commands/nfs
inst_ln src/tm_mad/nfs/tm_mkimage.sh    lib/tm_commands/nfs
inst_ln src/tm_mad/nfs/tm_mv.sh         lib/tm_commands/nfs

inst_ln src/tm_mad/ssh/tm_ssh.conf      etc/tm_ssh
inst_ln src/tm_mad/ssh/tm_sshrc         etc/tm_ssh

inst_ln src/tm_mad/ssh/tm_clone.sh      lib/tm_commands/ssh
inst_ln src/tm_mad/ssh/tm_delete.sh     lib/tm_commands/ssh
inst_ln src/tm_mad/ssh/tm_ln.sh         lib/tm_commands/ssh
inst_ln src/tm_mad/ssh/tm_mkswap.sh     lib/tm_commands/ssh
inst_ln src/tm_mad/ssh/tm_mkimage.sh    lib/tm_commands/ssh
inst_ln src/tm_mad/ssh/tm_mv.sh         lib/tm_commands/ssh


# --- Examples ---

inst_cp share/examples/vm.template share/examples
inst_cp share/examples/vm.schema share/examples
inst_cp share/examples/private.net share/examples
inst_cp share/examples/public.net share/examples


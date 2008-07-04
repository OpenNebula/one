#!/bin/sh

SRC_DIR=$PWD
DST_DIR=$1

echo $SRC_DIR
echo $DST_DIR

inst_ln() {
    ln -s $SRC_DIR/$1 $DST_DIR/$2
}

inst_cp() {
    cp $SRC_DIR/$1 $DST_DIR/$2
}

if [ -z "$SRC_DIR" -o -z "$DST_DIR" ]; then
    echo Must supply a destination directory
    exit -1
fi

DIRS="/bin /etc /etc/mad /etc/default /libexec /lib/ruby /var /share/examples /lib/im_probes"

for d in $DIRS; do
    mkdir -p $DST_DIR$d
done

inst_ln src/nebula/oned bin
inst_ln src/scheduler/mm_sched bin
inst_ln src/client/ruby/onevm bin
inst_ln src/client/ruby/onehost bin

inst_cp share/etc/oned.conf etc
inst_ln share/etc/mad/defaultrc etc/mad
inst_ln share/etc/mad/im_sshrc etc/mad
inst_ln share/etc/mad/vmm_xenrc etc/mad
inst_ln share/etc/mad/vmm_kvmrc etc/mad
inst_ln share/etc/default/vmm_xen.conf etc/default
inst_ln share/etc/default/vmm_kvm.conf etc/default

inst_ln share/scripts/madcommon.sh libexec

inst_ln src/vmm_mad/xen/one_vmm_xen.rb bin
inst_ln src/vmm_mad/xen/one_vmm_xen bin

inst_ln src/vmm_mad/kvm_ssh/one_vmm_kvm.rb bin
inst_ln src/vmm_mad/kvm_ssh/one_vmm_kvm bin

inst_ln src/im_mad/im_ssh/one_im_ssh.rb bin
inst_ln src/im_mad/im_ssh/one_im_ssh bin

inst_cp src/im_mad/xen/im_xen.conf etc/default
inst_cp src/im_mad/kvm/im_kvm.conf etc/default
inst_ln src/im_mad/xen/one_ssh.rb lib/ruby
inst_ln src/vmm_mad/xen/one_mad.rb lib/ruby
inst_ln src/client/ruby/one.rb lib/ruby
inst_ln src/client/ruby/client_utilities.rb lib/ruby
inst_ln src/client/ruby/command_parse.rb lib/ruby

inst_ln src/im_mad/xen/architecture.sh lib/im_probes
inst_ln src/im_mad/xen/cpu.sh lib/im_probes
inst_ln src/im_mad/xen/name.sh lib/im_probes
inst_ln src/im_mad/xen/xen.rb lib/im_probes

inst_cp share/scripts/one bin

inst_cp share/examples/vm.template share/examples



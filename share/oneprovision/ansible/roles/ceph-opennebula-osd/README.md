# ceph-opennebula-osd

## Description

To be applied in hypervisors that are connected to KVM. Creates the libvirt secret, and the oneadmin keyring, defines

## Requirements

This role should be applied in nodes that already have been applied the official Ceph osd role.

## Variables

* `ceph_secret_uuid` (mandatory): Ceph secret key to be stored in all KVM nodes, in libvirt.

## Todo list

None

# ceph-opennebula-mon

## Description

Creates a new ceph pool for OpenNebula, generates the auth keys and applies the [crush tunables][1].

## Requirements

This role should be applied in nodes that already have been applied the official Ceph mon role.

## Variables

All of the variables in this role are documented in the [defaults](defaults/main.yml) file.

## Todo list

None

[1]: http://docs.ceph.com/docs/master/rados/operations/crush-map/#tunables

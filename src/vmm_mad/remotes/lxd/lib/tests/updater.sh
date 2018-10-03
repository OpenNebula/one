#!/bin/bash 

rsync -rlptD --progress ~/Projects/one/src/vmm_mad/remotes/lxd/ root@10.10.0.71:/var/tmp/one/vmm/lxd/
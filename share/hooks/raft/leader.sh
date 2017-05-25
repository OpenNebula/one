#!/bin/bash -e

DIR=`dirname $0`
cd $DIR
cd ../../../../

SERVER=$(basename `pwd`)

echo "`date +'%F %H:%M:%S'` [$SERVER] LEADER HOOK" >> /tmp/raft_hooks.log

exit 0

#!/bin/bash
set -e

if [ -z "$RBVMOMI_HOST" ]
then
  echo "export at least RBVMOMI_HOST"
  exit 1
fi

EXAMPLES="$(dirname $(which $0))"
export RUBYOPT="-I$EXAMPLES/../lib -rubygems"

source "$HOME/.rvm/scripts/rvm"
rvm use 1.8.7
ruby -v
RUBY=ruby

echo Creating VM
$RUBY $EXAMPLES/create_vm.rb foo
echo Powering on VM
$RUBY $EXAMPLES/power.rb on foo
echo Resetting VM
$RUBY $EXAMPLES/power.rb reset foo
echo Powering off VM
$RUBY $EXAMPLES/power.rb off foo
echo "Powering on VM (1)"
$RUBY $EXAMPLES/readme-1.rb foo
echo Powering off VM
$RUBY $EXAMPLES/power.rb off foo
echo "Powering on VM (2)"
$RUBY $EXAMPLES/readme-2.rb foo
echo "Setting extraConfig"
$RUBY $EXAMPLES/extraConfig.rb foo set guestinfo.bar=baz
echo "Listing extraConfig"
$RUBY $EXAMPLES/extraConfig.rb foo list | grep guestinfo.bar
echo Powering off VM
$RUBY $EXAMPLES/power.rb off foo
echo Querying datastore utilization
$RUBY $EXAMPLES/vdf.rb
echo Destroying VM
$RUBY $EXAMPLES/power.rb destroy foo

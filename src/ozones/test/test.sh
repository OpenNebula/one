#!/bin/bash

# Compile if not stated otherwise
if [ "x$1" != "x-d" ]; then
    ( cd ../../.. && scons )
fi

# Env vars
ONE_LOCATION_A=$PWD/oneA
ONE_LOCATION_B=$PWD/oneB


##
# Install two fresh opennebulas for ozones testing
##

(cd ../../../ && ./install.sh -d $ONE_LOCATION_A)
(cd ../../../ && ./install.sh -d $ONE_LOCATION_B)

##
# Configure both ONEs
##
cp etc/oned.conf.a $ONE_LOCATION_A/etc/oned.conf
cp etc/oned.conf.b $ONE_LOCATION_B/etc/oned.conf

##
# Execute RSpec Tests
##
for j in `ls ./spec/*_spec.rb` ; do   
    # Launch them ONEs
    ONE_AUTH=$PWD/etc/one_auth_a ONE_LOCATION=$ONE_LOCATION_A oneA/bin/one start
    ONE_AUTH=$PWD/etc/one_auth_b ONE_LOCATION=$ONE_LOCATION_B oneB/bin/one start
    
    # Launch oZones
    OZONES_AUTH=$PWD/etc/ozones_auth ONE_LOCATION=$ONE_LOCATION_A oneA/bin/ozones-server start
    
    sleep 5
    ONE_LOCATION=$ONE_LOCATION_A rspec $j -f s
    CODE=$?

#    if [ $CODE != 0 ] ; then
#        break
#    fi
    
    ONE_LOCATION=$ONE_LOCATION_A oneA/bin/one stop
    ONE_LOCATION=$ONE_LOCATION_B oneB/bin/one stop
    ONE_LOCATION=$ONE_LOCATION_A oneA/bin/ozones-server stop
    sleep 5
    rm -rf oneA/var/*
    rm -rf oneB/var/*
done

if (($CODE == 0)); then
    # Delete directories
    rm -rf oneA
    rm -rf oneB
fi

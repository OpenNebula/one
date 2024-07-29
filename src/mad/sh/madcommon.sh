# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

function mad_debug
{
    if [ -n "${ONE_MAD_DEBUG}" ]; then
        ulimit -c 15000
    fi
}

function export_rc_vars
{
    if [ -f $1 ] ; then
        ONE_VARS=`cat $1 | egrep -e '^[a-zA-Z\-\_0-9]*=' | sed 's/=.*$//'`

        . $1

        for v in $ONE_VARS; do
          export $v
        done
    fi
}

function execute_mad
{

    MAD_FILE=`basename $0`

    if [ -z "$LOG_FILE" ]; then
        LOG_FILE=$MAD_FILE
    fi

    if [ -z "${ONE_LOCATION}" ]; then
        MAD_EXEC_PATH=/usr/lib/one/mads/$MAD_FILE.rb
        MAD_LOG_PATH=/var/log/one/$LOG_FILE.log
    else
        MAD_EXEC_PATH=$ONE_LOCATION/lib/mads/$MAD_FILE.rb
        MAD_LOG_PATH=$ONE_LOCATION/var/$LOG_FILE.log
    fi

    if [ -n "${ONE_MAD_DEBUG}" ]; then
        exec nice -n $PRIORITY $MAD_EXEC_PATH $* 2>> $MAD_LOG_PATH
    else
        exec nice -n $PRIORITY $MAD_EXEC_PATH $* 2> /dev/null
    fi
}

function set_proxy
{
    local proxy_found proxy arg

    proxy_found=false

    for arg in $*; do
        if $proxy_found ; then
            proxy=$arg
            break
        else
            if [ "$arg" = "--proxy" ]; then
                proxy_found=true
            fi
        fi
    done

    if [ -n "$proxy" ]; then
        export http_proxy=$proxy
    fi
}

# Set global environment
if [ -z "${ONE_LOCATION}" ]; then
    DEFAULTRC=/etc/one/defaultrc
else
    DEFAULTRC=$ONE_LOCATION/etc/defaultrc
fi

export_rc_vars $DEFAULTRC

# Sanitize PRIORITY variable
if [ -z "$PRIORITY" ]; then
    export PRIORITY=19
fi

# Add ruby vendorized libraries to the path
if [ -z "${ONE_LOCATION}" ]; then
    VENDOR=/usr/lib/one/ruby/vendors
else
    VENDOR=$ONE_LOCATION/lib/ruby/vendors
fi

ls $VENDOR/*/lib &> /dev/null
if [ $? = 0 ]; then
    if [ -n "$RUBYLIB" ]; then
        RUBYLIB="$RUBYLIB:"
    fi

    RUBYLIB="${RUBYLIB}$(echo $VENDOR/*/lib | tr ' ' ':')"
fi

# Set the proxy if defined
set_proxy "$@"

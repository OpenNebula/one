# -------------------------------------------------------------------------- #
# Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

function log_with_date
{
    PID=$$
    LOG_FILE=$1
    shift

    mkfifo /tmp/one_fifo.$PID.err /tmp/one_fifo.$PID.out
    
    # This line creates an empty log file
    echo -n "" > $LOG_FILE

    # Write out fifo to STDOUT
    cat /tmp/one_fifo.$PID.out &

    while read line < /tmp/one_fifo.$PID.err
    do
        echo `date +"%D %T"`: $line >> $LOG_FILE
    done &

    $* 2>/tmp/one_fifo.$PID.err 1>/tmp/one_fifo.$PID.out

    rm /tmp/one_fifo.$PID.out /tmp/one_fifo.$PID.err
}

function execute_mad
{
    MAD_FILE=`basename $0`

    if [ -n "${ONE_MAD_DEBUG}" ]; then
        log_with_date var/$MAD_FILE.log nice -n $PRIORITY bin/$MAD_FILE.rb $*
    else
        exec nice -n $PRIORITY bin/$MAD_FILE.rb $* 2> /dev/null
    fi
}


# Set global environment

export_rc_vars $ONE_LOCATION/etc/mad/defaultrc

# Sanitize PRIORITY variable
if [ -z "$PRIORITY" ]; then
    export PRIORITY=19
fi

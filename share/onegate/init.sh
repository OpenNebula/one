#mkdir /mnt/context
#mount /dev/disk/by-label/CONTEXT /mnt/context/

cp /mnt/onegate /usr/bin
chmod +x /usr/bin/onegate

TOKENTXT=`cat /mnt/token.txt`
echo "export TOKENTXT=$TOKENTXT" >> /root/.bashrc

function export_rc_vars
{
  if [ -f $1 ] ; then
    ONE_VARS=`cat $1 | egrep -e '^[a-zA-Z\-\_0-9]*=' | sed 's/=.*$//'`

    . $1

    for v in $ONE_VARS; do
        echo "export $v=\"${!v}\"" >> /root/.bashrc
    done
  fi
}

export_rc_vars /mnt/context.sh

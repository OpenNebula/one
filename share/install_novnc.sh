#!/bin/bash

NOVNC_TMP=/tmp/one/novnc-$(date "+%Y%m%d%H%M%S")

if [ -z "$ONE_LOCATION" ]; then
    ONE_SHARE=/usr/share/one
    ONE_PUBLIC_SUNSTONE=/usr/lib/one/sunstone/public
    SUNSTONE_CONF=/etc/one/sunstone-server.conf
else
    ONE_SHARE=$ONE_LOCATION/share
    ONE_PUBLIC_SUNSTONE=$ONE_LOCATION/lib/sunstone/public
    SUNSTONE_CONF=$ONE_LOCATION/etc/sunstone-server.conf
fi

mkdir -p $NOVNC_TMP
wget -P $NOVNC_TMP --no-check-certificate http://github.com/kanaka/noVNC/tarball/master

if [ $? -ne 0 ]; then
  echo "Error downloading noVNC"
  exit 1
fi

tar=`ls -rt $NOVNC_TMP|tail -n1`
tar -C $ONE_SHARE -mxvzf $NOVNC_TMP/$tar

if [ $? -ne 0 ]; then
  echo "Error untaring noVNC"
  exit 1
fi

dir=`ls -rt $ONE_SHARE|tail -n1`
mv $ONE_SHARE/$dir $ONE_SHARE/noVNC

mkdir -p $ONE_PUBLIC_SUNSTONE/vendor/noVNC
mv $ONE_SHARE/noVNC/include/ $ONE_PUBLIC_SUNSTONE/vendor/noVNC/

sed -i.bck "s%^\(:novnc_path: \).*$%\1$ONE_SHARE/noVNC%" $SUNSTONE_CONF

#Update file permissions
chmod +x $ONE_SHARE/noVNC/utils/launch.sh

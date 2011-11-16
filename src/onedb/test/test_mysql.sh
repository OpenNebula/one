#!/bin/bash

################################################################################
# Initialization
################################################################################

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

ONEDCONF_LOCATION="$ONE_LOCATION/etc/oned.conf"

if [ -f $ONEDCONF_LOCATION ]; then
    echo "$ONEDCONF_LOCATION has to be overwritten, move it to a safe place."
    exit -1
fi

VAR_LOCATION="$ONE_LOCATION/var"


# Clean DB
mysql -u oneadmin -poneadmin -h localhost -P 0 -e "DROP DATABASE IF EXISTS onedb_test;"

cp oned_mysql.conf $ONEDCONF_LOCATION


echo "oneadmin:oneadmin" > oneadmin_auth
export ONE_XMLRPC=http://localhost:2889/RPC2
export PATH=$ONE_LOCATION/bin:$PATH
export ONE_AUTH="`pwd`/oneadmin_auth"


PID=$$

mkdir results

################################################################################
# Start OpenNebula and populate a DB
################################################################################

echo "Starting oned, some resources will be created"

oned -f &
sleep 2s;

./create.sh

pkill -P $PID oned
sleep 2s;
pkill -9 -P $PID oned

################################################################################
# Upgrade the 2.2 sample DB, and compare schemas
################################################################################

echo "All resources created, now 2.2 DB will be upgraded."

# dump current DB and schema
onedb backup results/mysqldb.3.0 -v -S localhost -P 0 -u oneadmin -p oneadmin -d onedb_test
if [ $? -ne 0 ]; then
    exit -1
fi

mysqldump -u oneadmin -poneadmin -h localhost -P 0 --no-data onedb_test > results/mysqldb.3.0.tmpschema
if [ $? -ne 0 ]; then
    exit -1
fi

# restore 2.2
onedb restore -v -f 2.2/mysqldb.sql -S localhost -P 0 -u oneadmin -p oneadmin -d onedb_test
if [ $? -ne 0 ]; then
    exit -1
fi

# upgrade
echo "ssh" | onedb upgrade -v --backup results/mysqldb.backup -S localhost -P 0 -u oneadmin -p oneadmin -d onedb_test
if [ $? -ne 0 ]; then
    exit -1
fi

# dump upgraded DB schema
mysqldump -u oneadmin -poneadmin -h localhost -P 0 --no-data onedb_test > results/mysqldb.upgraded.tmpschema

echo "Done. Upgraded DB and the one just created will be compared."

# Sort the files contents, to avoid false diff errors
sort results/mysqldb.upgraded.tmpschema > results/mysqldb.upgraded.schema
sort results/mysqldb.3.0.tmpschema > results/mysqldb.3.0.schema

rm results/mysqldb.upgraded.tmpschema
rm results/mysqldb.3.0.tmpschema



# Perform a diff
FILE=results/schema.diff
diff <(grep -v -e "Dump completed on" results/mysqldb.upgraded.schema) <(grep -v -e "Dump completed on" results/mysqldb.3.0.schema) > $FILE


if [[ -s $FILE ]] ; then
    echo "Error: Schemas do not match. Check file $FILE"
    exit -1
fi


################################################################################
# Start oned using the upgraded DB and compare objects XMLs
################################################################################

echo "Schemas match. OpenNebula 3.0 will be started with the upgraded 2.2 DB."

oned -f &
sleep 2s;

for obj in host vnet image vm user; do
    for i in 0 1 2 3 4; do
        one$obj show -x $i > results/xml_files/$obj-$i-upgraded.xml
    done
done

for i in 0 1; do
    onegroup show -x $i > results/xml_files/group-$i-upgraded.xml
done


for obj in vnet image vm; do
    one$obj list a -x > results/xml_files/$obj-pool-upgraded.xml
done

for obj in host acl group user; do
    one$obj list -x > results/xml_files/$obj-pool-upgraded.xml
done

pkill -P $PID oned
sleep 2s;
pkill -9 -P $PID oned

echo "XML output collected. A diff will be performed."

mkdir results/diff_files

# TODO: fix. The pool elements are returned in different order.
#diff <(grep -v -e "<LAST_MON_TIME>" -e "<CLUSTER>" -e "NAME>" results/xml_files/host-pool.xml) <(grep -v -e "<LAST_MON_TIME>" -e "<CLUSTER>" -e "NAME>" results/xml_files/host-pool-upgraded.xml) > results/diff_files/host-pool.diff
#diff <(grep -v -e "<REGTIME>" -e "<SOURCE>" -e "<SIZE>" results/xml_files/image-pool.xml) <(grep -v -e "<REGTIME>" -e "<SOURCE>" -e "<SIZE>" results/xml_files/image-pool-upgraded.xml) > results/diff_files/image-pool.diff

diff <(grep -v -e "<LAST_POLL>" -e "TIME>" -e "<SOURCE>" -e "<TEMPLATE_ID>" -e "<VM_DIR>" results/xml_files/vm-pool.xml) <(grep -v -e "<LAST_POLL>" -e "TIME>" -e "<SOURCE>" -e "<TEMPLATE_ID>" -e "<VM_DIR>" results/xml_files/vm-pool-upgraded.xml) > results/diff_files/vm-pool.diff

for obj in vnet acl group user; do
    diff <(cat results/xml_files/$obj-pool.xml) <(cat results/xml_files/$obj-pool-upgraded.xml) > results/diff_files/$obj-pool.diff
done

for i in 0 1 2 3 4; do
    diff <(grep -v -e "<LAST_MON_TIME>" -e "<CLUSTER>" -e "NAME>" results/xml_files/host-$i.xml) <(grep -v -e "<LAST_MON_TIME>" -e "<CLUSTER>" -e "NAME>" results/xml_files/host-$i-upgraded.xml) > results/diff_files/host-$i.diff

    diff <(cat results/xml_files/vnet-$i.xml) <(cat results/xml_files/vnet-$i-upgraded.xml) > results/diff_files/vnet-$i.diff

    diff <(grep -v -e "<REGTIME>" -e "<SOURCE>" -e "<SIZE>" results/xml_files/image-$i.xml) <(grep -v -e "<REGTIME>" -e "<SOURCE>" -e "<SIZE>" results/xml_files/image-$i-upgraded.xml) > results/diff_files/image-$i.diff

    diff <(grep -v -e "<LAST_POLL>" -e "TIME>" -e "<SOURCE>" -e "<TEMPLATE_ID>" -e "<VM_DIR>" -e "<NET_TX>" results/xml_files/vm-$i.xml) <(grep -v -e "<LAST_POLL>" -e "TIME>" -e "<SOURCE>" -e "<TEMPLATE_ID>" -e "<VM_DIR>" -e "<NET_TX>" results/xml_files/vm-$i-upgraded.xml) > results/diff_files/vm-$i.diff

    diff <(cat results/xml_files/user-$i.xml) <(cat results/xml_files/user-$i-upgraded.xml) > results/diff_files/user-$i.diff
done

for i in 0 1; do
    diff <(cat results/xml_files/group-$i.xml) <(cat results/xml_files/group-$i-upgraded.xml) > results/diff_files/group-$i.diff
done

CODE=0

for obj in host vnet image vm user; do
    for i in 0 1 2 3 4; do
        FILE=results/diff_files/$obj-$i.diff
        if [[ -s $FILE ]] ; then
            echo "Error: diff file $FILE is not empty."
            CODE=-1
        fi
    done
done

for i in 0 1; do
    FILE=results/diff_files/group-$i.diff
    if [[ -s $FILE ]] ; then
        echo "Error: diff file $FILE is not empty."
        CODE=-1
    fi
done

for obj in host vnet image vm acl group user; do
    FILE=results/diff_files/$obj-pool.diff
    if [[ -s $FILE ]] ; then
        echo "Error: diff file $FILE is not empty."
        CODE=-1
    fi
done


if [ $CODE -eq 0 ]; then
    echo "Done, all tests passed."
fi

rm oneadmin_auth

exit $CODE

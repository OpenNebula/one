# Quick Start Guide
## Build

```
cd src/goca
go build
```

## Unit Tests

For unit tests you need dummy monitoring driver, dummy VM driver and user ``oneadmin`` with password ``opennebula``.
You can setup it by running:
```
echo "oneadmin:opennebula" > $HOME/.one/one_auth
echo 'IM_MAD = [ NAME="dummy", SUNSTONE_NAME="Dummy", EXECUTABLE="one_im_sh", ARGUMENTS="-r 3 -t 15 -w 90 dummy"]' >> /etc/one/monitord.conf
echo 'VM_MAD = [ NAME="dummy", SUNSTONE_NAME="Testing", EXECUTABLE="one_vmm_dummy",TYPE="xml" ]' >> /etc/one/oned.conf
one restart
```
Make sure opennebula is running. Exuecute tests:
```
cd src/goca
go test
```

## Examples

```
cd src/goca
go run ../../share/examples/example_name.go
```

HOST_MONITORING_INTERVAL = 600
#HOST_PER_INTERVAL        = 15

VM_POLLING_INTERVAL      = 600
#VM_PER_INTERVAL          = 5

#VM_DIR=/srv/cloud/one/var

SCRIPTS_REMOTE_DIR=/var/tmp/one

PORT = 2667

DB = [ backend = "sqlite" ]

VNC_BASE_PORT = 5900

DEBUG_LEVEL = 3

NETWORK_SIZE = 254

MAC_PREFIX   = "02:00"

DEFAULT_IMAGE_TYPE    = "OS"
DEFAULT_DEVICE_PREFIX = "hd"


IM_MAD = [ name="im_dummy", executable="one_im_dummy"]

VM_MAD = [ name="vmm_dummy", executable="one_vmm_dummy", type="xml" ]

TM_MAD = [
    name       = "tm_dummy",
    executable = "one_tm",
    arguments  = "tm_dummy/tm_dummy.conf" ]

IMAGE_MAD = [
    executable = "one_image",
    arguments  = "fs -t 15" ]

HM_MAD = [
    executable = "one_hm" ]

AUTH_MAD = [
    executable = "one_auth_mad",
    arguments  = "--authn ssh,x509,ldap,server_cipher,server_x509"
#    arguments  = "--authz quota --authn ssh,x509,ldap,server_cipher,server_x509"
]

SESSION_EXPIRATION_TIME = 900

VM_RESTRICTED_ATTR = "CONTEXT/FILES"
VM_RESTRICTED_ATTR = "DISK/SOURCE"
VM_RESTRICTED_ATTR = "NIC/MAC"
VM_RESTRICTED_ATTR = "NIC/VLAN_ID"
VM_RESTRICTED_ATTR = "RANK"

IMAGE_RESTRICTED_ATTR = "SOURCE"

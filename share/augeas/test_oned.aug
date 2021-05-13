module Test_oned =

    test Oned.lns get
"ENTRY = 123
" =?

   test Oned.lns get
"ENTRY = \"MANAGE ABC\"
" =?

    test Oned.lns get
"TM_MAD_CONF = [NAME=123]
" =?

    test Oned.lns get "
A = [ NAME=123 ]
" =?

    test Oned.lns get
"A = [
NAME=123
]
" = ?

    test Oned.lns get
"A = [
NAME=123,  NAME2=2
]
" = ?

   test Oned.lns get

"#abc
LOG = [
  SYSTEM      = \"file\",
  DEBUG_LEVEL = 3
]
" =?

    test Oned.lns get
"A=1
# comment
  # comment with leading space
	# comment with leading tab
" =?

    test Oned.lns get
"A=1
A=1
B=2 # comment
# abc
#

  C=[
  A=\"B\",
  A=\"B\",#abc
  # abc
  X=\"Y\",
  A=123
]
" =?

    test Oned.lns get
"C=[
  A=123,  #abc
  B=223# abc
]
"
=?
    test Oned.lns get
"TM_MAD = [
    EXECUTABLE = \"one_tm\",
    ARGUMENTS = \"-t 15 -d dummy,lvm,shared,fs_lvm,qcow2,ssh,ceph,dev,vcenter,iscsi_libvirt\"
]
INHERIT_DATASTORE_ATTR  = \"CEPH_HOST\"
"
=?

test Oned.lns get
"LOG = [
  SYSTEM      = \"file\",
  DEBUG_LEVEL = 3
]

MONITORING_INTERVAL_HOST      = 180
MONITORING_INTERVAL_VM        = 180
MONITORING_INTERVAL_DATASTORE = 300
MONITORING_INTERVAL_MARKET    = 600
MONITORING_THREADS  = 50

SCRIPTS_REMOTE_DIR=/var/tmp/one
PORT = 2633
LISTEN_ADDRESS = \"0.0.0.0\"
DB = [ BACKEND = \"sqlite\" ]

VNC_PORTS = [
    START    = 5900
]

FEDERATION = [
    MODE          = \"STANDALONE\",
    ZONE_ID       = 0,
    SERVER_ID     = -1,
    MASTER_ONED   = \"\"
]

RAFT = [
    LIMIT_PURGE          = 100000,
    LOG_RETENTION        = 500000,
    LOG_PURGE_TIMEOUT    = 600,
    ELECTION_TIMEOUT_MS  = 2500,
    BROADCAST_TIMEOUT_MS = 500,
    XMLRPC_TIMEOUT_MS    = 450
]

DEFAULT_COST = [
    CPU_COST    = 0,
    MEMORY_COST = 0,
    DISK_COST   = 0
]

NETWORK_SIZE = 254

MAC_PREFIX   = \"02:00\"

VLAN_IDS = [
    START    = \"2\",
    RESERVED = \"0, 1, 4095\"
]

VXLAN_IDS = [
    START = \"2\"
]

DATASTORE_CAPACITY_CHECK = \"yes\"

DEFAULT_DEVICE_PREFIX       = \"hd\"
DEFAULT_CDROM_DEVICE_PREFIX = \"hd\"

DEFAULT_IMAGE_TYPE           = \"OS\"
IM_MAD = [
      NAME       = \"collectd\",
      EXECUTABLE = \"collectd\",
      ARGUMENTS  = \"-p 4124 -f 5 -t 50 -i 60\" ]

IM_MAD = [
      NAME          = \"kvm\",
      SUNSTONE_NAME = \"KVM\",
      EXECUTABLE    = \"one_im_ssh\",
      ARGUMENTS     = \"-r 3 -t 15 -w 90 kvm\" ]

IM_MAD = [
      NAME          = \"vcenter\",
      SUNSTONE_NAME = \"VMWare vCenter\",
      EXECUTABLE    = \"one_im_sh\",
      ARGUMENTS     = \"-c -t 15 -r 0 vcenter\" ]

IM_MAD = [
      NAME          = \"ec2\",
      SUNSTONE_NAME = \"Amazon EC2\",
      EXECUTABLE    = \"one_im_sh\",
      ARGUMENTS     = \"-c -t 1 -r 0 -w 600 ec2\" ]

VM_MAD = [
    NAME           = \"kvm\",
    SUNSTONE_NAME  = \"KVM\",
    EXECUTABLE     = \"one_vmm_exec\",
    ARGUMENTS      = \"-t 15 -r 0 kvm\",
    DEFAULT        = \"vmm_exec/vmm_exec_kvm.conf\",
    TYPE           = \"kvm\",
    KEEP_SNAPSHOTS = \"no\",
    LIVE_RESIZE    = \"no\",
    IMPORTED_VMS_ACTIONS = \"terminate, terminate-hard, hold, release, suspend,
        resume, delete, reboot, reboot-hard, resched, unresched, disk-attach,
        disk-detach, nic-attach, nic-detach, snapshot-create, snapshot-delete\"
]
" = ?


    test Oned.lns get
"PASSWORD = \"open\\\"nebula\"
" =?

    test Oned.lns get
"DB = [
  PASSWORD = \"open\\\"nebula\"
]
" =?

    test Oned.lns get
" NIC      = [ model=\"virtio\" ]   
" =?

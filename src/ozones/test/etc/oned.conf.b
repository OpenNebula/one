#*******************************************************************************
#                       OpenNebula Configuration file
#*******************************************************************************

# General

HOST_MONITORING_INTERVAL = 600
VM_POLLING_INTERVAL      = 600
SCRIPTS_REMOTE_DIR=/var/tmp/one
PORT=2637
DB = [ backend = "sqlite" ]
VNC_BASE_PORT = 5900
DEBUG_LEVEL=3
NETWORK_SIZE = 254
MAC_PREFIX   = "02:00"
DEFAULT_IMAGE_TYPE    = "OS"
DEFAULT_DEVICE_PREFIX = "hd"

# Dummy 

IM_MAD = [ name="im_dummy", executable="one_im_dummy"]
VM_MAD = [ name="vmm_dummy",executable="one_vmm_dummy", type="xml" ]
TM_MAD = [ name="tm_dummy", executable="one_tm", arguments ="tm_dummy/tm_dummy.conf" ]

# Image 
IMAGE_MAD = [ executable = "one_image", arguments  = "fs -t 15" ]

# Hook
HM_MAD = [ executable = "one_hm" ]


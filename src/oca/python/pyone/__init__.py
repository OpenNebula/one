# Copyright 2018 www.privaz.io Valletech AB
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
'''
PyONE is an implementation of Open Nebula XML-RPC bindings.
'''

from enum import IntEnum
from os import environ
from typing import Optional, Union

#
# Exceptions as defined in the XML-API reference
#
class OneException(Exception):
    pass


class OneAuthenticationException(OneException):
    pass


class OneAuthorizationException(OneException):
    pass


class OneNoExistsException(OneException):
    pass


class OneActionException(OneException):
    pass


class OneApiException(OneException):
    pass


class OneInternalException(OneException):
    pass

#
# Constants, naming follows those in Open Nebula Ruby API
#


DATASTORE_TYPES = IntEnum('DATASTORE_TYPES', 'IMAGE SYSTEM FILE', start=0)
DATASTORE_STATES = IntEnum('DATASTORE_STATES', 'READY DISABLED', start=0)

DISK_TYPES = IntEnum('DISK_TYPES', 'FILE CD_ROM BLOCK RBD FILE_SYSTEM', start=0)

HISTORY_ACTION = IntEnum('HISTORY_ACTION', '''none migrate live-migrate
        shutdown shutdown-hard undeploy undeploy-hard hold release stop
        suspend resume boot delete delete-recreate reboot reboot-hard resched
        unresched poweroff poweroff-hard disk-attach disk-detach nic-attach
        nic-detach disk-snapshot-create disk-snapshot-delete terminate
        terminate-hard disk-resize deploy chown chmod updateconf rename resize
        update snapshot-resize snapshot-delete snapshot-revert disk-saveas
        disk-snapshot-revert recover retry monitor''', start=0)

HOST_STATES = IntEnum('HOST_STATES', '''INIT MONITORING_MONITORED MONITORED
        ERROR DISABLED MONITORING_ERROR MONITORING_INIT MONITORING_DISABLED
        OFFLINE''', start=0)

HOST_STATUS = IntEnum('HOST_STATUS', 'ENABLED DISABLED OFFLINE', start=0)

IMAGE_STATES = IntEnum('IMAGE_STATES', '''INIT READY USED DISABLED LOCKED ERROR
        CLONE DELETE USED_PERS LOCKED_USED LOCKED_USED_PERS''', start=0)

IMAGE_TYPES = IntEnum('IMAGE_TYPES', '''OS CDROM DATABLOCK KERNEL RAMDISK
        CONTEXT FILESYSTEM''', start=0)

LCM_STATE = IntEnum('LCM_STATE', '''
            LCM_INIT
            PROLOG
            BOOT
            RUNNING
            MIGRATE
            SAVE_STOP
            SAVE_SUSPEND
            SAVE_MIGRATE
            PROLOG_MIGRATE
            PROLOG_RESUME
            EPILOG_STOP
            EPILOG
            SHUTDOWN
            CANCEL
            FAILURE
            CLEANUP_RESUBMIT
            UNKNOWN
            HOTPLUG
            SHUTDOWN_POWEROFF
            BOOT_UNKNOWN
            BOOT_POWEROFF
            BOOT_SUSPENDED
            BOOT_STOPPED
            CLEANUP_DELETE
            HOTPLUG_SNAPSHOT
            HOTPLUG_NIC
            HOTPLUG_SAVEAS
            HOTPLUG_SAVEAS_POWEROFF
            HOTPLUG_SAVEAS_SUSPENDED
            SHUTDOWN_UNDEPLOY
            EPILOG_UNDEPLOY
            PROLOG_UNDEPLOY
            BOOT_UNDEPLOY
            HOTPLUG_PROLOG_POWEROFF
            HOTPLUG_EPILOG_POWEROFF
            BOOT_MIGRATE
            BOOT_FAILURE
            BOOT_MIGRATE_FAILURE
            PROLOG_MIGRATE_FAILURE
            PROLOG_FAILURE
            EPILOG_FAILURE
            EPILOG_STOP_FAILURE
            EPILOG_UNDEPLOY_FAILURE
            PROLOG_MIGRATE_POWEROFF
            PROLOG_MIGRATE_POWEROFF_FAILURE
            PROLOG_MIGRATE_SUSPEND
            PROLOG_MIGRATE_SUSPEND_FAILURE
            BOOT_UNDEPLOY_FAILURE
            BOOT_STOPPED_FAILURE
            PROLOG_RESUME_FAILURE
            PROLOG_UNDEPLOY_FAILURE
            DISK_SNAPSHOT_POWEROFF
            DISK_SNAPSHOT_REVERT_POWEROFF
            DISK_SNAPSHOT_DELETE_POWEROFF
            DISK_SNAPSHOT_SUSPENDED
            DISK_SNAPSHOT_REVERT_SUSPENDED
            DISK_SNAPSHOT_DELETE_SUSPENDED
            DISK_SNAPSHOT
            DISK_SNAPSHOT_REVERT
            DISK_SNAPSHOT_DELETE
            PROLOG_MIGRATE_UNKNOWN
            PROLOG_MIGRATE_UNKNOWN_FAILURE
            DISK_RESIZE
            DISK_RESIZE_POWEROFF
            DISK_RESIZE_UNDEPLOYED
            HOTPLUG_NIC_POWEROFF
            HOTPLUG_RESIZE
            HOTPLUG_SAVEAS_UNDEPLOYED
            HOTPLUG_SAVEAS_STOPPED''', start=0)

MARKETPLACEAPP_STATES = IntEnum('MARKETPLACEAPP_STATES', '''INIT READY LOCKED
        ERROR DISABLED''', start=0)
MARKETPLACEAPP_TYPES = IntEnum('MARKETPLACEAPP_TYPES', '''UNKNOWN IMAGE
        VMTEMPLATE SERVICE_TEMPLATE''', start=0)

PAGINATED_POOLS = IntEnum('PAGINATED_POOLS', '''VM_POOL IMAGE_POOL
        TEMPLATE_POOL VN_POOL DOCUMENT_POOL SECGROUP_POOL''', start=0)

REMOVE_VNET_ATTRS = IntEnum('REMOVE_VNET_ATTRS', '''AR_ID BRIDGE CLUSTER_ID
        IP MAC TARGET NIC_ID NETWORK_ID VN_MAD SECURITY_GROUPS VLAN_ID
        ''', start=0)

VM_STATE = IntEnum('VM_STATE', '''INIT PENDING HOLD ACTIVE STOPPED SUSPENDED
        DONE FAILED POWEROFF UNDEPLOYED CLONING CLONING_FAILURE''', start=0)


#
# Import helper methods after definitions they are likely to refer to.
#

def _resolve_uri_and_protocol(uri: Optional[str], protocol: Optional[str]) -> tuple[Optional[str], str]:
    """Resolve uri/protocol using optional environment variables."""

    if uri is None:
        env_xmlrpc_endpoint = environ.get("ONE_XMLRPC")
        env_grpc_endpoint = environ.get("ONE_GRPC")

        uri = env_xmlrpc_endpoint or env_grpc_endpoint

        if not uri:
            raise OneException("Missing endpoint. Pass uri or set ONE_XMLRPC / ONE_GRPC.")

    if protocol is None:
        protocol = environ.get("ONEAPI_PROTOCOL")
        if protocol is None:
            if not isinstance(uri, str):
                raise OneException("Invalid endpoint")
            uri_str = uri.strip()
            if uri_str.startswith(('http://', 'https://')):
                protocol = "xmlrpc"
            else:
                protocol = "grpc"
    
    return protocol.lower(), uri


from . import server_grpc
from . import server_xrpc


class OneServer:
    """
    OpenNebula API client factory. Creates an XML-RPC or gRPC client based on
    protocol and endpoint. Call as OneServer(uri, session, ...).

    :param uri: Endpoint - XML-RPC: "http://host:2633/RPC2", gRPC: "host:2634"
    :param session: Authentication (user:password)
    :param protocol: "grpc" to force gRPC, None for auto-detect from uri
    :param timeout: Request timeout
    :param https_verify: For XML-RPC HTTPS, whether to verify certificates
    """

    def __new__(
        cls,
        uri=None,
        session=None,
        timeout=None,
        https_verify=True,
        protocol: Optional[str] = None,
        **options
    ) -> Union[server_grpc.OneServerGRPC, server_xrpc.OneServerXRPC]:
        if session is None:
            raise OneException("Missing session")
        protocol, uri = _resolve_uri_and_protocol(uri, protocol)
        if protocol == "grpc":
            return server_grpc.OneServerGRPC(
                uri, session, timeout=timeout, **options
            )
        return server_xrpc.OneServerXRPC(
            uri, session, timeout=timeout, https_verify=https_verify, **options
        )

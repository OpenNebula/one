# Copyright 2018 www.privaz.io Valletech AB
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems
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

import xmlrpc.client
import socket
import requests
import requests.utils

from six import string_types
from aenum import IntEnum
from pyone import bindings
from .util import cast2one


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

DISK_TYPES = IntEnum('DISK_TYPES', 'FILE CD_ROM BLOCK RBD', start=0)

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
        CONTEXT''', start=0)

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
            HOTPLUG_NIC_POWEROFF''', start=0)

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
from .helpers import marketapp_export


class OneServer(xmlrpc.client.ServerProxy):
    """
    XML-RPC OpenNebula Server
    Slightly tuned ServerProxy
    """

    def __init__(self, uri, session, timeout=None, **options):
        """
        Override the constructor to take the authentication or session
        Will also configure the socket timeout
        :param uri: OpenNebula endpoint
        :param session: OpenNebula authentication session
        :param timeout: Socket timetout
        :param options: additional options for ServerProxy
        """

        self.__session = session
        if timeout:
            # note that this will affect other classes using sockets too.
            socket.setdefaulttimeout(timeout)

        # register helpers:
        self.__helpers = {
            "marketapp.export": marketapp_export
        }

        transport = RequestsTransport()
        transport.set_https(uri.startswith('https'))

        xmlrpc.client.ServerProxy.__init__(
            self,
            uri,
            transport=transport,
            **options)

    #
    def _ServerProxy__request(self, methodname, params):
        """
        Override/patch the (private) request method to:
          - structured parameters will be casted to attribute=value or XML
          - automatically prefix all methodnames with "one."
          - automatically add the authentication info as first parameter
          - process the response

        :param methodname: XMLRPC method name
        :param params: XMLRPC parameters
        :return: opennebula object or XMLRPC returned value
        """

        # check if this is a helper or a XMLPRC method call

        if methodname in self.__helpers:
            return self.__helpers[methodname](self, *params)

        ret = self._do_request("one."+methodname, self._cast_parms(params))
        return self.__response(ret)

    def _do_request(self, method, params):
        try:
            return xmlrpc.client.ServerProxy._ServerProxy__request(
                self, method, params)
        except xmlrpc.client.Fault as e:
            raise OneException(str(e))

    def _cast_parms(self, params):
        """
        cast parameters, make them one-friendly
        :param params:
        :return:
        """
        lparams = list(params)
        for i, param in enumerate(lparams):
            lparams[i] = cast2one(param)
        params = tuple(lparams)
        # and session a prefix
        params = (self.__session,) + params
        return params

    # Process the response from one XML-RPC server
    # will throw exceptions for each error condition
    # will bind returned xml to objects generated from xsd schemas
    def __response(self, raw_response):
        sucess = raw_response[0]
        code = raw_response[2]

        if sucess:
            ret = raw_response[1]
            if isinstance(ret, string_types):
                # detect xml
                if ret[0] == '<':
                    return bindings.parseString(ret.encode("utf-8"))
            return ret

        message = raw_response[1]
        if code == 0x0100:
            raise OneAuthenticationException(message)
        if code == 0x0200:
            raise OneAuthorizationException(message)
        if code == 0x0400:
            raise OneNoExistsException(message)
        if code == 0x0800:
            raise OneActionException(message)
        if code == 0x1000:
            raise OneApiException(message)
        if code == 0x2000:
            raise OneInternalException(message)
        raise OneException(message)

    def server_retry_interval(self):
        '''returns the recommended wait time between attempts to check if
        the opennebula platform has reached a desired state, in seconds'''
        return 1

    def server_close(self):
        pass


class RequestsTransport(xmlrpc.client.Transport):
    """
    Drop in Transport for xmlrpclib that uses Requests instead of httplib
    """

    user_agent = "Python XMLRPC with Requests (python-requests.org)"
    use_https = False

    def set_https(self, https=False):
        self.use_https = https

    def request(self, host, handler, request_body, verbose=False):
        """
        Make an xmlrpc request.
        """
        headers = {'User-Agent': self.user_agent,
                   'Content-Type': 'text/xml',
                   'Accept': '*/*'
                   }

        url = self._build_url(host, handler)

        kwargs = {'verify': True}

        resp = requests.post(url, data=request_body, headers=headers,
                             **kwargs)
        try:
            resp.raise_for_status()
        except requests.RequestException as e:
            raise xmlrpc.client.ProtocolError(url, resp.status_code,
                                              str(e), resp.headers)
        else:
            return self.parse_response(resp)

    def parse_response(self, response):
        """
        Parse the xmlrpc response.
        """
        p, u = self.getparser()

        p.feed(response.content)
        p.close()

        return u.close()

    def _build_url(self, host, handler):
        """
        Build a url for our request based on the host, handler and use_http
        property
        """
        scheme = 'https' if self.use_https else 'http'
        handler = handler.lstrip('/')

        return '%s://%s/%s' % (scheme, host, handler)

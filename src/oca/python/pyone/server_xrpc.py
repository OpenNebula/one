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

# XML-RPC implementation used by OneServer() factory in __init__.py

import socket
import xmlrpc.client
import requests

from . import bindings
from .util import cast2one
from .helpers import marketapp_export
from . import (
    OneException,
    OneAuthenticationException,
    OneAuthorizationException,
    OneNoExistsException,
    OneActionException,
    OneApiException,
    OneInternalException,
)


class OneServerXRPC(xmlrpc.client.ServerProxy):
    """
    XML-RPC OpenNebula Server.
    Slightly tuned ServerProxy. Use OneServer() factory for protocol dispatch.
    """

    def __init__(self, uri, session, timeout=None, https_verify=True,
                 **options):
        """
        Override the constructor to take the authentication or session
        Will also configure the socket timeout
        :param uri: OpenNebula endpoint
        :param session: OpenNebula authentication session
        :param timeout: Socket timetout
        :param https_verify: if https cert should be verified
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
        transport.set_https_verify(https_verify)

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
        success = raw_response[0]
        code = raw_response[2]

        if success:
            ret = raw_response[1]
            if isinstance(ret, str):
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
    headers = {
        "User-Agent": user_agent,
        "Content-Type": "text/xml",
        "Accept": "*/*",
    }

    def set_https(self, https=False):
        self.use_https = https

    def set_https_verify(self, https_verify):
        self.https_verify = https_verify

    def request(self, host, handler, request_body, verbose=False):
        """
        Make an xmlrpc request.
        """
        url = self._build_url(host, handler)

        kwargs = {'verify': self.https_verify }

        resp = requests.post(url, data=request_body, headers=self.headers,
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

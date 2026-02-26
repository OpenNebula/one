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

from hashlib import md5
from json import load, dumps as json_dumps
from base64 import b64decode, b64encode
from pickle import dumps, loads
from os import path
from tblib import pickling_support
from sys import exc_info
from collections import OrderedDict
from gzip import open
from os import environ

from . import OneException
from .server_grpc import OneServerGRPC
from .server_xrpc import OneServerXRPC
from .util import cast2one

pickling_support.install()


def read_fixture_file(fixture_file):
    f = open(fixture_file, "rt")
    ret = load(f)
    f.close()
    return ret


def write_fixture_file(fixture_file, obj):
    f = open(fixture_file, "wb")
    f.write(json_dumps(obj).encode())
    f.close()


class _OneServerTesterBase:
    def __init__(self, uri, session, fixture_file=None, fixture_unit=None, timeout=None, fixture_replay=None, **options):

        # Environment driven initialization required for capturing fixtures during ansible integration tests

        if fixture_file is None:
            fixture_file = environ.get("PYONE_TEST_FIXTURE_FILE", None)

        if fixture_replay is None:
            fixture_replay = (environ.get("PYONE_TEST_FIXTURE_REPLAY", "True").lower() in ["1", "yes", "true"])

        if fixture_unit is None:
            fixture_unit = environ.get("PYONE_TEST_FIXTURE_UNIT", "init")

        if path.isfile(fixture_file):
            self._fixtures = read_fixture_file(fixture_file)
        else:
            self._fixtures = dict()

        # all members involved in the fixtures must be predefined or
        # the magic getter method will trigger resulting in stack overflows
        self._fixture_replay = fixture_replay
        self._fixture_file = fixture_file
        self.set_fixture_unit_test(fixture_unit)

        super().__init__(uri, session, timeout=timeout, **options)

    def set_fixture_unit_test(self,name):
        """
        Set the name of the unit test. creates an entry in the fixture tree if it does not exist.
        :param name:
        :return:
        """

        if not name in self._fixtures:
            self._fixtures[name] = dict()

        self._fixture_unit_test = self._fixtures[name]

    def _fixture_signature(self, methodname, params):
        signature_md5 = md5()
        sparms=json_dumps(params,sort_keys=True).encode()
        signature_md5.update(sparms)
        return signature_md5.hexdigest()

    def _get_fixture(self, methodname, params):
        '''
        returns the next fixture for a given call.
        :param methodname: XMlRPC method
        :param params: the paramters passed
        :return: file name were to store to or read from the fixture data
        '''

        ret = self._fixture_unit_test[methodname][self._fixture_signature(methodname,params)].pop(0)

        if not ret:
            raise Exception("Could not read fixture, if the tests changed you must re-record fixtures")

        return ret

    def _set_fixture(self,methodname,params,object):
        '''
        Will create the fixture for a given call
        :param methodname:
        :param params:
        :return:
        '''

        signature = self._fixture_signature(methodname,params)

        if not methodname in self._fixture_unit_test:
            self._fixture_unit_test[methodname]=dict()

        if not signature in self._fixture_unit_test[methodname]:
            self._fixture_unit_test[methodname][signature]=[]

        self._fixture_unit_test[methodname][signature].append(object)

    def _do_request(self,method,params):
        '''
        Intercepts requests.
        In record mode they are recorded before being returned.
        In replay mode they are read from fixtures instead
        Exceptions are also captured and reraised
        '''

        ret = None

        if self._fixture_replay:
            ret = self._get_fixture(method,params)
            if 'exception' in ret:
                _, exc_value, exc_tb = loads(b64decode(ret['exception']))
                raise exc_value.with_traceback(exc_tb)
        else:
            try:
                ret = super()._do_request(method, params)
            except Exception as exception:
                ret = {
                    "exception": b64encode(dumps(exc_info(), 2)).decode(),
                }
                raise exception
            finally:
                self._set_fixture(method,params,ret)
        return ret

    def _cast_parms(self,params):
        """
        Parameters will be used to generate the signature of the method, an md5.
        So we need signatures to be deterministic. There are two sources of randomness
        - Python version, in particular differences in dealing with encodings
        - Unsorted sets.
        This method will add casting transformations to fix those, only required for testing.

        :param params:
        :return: a list of parameters that should generate a deterministic md5 signature.
        """
        lparams = list(params)

        for i, param in enumerate(lparams):
            if isinstance(param, dict):
                lparams[i] = self._to_ordered_dict(param)

        return super()._cast_parms(tuple(lparams))

    def _to_ordered_dict(self, param):
        """
        deep orders a dictionary
        :param param:
        :return:
        """

        if isinstance(param,dict):
            # ensure the dictionary is ordered
            param = OrderedDict(sorted(param.items()))
            # recurse
            for key, value in param.items():
                if isinstance(value, dict):
                    param[key] = self._to_ordered_dict(value)
        return param

    def server_retry_interval(self):
        return 0.01

    def server_close(self):
        """
        Unpdates the fixture data if we are recording.
        :return:
        """
        if not self._fixture_replay:
            write_fixture_file(self._fixture_file, self._fixtures)
        super().server_close()


class _OneServerGRPC(OneServerGRPC):
    """Adds _do_request and _cast_parms (same interface as OneServerXRPC) for tester compatibility."""

    def _do_request(self, method, params):
        if not method.startswith("one."):
            raise OneException(
                "gRPC _do_request expects method like one.namespace.method, got: {}".format(method)
            )
        rest = method[len("one.") :]
        parts = rest.split(".", 1)
        if len(parts) != 2:
            raise OneException(
                "gRPC _do_request expects method like one.namespace.method, got: {}".format(method)
            )
        namespace, method_name = parts
        args = params[1:] if len(params) > 1 else ()
        return self._call(namespace, method_name, *args)

    def _cast_parms(self, params):
        lparams = list(params)
        for i, param in enumerate(lparams):
            lparams[i] = cast2one(param)
        return (self._session,) + tuple(lparams)


class OneServerTesterGRPC(_OneServerTesterBase, _OneServerGRPC):
    pass


class OneServerTesterXRPC(_OneServerTesterBase, OneServerXRPC):
    pass


class OneServerTester:
    '''
    This class extends the OneServer to facilitate unit testing
    The idea is to be able to "record" fixtures while testing with a live OpenNebula platform.
    Those recordings can later be use in "replay" mode to simulate an OpenNebula platform.
    XMLAPI method calls are recorded as test_base/unit_test/method_signature_instance
    The signature is generated as the md5 of the parameters
    if several calls with the same signature are doing during the same unit test, instance is incremented.
    The order in which calls happen within the same unit_test must be deterministic.
    '''

    def __new__(
        cls,
        uri,
        session,
        fixture_file=None,
        fixture_unit=None,
        timeout=None,
        fixture_replay=None,
        protocol=None,
        **options
    ):
        tester_class = (
            OneServerTesterGRPC if protocol == "grpc" else OneServerTesterXRPC
        )
        return tester_class(
            uri,
            session,
            fixture_file=fixture_file,
            fixture_unit=fixture_unit,
            timeout=timeout,
            fixture_replay=fixture_replay,
            **options
        )

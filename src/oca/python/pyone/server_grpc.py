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

"""
gRPC implementation of OpenNebula API.
Provides same interface as OneServer (XML-RPC) but uses gRPC transport.
Methods are dispatched via GRPC_API_REGISTRY in grpc/grpc_api_registry.py - add entries
there to support new methods without writing handler code.
"""

from importlib import import_module
from typing import Any, Optional

import grpc

from . import bindings
from .util import cast2one
from . import (
    OneException,
    OneAuthenticationException,
    OneAuthorizationException,
    OneNoExistsException,
    OneActionException,
    OneApiException,
    OneInternalException,
)
from .grpc.grpc_api_registry import GRPC_API_REGISTRY
from .helpers import marketapp_export


# Helpers: (namespace, method) -> callable(server, *args, **kwargs)
# Same as XML-RPC helpers: high-level ops implemented via multiple API
# calls.
_GRPC_HELPERS = {
    ("marketapp", "export"): marketapp_export,
}

# gRPC status code to PyONE exception mapping
_GRPC_STATUS_TO_EXCEPTION = {
    grpc.StatusCode.UNAUTHENTICATED: OneAuthenticationException,
    grpc.StatusCode.PERMISSION_DENIED: OneAuthorizationException,
    grpc.StatusCode.NOT_FOUND: OneNoExistsException,
    grpc.StatusCode.FAILED_PRECONDITION: OneActionException,
    grpc.StatusCode.INVALID_ARGUMENT: OneApiException,
    grpc.StatusCode.INTERNAL: OneInternalException,
    grpc.StatusCode.UNAVAILABLE: OneInternalException,
    grpc.StatusCode.DEADLINE_EXCEEDED: OneInternalException,
}

_PROTO_PACKAGE_TO_PB2 = {
    "tmpl": "template",
    "market": "marketplace",
    "marketapp": "marketplaceapp",
}


def _proto_package_to_pb2_base(package: str) -> str:
    return _PROTO_PACKAGE_TO_PB2.get(package, package)



def _handle_grpc_error(exc: grpc.RpcError) -> None:
    """Convert gRPC error to PyONE exception."""
    code = exc.code()
    message = exc.details() or str(exc)
    exc_class = _GRPC_STATUS_TO_EXCEPTION.get(code, OneException)
    raise exc_class(message)


def _parse_xml_response(response: Any) -> Any:
    """Parse ResponseXML into bindings object."""
    xml_str = response.xml
    if isinstance(xml_str, str):
        xml_str_stripped = xml_str.lstrip()
        if xml_str_stripped.startswith("<"):
            return bindings.parseString(xml_str_stripped.encode("utf-8"))
    return xml_str


def _build_request(spec: dict, session: str, args: tuple, kwargs: dict) -> Any:
    """
    Build protobuf request from spec and *args, **kwargs using protobuf descriptors.
    Maps positional args to request fields by field number order, kwargs by name.
    """
    pb2_base = _proto_package_to_pb2_base(spec["proto_package"])
    pb2_mod = import_module("pyone.grpc." + pb2_base + "_pb2")
    request_class = None
    try:
        service_desc = pb2_mod.DESCRIPTOR.services_by_name.get(spec["service"])
        if service_desc is not None:
            method_desc = service_desc.methods_by_name.get(spec["rpc"])
            if method_desc is not None:
                request_class = getattr(pb2_mod, method_desc.input_type.name)
    except Exception:
        request_class = None
    if request_class is None:
        request_class = getattr(pb2_mod, spec["rpc"] + "Request")

    fields = [f for f in request_class.DESCRIPTOR.fields if f.name != "session_id"]
    field_names = {f.name for f in fields}
    if len(args) > len(fields):
        raise OneException("Too many positional parameters for gRPC request")

    req_dict = {"session_id": session}
    assigned = set()

    for i, field in enumerate(fields):
        if i >= len(args):
            break
        value = args[i]
        if value is None:
            continue
        if field.name == "template":
            value = cast2one(value)
        req_dict[field.name] = value
        assigned.add(field.name)

    for k, value in kwargs.items():
        if k == "session_id":
            continue
        if value is None:
            continue
        if k not in field_names:
            raise OneException(
                "Unknown gRPC parameter '{}' for one.{}.{}".format(
                    k, spec["namespace"], spec["method"]
                )
            )
        if k in assigned:
            raise OneException("Parameter '{}' specified multiple times".format(k))
        if k == "template":
            value = cast2one(value)
        req_dict[k] = value

    try:
        return request_class(**req_dict)
    except TypeError as exc:
        raise OneException(str(exc)) from exc


def _generic_call(server, namespace, method, *args, **kwargs):
    """
    Generic dispatcher: look up (namespace, method) in GRPC_API_REGISTRY,
    build request from *args/**kwargs, call gRPC, handle response.
    """
    key = (namespace, method)
    spec = GRPC_API_REGISTRY.get(key)
    if spec is None:
        raise OneException(
            "gRPC method not implemented: one.{}.{}".format(namespace, method)
        )

    spec = dict(spec)
    spec["namespace"] = namespace
    spec["method"] = method
    stub = server._get_stub(spec["proto_package"], spec["service"])
    rpc_method = getattr(stub, spec["rpc"])
    req = _build_request(spec, server._session, args, kwargs)

    try:
        res = rpc_method(req, timeout=server._timeout)
    except grpc.RpcError as e:
        _handle_grpc_error(e)

    xml = getattr(res, "xml", None)
    if isinstance(xml, str):
        return _parse_xml_response(res)

    oid = getattr(res, "oid", None)
    if isinstance(oid, int):
        return oid

    return res


class _GRPCNamespace(object):
    """
    Provides dynamic dispatch for nested method calls.
    e.g. one.hostpool.info() -> _call("hostpool", "info")
    """

    def __init__(self, server, path):
        self._server = server
        self._path = path

    def __getattr__(self, name):
        def caller(*args, **kwargs):
            return self._server._call(self._path, name, *args, **kwargs)
        return caller


class OneServerGRPC(object):
    """
    OpenNebula API client using gRPC transport.
    Same interface as OneServer (XML-RPC) for supported methods.
    Methods are dispatched via GRPC_API_REGISTRY in grpc/grpc_api_registry.py.
    """

    def __init__(self, endpoint: str, session: str, timeout: Optional[float] = None, **options):
        """
        :param endpoint: gRPC endpoint (host:port), e.g. "localhost:2634"
        :param session: OpenNebula authentication (user:password)
        :param timeout: Request timeout in seconds
        """
        self._session = session
        self._endpoint = endpoint
        self._timeout = 60 if timeout is None else timeout
        opts = []
        if timeout is not None:
            opts.append(("grpc.keepalive_timeout_ms", int(timeout * 1000)))
        self._channel = grpc.insecure_channel(endpoint, options=opts or None)
        self._stubs = {}

    def _get_stub(self, proto_package, service):
        """Lazy-load gRPC stub for proto package + service."""
        key = (proto_package, service)
        if key not in self._stubs:
            pb2_base = _proto_package_to_pb2_base(proto_package)
            grpc_mod_name = pb2_base + "_pb2_grpc"
            stub_name = service + "Stub"
            try:
                mod = import_module("pyone.grpc." + grpc_mod_name)
                stub_class = getattr(mod, stub_name)
            except (ImportError, AttributeError) as exc:
                raise OneException(
                    "Failed to load stub for {}.{}: {}".format(
                        proto_package, service, exc
                    )
                ) from exc
            self._stubs[key] = stub_class(self._channel)
        return self._stubs[key]

    def __getattr__(self, name):
        return _GRPCNamespace(self, name)

    def _call(self, namespace, method, *args, **kwargs):
        """Dispatch (namespace, method) to helper or via GRPC_API_REGISTRY."""
        key = (namespace, method)
        if key in _GRPC_HELPERS:
            return _GRPC_HELPERS[key](self, *args, **kwargs)
        return _generic_call(self, namespace, method, *args, **kwargs)

    def server_retry_interval(self):
        return 1

    def server_close(self):
        if self._channel:
            self._channel.close()
            self._channel = None
            self._stubs.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.server_close()

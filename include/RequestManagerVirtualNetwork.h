/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#ifndef REQUEST_MANAGER_VIRTUAL_NETWORK_H
#define REQUEST_MANAGER_VIRTUAL_NETWORK_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVirtualNetwork: public Request
{
protected:
    RequestManagerVirtualNetwork(const string& method_name,
                                 const string& help)
        :Request(method_name,"A:sis",help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerVirtualNetwork(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);

    virtual int leases_action(VirtualNetwork * vn,
                              VirtualNetworkTemplate * tmpl,
                              RequestAttributes& att,
                              string& error_str) = 0;
    /* -------------------------------------------------------------------- */

    string leases_error (const string& error);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAddAddressRange: public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkAddAddressRange():
        RequestManagerVirtualNetwork("VirtualNetworkAddAddressRange",
                                     "Adds address ranges to a virtual network")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~VirtualNetworkAddAddressRange(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      string& error_str)
    {
        return vn->add_ar(tmpl, error_str);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRmAddressRange : public Request
{
public:
    VirtualNetworkRmAddressRange(
      const string& name = "VirtualNetworkRmAddressRange",
      const string& sign = "A:sii",
      const string& help = "Removes an address range from a virtual network")
        : Request(name, sign, help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::ADMIN;
    };

    virtual ~VirtualNetworkRmAddressRange(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkFreeAddressRange : public VirtualNetworkRmAddressRange
{
public:
    VirtualNetworkFreeAddressRange():VirtualNetworkRmAddressRange(
      "VirtualNetworkFreeAddressRange",
      "A:sii",
      "Frees a reserved address range from a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    ~VirtualNetworkFreeAddressRange(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att)
    {
        VirtualNetworkRmAddressRange::request_execute(_paramList, att);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateAddressRange: public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkUpdateAddressRange():
        RequestManagerVirtualNetwork("VirtualNetworkUpdateAddressRange",
          "Updates address ranges to a virtual network")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~VirtualNetworkUpdateAddressRange(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      string& error_str)
    {
        error_str.clear();

        vn->update_ar(tmpl);

        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkHold : public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkHold():
        RequestManagerVirtualNetwork("VirtualNetworkHold",
                                     "Holds a virtual network Lease as used"){};
    ~VirtualNetworkHold(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      string& error_str)
    {
        return vn->hold_leases(tmpl, error_str);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRelease : public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkRelease():
        RequestManagerVirtualNetwork("VirtualNetworkRelease",
                                     "Releases a virtual network Lease on hold"){};
    ~VirtualNetworkRelease(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      string& error_str)
    {
        return vn->free_leases(tmpl, error_str);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkReserve: public Request
{
public:
    VirtualNetworkReserve():Request("VirtualNetworkReserve", "A:sis",
      "Reserve network addresses")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::USE;
    };

    ~VirtualNetworkReserve(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
        RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

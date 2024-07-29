/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "VirtualNetworkPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVirtualNetwork: public Request
{
protected:
    RequestManagerVirtualNetwork(const std::string& method_name,
                                 const std::string& help)
        :Request(method_name, "A:sis", help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerVirtualNetwork() {};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    virtual int leases_action(VirtualNetwork * vn,
                              VirtualNetworkTemplate * tmpl,
                              RequestAttributes& att,
                              std::string& error_str) = 0;
    /* -------------------------------------------------------------------- */

    std::string leases_error(const std::string& error);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAddAddressRange: public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkAddAddressRange():
        RequestManagerVirtualNetwork("one.vn.add_ar",
                                     "Adds address ranges to a virtual network")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~VirtualNetworkAddAddressRange() {};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      std::string& error_str) override
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
            const std::string& name = "one.vn.rm_ar",
            const std::string& sign = "A:sii",
            const std::string& help = "Removes an address range from a virtual network")
        : Request(name, sign, help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::ADMIN;
    };

    ~VirtualNetworkRmAddressRange() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkFreeAddressRange : public VirtualNetworkRmAddressRange
{
public:
    VirtualNetworkFreeAddressRange():VirtualNetworkRmAddressRange(
                "one.vn.free_ar",
                "A:sii",
                "Frees a reserved address range from a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    ~VirtualNetworkFreeAddressRange() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override
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
        RequestManagerVirtualNetwork("one.vn.update_ar",
                                     "Updates address ranges to a virtual network")
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~VirtualNetworkUpdateAddressRange() {};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      std::string& error_str) override
    {
        if (!att.is_admin())
        {
            return vn->update_ar(tmpl, true, error_str);
        }
        else
        {
            return vn->update_ar(tmpl, false, error_str);
        }
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkHold : public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkHold():
        RequestManagerVirtualNetwork("one.vn.hold",
                                     "Holds a virtual network Lease as used") {};
    ~VirtualNetworkHold() {};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      std::string& error_str) override
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
        RequestManagerVirtualNetwork("one.vn.release",
                                     "Releases a virtual network Lease on hold") {};
    ~VirtualNetworkRelease() {};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      RequestAttributes& att,
                      std::string& error_str) override
    {
        return vn->free_leases(tmpl, error_str);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkReserve: public Request
{
public:
    VirtualNetworkReserve():Request("one.vn.reserve", "A:sis",
                                        "Reserve network addresses")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::USE;
    };

    ~VirtualNetworkReserve() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRecover : public Request
{
public:
    VirtualNetworkRecover()
        : Request("one.vn.recover",
                  "A:sii",
                  "Recover Virtual Network from ERROR or LOCKED state")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();

        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

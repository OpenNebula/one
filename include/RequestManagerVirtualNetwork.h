/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
                              string& error_str) = 0;
    /* -------------------------------------------------------------------- */

    string leases_error (const string& error);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAddLeases : public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkAddLeases():
        RequestManagerVirtualNetwork("VirtualNetworkAddLeases",
                                     "Adds leases to a virtual network"){};
    ~VirtualNetworkAddLeases(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      string& error_str)
    {
        return vn->add_leases(tmpl, error_str);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRemoveLeases : public RequestManagerVirtualNetwork
{
public:
    VirtualNetworkRemoveLeases():
        RequestManagerVirtualNetwork("VirtualNetworkRemoveLeases",
                                     "Removes leases from a virtual network"){};
    ~VirtualNetworkRemoveLeases(){};

    int leases_action(VirtualNetwork * vn,
                      VirtualNetworkTemplate * tmpl,
                      string& error_str) 
    {
        return vn->remove_leases(tmpl, error_str);
    }
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
                      string& error_str)
    {
        return vn->free_leases(tmpl, error_str);
    }
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

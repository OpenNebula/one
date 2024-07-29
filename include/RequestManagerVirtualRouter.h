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

#ifndef REQUEST_MANAGER_VIRTUAL_ROUTER_H
#define REQUEST_MANAGER_VIRTUAL_ROUTER_H

#include "Request.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVirtualRouter: public Request
{
protected:
    RequestManagerVirtualRouter(const std::string& method_name,
                                const std::string& help,
                                const std::string& params);

    ~RequestManagerVirtualRouter() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterInstantiate : public RequestManagerVirtualRouter
{
public:
    VirtualRouterInstantiate() : RequestManagerVirtualRouter(
                "one.vrouter.instantiate", "Instantiates a new virtual machine "
                "associated to a virtual router", "A:siiisbs") { }

    ~VirtualRouterInstantiate() = default;

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAttachNic : public RequestManagerVirtualRouter
{
public:
    VirtualRouterAttachNic():RequestManagerVirtualRouter("one.vrouter.attachnic",
                                                             "Attaches a new NIC to the virtual router, and its virtual machines",
                                                             "A:sis") { }

    ~VirtualRouterAttachNic() = default;

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterDetachNic : public RequestManagerVirtualRouter
{
public:
    VirtualRouterDetachNic():RequestManagerVirtualRouter("one.vrouter.detachnic",
                                                             "Detaches a NIC from a virtual router, and its virtual machines", "A:sii") { }

    ~VirtualRouterDetachNic() = default;

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

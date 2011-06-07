/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef REQUEST_MANAGER_CHOWN_H_
#define REQUEST_MANAGER_CHOWN_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerChown : public Request
{
protected:
    RequestManagerChown(const string& method_name,
                        const string& help)
        :Request(method_name,"A:siii",help)
    {
        auth_op = AuthRequest::CHOWN;
    };

    ~RequestManagerChown(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList);

    /* -------------------------------------------------------------------- */

    virtual int set_uid(int noid, PoolObjectSQL * object, string& error_msg)
    {
        int rc = object->set_uid(noid);
        if ( rc < 0 )
        {
            ostringstream oss;
            oss << object_name(auth_object) << " objects do not have owner";

            error_msg = oss.str();
        }

        pool->update(object);

        object->unlock();

        return rc;
    };

    /* -------------------------------------------------------------------- */

    virtual int set_gid(int ngid, PoolObjectSQL * object, string& error_msg)
    {
        int rc = object->set_gid(ngid);
        if ( rc < 0 )
        {
            ostringstream oss;
            oss << object_name(auth_object) << " objects do not have group";

            error_msg = oss.str();
        }

        pool->update(object);

        object->unlock();

        return rc;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChown : public RequestManagerChown
{
public:
    VirtualMachineChown():
        RequestManagerChown("VirtualMachineChown",
                            "Changes ownership of a virtual machine")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = AuthRequest::VM;
    };

    ~VirtualMachineChown(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChown : public RequestManagerChown
{
public:
    TemplateChown():
        RequestManagerChown("TemplateChown",
                            "Changes ownership of a virtual machine template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = AuthRequest::TEMPLATE;
    };

    ~TemplateChown(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkChown: public RequestManagerChown
{
public:
    VirtualNetworkChown():
        RequestManagerChown("VirtualNetworkChown",
                           "Changes ownership of a virtual network")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = AuthRequest::NET;
    };

    ~VirtualNetworkChown(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChown: public RequestManagerChown
{
public:
    ImageChown():
        RequestManagerChown("ImageChown",
                            "Changes ownership of an image")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = AuthRequest::IMAGE;
    };

    ~ImageChown(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostChown : public RequestManagerChown
{
public:
    HostChown():
        RequestManagerChown("HostChown",
                            "Changes ownership of a host")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = AuthRequest::HOST;
    };

    ~HostChown(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChown : public RequestManagerChown
{
public:
    UserChown():
        RequestManagerChown("UserChown",
                            "Changes ownership of a user")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = AuthRequest::USER;
    };

    ~UserChown(){};

    /* -------------------------------------------------------------------- */

    int set_gid(int ngid, PoolObjectSQL * object, string& error_msg)
    {
        User * user = static_cast<User*>(object);
        int oid = user->get_oid();

        user->set_gid(ngid);

        // Main group is also in the Group IDs set
        // This call's return code is not checked, because this new main group
        // could be already a secondary group
        user->add_group(ngid);

        pool->update(object);
        object->unlock();

        // Now add the User's ID to the Group
        Nebula&     nd    = Nebula::instance();
        GroupPool * gpool = nd.get_gpool();
        Group *     group = gpool->get(ngid, true);

        if( group == 0 )
        {
            get_error(object_name(AuthRequest::GROUP),ngid);
            return -1;
        }

        group->add_user(oid);

        gpool->update(group);

        group->unlock();

        return 0;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

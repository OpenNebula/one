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

#ifndef REQUEST_MANAGER_ALLOCATE_H_
#define REQUEST_MANAGER_ALLOCATE_H_

#include "Request.h"
#include "Nebula.h"

#include "VirtualNetworkTemplate.h"
#include "ImageTemplate.h"
#include "VirtualMachineTemplate.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerAllocate: public Request
{
protected:
    RequestManagerAllocate(const string& method_name,
                           const string& help,
                           const string& xml_args,
                           bool  dt)
        :Request(method_name,xml_args,help), do_template(dt)
    {
        auth_op = AuthRequest::CREATE;
    };

    ~RequestManagerAllocate(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList);

    virtual bool allocate_authorization(Template * obj_template);

    string allocate_error (char *error);

    string allocate_error (const string& error);

    /* -------------------------------------------------------------------- */

    virtual Template * get_object_template() { return 0; };

    virtual int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                              Template * tmpl,
                              int& id, 
                              string& error_str) = 0;
private:

    bool do_template;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAllocate: public RequestManagerAllocate
{
public:
    VirtualMachineAllocate():
        RequestManagerAllocate("VirtualMachineAllocate",
                               "Allocates a new virtual machine",
                               "A:ss",
                               true)
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_vmpool();
        auth_object = AuthRequest::VM;
    };

    ~VirtualMachineAllocate(){};
    /* --------------------------------------------------------------------- */

    Template * get_object_template() 
    { 
        return new VirtualMachineTemplate; 
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);

    bool allocate_authorization(Template * obj_template);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAllocate: public RequestManagerAllocate
{
public:
    VirtualNetworkAllocate():
        RequestManagerAllocate("VirtualNetworkInfo",
                               "Allocates a new virtual network",
                               "A:ss",
                               true)
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = AuthRequest::NET;
    };

    ~VirtualNetworkAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template() 
    { 
        return new VirtualNetworkTemplate; 
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAllocate: public RequestManagerAllocate
{
public:
    ImageAllocate():
        RequestManagerAllocate("ImageAllocate",
                               "Allocates a new image",
                               "A:ss",
                               true)
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = AuthRequest::IMAGE;
    };

    ~ImageAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template() 
    { 
        return new ImageTemplate; 
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAllocate : public RequestManagerAllocate
{
public:
    TemplateAllocate():
        RequestManagerAllocate("TemplateAllocate",
                               "Allocates a new virtual machine template",
                               "A:ss",
                               true)
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = AuthRequest::TEMPLATE;
    };

    ~TemplateAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template() 
    { 
        return new VirtualMachineTemplate; 
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAllocate : public RequestManagerAllocate
{
public:
    HostAllocate():
        RequestManagerAllocate("HostInfo",
                               "Allocates a new host",
                               "A:sssss",
                               false)
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = AuthRequest::HOST;
    };

    ~HostAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAllocate: public RequestManagerAllocate
{
public:
    UserAllocate():
        RequestManagerAllocate("UserInfo",
                               "Returns user information",
                               "A:sss",
                               false)
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = AuthRequest::USER;
    };

    ~UserAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAllocate : public RequestManagerAllocate
{
public:
    ClusterAllocate():
        RequestManagerAllocate("ClusterInfo",
                               "Allocates a new cluster",
                               "A:ss",
                               false)
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_cpool();
        auth_object = AuthRequest::CLUSTER;
    };

    ~ClusterAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAllocate: public RequestManagerAllocate
{
public:
    GroupAllocate():
        RequestManagerAllocate("GroupAllocate",
                               "Allocates a new group",
                               "A:ss",
                               false)
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = AuthRequest::GROUP;
    };

    ~GroupAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList, 
                      Template * tmpl,
                      int& id, 
                      string& error_str);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

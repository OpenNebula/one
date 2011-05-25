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

#ifndef REQUEST_MANAGER_INFO_H_
#define REQUEST_MANAGER_INFO_H_

#include "Request.h"
#include "Nebula.h"
#include "AuthManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerInfo: public Request
{
protected:
    RequestManagerInfo(const string& method_name,
                       const string& help)
        :Request(method_name,"A:si",help){};

    ~RequestManagerInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(int uid, 
                         int gid,
                         xmlrpc_c::paramList const& _paramList);

    virtual bool isPublic(PoolObjectSQL *obj){ return false; };
    
    /* -------------------------------------------------------------------- */

    PoolSQL *           pool;
    AuthRequest::Object auth_object;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineInfo : public RequestManagerInfo
{
public:
    VirtualMachineInfo():
        RequestManagerInfo("VirtualMachineInfo",
                           "Returns virtual machine instance information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = AuthRequest::VM;
    };

    ~VirtualMachineInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateInfo : public RequestManagerInfo
{
public:
    TemplateInfo():
        RequestManagerInfo("TemplateInfo",
                           "Returns virtual machine template information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = AuthRequest::TEMPLATE;
    };

    ~TemplateInfo(){};

    bool isPublic(PoolObjectSQL *obj)
    { 
        VMTemplate * cobj;

        cobj = static_cast<VMTemplate *>(obj);

        return cobj->isPublic();
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkInfo: public RequestManagerInfo
{
public:
    VirtualNetworkInfo():
        RequestManagerInfo("VirtualNetworkInfo",
                           "Returns virtual network information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = AuthRequest::NET;
    };

    ~VirtualNetworkInfo(){};

    bool isPublic(PoolObjectSQL *obj)
    { 
        VirtualNetwork * cobj;

        cobj = static_cast<VirtualNetwork *>(obj);

        return cobj->isPublic();
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageInfo: public RequestManagerInfo
{
public:
    ImageInfo():
        RequestManagerInfo("ImageInfo",
                           "Returns image information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = AuthRequest::IMAGE;
    };

    ~ImageInfo(){};

    bool isPublic(PoolObjectSQL *obj)
    { 
        Image * cobj;

        cobj = static_cast<Image *>(obj);

        return cobj->isPublic();
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostInfo : public RequestManagerInfo
{
public:
    HostInfo():
        RequestManagerInfo("HostInfo",
                           "Returns host information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = AuthRequest::HOST;
    };

    ~HostInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterInfo : public RequestManagerInfo
{
public:
    ClusterInfo():
        RequestManagerInfo("ClusterInfo",
                           "Returns cluster information")
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_cpool();
        auth_object = AuthRequest::CLUSTER;
    };

    ~ClusterInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class GroupInfo: public RequestManagerInfo
{
public:
    GroupInfo():
        RequestManagerInfo("GroupInfo",
                           "Returns group information")
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = AuthRequest::GROUP;
    };

    ~GroupInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserInfo: public RequestManagerInfo
{
public:
    UserInfo():
        RequestManagerInfo("UserInfo",
                           "Returns user information")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = AuthRequest::USER;
    };

    ~UserInfo(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

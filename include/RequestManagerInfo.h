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

#ifndef REQUEST_MANAGER_INFO_H_
#define REQUEST_MANAGER_INFO_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerInfo: public Request
{
protected:
    RequestManagerInfo(const string& method_name,
                       const string& help)
        :Request(method_name,"A:si",help)
    {
        auth_op = AuthRequest::USE;
    };

    ~RequestManagerInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    /* -------------------------------------------------------------------- */

    virtual void to_xml(PoolObjectSQL * object, string& str)
    {
        object->to_xml(str);
    };
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
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(PoolObjectSQL * object, string& str)
    {
        VirtualMachine * vm = static_cast<VirtualMachine *>(object);
        vm->to_xml_extended(str);
    };
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
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateInfo(){};
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
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(PoolObjectSQL * object, string& str)
    {
        VirtualNetwork * vn = static_cast<VirtualNetwork*>(object);
        vn->to_xml_extended(str);
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
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageInfo(){};

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
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostInfo(){};
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
        auth_object = PoolObjectSQL::GROUP;
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
        auth_object = PoolObjectSQL::USER;
    };

    ~UserInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreInfo: public RequestManagerInfo
{
public:
    DatastoreInfo():
        RequestManagerInfo("DatastoreInfo",
                           "Returns datastore information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterInfo: public RequestManagerInfo
{
public:
    ClusterInfo():
        RequestManagerInfo("ClusterInfo",
                           "Returns cluster information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterInfo(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

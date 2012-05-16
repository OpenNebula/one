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

#ifndef REQUEST_MANAGER_POOL_INFO_FILTER_H_
#define REQUEST_MANAGER_POOL_INFO_FILTER_H_

#include "Request.h"
#include "Nebula.h"
#include "AuthManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerPoolInfoFilter: public Request
{
public:
    /** Specify all objects the user has right to USE (-2) */
    static const int ALL;

    /** Specify user's objects in the pool (-3) */
    static const int MINE;

    /** Specify user's + group objects (-1)     */
    static const int MINE_GROUP;

protected:
    RequestManagerPoolInfoFilter(const string& method_name,
                                 const string& help,
                                 const string& signature)
        :Request(method_name,signature,help)
    {};

    ~RequestManagerPoolInfoFilter(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);

    /* -------------------------------------------------------------------- */

    void where_filter(RequestAttributes& att,
                      int                filter_flag,
                      int                start_id,
                      int                end_id,
                      const string&      and_clause,
                      const string&      or_clause,
                      string&            where_string);

    /* -------------------------------------------------------------------- */

    void dump(RequestAttributes& att,
              int                filter_flag,
              int                start_id,
              int                end_id,
              const string&      and_clause,
              const string&      or_clause);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    /* -------------------------------------------------------------------- */

    static const int ALL_VM;   /**< VMs in any state  (-2) */
    static const int NOT_DONE; /**< VMs in any state expect DONE (-1)*/

    /* -------------------------------------------------------------------- */

    VirtualMachinePoolInfo():
        RequestManagerPoolInfoFilter("VirtualMachinePoolInfo",
                                     "Returns the virtual machine instances pool",
                                     "A:siiii")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachinePoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAccounting : public RequestManagerPoolInfoFilter
{
public:

    VirtualMachinePoolAccounting():
        RequestManagerPoolInfoFilter("VirtualMachinePoolAccounting",
                                     "Returns the virtual machine history records",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachinePoolAccounting(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolMonitoring : public RequestManagerPoolInfoFilter
{
public:

    VirtualMachinePoolMonitoring():
        RequestManagerPoolInfoFilter("VirtualMachinePoolMonitoring",
                                     "Returns the virtual machine monitoring records",
                                     "A:si")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachinePoolMonitoring(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    TemplatePoolInfo():
        RequestManagerPoolInfoFilter("TemplatePoolInfo",
                                     "Returns the virtual machine template pool",
                                     "A:siii")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplatePoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    VirtualNetworkPoolInfo():
        RequestManagerPoolInfoFilter("VirtualNetworkPoolInfo",
                                     "Returns the virtual network pool",
                                     "A:siii")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkPoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ImagePoolInfo():
        RequestManagerPoolInfoFilter("ImagePoolInfo",
                                     "Returns the image pool",
                                     "A:siii")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImagePoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    HostPoolInfo():
        RequestManagerPoolInfoFilter("HostPoolInfo",
                                     "Returns the host pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolMonitoring : public RequestManagerPoolInfoFilter
{
public:

    HostPoolMonitoring():
        RequestManagerPoolInfoFilter("HostPoolMonitoring",
                                     "Returns the host monitoring records",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostPoolMonitoring(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    GroupPoolInfo():
        RequestManagerPoolInfoFilter("GroupPoolInfo",
                                     "Returns the group pool",
                                     "A:s")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;
    };

    ~GroupPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    UserPoolInfo():
        RequestManagerPoolInfoFilter("UserPoolInfo",
                                     "Returns the user pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastorePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    DatastorePoolInfo():
        RequestManagerPoolInfoFilter("DatastorePoolInfo",
                                     "Returns the datastore pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastorePoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ClusterPoolInfo():
        RequestManagerPoolInfoFilter("ClusterPoolInfo",
                                     "Returns the cluster pool",
                                     "A:s")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

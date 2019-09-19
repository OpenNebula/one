/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

    /** Specify group objects (-4)     */
    static const int GROUP;

    /**
     *  Set a where filter to get the oids of objects that a user can "USE"
     *    @param att the XML-RPC Attributes with user information
     *    @param auth_object the object type
     *    @param where_string will store the resulting SQL filter
     *    @return true if the use_filter is empty and access to all objects
     *    should be granted.
     */
    static bool use_filter(RequestAttributes& att,
          PoolObjectSQL::ObjectType aobj,
          bool disable_all_acl,
          bool disable_cluster_acl,
          bool disable_group_acl,
          const string& and_str,
          string& where_str);

protected:
    /*
    *  True to gather full info
    */
    bool extended;

    RequestManagerPoolInfoFilter(const string& method_name,
                                 const string& help,
                                 const string& signature)
        :Request(method_name,signature,help)
    {
        leader_only = false;
        extended    = false;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;

    /* -------------------------------------------------------------------- */

    void where_filter(RequestAttributes& att,
              int                filter_flag,
              int                start_id,
              int                end_id,
              const string&      and_clause,
              const string&      or_clause,
              bool               disable_all_acl,
              bool               disable_cluster_acl,
              bool               disable_group_acl,
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
        RequestManagerPoolInfoFilter("one.vmpool.info",
                                     "Returns the virtual machine instances pool",
                                     "A:siiiis")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    VirtualMachinePoolInfo(const string& method_name,
                           const string& help,
                           const string& signature)
        :RequestManagerPoolInfoFilter(method_name, help, signature)
    {

        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoExtended : public VirtualMachinePoolInfo
{
public:

    VirtualMachinePoolInfoExtended():
        VirtualMachinePoolInfo("one.vmpool.infoextended",
            "Returns the virtual machine instances pool in extended format",
            "A:siiiis")
    {
        extended    = true;
    };

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAccounting : public RequestManagerPoolInfoFilter
{
public:

    VirtualMachinePoolAccounting():
        RequestManagerPoolInfoFilter("one.vmpool.accounting",
                                     "Returns the virtual machine history records",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowback : public RequestManagerPoolInfoFilter
{
public:

    VirtualMachinePoolShowback():
        RequestManagerPoolInfoFilter("one.vmpool.showback",
                                     "Returns the virtual machine showback records",
                                     "A:siiiii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolMonitoring : public RequestManagerPoolInfoFilter
{
public:

    VirtualMachinePoolMonitoring():
        RequestManagerPoolInfoFilter("one.vmpool.monitoring",
                                     "Returns the virtual machine monitoring records",
                                     "A:si")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    TemplatePoolInfo():
        RequestManagerPoolInfoFilter("one.templatepool.info",
                                     "Returns the virtual machine template pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    VirtualNetworkPoolInfo():
        RequestManagerPoolInfoFilter("one.vnpool.info",
                                     "Returns the virtual network pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplatePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    VirtualNetworkTemplatePoolInfo():
        RequestManagerPoolInfoFilter("one.vntemplatepool.info",
                                     "Returns the virtual network template pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ImagePoolInfo():
        RequestManagerPoolInfoFilter("one.imagepool.info",
                                     "Returns the image pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    HostPoolInfo():
        RequestManagerPoolInfoFilter("one.hostpool.info",
                                     "Returns the host pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolMonitoring : public RequestManagerPoolInfoFilter
{
public:

    HostPoolMonitoring():
        RequestManagerPoolInfoFilter("one.hostpool.monitoring",
                                     "Returns the host monitoring records",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    GroupPoolInfo():
        RequestManagerPoolInfoFilter("one.grouppool.info",
                                     "Returns the group pool",
                                     "A:s")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    UserPoolInfo():
        RequestManagerPoolInfoFilter("one.userpool.info",
                                     "Returns the user pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastorePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    DatastorePoolInfo():
        RequestManagerPoolInfoFilter("one.datastorepool.info",
                                     "Returns the datastore pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ClusterPoolInfo():
        RequestManagerPoolInfoFilter("one.clusterpool.info",
                                     "Returns the cluster pool",
                                     "A:s")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    DocumentPoolInfo():
        RequestManagerPoolInfoFilter("one.documentpool.info",
                                     "Returns the generic document pool",
                                     "A:siiii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZonePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    ZonePoolInfo():
        RequestManagerPoolInfoFilter("one.zonepool.info",
                                     "Returns the zone pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    SecurityGroupPoolInfo():
        RequestManagerPoolInfoFilter("one.secgrouppool.info",
                                     "Returns the security group pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VdcPoolInfo():
        RequestManagerPoolInfoFilter("one.vdcpool.info",
                                     "Returns the VDC pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VirtualRouterPoolInfo():
        RequestManagerPoolInfoFilter("one.vrouterpool.info",
                                     "Returns the virtual router pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlacePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    MarketPlacePoolInfo():
        RequestManagerPoolInfoFilter("one.marketpool.info",
                                     "Returns the marketplace pool",
                                     "A:s")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    MarketPlaceAppPoolInfo():
        RequestManagerPoolInfoFilter("one.marketapppool.info",
                                     "Returns the market place pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VMGroupPoolInfo():
        RequestManagerPoolInfoFilter("one.vmgrouppool.info",
                                     "Returns the vm group pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    HookPoolInfo():
        RequestManagerPoolInfoFilter("one.hookpool.info",
                                     "Returns the hook pool",
                                     "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookPoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookLogInfo : public RequestManagerPoolInfoFilter
{
public:
    HookLogInfo():
        RequestManagerPoolInfoFilter("one.hooklog.info",
                                     "Returns the hook pool log info",
                                     "A:siiii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookLogInfo(){};

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

#endif

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
          const std::string& and_str,
          std::string& where_str);

protected:
    /*
    *  True to gather full info
    */
    bool extended;

    RequestManagerPoolInfoFilter(const std::string& method_name,
                                 const std::string& help,
                                 const std::string& signature)
        :Request(method_name,signature,help)
    {
        leader_only = false;
        extended    = false;
        zone_disabled = true;
    };

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;

    void where_filter(RequestAttributes& att,
              int                filter_flag,
              int                start_id,
              int                end_id,
              const std::string& and_clause,
              const std::string& or_clause,
              bool               disable_all_acl,
              bool               disable_cluster_acl,
              bool               disable_group_acl,
              std::string&       where_string);

    void dump(RequestAttributes& att,
              int                filter_flag,
              int                start_id,
              int                end_id,
              const std::string& and_clause,
              const std::string& or_clause);
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

    VirtualMachinePoolInfo();

    VirtualMachinePoolInfo(const std::string& method_name,
                           const std::string& help,
                           const std::string& signature);

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

class VirtualMachinePoolInfoSet : public RequestManagerPoolInfoFilter
{
public:
    VirtualMachinePoolInfoSet();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAccounting : public RequestManagerPoolInfoFilter
{
public:
    VirtualMachinePoolAccounting();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowback : public RequestManagerPoolInfoFilter
{
public:
    VirtualMachinePoolShowback();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolMonitoring : public RequestManagerPoolInfoFilter
{
public:
    VirtualMachinePoolMonitoring();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    TemplatePoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    VirtualNetworkPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplatePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    VirtualNetworkTemplatePoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ImagePoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    HostPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolMonitoring : public RequestManagerPoolInfoFilter
{
public:
    HostPoolMonitoring();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    GroupPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    UserPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastorePoolInfo: public RequestManagerPoolInfoFilter
{
public:
    DatastorePoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfo: public RequestManagerPoolInfoFilter
{
public:
    ClusterPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    DocumentPoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZonePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    ZonePoolInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    SecurityGroupPoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VdcPoolInfo();

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VirtualRouterPoolInfo();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlacePoolInfo : public RequestManagerPoolInfoFilter
{
public:
    MarketPlacePoolInfo();

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    MarketPlaceAppPoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    VMGroupPoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    HookPoolInfo();
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookLogInfo : public RequestManagerPoolInfoFilter
{
public:
    HookLogInfo();

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobPoolInfo : public RequestManagerPoolInfoFilter
{
public:
    BackupJobPoolInfo();
};


#endif

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

#include "RequestManagerPoolInfoFilter.h"
#include "HookLog.h"
#include "Nebula.h"
#include "AuthManager.h"
#include "BackupJobPool.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "DocumentPool.h"
#include "HookPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "MarketPlaceAppPool.h"
#include "MarketPlacePool.h"
#include "SecurityGroupPool.h"
#include "VdcPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"
#include "ZonePool.h"
#include "OneDB.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const int RequestManagerPoolInfoFilter::ALL  = -2;

const int RequestManagerPoolInfoFilter::MINE = -3;

const int RequestManagerPoolInfoFilter::MINE_GROUP = -1;

const int RequestManagerPoolInfoFilter::GROUP = -4;

/* ------------------------------------------------------------------------- */

const int VirtualMachinePoolInfo::ALL_VM   = -2;

const int VirtualMachinePoolInfo::NOT_DONE = -1;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    dump(att, filter_flag, start_id, end_id, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

bool RequestManagerPoolInfoFilter::use_filter(RequestAttributes& att,
    PoolObjectSQL::ObjectType aobj,
    bool disable_all_acl,
    bool disable_cluster_acl,
    bool disable_group_acl,
    const string& and_str,
    string& where_str)
{
    bool all;

    string acl_str;

    PoolSQL::acl_filter(att.uid, att.group_ids, aobj, all,
        disable_all_acl, disable_cluster_acl, disable_group_acl, acl_str);

    PoolSQL::usr_filter(att.uid, att.gid, att.group_ids, ALL, all, acl_str,
        where_str);

    if (!and_str.empty())
    {
        ostringstream filter;

        filter << "( " << where_str << " ) AND ( " << and_str << " )";

        where_str = filter.str();
    }

    return all;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::where_filter(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause,
        bool               disable_all_acl,
        bool               disable_cluster_acl,
        bool               disable_group_acl,
        string&            filter_str)
{
    bool empty = true;
    bool all;

    string acl_str;
    string uid_str;
    string oid_str;

    ostringstream filter;

    PoolSQL::acl_filter(att.uid, att.group_ids, auth_object, all,
        disable_all_acl, disable_cluster_acl, disable_group_acl, acl_str);

    PoolSQL::usr_filter(att.uid, att.gid, att.group_ids, filter_flag, all,
        acl_str, uid_str);

    PoolSQL::oid_filter(start_id, end_id, oid_str);

    // -------------------------------------------------------------------------
    //                          Compound WHERE clause
    //   WHERE ( id_str ) AND ( uid_str ) AND ( and_clause ) OR ( or_clause )
    // -------------------------------------------------------------------------

    if (!oid_str.empty())
    {
        filter << "(" << oid_str << ")";
        empty = false;
    }

    if (!uid_str.empty())
    {
        if (!empty)
        {
            filter << " AND ";
        }

        filter << "(" << uid_str << ")";
        empty = false;
    }

    if (!and_clause.empty())
    {
        if (!empty)
        {
            filter << " AND ";
        }

        filter << "(" << and_clause << ")";
        empty = false;
    }

    if (!or_clause.empty())
    {
        if (!empty)
        {
            filter << " OR ";
        }

        filter << "(" << or_clause << ")";
    }

    filter_str = filter.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::dump(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause)
{
    std::string str;

    std::string where_string;
    std::string desc;

    int limit_end_id = -1;

    int rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att,
                 filter_flag,
                 start_id,
                 end_id,
                 and_clause,
                 or_clause,
                 false,
                 false,
                 false,
                 where_string);

    if ( end_id < -1 )
    {
        limit_end_id = -end_id;
    }

    Nebula::instance().get_configuration_attribute(att.uid, att.gid,
            "API_LIST_ORDER", desc);

    if ( extended )
    {
        rc = pool->dump_extended(str,
                                 where_string,
                                 start_id,
                                 limit_end_id,
                                 one_util::icasecmp(desc, "DESC"));
    }
    else
    {
        rc = pool->dump(str,
                        where_string,
                        start_id,
                        limit_end_id,
                        one_util::icasecmp(desc, "DESC"));
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolInfo::VirtualMachinePoolInfo()
    : RequestManagerPoolInfoFilter("one.vmpool.info",
                                   "Returns the virtual machine instances pool",
                                   "A:siiiis")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolInfo::VirtualMachinePoolInfo(const string& method_name,
                                               const string& help,
                                               const string& signature)
    : RequestManagerPoolInfoFilter(method_name, help, signature)
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));
    int state       = xmlrpc_c::value_int(paramList.getInt(4));

    std::string fts_query;

    if (paramList.size() > 5)
    {
        fts_query = xmlrpc_c::value_string(paramList.getString(5));

        if (!fts_query.empty() && !pool->supports(SqlDB::SqlFeature::FTS))
        {
            att.resp_msg = "Full text search is not supported by the SQL backend";

            failure_response(INTERNAL, att);
            return;
        }
    }

    ostringstream and_filter;

    if (( state < VirtualMachinePoolInfo::ALL_VM ) ||
        ( state > VirtualMachine::CLONING_FAILURE ))
    {
        att.resp_msg = "Incorrect filter_flag, state";

        failure_response(XML_RPC_API, att);
        return;
    }

    switch (state)
    {
        case VirtualMachinePoolInfo::ALL_VM:
            break;

        case VirtualMachinePoolInfo::NOT_DONE:
            and_filter << "state <> " << VirtualMachine::DONE;
            break;

        default:
            and_filter << "state = " << state;
            break;
    }

    if (!fts_query.empty())
    {
        char * _fts_query = pool->escape_str(fts_query);

        if ( _fts_query == 0 )
        {
            att.resp_msg = "Error building search query";

            failure_response(INTERNAL, att);
            return;
        }

        if (!and_filter.str().empty())
        {
            and_filter << " AND ";
        }

        and_filter << "MATCH(search_token) AGAINST ('+\"";
        one_util::escape_token(_fts_query, and_filter);
        and_filter << "\"' in boolean mode)";

        pool->free_str(_fts_query);
    }

    dump(att, filter_flag, start_id, end_id, and_filter.str(), "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolInfoSet::VirtualMachinePoolInfoSet()
    : RequestManagerPoolInfoFilter("one.vmpool.infoset",
                                   "Returns a virtual machine instances set",
                                   "A:ss")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfoSet::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    std::string ids_str = xmlrpc_c::value_string(paramList.getString(1));
    extended            = xmlrpc_c::value_boolean(paramList.getBoolean(2));

    ostringstream and_filter;
    std::set<unsigned int> ids;

    one_util::split_unique(ids_str, ',', ids);

    if (ids.empty())
    {
        std::string empty_pool = "<VM_POOL></VM_POOL>";
        success_response(empty_pool, att);
        return;
    }

    and_filter << "oid in (" << one_util::join(ids, ',') << ")";

    dump(att, -2, -1, -1, and_filter.str(), "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolAccounting::VirtualMachinePoolAccounting()
    : RequestManagerPoolInfoFilter("one.vmpool.accounting",
                                   "Returns the virtual machine history records",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolAccounting::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int time_start  = xmlrpc_c::value_int(paramList.getInt(2));
    int time_end    = xmlrpc_c::value_int(paramList.getInt(3));

    string oss;
    string where;
    int rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_acct(oss,
                                                              where,
                                                              time_start,
                                                              time_end);
    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolShowback::VirtualMachinePoolShowback()
    : RequestManagerPoolInfoFilter("one.vmpool.showback",
                                   "Returns the virtual machine showback records",
                                   "A:siiiii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolShowback::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_month = xmlrpc_c::value_int(paramList.getInt(2));
    int start_year  = xmlrpc_c::value_int(paramList.getInt(3));
    int end_month   = xmlrpc_c::value_int(paramList.getInt(4));
    int end_year    = xmlrpc_c::value_int(paramList.getInt(5));

    string oss;
    string        where;
    int           rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_showback(oss,
                                                              where,
                                                              start_month,
                                                              start_year,
                                                              end_month,
                                                              end_year);
    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachinePoolMonitoring::VirtualMachinePoolMonitoring()
    : RequestManagerPoolInfoFilter("one.vmpool.monitoring",
                                   "Returns the virtual machine monitoring records",
                                   "A:si")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmpool();
    auth_object = PoolObjectSQL::VM;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolMonitoring::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));

    string oss;
    string where;
    int rc;

    int seconds = -1;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    if (paramList.size() > 2)
    {
        seconds = xmlrpc_c::value_int(paramList.getInt(2));
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_monitoring(oss, where, seconds);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

TemplatePoolInfo::TemplatePoolInfo()
    : RequestManagerPoolInfoFilter("one.templatepool.info",
                                   "Returns the virtual machine template pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_tpool();
    auth_object = PoolObjectSQL::TEMPLATE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkPoolInfo::VirtualNetworkPoolInfo()
    : RequestManagerPoolInfoFilter("one.vnpool.info",
                                   "Returns the virtual network pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vnpool();
    auth_object = PoolObjectSQL::NET;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    int limit_end_id = -1;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Build where filters to get ois from:                                  */
    /*    - vnets (owner, permissions & ACL)                                  */
    /*    - reservations (owner, permission & not VNET\* nor VNET/% ACLs)     */
    /* ---------------------------------------------------------------------- */

    string  where_vnets, where_reserv;
    ostringstream where_string;

    where_filter(att, filter_flag, start_id, end_id, "pid = -1", "", false,
        false, false, where_vnets);

    where_filter(att, filter_flag, start_id, end_id, "pid != -1", "", true,
        true, false, where_reserv);

    where_string << "( " << where_vnets << " ) OR ( " << where_reserv << " ) ";

    /* ---------------------------------------------------------------------- */
    /*  Build pagination limits                                               */
    /* ---------------------------------------------------------------------- */

    if ( end_id < -1 )
    {
        limit_end_id = -end_id;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get the VNET pool                                                     */
    /* ---------------------------------------------------------------------- */
    std::string pool_oss;
    std::string desc;

    Nebula::instance().get_configuration_attribute(att.uid, att.gid,
            "API_LIST_ORDER", desc);

    int rc = pool->dump(pool_oss, where_string.str(), start_id, limit_end_id,
            one_util::toupper(desc) == "DESC");

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(pool_oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkTemplatePoolInfo::VirtualNetworkTemplatePoolInfo()
    : RequestManagerPoolInfoFilter("one.vntemplatepool.info",
                                   "Returns the virtual network template pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vntpool();
    auth_object = PoolObjectSQL::VNTEMPLATE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ImagePoolInfo::ImagePoolInfo()
    : RequestManagerPoolInfoFilter("one.imagepool.info",
                                   "Returns the image pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_ipool();
    auth_object = PoolObjectSQL::IMAGE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HostPoolInfo::HostPoolInfo()
    : RequestManagerPoolInfoFilter("one.hostpool.info",
                                   "Returns the host pool",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hpool();
    auth_object = PoolObjectSQL::HOST;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HostPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HostPoolMonitoring::HostPoolMonitoring()
    : RequestManagerPoolInfoFilter("one.hostpool.monitoring",
                                   "Returns the host monitoring records",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hpool();
    auth_object = PoolObjectSQL::HOST;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HostPoolMonitoring::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    string oss;
    string where;

    int rc;

    int seconds = -1;

    if (paramList.size() > 1)
    {
        seconds = xmlrpc_c::value_int(paramList.getInt(1));
    }

    where_filter(att, ALL, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<HostPool *>(pool))->dump_monitoring(oss, where, seconds);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

GroupPoolInfo::GroupPoolInfo()
    : RequestManagerPoolInfoFilter("one.grouppool.info",
                                   "Returns the group pool",
                                   "A:s")
{
    Nebula& nd = Nebula::instance();
    pool       = nd.get_gpool();
    auth_object = PoolObjectSQL::GROUP;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void GroupPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

UserPoolInfo::UserPoolInfo()
    : RequestManagerPoolInfoFilter("one.userpool.info",
                                   "Returns the user pool",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_upool();
    auth_object = PoolObjectSQL::USER;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DatastorePoolInfo::DatastorePoolInfo()
    : RequestManagerPoolInfoFilter("one.datastorepool.info",
                                   "Returns the datastore pool",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_dspool();
    auth_object = PoolObjectSQL::DATASTORE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DatastorePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ClusterPoolInfo::ClusterPoolInfo()
    : RequestManagerPoolInfoFilter("one.clusterpool.info",
                                   "Returns the cluster pool",
                                   "A:s")
{
    Nebula& nd = Nebula::instance();
    pool       = nd.get_clpool();
    auth_object = PoolObjectSQL::CLUSTER;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DocumentPoolInfo::DocumentPoolInfo()
    : RequestManagerPoolInfoFilter("one.documentpool.info",
                                   "Returns the generic document pool",
                                   "A:siiii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_docpool();
    auth_object = PoolObjectSQL::DOCUMENT;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DocumentPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));
    int type        = xmlrpc_c::value_int(paramList.getInt(4));

    ostringstream oss;
    oss << "type = " << type;

    dump(att, filter_flag, start_id, end_id, oss.str(), "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ZonePoolInfo::ZonePoolInfo()
    : RequestManagerPoolInfoFilter("one.zonepool.info",
                                   "Returns the zone pool",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_zonepool();
    auth_object = PoolObjectSQL::ZONE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZonePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

SecurityGroupPoolInfo::SecurityGroupPoolInfo()
    : RequestManagerPoolInfoFilter("one.secgrouppool.info",
                                   "Returns the security group pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_secgrouppool();
    auth_object = PoolObjectSQL::SECGROUP;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VdcPoolInfo::VdcPoolInfo()
    : RequestManagerPoolInfoFilter("one.vdcpool.info",
                                    "Returns the VDC pool",
                                    "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vdcpool();
    auth_object = PoolObjectSQL::VDC;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VdcPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualRouterPoolInfo::VirtualRouterPoolInfo()
    : RequestManagerPoolInfoFilter("one.vrouterpool.info",
                                   "Returns the virtual router pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vrouterpool();
    auth_object = PoolObjectSQL::VROUTER;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlacePoolInfo::MarketPlacePoolInfo()
    : RequestManagerPoolInfoFilter("one.marketpool.info",
                                   "Returns the marketplace pool",
                                   "A:s")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_marketpool();
    auth_object = PoolObjectSQL::MARKETPLACE;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlacePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MarketPlaceAppPoolInfo::MarketPlaceAppPoolInfo()
    : RequestManagerPoolInfoFilter("one.marketapppool.info",
                                   "Returns the market place pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_apppool();
    auth_object = PoolObjectSQL::MARKETPLACEAPP;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroupPoolInfo::VMGroupPoolInfo():
    RequestManagerPoolInfoFilter("one.vmgrouppool.info",
                                    "Returns the vm group pool",
                                    "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmgrouppool();
    auth_object = PoolObjectSQL::VMGROUP;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HookPoolInfo::HookPoolInfo()
    : RequestManagerPoolInfoFilter("one.hookpool.info",
                                   "Returns the hook pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hkpool();
    auth_object = PoolObjectSQL::HOOK;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HookLogInfo::HookLogInfo()
    : RequestManagerPoolInfoFilter("one.hooklog.info",
                                   "Returns the hook pool log info",
                                   "A:siiii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hkpool();
    auth_object = PoolObjectSQL::HOOK;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookLogInfo::request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att)
{
    int min_ts  = xmlrpc_c::value_int(_paramList.getInt(1));
    int max_ts  = xmlrpc_c::value_int(_paramList.getInt(2));
    int hook_id = xmlrpc_c::value_int(_paramList.getInt(3));
    int rc_hook = xmlrpc_c::value_int(_paramList.getInt(4));

    Nebula& nd = Nebula::instance();

    HookLog*     hklog  = nd.get_hl();

    PoolObjectAuth hk_perms;

    ostringstream oss;
    bool empty = true;

    int rc;

    string dump_xml;

    /* ---------------------------------------------------------------------- */
    /* Check permissions                                                      */
    /* ---------------------------------------------------------------------- */

    if (!att.is_oneadmin_group())
    {
        att.resp_id  = -1;

        failure_response(AUTHORIZATION, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Build where clause                                                     */
    /* ---------------------------------------------------------------------- */

    if (min_ts >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "timestamp > " << min_ts;
        empty = false;
    }
    if (max_ts >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "timestamp < " << max_ts;
        empty = false;
    }
    if (hook_id >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "hkid = " << hook_id;
        empty = false;
    }
    if (rc_hook == -1 || rc_hook == 1)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        if (rc_hook == -1)
        {
            oss << "rc <> 0";
        }
        else
        {
            oss << "rc = 0";
        }
    }



    rc = hklog->dump_log(oss.str(), dump_xml);

    if (rc != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(dump_xml, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

BackupJobPoolInfo::BackupJobPoolInfo()
    : RequestManagerPoolInfoFilter("one.backupjobpool.info",
                                   "Returns the Backup Job pool",
                                   "A:siii")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_bjpool();
    auth_object = PoolObjectSQL::BACKUPJOB;
}

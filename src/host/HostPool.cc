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

/* ************************************************************************** */
/* Host Pool                                                                  */
/* ************************************************************************** */

#include <stdexcept>
#include <sstream>

#include "Nebula.h"
#include "HostPool.h"
#include "HookStateHost.h"
#include "HookManager.h"
#include "NebulaLog.h"
#include "GroupPool.h"
#include "ClusterPool.h"
#include "InformationManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB * db, const vector<const SingleAttribute *>& ea) :
    PoolSQL(db, one_db::host_table)
{
    HostTemplate::parse_encrypted(ea);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::allocate (
        int * oid,
        const string& hostname,
        const string& im_mad_name,
        const string& vmm_mad_name,
        int           cluster_id,
        const string& cluster_name,
        string& error_str)
{
    Host *        host_ptr;
    ostringstream oss;

    int db_oid;

    if ( !PoolObjectSQL::name_is_valid(hostname, error_str) )
    {
        goto error_name;
    }

    if ( im_mad_name.empty() )
    {
        goto error_im;
    }

    if ( vmm_mad_name.empty() )
    {
        goto error_vmm;
    }

    db_oid = exist(hostname);

    if ( db_oid != -1 )
    {
        goto error_duplicated;
    }

    // Build a new Host object

    host_ptr = new Host(
            -1,
            hostname,
            im_mad_name,
            vmm_mad_name,
            cluster_id,
            cluster_name);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host_ptr, error_str);

    if (*oid >= 0)
    {
        if ( auto host = get(*oid) )
        {
            std::string event = HookStateHost::format_message(host.get());

            Nebula::instance().get_hm()->trigger_send_event(event);

            auto *im = Nebula::instance().get_im();
            im->update_host(host.get());
        }
    }

    return *oid;

error_im:
    error_str = "IM_MAD_NAME cannot be empty.";
    goto error_common;

error_vmm:
    error_str = "VMM_MAD_NAME cannot be empty.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by HOST " << db_oid << ".";
    error_str = oss.str();

error_name:
error_common:
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::update(PoolObjectSQL * objsql)
{
    Host * host = dynamic_cast<Host *>(objsql);

    if ( host == nullptr )
    {
        return -1;
    }

    if ( HookStateHost::trigger(host) )
    {
        std::string event = HookStateHost::format_message(host);

        Nebula::instance().get_hm()->trigger_send_event(event);
    }

    host->set_prev_state();

    Nebula::instance().get_im()->update_host(host);

    return host->update(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::dump_monitoring(
        string& oss,
        const string&  where,
        const int seconds)
{
    ostringstream cmd;

    switch(seconds)
    {
        case 0: //Get last monitor value
            /*
            * SELECT host_monitoring.body
            * FROM host_monitoring
            *     INNER JOIN (
            *         SELECT hid, MAX(last_mon_time) as last_mon_time
            *             FROM host_monitoring
            *             GROUP BY hid
            *     ) lmt on lmt.hid = host_monitoring.hid AND lmt.last_mon_time = host_monitoring.last_mon_time
            *     INNER JOIN host_pool ON host_monitoring.hid = oid
            * ORDER BY oid;
            */
            cmd << "SELECT " << one_db::host_monitor_table << ".body "
                << "FROM " << one_db::host_monitor_table << " INNER JOIN ("
                << "SELECT hid, MAX(last_mon_time) as last_mon_time FROM "
                << one_db::host_monitor_table << " GROUP BY hid) as lmt "
                << "ON lmt.hid = " << one_db::host_monitor_table << ".hid "
                << "AND lmt.last_mon_time = " << one_db::host_monitor_table
                << ".last_mon_time INNER JOIN " << one_db::host_table
                << " ON " << one_db::host_monitor_table << ".hid = oid";

            if ( !where.empty() )
            {
                cmd << " WHERE " << where;
            }

            cmd << " ORDER BY oid";

            break;

        case -1: //Get all monitoring
            cmd << "SELECT " << one_db::host_monitor_table << ".body FROM "
                << one_db::host_monitor_table << " INNER JOIN " << one_db::host_table
                << " ON hid = oid";

            if ( !where.empty() )
            {
                cmd << " WHERE " << where;
            }

            cmd << " ORDER BY hid, " << one_db::host_monitor_table << ".last_mon_time;";

            break;

        default: //Get monitor in last s seconds
            cmd << "SELECT " << one_db::host_monitor_table << ".body FROM "
                << one_db::host_monitor_table << " INNER JOIN " << one_db::host_table
                << " ON hid = oid WHERE " << one_db::host_monitor_table
                << ".last_mon_time > " << time(nullptr) - seconds;

            if ( !where.empty() )
            {
                cmd << " AND " << where;
            }

            cmd << " ORDER BY hid, " << one_db::host_monitor_table << ".last_mon_time;";

            break;
    }

    return PoolSQL::dump(oss, "MONITORING_DATA", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostMonitoringTemplate HostPool::get_monitoring(int hid)
{
    ostringstream cmd;
    string monitor_str;

    cmd << "SELECT " << one_db::host_monitor_table << ".body FROM "
        << one_db::host_monitor_table
        << " WHERE hid = " << hid
        << " AND last_mon_time=(SELECT MAX(last_mon_time) FROM "
        << one_db::host_monitor_table
        << " WHERE hid = " << hid << ")";

    HostMonitoringTemplate info;

    if (PoolSQL::dump(monitor_str, "", cmd) == 0 && !monitor_str.empty())
    {
        info.from_xml(monitor_str);
    }

    return info;
}

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

// Reference
// https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/naming-conventions-for-computer-domain-site-ou
static bool hostname_is_valid(const string& hostname, string& error_str)
{
    if (hostname.size() < 2 || hostname.size() > 63)
    {
        error_str = "Invalid HOSTNAME, HOSTNAME length should be greater than 1, but smaller than 64 characters";
        return false;
    }

    const auto firstChar = hostname.front();
    
    if (firstChar == '-' || firstChar == '.' || firstChar == '_')
    {
        std::stringstream ss;    
        ss << "Invalid HOSTNAME, first character can't be '" << firstChar << "'";
        
        error_str = ss.str();
        return false;
    }

    for (const auto ch : hostname)
    {
        if (!std::isalnum(ch) && ch != '-' && ch != '.' && ch != '_')
        {
            std::stringstream ss;
            ss << "Invalid HOSTNAME, '" << ch << "' is invalid character for a HOSTNAME";
        
            error_str = ss.str();
            return false;
        }
    }

    const auto lastChar = hostname.back();
        
    if (lastChar == '-' || lastChar == '.' || lastChar == '_')
    {
        std::stringstream ss;
        ss << "Invalid HOSTNAME, last character can't be '" << lastChar << "'";
            
        error_str = ss.str();
        return false;
    }

    return true;
}

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
    *oid = -1;

    if ( !hostname_is_valid(hostname, error_str) || !PoolObjectSQL::name_is_valid(hostname, error_str) )
    {
        return *oid;
    }

    if ( im_mad_name.empty() )
    {
        error_str = "IM_MAD_NAME cannot be empty.";
        return *oid;
    }

    if ( vmm_mad_name.empty() )
    {
        error_str = "VMM_MAD_NAME cannot be empty.";
        return *oid;
    }

    const auto db_oid = exist(hostname);

    if ( db_oid != -1 )
    {
        ostringstream oss;

        oss << "NAME is already taken by HOST " << db_oid << ".";
        error_str = oss.str();

        return *oid;
    }

    // Build a new Host object

    Host host{
            -1,
            hostname,
            im_mad_name,
            vmm_mad_name,
            cluster_id,
            cluster_name};

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host, error_str);

    if (*oid >= 0)
    {
        if ( auto host_ptr = get(*oid) )
        {
            std::string event = HookStateHost::format_message(host_ptr.get());

            Nebula::instance().get_hm()->trigger_send_event(event);

            auto *im = Nebula::instance().get_im();
            im->update_host(host_ptr.get());
        }
    }

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

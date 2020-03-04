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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB * db, vector<const SingleAttribute *>& ea) :
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
    Host *        host;
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

    host = new Host(
            -1,
            hostname,
            im_mad_name,
            vmm_mad_name,
            cluster_id,
            cluster_name);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host, error_str);

    if (*oid >= 0)
    {
        host = get(*oid);

        if (host != nullptr)
        {
            std::string * event = HookStateHost::format_message(host);

            Nebula::instance().get_hm()->trigger(HMAction::SEND_EVENT, *event);

            delete event;

            auto *im = Nebula::instance().get_im();
            im->update_host(host);

            host->unlock();
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

    if ( host == 0 )
    {
        return -1;
    }

    if ( HookStateHost::trigger(host) )
    {
        std::string * event = HookStateHost::format_message(host);

        Nebula::instance().get_hm()->trigger(HMAction::SEND_EVENT, *event);

        delete event;
    }

    host->set_prev_state();

    Nebula::instance().get_im()->update_host(host);

    return host->update(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::dump_monitoring(
        string& oss,
        const string&  where)
{
    ostringstream cmd;

    cmd << "SELECT " << one_db::host_monitor_table << ".body FROM "
        << one_db::host_monitor_table << " INNER JOIN " << one_db::host_table
        << " WHERE hid = oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    cmd << " ORDER BY hid, " << one_db::host_monitor_table << ".last_mon_time;";

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

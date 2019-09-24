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
#include "NebulaLog.h"
#include "GroupPool.h"
#include "ClusterPool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t HostPool::_monitor_expiration;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB * db, time_t expire_time,
        vector<const SingleAttribute *>& encrypted_attrs) : PoolSQL(db, Host::table)
{
    _monitor_expiration = expire_time;

    if ( _monitor_expiration == 0 )
    {
        clean_all_monitoring();
    }

    // Parse encrypted attributes
    HostTemplate::parse_encrypted(encrypted_attrs);
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

    return host->update(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::discover(
        set<int> *  discovered_hosts,
        int         host_limit,
        time_t      target_time)
{
    ostringstream sql;
    set_cb<int>   cb;

    cb.set_callback(discovered_hosts);

    sql << "SELECT oid FROM " << Host::table
        << " WHERE last_mon_time <= " << target_time
        << " ORDER BY last_mon_time ASC LIMIT " << host_limit;

    int rc = db->exec_rd(sql, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::dump_monitoring(
        string& oss,
        const string&  where)
{
    ostringstream cmd;

    cmd << "SELECT " << Host::monit_table << ".body FROM " << Host::monit_table
        << " INNER JOIN " << Host::table
        << " WHERE hid = oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    cmd << " ORDER BY hid, " << Host::monit_table << ".last_mon_time;";

    return PoolSQL::dump(oss, "MONITORING_DATA", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::clean_expired_monitoring()
{
    if ( _monitor_expiration == 0 )
    {
        return 0;
    }

    int             rc;
    time_t          max_mon_time;
    ostringstream   oss;

    max_mon_time = time(0) - _monitor_expiration;

    oss << "DELETE FROM " << Host::monit_table
        << " WHERE last_mon_time < " << max_mon_time;

    rc = db->exec_local_wr(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::clean_all_monitoring()
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << Host::monit_table;

    rc = db->exec_local_wr(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include "HostHook.h"
#include "NebulaLog.h"
#include "GroupPool.h"
#include "ClusterPool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t HostPool::_monitor_expiration;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB*                    db,
                   vector<const VectorAttribute *> hook_mads,
                   const string&             hook_location,
                   const string&             remotes_location,
                   time_t                    expire_time)
                        : PoolSQL(db, Host::table, true, true)
{

    _monitor_expiration = expire_time;

    if ( _monitor_expiration == 0 )
    {
        clean_all_monitoring();
    }

    // ------------------ Initialize Hooks for the pool ----------------------
    string name;
    string on;
    string cmd;
    string arg;
    bool   remote;

    bool state_hook = false;

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        name = hook_mads[i]->vector_value("NAME");
        on   = hook_mads[i]->vector_value("ON");
        cmd  = hook_mads[i]->vector_value("COMMAND");
        arg  = hook_mads[i]->vector_value("ARGUMENTS");
        hook_mads[i]->vector_value("REMOTE", remote);

        one_util::toupper(on);

        if ( on.empty() || cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty ON or COMMAND attribute in HOST_HOOK. Hook "
                << "not registered!";
            NebulaLog::log("ONE",Log::WARNING,oss);

            continue;
        }

        if ( name.empty() )
        {
            name = cmd;
        }

        if (cmd[0] != '/')
        {
            ostringstream cmd_os;

            if ( remote )
            {
                cmd_os << hook_location << "/" << cmd;
            }
            else
            {
                cmd_os << remotes_location << "/hooks/" << cmd;
            }

            cmd = cmd_os.str();
        }

        if ( on == "CREATE" )
        {
            HostAllocateHook * hook;

            hook = new HostAllocateHook(name,cmd,arg,remote);

            add_hook(hook);
        }
        else if ( on == "DISABLE" )
        {
            HostStateHook * hook;

            hook = new HostStateHook(name, cmd, arg, remote, Host::DISABLED);

            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "ERROR" )
        {
            HostStateHook * hook;

            hook = new HostStateHook(name, cmd, arg, remote, Host::ERROR);

            add_hook(hook);

            state_hook = true;
        }
    }

    if ( state_hook )
    {
        HostUpdateStateHook * hook;

        hook = new HostUpdateStateHook();

        add_hook(hook);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::allocate (
    int * oid,
    const string& hostname,
    const string& im_mad_name,
    const string& vmm_mad_name,
    const string& vnm_mad_name,
    const set<int>& cluster_ids,
    string& error_str)
{
    Host *        host;
    ostringstream oss;

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

    if ( vnm_mad_name.empty() )
    {
        goto error_vnm;
    }

    host = get(hostname,false);

    if ( host !=0)
    {
        goto error_duplicated;
    }

    // Build a new Host object

    host = new Host(
            -1,
            hostname,
            im_mad_name,
            vmm_mad_name,
            vnm_mad_name,
            cluster_ids);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host, error_str);

    return *oid;

error_im:
    error_str = "IM_MAD_NAME cannot be empty.";
    goto error_common;

error_vmm:
    error_str = "VMM_MAD_NAME cannot be empty.";
    goto error_common;

error_vnm:
    error_str = "VNM_MAD_NAME cannot be empty.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by HOST " << host->get_oid() << ".";
    error_str = oss.str();

error_name:
error_common:
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::discover_cb(void * _set, int num, char **values, char **names)
{
    set<int> *  discovered_hosts;
    string      im_mad;
    int         hid;

    discovered_hosts = static_cast<set<int> *>(_set);

    if ( (num<1) || (values[0] == 0) )
    {
        return -1;
    }

    hid = atoi(values[0]);

    discovered_hosts->insert(hid);

    return 0;
}

/* -------------------------------------------------------------------------- */

int HostPool::discover(
        set<int> *  discovered_hosts,
        int         host_limit,
        time_t      target_time)
{
    ostringstream   sql;
    int             rc;

    set_callback(static_cast<Callbackable::Callback>(&HostPool::discover_cb),
                 static_cast<void *>(discovered_hosts));

    sql << "SELECT oid FROM " << Host::table
        << " WHERE last_mon_time <= " << target_time
        << " ORDER BY last_mon_time ASC LIMIT " << host_limit;

    rc = db->exec(sql,this);

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::dump_monitoring(
        ostringstream& oss,
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

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::clean_all_monitoring()
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << Host::monit_table;

    rc = db->exec(oss);

    return rc;
}

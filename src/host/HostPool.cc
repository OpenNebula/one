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

/* ************************************************************************** */
/* Host Pool                                                                  */
/* ************************************************************************** */

#include <stdexcept>
#include <sstream>

#include "HostPool.h"
#include "HostHook.h"
#include "NebulaLog.h"
#include "GroupPool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t HostPool::_monitor_expiration;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB*                    db,
                   vector<const Attribute *> hook_mads,
                   const string&             hook_location,
                   const string&             remotes_location,
                   time_t                    expire_time)
                        : PoolSQL(db, Host::table, true)
{

    _monitor_expiration = expire_time;

    if ( _monitor_expiration == 0 )
    {
        clean_all_monitoring();
    }

    // ------------------ Initialize Hooks for the pool ----------------------

    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;
    string rmt;
    bool   remote;

    bool state_hook = false;

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        vattr = static_cast<const VectorAttribute *>(hook_mads[i]);

        name = vattr->vector_value("NAME");
        on   = vattr->vector_value("ON");
        cmd  = vattr->vector_value("COMMAND");
        arg  = vattr->vector_value("ARGUMENTS");
        rmt  = vattr->vector_value("REMOTE");

        transform (on.begin(),on.end(),on.begin(),(int(*)(int))toupper);

        if ( on.empty() || cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty ON or COMMAND attribute in HOST_HOOK. Hook "
                << "not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);

            continue;
        }

        if ( name.empty() )
        {
            name = cmd;
        }

        remote = false;

        if ( !rmt.empty() )
        {
            transform(rmt.begin(),rmt.end(),rmt.begin(),(int(*)(int))toupper);

            if ( rmt == "YES" )
            {
                remote = true;
            }
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
    int           cluster_id,
    const string& cluster_name,
    string& error_str)
{
    Host *        host;
    ostringstream oss;

    if ( hostname.empty() )
    {
        goto error_name;
    }

    if ( hostname.length() > 128 )
    {
        goto error_name_length;
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
            cluster_id,
            cluster_name);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_im:
    oss << "IM_MAD_NAME cannot be empty.";
    goto error_common;

error_vmm:
    oss << "VMM_MAD_NAME cannot be empty.";
    goto error_common;

error_vnm:
    oss << "VNM_MAD_NAME cannot be empty.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by HOST " << host->get_oid() << ".";

error_common:
    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::discover_cb(void * _map, int num, char **values, char **names)
{
    map<int, string> *  discovered_hosts;
    string              im_mad;
    int                 hid;
    int                 rc;

    discovered_hosts = static_cast<map<int, string> *>(_map);

    if ( (num<2) || (values[0] == 0) || (values[1] == 0) )
    {
        return -1;
    }

    hid = atoi(values[0]);
    rc  = ObjectXML::xpath_value(im_mad,values[1],"/HOST/IM_MAD");

    if( rc != 0)
    {
        return -1;
    }

    discovered_hosts->insert(make_pair(hid,im_mad));

    return 0;
}

/* -------------------------------------------------------------------------- */

int HostPool::discover(map<int, string> * discovered_hosts, int host_limit)
{
    ostringstream   sql;
    int             rc;

    set_callback(static_cast<Callbackable::Callback>(&HostPool::discover_cb),
                 static_cast<void *>(discovered_hosts));

    sql << "SELECT oid, body FROM "
        << Host::table << " WHERE state != "
        << Host::DISABLED << " ORDER BY last_mon_time ASC LIMIT " << host_limit;

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

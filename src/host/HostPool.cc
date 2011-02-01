/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "HostPool.h"
#include "HostHook.h"
#include "ClusterPool.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::init_cb(void *nil, int num, char **values, char **names)
{
    if ( num != 2 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    cluster_pool.cluster_names.insert( make_pair(atoi(values[0]), values[1]) );

    return 0;
}

/* -------------------------------------------------------------------------- */

HostPool::HostPool(SqlDB*                    db,
                   vector<const Attribute *> hook_mads,
                   const string&             hook_location)
                        : PoolSQL(db,Host::table)
{
    // ------------------ Initialize Cluster Array ----------------------

    ostringstream   sql;

    set_callback(static_cast<Callbackable::Callback>(&HostPool::init_cb));

    sql << "SELECT " << ClusterPool::db_names << " FROM "
        <<  ClusterPool::table;

    db->exec(sql, this);

    unset_callback();

    if (cluster_pool.cluster_names.empty())
    {
        int rc = cluster_pool.insert(0, ClusterPool::DEFAULT_CLUSTER_NAME, db);

        if(rc != 0)
        {
            throw runtime_error("Could not create default cluster HostPool");
        }
    }

    // ------------------ Initialize Hooks fot the pool ----------------------

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
            cmd = hook_location + cmd;
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
    int *  oid,
    const string& hostname,
    const string& im_mad_name,
    const string& vmm_mad_name,
    const string& tm_mad_name,
    string& error_str)
{
    Host *        host;

    // Build a new Host object

    host = new Host(-1,
        hostname,
        im_mad_name,
        vmm_mad_name,
        tm_mad_name);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host, error_str);

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::discover_cb(void * _map, int num, char **values, char **names)
{
    map<int, string> *  discovered_hosts;
    string              im_mad(values[1]);
    int                 hid;

    discovered_hosts = static_cast<map<int, string> *>(_map);

    if ( (num<=0) || (values[0] == 0) )
    {
        return -1;
    }

    hid    = atoi(values[0]);
    im_mad = values[1];

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

    sql << "SELECT oid, im_mad FROM "
        << Host::table << " WHERE state != "
        << Host::DISABLED << " ORDER BY last_mon_time ASC LIMIT " << host_limit;

    rc = db->exec(sql,this);

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::dump_cb(void * _oss, int num, char **values, char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return Host::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int HostPool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<HOST_POOL>";

    set_callback(static_cast<Callbackable::Callback>(&HostPool::dump_cb),
                  static_cast<void *>(&oss));

    cmd << "SELECT " << Host::db_names << " , " << HostShare::db_names
        << " FROM " << Host::table << " JOIN " << HostShare::table
        << " ON " << Host::table << ".oid = " << HostShare::table << ".hid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd, this);

    oss << "</HOST_POOL>";

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPool::drop_cluster(int clid)
{
    int                         rc;
    map<int, string>::iterator  it;
    string                      cluster_name;

    it = cluster_pool.cluster_names.find(clid);

    if ( it == cluster_pool.cluster_names.end() )
    {
        return -1;
    }

    cluster_name = it->second;

    // try to drop the cluster from the pool and DB
    rc = cluster_pool.drop(clid, db);

    // Move the hosts assigned to the deleted cluster to the default one
    if( rc == 0 )
    {
        Host*                   host;
        vector<int>             hids;
        vector<int>::iterator   hid_it;

        string                  where = "cluster = '" + cluster_name + "'";

        search(hids, Host::table, where);

        for ( hid_it=hids.begin() ; hid_it < hids.end(); hid_it++ )
        {
            host = get(*hid_it, true);

            if ( host == 0 )
            {
                continue;
            }

            set_default_cluster(host);

            update(host);

            host->unlock();
        }
    }

    return rc;
}

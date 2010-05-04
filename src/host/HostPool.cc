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
/* Host Pool                                                    			  */
/* ************************************************************************** */

#include "HostPool.h"

int HostPool::allocate (
    int *  oid,
    string hostname,
    string im_mad_name,
    string vmm_mad_name,
    string tm_mad_name)
{
    Host *        host;

    // Build a new Host object

    host = new Host(-1,
        hostname,
        im_mad_name,
        vmm_mad_name,
        tm_mad_name);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(host);

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

int HostPool::discover(map<int, string> * discovered_hosts)
{
    ostringstream   sql;
    int             rc;

    lock();

    set_callback(static_cast<Callbackable::Callback>(&HostPool::discover_cb),
                 static_cast<void *>(discovered_hosts));

    sql << "SELECT oid, im_mad FROM "
        << Host::table << " WHERE state != "
        << Host::DISABLED << " ORDER BY last_mon_time LIMIT 10";

    rc = db->exec(sql,this);

    unlock();

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

    cmd << "SELECT * FROM " << Host::table << " JOIN " << HostShare::table
        << " ON " << Host::table << ".oid = " << HostShare::table << ".hid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd, this);

    oss << "</HOST_POOL>";

    return rc;
}

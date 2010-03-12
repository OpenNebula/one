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
#include "Nebula.h"

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

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C"
{
    static int discover_cb (
        void *                  _discovered_hosts,
        int                     num,
        char **                 values,
        char **                 names)
    {
        map<int, string> *  discovered_hosts;
        string              im_mad(values[1]);
        int                 hid;
        
        discovered_hosts = static_cast<map<int, string> *>(_discovered_hosts);

        if ( (discovered_hosts == 0) || (num<=0) || (values[0] == 0) )
        {
            return -1;
        }
        
        hid    = atoi(values[0]);
        im_mad = values[1];

        discovered_hosts->insert(make_pair(hid,im_mad));

        return 0;
    };
}

/* -------------------------------------------------------------------------- */

int HostPool::discover(map<int, string> * discovered_hosts)
{

    ostringstream   sql;
    int             rc;

    lock();

    sql << "SELECT oid, im_mad FROM " 
        << Host::table << " ORDER BY last_mon_time LIMIT 10";

    rc = db->exec(sql,discover_cb,(void *) discovered_hosts);
    
    unlock();
       
    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

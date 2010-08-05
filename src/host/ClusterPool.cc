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

#include "ClusterPool.h"
#include "NebulaLog.h"

const char * ClusterPool::table = "cluster_pool";

const char * ClusterPool::db_names = "oid, cluster_name";

const char * ClusterPool::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS cluster_pool ("
    "oid INTEGER PRIMARY KEY, cluster_name VARCHAR(128), "
    "UNIQUE(cluster_name) )";

const string ClusterPool::DEFAULT_CLUSTER_NAME = "default";

/* -------------------------------------------------------------------------- */

int ClusterPool::allocate(int * clid, string name, SqlDB *db, string& error_str)
{
    int                         rc;
    map<int, string>::iterator  it;

    ostringstream               oss;

    // Return error if name already exists
    for(it=cluster_names.begin();it!=cluster_names.end();it++)
    {
        if(it->second == name)
        {
            goto error_existing_name;
        }
    }

    // Get the highest key, and add 1
    *clid = cluster_names.rbegin()->first + 1;

    rc = insert(*clid, name, db);

    if(rc != 0)
    {
        goto error_db;
    }

    return *clid;


error_existing_name:
    oss << "Could not allocate new cluster: Name \""
        << name << "\" already exists";

    goto error_common;
error_db:
    oss << "Could not allocate new cluster \"" << name;
    goto error_common;

error_common:
    error_str = oss.str();
    NebulaLog::log("CLUSTER", Log::ERROR, oss);

    *clid = -1;
    return *clid;
}

/* -------------------------------------------------------------------------- */

string ClusterPool::info(int clid)
{
    ostringstream oss;

    map<int, string>::iterator it;

    it = cluster_names.find(clid);

    if(it != cluster_names.end())
    {
        dump_cluster(oss, it->first, it->second);
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */

int ClusterPool::drop(int clid, SqlDB *db)
{
    int             rc;
    ostringstream   oss;

    // Return error if cluster is 'default' or if it doesn't exist
    if( clid == 0 || cluster_names.count(clid) == 0 )
    {
        return -1;
    }

    oss << "DELETE FROM " << table << " WHERE oid=" << clid;

    rc = db->exec(oss);

    if(rc == 0)
    {
        cluster_names.erase(clid);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */

int ClusterPool::dump(ostringstream& oss)
{
    map<int, string>::iterator  it;


    oss << "<CLUSTER_POOL>";

    for(it=cluster_names.begin();it!=cluster_names.end();it++)
    {
        dump_cluster(oss, it->first, it->second);
    }

    oss << "</CLUSTER_POOL>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::insert(int oid, string name, SqlDB *db)
{
    ostringstream   oss;

    int    rc;

    char * sql_name;

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        return -1;
    }

    oss << "INSERT INTO "<< table <<" ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_name    << "')";

    rc = db->exec(oss);

    db->free_str(sql_name);

    if( rc == 0 )
    {
        cluster_names.insert( make_pair(oid, name) );
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterPool::dump_cluster(ostringstream& oss, int id, string name)
{
    oss <<
        "<CLUSTER>"     <<
            "<ID>"      << id       << "</ID>"      <<
            "<NAME>"    << name     << "</NAME>"    <<
        "</CLUSTER>";
}

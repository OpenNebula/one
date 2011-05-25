/* ------------------------------------------------------------------------ */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "Cluster.h"
#include "Nebula.h"

const char * Cluster::table = "cluster_pool";

const char * Cluster::db_names = "oid, name, body";

const char * Cluster::db_bootstrap = "CREATE TABLE IF NOT EXISTS cluster_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name))";


/* ************************************************************************ */
/* Cluster :: Constructor/Destructor                                        */
/* ************************************************************************ */

Cluster::Cluster(int id, const string& name)
    :PoolObjectSQL(id,name,-1,-1,table),
    ObjectCollection("HOSTS")
{};

Cluster::~Cluster(){};

/* ************************************************************************ */
/* Cluster :: Database Access Functions                                     */
/* ************************************************************************ */

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::insert(SqlDB *db, string& error_str)
{
    int rc;

    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        error_str = "Error inserting Cluster in DB.";
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::update(SqlDB *db)
{
    int    rc;

    rc = insert_replace(db, true);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

   // Update the Cluster

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_name            << "',"
        << "'" <<   sql_xml             << "')";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_body:
    db->free_str(sql_name);
error_name:
    return -1;
}

/* ************************************************************************ */
/* Cluster :: Misc                                                          */
/* ************************************************************************ */

ostream& operator<<(ostream& os, Cluster& cluster)
{
    string cluster_str;

    os << cluster.to_xml(cluster_str);

    return os;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Cluster::to_xml(string& xml) const
{
    ostringstream   oss;
    string          collection_xml;

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<CLUSTER>"  <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        collection_xml <<
    "</CLUSTER>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/CLUSTER/ID",   -1);
    rc += xpath(name,"/CLUSTER/NAME", "not_found");


    // Get associated classes
    ObjectXML::get_nodes("/CLUSTER/HOSTS", content);

    if( content.size() < 1 )
    {
        return -1;
    }

    // Set of IDs
    rc += ObjectCollection::from_xml_node(content[0]);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::set_default_cluster()
{
    int rc = 0;

    Nebula&     nd      = Nebula::instance();
    HostPool * hpool    = nd.get_hpool();
    Host *     host;

    // Get a copy of the set, because the original will be modified deleting
    // elements from it.
    set<int>            host_set;
    set<int>::iterator  it;

    host_set = get_collection_copy();

    if( hpool == 0 )
    {
        return -1;
    }

    for ( it = host_set.begin(); it != host_set.end(); it++ )
    {
        host = hpool->get( *it, true );

        if( host == 0 )
        {
            rc = -1;
            continue;
        }

        rc += host->set_gid(ClusterPool::DEFAULT_CLUSTER_ID);

        // TODO: this add_to_cluster method locks Cluster objects, which
        // may lead to deadlocks. Maybe this movement to the default cluster
        // should be made in the RM
        rc += host->add_to_cluster();

        hpool->update(host);
        host->unlock();
    }

    return rc;
}

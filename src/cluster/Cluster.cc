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


const char * Cluster::table = "cluster_pool";

const char * Cluster::db_names = "oid, name, body";

const char * Cluster::db_bootstrap = "CREATE TABLE IF NOT EXISTS cluster_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name))";


/* ************************************************************************ */
/* Cluster :: Constructor/Destructor                                        */
/* ************************************************************************ */

Cluster::Cluster(
    int     id,
    string _name):
        PoolObjectSQL(id,_name,-1,table)
        {}

Cluster::~Cluster(){}

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

    oss <<
    "<CLUSTER>"     <<
        "<ID>"      << oid      << "</ID>"      <<
        "<NAME>"    << name     << "</NAME>"    <<
    "</CLUSTER>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Cluster::from_xml(const string& xml)
{
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,    "/CLUSTER/ID",      -1);
    rc += xpath(name,   "/CLUSTER/NAME",    "not_found");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

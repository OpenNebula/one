/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <limits.h>
#include <string.h>
#include <stdlib.h>

#include <iostream>
#include <sstream>
#include <iomanip>

#include "User.h"
#include "Nebula.h"
#include "Group.h"


const string User::NO_PASSWD_CHARS = " \t\n\v\f\r";

/* ************************************************************************** */
/* User :: Database Access Functions                                          */
/* ************************************************************************** */

const char * User::table = "user_pool";

const char * User::db_names = "oid,name,body";

const char * User::db_bootstrap = "CREATE TABLE IF NOT EXISTS user_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert(SqlDB *db, string& error_str)
{
    int rc;

    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        error_str = "Error inserting User in DB.";
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_username;
    char * sql_xml;

    // Update the User

    sql_username = db->escape_str(name.c_str());

    if ( sql_username == 0 )
    {
        goto error_username;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    // Construct the SQL statement to Insert or Replace
    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_username    << "',"
        << "'" <<   sql_xml         << "')";

    rc = db->exec(oss);

    db->free_str(sql_username);
    db->free_str(sql_xml);

    return rc;

error_body:
    db->free_str(sql_username);
error_username:
    return -1;
}

/* ************************************************************************** */
/* User :: Misc                                                               */
/* ************************************************************************** */

string& User::to_xml(string& xml) const
{
    ostringstream   oss;
    string          collection_xml;

    int  enabled_int = enabled?1:0;

    oss <<
    "<USER>"
         "<ID>"          << oid         <<"</ID>"      <<
         "<GID>"         << gid         <<"</GID>"     <<
         "<GNAME>"       << gname       <<"</GNAME>"   <<
         "<NAME>"        << name        <<"</NAME>"    <<
         "<PASSWORD>"    << password    <<"</PASSWORD>"<<
         "<ENABLED>"     << enabled_int <<"</ENABLED>" <<
    "</USER>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::from_xml(const string& xml)
{
    int rc = 0;
    int int_enabled;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    rc += xpath(oid,         "/USER/ID",       -1);
    rc += xpath(gid,         "/USER/GID",      -1);
    rc += xpath(gname,       "/USER/GNAME",    "not_found");
    rc += xpath(name,        "/USER/NAME",     "not_found");
    rc += xpath(password,    "/USER/PASSWORD", "not_found");
    rc += xpath(int_enabled, "/USER/ENABLED",  0);

    enabled = int_enabled;

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::split_secret(const string secret, string& user, string& pass)
{
    size_t pos;
    int    rc = -1;

    pos=secret.find(":");

    if (pos != string::npos)
    {
        user = secret.substr(0,pos);
        pass = secret.substr(pos+1);

        rc = 0;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


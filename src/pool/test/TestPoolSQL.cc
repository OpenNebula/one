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

#include <limits.h>
#include <string.h>
#include <stdlib.h>

#include <iostream>
#include <sstream>

#include <openssl/evp.h>
#include <iomanip>

#include "TestPoolSQL.h"

/* ************************************************************************** */
/* Database Access Functions                                                  */
/* ************************************************************************** */

const char * TestObjectSQL::table = "test_pool";

const char * TestObjectSQL::db_names = "oid,name,body,uid,number";

const char * TestObjectSQL::db_bootstrap = "CREATE TABLE test_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, "
    "number INTEGER)";

/* -------------------------------------------------------------------------- */

int TestObjectSQL::insert(SqlDB *db, string& str)
{
    return insert_replace(db, false);
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::update(SqlDB *db)
{
    return insert_replace(db, true);
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the User

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
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          number          << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_body:
    db->free_str(sql_name);
error_name:
    return -1;
}

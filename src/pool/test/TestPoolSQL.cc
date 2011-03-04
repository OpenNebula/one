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

#include <limits.h>
#include <string.h>
#include <stdlib.h>

#include <iostream>
#include <sstream>

#include <openssl/evp.h>
#include <iomanip>

#include "TestPoolSQL.h"

/* ************************************************************************** */
/* Database Access Functions                                          */
/* ************************************************************************** */

const char * TestObjectSQL::table = "test_pool";

const char * TestObjectSQL::db_names = "(oid,number,name)";

const char * TestObjectSQL::db_bootstrap = "CREATE TABLE test_pool ("
        "oid INTEGER, number INTEGER, name TEXT, PRIMARY KEY(oid))";

/* -------------------------------------------------------------------------- */

int TestObjectSQL::unmarshall(void * nil, int num, char **values, char **names)
{
    if ((!values[OID]) ||
        (!values[NUMBER]) ||
        (!values[TEXT]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid      = atoi(values[OID]);
    number   = atoi(values[NUMBER]);
    text     = values[TEXT];

    return 0;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(
        static_cast<Callbackable::Callback>(&TestObjectSQL::unmarshall),0);
    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::insert(SqlDB *db, string& str)
{
    ostringstream   oss;

    int    rc;
    char * sql_text;

    sql_text   = db->escape_str(text.c_str());

    oss << "INSERT INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << number << ","
        << "'" << sql_text << "')";

    rc = db->exec(oss);

    db->free_str(sql_text);

    return rc;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::update(SqlDB *db)
{
    ostringstream   oss;

    int    rc;
    char * sql_text;

    sql_text   = db->escape_str(text.c_str());

    oss << "REPLACE INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << number << ","
        << "'" << sql_text << "')";

    rc = db->exec(oss);

    db->free_str(sql_text);

    return rc;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::drop(SqlDB * db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}

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

const char * TestObjectSQL::db_names = "(oid,number,text)";

const char * TestObjectSQL::db_bootstrap = "CREATE TABLE test_pool ("
	"oid INTEGER, number INTEGER, text TEXT, PRIMARY KEY(oid))";

/* -------------------------------------------------------------------------- */

int TestObjectSQL::unmarshall(int num, char **names, char ** values)
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

extern "C" int user_select_cb (
        void *                  _user,
        int                     num,
        char **                 values,
        char **                 names)
{    
    TestObjectSQL *    user;

    user = static_cast<TestObjectSQL *>(_user);

    if (user == 0)
    {
        return -1;
    }

    return user->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int TestObjectSQL::select(SqliteDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, user_select_cb, (void *) this);

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::insert(SqliteDB *db)
{
    return update(db);
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::update(SqliteDB *db)
{
    ostringstream   oss;

    int    rc;

    char * sql_number;
    char * sql_text;

    sql_number = sqlite3_mprintf("%d",number);
    sql_text   = sqlite3_mprintf("%q",text.c_str());

    if ( sql_text == 0 )
    {
      sqlite3_free(sql_number);
      return -1;
    }

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << sql_number << ","
        << "'" << sql_text << "')";

    rc = db->exec(oss);
    
    sqlite3_free(sql_number);
    sqlite3_free(sql_text);

    return rc;
}

/* -------------------------------------------------------------------------- */

int TestObjectSQL::drop(SqliteDB * db)
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
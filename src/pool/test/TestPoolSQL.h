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

#ifndef TESTSQL_H_
#define TESTSQL_H_

#include <string>
#include "PoolSQL.h"

using namespace std;

extern "C" int user_select_cb (void *  _host,
                               int     num,
                               char ** values,
                               char ** names);
                               
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// THE OBJECT
class TestObjectSQL : public PoolObjectSQL
{
public:
    //OBJECT ATTRIBUTES
    TestObjectSQL(int n=-1, string t="default"):number(n),text(t){};
                    
    ~TestObjectSQL(){};

    int         number;

    string      text;

    // OBJECTSQL INTERFACE
    int unmarshall(int num, char **names, char ** values);
    
    int select(SqliteDB *db);

    int insert(SqliteDB *db);

    int update(SqliteDB *db);

    int drop(SqliteDB *db);

    // DATABASE IMPLEMENTATION
    enum ColNames
    {
        OID             = 0,
        NUMBER          = 1,
        TEXT            = 2,
        LIMIT           = 3
    };

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    static void bootstrap(SqliteDB * db)
    {
        db->exec(TestObjectSQL::db_bootstrap);
    };
};

// THE POOL
class TestPool : public PoolSQL
{

public:
    TestPool(SqliteDB *db):PoolSQL(db,"test_pool"){};
    ~TestPool(){};

    TestObjectSQL * get(
        int     oid,
        bool    lock)
    {
        return static_cast<TestObjectSQL *>(PoolSQL::get(oid,lock));;
    }

private:

    TestObjectSQL * create()
    {
        return new TestObjectSQL;
    };

};

#endif
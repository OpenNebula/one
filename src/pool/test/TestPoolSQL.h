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

#ifndef TESTSQL_H_
#define TESTSQL_H_

#include <string>
#include "PoolSQL.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// THE OBJECT
class TestObjectSQL : public PoolObjectSQL
{
public:
    //OBJECT ATTRIBUTES
    TestObjectSQL(int n=-1, string t="default"):PoolObjectSQL(-1,"",0,0),number(n),text(t){};

    ~TestObjectSQL(){};

    int         number;

    string      text;

    // OBJECTSQL INTERFACE
    int unmarshall(void * nil, int num, char **names, char ** values);

    int select(SqlDB *db);

    int insert(SqlDB *db, string& err);

    int update(SqlDB *db);

    int drop(SqlDB *db);

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

    static void bootstrap(SqlDB * db)
    {
        ostringstream oss;
        oss.str(TestObjectSQL::db_bootstrap);

        db->exec(oss,0);
    };

    string& to_xml(string& xml) const
    {
        return xml;
    };

    int from_xml(const string &xml_str)
    {
        return 0;
    };
};

// THE POOL
class TestPool : public PoolSQL
{

public:
    TestPool(SqlDB *db):PoolSQL(db,"test_pool"){};
    ~TestPool(){};

    TestObjectSQL * get(
        int     oid,
        bool    lock)
    {
        return static_cast<TestObjectSQL *>(PoolSQL::get(oid,lock));;
    }

    int dump(std::ostringstream&, const std::string&){return -1;};

private:

    TestObjectSQL * create()
    {
        return new TestObjectSQL;
    };

};

#endif

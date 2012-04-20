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
    TestObjectSQL(int n=-1, string t="default"):PoolObjectSQL(-1,VM,t,0,0,"","",table),number(n),text(t){};

    ~TestObjectSQL(){};

    int         number;

    string      text;

    // OBJECTSQL INTERFACE
    int unmarshall(void * nil, int num, char **names, char ** values);

    int insert(SqlDB *db, string& err);

    int update(SqlDB *db);

    int insert_replace(SqlDB *db, bool replace);

    int drop(SqlDB *db)
    {
        return PoolObjectSQL::drop(db);
    }

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
        ostringstream   oss;

        oss << "<TEST>"
            << "<ID>"        << oid       << "</ID>"
            << "<UID>"       << uid       << "</UID>"
            << "<GID>"       << gid       << "</GID>"
            << "<UNAME>"     << uname     << "</UNAME>"
            << "<GNAME>"     << gname     << "</GNAME>"
            << "<NAME>"      << name      << "</NAME>"
            << "<NUMBER>"    << number    << "</NUMBER>"
            << "<TEXT>"      << text      << "</TEXT>"
            << "</TEST>";

        xml = oss.str();

        return xml;
    };

    int from_xml(const string &xml_str)
    {
        int rc = 0;

        // Initialize the internal XML object
        update_from_str(xml_str);

        // Get class base attributes
        rc += xpath(oid,       "/TEST/ID",    -1);
        rc += xpath(uid,       "/TEST/UID",   -1);
        rc += xpath(gid,       "/TEST/GID",   -1);
        rc += xpath(uname,     "/TEST/UNAME", "not_found");
        rc += xpath(gname,     "/TEST/GNAME", "not_found");
        rc += xpath(name,      "/TEST/NAME",  "not_found");

        rc += xpath(number,    "/TEST/NUMBER", -1);
        rc += xpath(text,      "/TEST/TEXT",  "not_found");

        if ( rc != 0 )
        {
            return -1;
        }

        return 0;
    };
};

// THE POOL
class TestPool : public PoolSQL
{

public:
    TestPool(SqlDB *db):PoolSQL(db,"test_pool",true){};
    ~TestPool(){};

    TestObjectSQL * get(
        int     oid,
        bool    lock)
    {
        return static_cast<TestObjectSQL *>(PoolSQL::get(oid,lock));
    }

    TestObjectSQL * get(
        const string& name,
        int ouid,
        bool olock)
    {
        return static_cast<TestObjectSQL *>(PoolSQL::get(name, ouid, olock));
    }

    int dump(std::ostringstream&, const std::string&){return -1;};

private:

    TestObjectSQL * create()
    {
        return new TestObjectSQL;
    };

};

#endif

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "Nebula.h"
#include "SystemDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// Pool control table
const char * SystemDB::pc_table = "pool_control";
const char * SystemDB::pc_names = "tablename, last_oid";

const char * SystemDB::pc_bootstrap = "CREATE TABLE pool_control "
    "(tablename VARCHAR(32) PRIMARY KEY, last_oid BIGINT UNSIGNED)";


// DB versioning table
const char * SystemDB::ver_table = "db_versioning";
const char * SystemDB::ver_names = "oid, version, timestamp, comment";

const char * SystemDB::ver_bootstrap = "CREATE TABLE db_versioning "
    "(oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, "
    "comment VARCHAR(256))";

// System attributes table
const char * SystemDB::sys_table = "system_attributes";
const char * SystemDB::sys_names = "name, body";

const char * SystemDB::sys_bootstrap =  "CREATE TABLE IF NOT EXISTS"
        " system_attributes (name VARCHAR(128) PRIMARY KEY, body MEDIUMTEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::bootstrap()
{
    int             rc;
    ostringstream   oss;

    // ------------------------------------------------------------------------
    // pool control, tracks the last ID's assigned to objects
    // ------------------------------------------------------------------------
    oss.str(pc_bootstrap);
    rc = db->exec(oss);

    // ------------------------------------------------------------------------
    // db versioning, version of OpenNebula. Insert this version number
    // ------------------------------------------------------------------------
    oss.str(ver_bootstrap);
    rc += db->exec(oss);

    oss.str("");
    oss << "INSERT INTO " << ver_table << " (" << ver_names << ") "
        << "VALUES (0, '" << Nebula::db_version() << "', " << time(0)
        << ", '" << Nebula::version() << " daemon bootstrap')";

    rc += db->exec(oss);

    // ------------------------------------------------------------------------
    // system , version of OpenNebula. Insert this version number
    // ------------------------------------------------------------------------
    oss.str(sys_bootstrap);
    rc += db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::select_cb(void *_loaded_db_version, int num, char **values,
                      char **names)
{
    istringstream   iss;
    string *        loaded_db_version;

    loaded_db_version = static_cast<string *>(_loaded_db_version);

    if ( (values[0]) && (num == 1) )
    {
        *loaded_db_version = values[0];
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::check_db_version()
{
    int             rc;
    ostringstream   oss;

    string loaded_db_version = "";

    // Try to read latest version
    set_callback( static_cast<Callbackable::Callback>(&SystemDB::select_cb),
                  static_cast<void *>(&loaded_db_version) );

    oss << "SELECT version FROM " << ver_table
        << " WHERE oid=(SELECT MAX(oid) FROM " << ver_table << ")";

    db->exec(oss, this);

    oss.str("");
    unset_callback();

    if( loaded_db_version == "" )
    {
        // Table user_pool is present for all OpenNebula versions, and it
        // always contains at least the oneadmin user.
        oss << "SELECT MAX(oid) FROM user_pool";
        rc = db->exec(oss);

        oss.str("");

        if( rc != 0 )   // Database needs bootstrap
        {
            return -2;
        }
    }

    if( Nebula::db_version() != loaded_db_version )
    {
        oss << "Database version mismatch. "
            << "Installed " << Nebula::version() << " uses DB version '"
            << Nebula::db_version() << "', and existing DB version is '"
            << loaded_db_version << "'.";

        NebulaLog::log("ONE",Log::ERROR,oss);
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::insert_replace(
        const string& attr_name,
        const string& xml_attr,
        bool          replace,
        string&       err)
{
    ostringstream   oss;

    int    rc;
    char * sql_xml;

    sql_xml = db->escape_str(xml_attr.c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( ObjectXML::validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<< sys_table << " ("<< sys_names <<") VALUES ("
        << "'" << attr_name << "'," << "'" << sql_xml   << "')";

    rc = db->exec(oss);

    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_xml);

error_body:
    err = "Error inserting system attribute in DB.";
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::select_attr_cb(void *  _xml_attr,
                             int     num,
                             char ** values,
                             char ** names)
{
    istringstream   iss;
    string *        xml_attr;

    xml_attr = static_cast<string *>(_xml_attr);

    if ( (values[0]) && (num == 1) )
    {
        *xml_attr = values[0];
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::select_sys_attribute(const string& attr_name, string& attr_xml)
{
    ostringstream oss;

    int rc;

    set_callback(static_cast<Callbackable::Callback>(&SystemDB::select_attr_cb),
                 static_cast<void *>(&attr_xml) );

    oss << "SELECT body FROM " << sys_table << " WHERE name = '"
        << attr_name << "'";

    rc = db->exec(oss, this);

    unset_callback();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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


// DB versioning table, shared (federation) tables
const char * SystemDB::shared_ver_table = "db_versioning";
const char * SystemDB::shared_ver_names = "oid, version, timestamp, comment";

const char * SystemDB::shared_ver_bootstrap = "CREATE TABLE db_versioning "
                                              "(oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, "
                                              "comment VARCHAR(256))";

// DB versioning table, local tables
const char * SystemDB::local_ver_table = "local_db_versioning";
const char * SystemDB::local_ver_names = "oid, version, timestamp, comment, is_slave";

const char * SystemDB::local_ver_bootstrap = "CREATE TABLE local_db_versioning "
                                             "(oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, "
                                             "comment VARCHAR(256), is_slave BOOLEAN)";

// System attributes table
const char * SystemDB::sys_table = "system_attributes";
const char * SystemDB::sys_names = "name, body";

const char * SystemDB::sys_bootstrap =  "CREATE TABLE IF NOT EXISTS"
                                        " system_attributes (name VARCHAR(128) PRIMARY KEY, body MEDIUMTEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::shared_bootstrap()
{
    int           rc;
    ostringstream oss;

    // ---------------------------------------------------------------------
    // db versioning, version of OpenNebula.
    // ---------------------------------------------------------------------
    oss.str(shared_ver_bootstrap);
    rc = db->exec_local_wr(oss);

    oss.str("");
    oss << "INSERT INTO " << shared_ver_table << " (" << shared_ver_names << ") "
        << "VALUES (0, '" << Nebula::shared_db_version() << "', " << time(0)
        << ", '" << Nebula::version() << " daemon bootstrap')";

    rc += db->exec_local_wr(oss);

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::local_bootstrap()
{
    int           rc;
    ostringstream oss;

    // ------------------------------------------------------------------------
    // pool control, tracks the last ID's assigned to objects
    // ------------------------------------------------------------------------
    oss.str(pc_bootstrap);
    rc = db->exec_local_wr(oss);

    // ------------------------------------------------------------------------
    // local db versioning, version of tables that are not replicated in a
    // slave OpenNebula.
    // ------------------------------------------------------------------------
    oss.str(local_ver_bootstrap);
    rc += db->exec_local_wr(oss);

    oss.str("");
    oss << "INSERT INTO " << local_ver_table << " (" << local_ver_names << ") "
        << "VALUES (0, '" << Nebula::local_db_version() << "', " << time(0)
        << ", '" << Nebula::version() << " daemon bootstrap', "
        << "'" << Nebula::instance().is_federation_slave() << "')";

    rc += db->exec_local_wr(oss);

    // ------------------------------------------------------------------------
    // system
    // ------------------------------------------------------------------------
    oss.str(sys_bootstrap);
    rc += db->exec_local_wr(oss);

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::select_cb(void *_loaded_db_version, int num, char **values,
                        char **names)
{
    string *        loaded_db_version;

    loaded_db_version = static_cast<string *>(_loaded_db_version);

    if ( (values[0]) && (num == 1) )
    {
        *loaded_db_version = values[0];
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::check_db_version(const string& table,
                               const string& version,
                               string& error)
{
    ostringstream oss;
    string        db_version;

    error.clear();

    set_callback(static_cast<Callbackable::Callback>(&SystemDB::select_cb),
                 static_cast<void *>(&db_version));

    oss << "SELECT version FROM " << table <<" WHERE oid=(SELECT MAX(oid) FROM "
        << table << ")";

    int rc = db->exec_rd(oss, this);

    unset_callback();

    if( rc != 0 || db_version.empty() )//DB needs bootstrap or replica config.
    {
        return -2;
    }

    oss.str("");

    if(version != db_version)//DB needs upgrade
    {
        oss << "Database version mismatch ( " << table << "). "
            << "Installed " << Nebula::version() << " needs DB version '"
            << version << "', and existing DB version is '"<< db_version << "'.";

        error = oss.str();

        return -1;
    }

    oss << "oned is using version " << version << " for " << table;

    NebulaLog::log("ONE", Log::INFO, oss);

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::check_db_version(bool is_slave, bool &local_bs, bool &shared_bs)
{
    int    rc;
    string error;

    local_bs  = false;
    shared_bs = false;

    /* ---------------------------------------------------------------------- */
    /* Check DB version for local tables                                      */
    /* ---------------------------------------------------------------------- */

    rc = check_db_version(local_ver_table, Nebula::local_db_version(), error);

    switch(rc)
    {
        case 0:// All ok continue
            break;

        case -1:// Version missmatch (same for master/slave/standalone)
            NebulaLog::log("ONE", Log::ERROR, error);
            NebulaLog::log("ONE", Log::ERROR, "Use onedb to upgrade DB.");
            return -1;

        case -2: //Cannot access DB table or empty, bootstrap
            local_bs = true;
            break;

        default:
            break;
    }

    /* ---------------------------------------------------------------------- */
    /* Check DB version for shared (federation) tables                        */
    /* ---------------------------------------------------------------------- */

    rc = check_db_version(shared_ver_table, Nebula::shared_db_version(), error);

    switch(rc)
    {
        case 0:// All ok continue
            break;

        case -1:// Version missmatch
            NebulaLog::log("ONE", Log::ERROR, error);

            if (is_slave)
            {
                NebulaLog::log("ONE", Log::ERROR,
                               "Cannot join federation, oned master needs upgrade.");
            }
            else
            {
                NebulaLog::log("ONE", Log::ERROR, "Use onedb to upgrade DB.");
            }

            return -1;

        case -2: //Cannot access DB table or empty, bootstrap (only master/standalone)
            if (is_slave)
            {
                NebulaLog::log("ONE", Log::ERROR, "Cannot access shared DB"
                               " tables. Check DB replica configuration.");

                return -1;
            }

            shared_bs = true;
            break;

        default:
            break;
    }

    return 0;
};

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

    sql_xml = db->escape_str(xml_attr);

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
        oss << "UPDATE " << sys_table << " SET "
            << "body = '" << sql_xml << "' "
            << "WHERE name = '" << attr_name << "'";
    }
    else
    {
        oss << "INSERT INTO " << sys_table << " (" << sys_names << ") VALUES ("
            << "'" << attr_name << "',"
            << "'" << sql_xml   << "')";
    }
    rc = db->exec_wr(oss);

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

    rc = db->exec_rd(oss, this);

    unset_callback();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

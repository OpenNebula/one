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

#include "DefaultQuotas.h"
#include "ObjectXML.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * DefaultQuotas::table    = "system_attributes";
const char * DefaultQuotas::db_names = "name, body";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& DefaultQuotas::to_xml(string& xml) const
{
    ostringstream oss;

    string aux_xml;

    oss << "<" << root_elem << ">"
        << Quotas::to_xml(aux_xml)
        << "</" << root_elem << ">";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::from_xml(const string& xml)
{
    ObjectXML *object_xml = new ObjectXML(xml);

    int rc = Quotas::from_xml(object_xml);

    delete object_xml;

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::select(SqlDB *db)
{
    ostringstream oss;

    int rc;

    set_callback(
            static_cast<Callbackable::Callback>(&DefaultQuotas::select_cb));

    oss << "SELECT body FROM " << table << " WHERE name = '" << root_elem << "'";

    rc = db->exec(oss, this);

    unset_callback();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_xml;

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }
/*
    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }
*/
    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        << "'" <<   root_elem            << "',"
        << "'" <<   sql_xml             << "')";

    rc = db->exec(oss);

    db->free_str(sql_xml);

    return rc;
/*
error_xml:
    db->free_str(sql_xml);

    error_str = "Error transforming the Quotas to XML.";

    goto error_common;
*/
error_body:
    goto error_generic;

error_generic:
    error_str = "Error inserting Quotas in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::bootstrap(SqlDB * db)
{
    ostringstream oss;

    oss << "CREATE TABLE IF NOT EXISTS system_attributes ("
            "name VARCHAR(128) PRIMARY KEY, body TEXT)";

    return db->exec(oss);
}

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

#include "QuotasSQL.h"
#include "Nebula.h"

#include "ObjectXML.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& QuotasSQL::to_xml_db(string& xml) const
{
    ostringstream oss;

    oss << "<QUOTAS>"
        << "<ID>" << oid << "</ID>"
        << Quotas::to_xml(xml)
        << "</QUOTAS>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotasSQL::from_xml(const string& xml)
{
    ObjectXML obj_xml(xml);

    int rc = Quotas::from_xml(&obj_xml);

    obj_xml.xpath(oid, "/QUOTAS/ID", -1);

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotasSQL::select(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    set_callback(static_cast<Callbackable::Callback>(&QuotasSQL::select_cb));

    oss << "SELECT body FROM " << table()
        << " WHERE " << table_oid_column() << " = " << oid;

    rc = db->exec_rd(oss, this);

    unset_callback();

    if (rc != 0)
    {
        goto error_id;
    }

    return 0;

error_id:
    oss.str("");
    oss << "Error getting quotas for user/group " << oid;

    NebulaLog::log("ONE", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */

int QuotasSQL::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (!values[0]) || (num != 1) )
    {
        return -1;
    }

    return from_xml(values[0]);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotasSQL::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_quota;
    char * sql_quota_xml;

    // Quota fields

    sql_quota_xml = db->escape_str(to_xml_db(xml_quota));

    if ( sql_quota_xml == 0 )
    {
        goto error_quota_body;
    }

    if ( ObjectXML::validate_xml(sql_quota_xml) != 0 )
    {
        goto error_quota_xml;
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

    oss << " INTO " << table() << " ("<< table_names() <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_quota_xml   << "')";

    rc = db->exec_wr(oss);

    db->free_str(sql_quota_xml);

    return rc;

error_quota_xml:
    db->free_str(sql_quota_xml);

    goto error_common;

error_quota_body:
    error_str = "Error transforming the Quotas to XML.";

    goto error_common;

error_common:
    error_str = "Error transforming the Quotas to XML.";
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotasSQL::drop(SqlDB *db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table()
        << " WHERE " << table_oid_column() << " = " << oid;

    rc = db->exec_wr(oss);

    return rc;
}

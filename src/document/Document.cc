/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include "Document.h"
#include "OneDB.h"

using namespace std;

/* ************************************************************************ */
/* Document :: Constructor/Destructor                                       */
/* ************************************************************************ */

Document::Document( int id,
                    int _uid,
                    int _gid,
                    const string& _uname,
                    const string& _gname,
                    int _umask,
                    int _type,
                    std::unique_ptr<Template> _template_contents)
    : PoolObjectSQL(id, DOCUMENT, "", _uid, _gid, _uname, _gname, one_db::doc_table)
    , type(_type)
{
    if (_template_contents)
    {
        obj_template = move(_template_contents);
    }
    else
    {
        obj_template = make_unique<DocumentTemplate>();
    }

    set_umask(_umask);
}

/* ************************************************************************ */
/* Document :: Database Access Functions                                    */
/* ************************************************************************ */

int Document::insert(SqlDB *db, string& error_str)
{
    int             rc;
    ostringstream   oss;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( name.empty() == true )
    {
        oss << "document-" << oid;
        name = oss.str();
    }
    else if ( name.length() > 128 )
    {
        error_str = "NAME is too long; max length is 128 chars.";
        return -1;
    }

    // Encrypt all the secrets
    encrypt();

    // ------------------------------------------------------------------------
    // Insert the Document
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Document::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Object

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if(replace)
    {
        oss << "UPDATE " << one_db::doc_table << " SET "
            << "name = '"    << sql_name << "', "
            << "body = '"    << sql_xml  << "', "
            << "type = "     << type     << ", "
            << "uid = "      << uid      << ", "
            << "gid = "      << gid      << ", "
            << "owner_u = "  << owner_u  << ", "
            << "group_u = "  << group_u  << ", "
            << "other_u = "  << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::doc_table
            << " (" << one_db::doc_db_names << ") VALUES ("
            <<            oid        << ","
            << "'"     << sql_name   << "',"
            << "'"     << sql_xml    << "',"
            <<            type       << ","
            <<            uid        << ","
            <<            gid        << ","
            <<            owner_u    << ","
            <<            group_u    << ","
            <<            other_u    << ")";
    }

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Document to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Document in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Document::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::doc_db_bootstrap);

    return db->exec_local_wr(oss);
}

/* ************************************************************************ */
/* Document :: Misc                                                         */
/* ************************************************************************ */

string& Document::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          perm_str;
    string          lock_str;

    oss << "<DOCUMENT>"
        << "<ID>"       << oid        << "</ID>"
        << "<UID>"      << uid        << "</UID>"
        << "<GID>"      << gid        << "</GID>"
        << "<UNAME>"    << uname      << "</UNAME>"
        << "<GNAME>"    << gname      << "</GNAME>"
        << "<NAME>"     << name       << "</NAME>"
        << "<TYPE>"     << type       << "</TYPE>"
        << perms_to_xml(perm_str)
        << lock_db_to_xml(lock_str)
        << obj_template->to_xml(template_xml)
        << "</DOCUMENT>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Document::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/DOCUMENT/ID",      -1);
    rc += xpath(uid,        "/DOCUMENT/UID",     -1);
    rc += xpath(gid,        "/DOCUMENT/GID",     -1);
    rc += xpath(uname,      "/DOCUMENT/UNAME",   "not_found");
    rc += xpath(gname,      "/DOCUMENT/GNAME",   "not_found");
    rc += xpath(name,       "/DOCUMENT/NAME",    "not_found");
    rc += xpath(type,       "/DOCUMENT/TYPE",     0);

    // Permissions
    rc += perms_from_xml();

    // Lock info
    rc += lock_db_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/DOCUMENT/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

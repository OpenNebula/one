/* ------------------------------------------------------------------------ */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)           */
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

#include "VMTemplate.h"

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)


/* ************************************************************************ */
/* VMTemplate :: Constructor/Destructor                                     */
/* ************************************************************************ */

VMTemplate::VMTemplate(int id,
                       int _uid,
                       int _gid,
                       const string& _uname,
                       const string& _gname,
                       VirtualMachineTemplate * _template_contents):
        PoolObjectSQL(id,"",_uid,_gid,_uname,_gname,table),
        regtime(time(0))
{
    if (_template_contents != 0)
    {
        obj_template = _template_contents;
    }
    else
    {
        obj_template = new VirtualMachineTemplate;
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

VMTemplate::~VMTemplate()
{
    if ( obj_template != 0 )
    {
        delete obj_template;
    }
}

/* ************************************************************************ */
/* VMTemplate :: Database Access Functions                                  */
/* ************************************************************************ */

const char * VMTemplate::table = "template_pool";

const char * VMTemplate::db_names = "oid, name, body, uid, gid, public";

const char * VMTemplate::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS template_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(256), body TEXT, uid INTEGER, gid INTEGER, public INTEGER)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::insert(SqlDB *db, string& error_str)
{
    int             rc;
    ostringstream   oss;
    string          public_attr;


    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    // ------------ NAME & TEMPLATE_ID --------------------
    oss << oid;

    replace_template_attribute("TEMPLATE_ID",oss.str()); 

    get_template_attribute("NAME", name);

    if ( name.empty() == true )
    {
        oss.str("");
        oss << "template-" << oid;
        name = oss.str();
    }


    // ------------ PUBLIC --------------------

    get_template_attribute("PUBLIC", public_attr);

    obj_template->erase("PUBLIC");

    TO_UPPER(public_attr);

    public_obj = (public_attr == "YES");

    // ------------------------------------------------------------------------
    // Insert the Template
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        error_str = "Error inserting Template in DB.";
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

   // Update the Object

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO " << table <<" ("<< db_names <<") VALUES ("
        <<            oid        << ","
        << "'"     << sql_name   << "',"
        << "'"     << sql_xml    << "',"
        <<            uid        << ","
        <<            gid        << ","
        <<            public_obj << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_body:
    db->free_str(sql_name);
error_name:
    return -1;
}

/* ************************************************************************ */
/* VMTemplate :: Misc                                                       */
/* ************************************************************************ */

string& VMTemplate::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;

    oss << "<VMTEMPLATE>"
            << "<ID>"       << oid        << "</ID>"
            << "<UID>"      << uid        << "</UID>"
            << "<GID>"      << gid        << "</GID>"
            << "<NAME>"     << name       << "</NAME>"
            << "<PUBLIC>"   << public_obj << "</PUBLIC>"
            << "<REGTIME>"  << regtime    << "</REGTIME>"
            << obj_template->to_xml(template_xml)
        << "</VMTEMPLATE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/VMTEMPLATE/ID",      -1);
    rc += xpath(uid,        "/VMTEMPLATE/UID",     -1);
    rc += xpath(gid,        "/VMTEMPLATE/GID",     -1);
    rc += xpath(name,       "/VMTEMPLATE/NAME",    "not_found");
    rc += xpath(public_obj, "/VMTEMPLATE/PUBLIC",  0);
    rc += xpath(regtime,    "/VMTEMPLATE/REGTIME", 0);

    // Get associated classes
    ObjectXML::get_nodes("/VMTEMPLATE/TEMPLATE", content);

    if( content.size() < 1 )
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

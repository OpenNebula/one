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

#include "VMTemplate.h"
#include "Nebula.h"
#include "VirtualMachineManager.h"
#include "OneDB.h"

#include "ScheduledAction.h"

using namespace std;

/* ************************************************************************ */
/* VMTemplate :: Constructor/Destructor                                     */
/* ************************************************************************ */

VMTemplate::VMTemplate(int id,
                       int _uid,
                       int _gid,
                       const string& _uname,
                       const string& _gname,
                       int umask,
                       unique_ptr<Template> _template_contents):
    PoolObjectSQL(id, TEMPLATE, "", _uid, _gid, _uname, _gname, one_db::vm_template_table),
    regtime(time(0))
{
    if (_template_contents)
    {
        obj_template = move(_template_contents);
    }
    else
    {
        obj_template = make_unique<VirtualMachineTemplate>();
    }

    set_umask(umask);
}

/* ************************************************************************ */
/* VMTemplate :: Database Access Functions                                  */
/* ************************************************************************ */

int VMTemplate::insert(SqlDB *db, string& error_str)
{
    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------
    erase_template_attribute("NAME", name);

    // ---------------------------------------------------------------------
    // Remove DONE/MESSAGE from SCHED_ACTION and check rest attributes
    // ---------------------------------------------------------------------
    int rc = parse_sched_action(error_str);

    if (rc == -1)
    {
        return rc;
    }

    // ------------------------------------------------------------------------
    // Validate RAW attribute
    // ------------------------------------------------------------------------
    rc = Nebula::instance().get_vmm()->validate_raw(obj_template.get(), error_str);

    if (rc != 0)
    {
        return rc;
    }

    // ------------------------------------------------------------------------
    // Insert the Template
    // ------------------------------------------------------------------------
    return insert_replace(db, false, error_str);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::insert_replace(SqlDB *db, bool replace, string& error_str)
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
        oss << "UPDATE " << one_db::vm_template_table << " SET "
            << "name = '"      << sql_name   << "', "
            << "body = '"      << sql_xml    << "', "
            << "uid = "        << uid        << ", "
            << "gid = "        << gid        << ", "
            << "owner_u = "    << owner_u    << ", "
            << "group_u = "    << group_u    << ", "
            << "other_u = "    << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::vm_template_table
            << " (" << one_db::vm_template_db_names << ") VALUES ("
            <<            oid        << ","
            << "'"     << sql_name   << "',"
            << "'"     << sql_xml    << "',"
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

    error_str = "Error transforming the Template to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Template in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::vm_template_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::parse_sched_action(string& error_str)
{
    vector<const VectorAttribute*> vas;

    if (obj_template->get("SCHED_ACTION", vas) == 0)
    {
        return 0;
    }

    for (const auto& i: vas)
    {
        ScheduledAction sa(PoolObjectSQL::VM, 0);

        if ( sa.parse(i, 0, error_str) == -1 )
        {
            return -1;
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::post_update_template(string& error)
{
    int rc = parse_sched_action(error);

    if (rc == -1)
    {
        return rc;
    }

    rc = Nebula::instance().get_vmm()->validate_raw(obj_template.get(), error);

    if (rc != 0)
    {
        return rc;
    }

    return 0;
}

/* ************************************************************************ */
/* VMTemplate :: Misc                                                       */
/* ************************************************************************ */

string& VMTemplate::to_xml(string& xml) const
{
    return to_xml(xml, obj_template.get());
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& VMTemplate::to_xml(string& xml, const Template* tmpl) const
{
    ostringstream   oss;
    string          template_xml;
    string          perm_str;
    string          lock_str;

    oss << "<VMTEMPLATE>"
        << "<ID>"       << oid        << "</ID>"
        << "<UID>"      << uid        << "</UID>"
        << "<GID>"      << gid        << "</GID>"
        << "<UNAME>"    << uname      << "</UNAME>"
        << "<GNAME>"    << gname      << "</GNAME>"
        << "<NAME>"     << name       << "</NAME>"
        << lock_db_to_xml(lock_str)
        << perms_to_xml(perm_str)
        << "<REGTIME>"  << regtime    << "</REGTIME>"
        << tmpl->to_xml(template_xml)
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
    rc += xpath(uname,      "/VMTEMPLATE/UNAME",   "not_found");
    rc += xpath(gname,      "/VMTEMPLATE/GNAME",   "not_found");
    rc += xpath(name,       "/VMTEMPLATE/NAME",    "not_found");
    rc += xpath<time_t>(regtime, "/VMTEMPLATE/REGTIME", 0);

    rc += lock_db_from_xml();
    // Permissions
    rc += perms_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/VMTEMPLATE/TEMPLATE", content);

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

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

bool VMTemplate::is_vrouter()
{
    bool vr;

    get_template_attribute("VROUTER", vr);

    return vr;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

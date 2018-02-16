/* ------------------------------------------------------------------------ */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems              */
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
                       int umask,
                       VirtualMachineTemplate * _template_contents):
        PoolObjectSQL(id,TEMPLATE,"",_uid,_gid,_uname,_gname,table),
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

    set_umask(umask);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

VMTemplate::~VMTemplate(){};

/* ************************************************************************ */
/* VMTemplate :: Database Access Functions                                  */
/* ************************************************************************ */

const char * VMTemplate::table = "template_pool";

const char * VMTemplate::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * VMTemplate::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS template_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::insert(SqlDB *db, string& error_str)
{
    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------
    erase_template_attribute("NAME", name);

    // ---------------------------------------------------------------------
    // Remove DONE/MESSAGE from SCHED_ACTION
    // ---------------------------------------------------------------------
    parse_sched_action();

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

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
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
        <<            owner_u    << ","
        <<            group_u    << ","
        <<            other_u    << ")";

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

int VMTemplate::parse_sched_action()
{
    vector<VectorAttribute *> _sched_actions;
    vector<VectorAttribute *>::iterator i;
    set<int>::const_iterator it_set;
    VectorAttribute* vatt;
    int rep_mode, end_mode;
    int has_mode, has_end_mode, has_days, has_end_value;
    int end_value;
    int first_day, last_day;
    string days;
    vector<string> v_days;
    set<int> s_days;

    get_template_attribute("SCHED_ACTION", _sched_actions);

    for ( i = _sched_actions.begin(); i != _sched_actions.end() ; ++i)
    {
        vatt = dynamic_cast<VectorAttribute*>(*i);

        has_mode  = vatt->vector_value("REP", rep_mode);
        has_days  = vatt->vector_value("DAYS", days);

        if (has_mode == 0 && has_days == 0)
        {
            v_days = one_util::split(days, ',', true);
            for(vector<string>::iterator it = v_days.begin(); it != v_days.end(); ++it) {
                s_days.insert(atoi((*it).c_str()));
            }
            first_day = *s_days.cbegin();
            last_day = *s_days.cend();

            if (!(rep_mode == 0 && first_day > 0 && last_day < 7)) //WEEK
            {
                return -1;
            }
            else if (!(rep_mode == 1 && first_day > 0 && last_day < 32)) //MONTH
            {
                return -1;
            }
            else if (!(rep_mode == 2 && first_day > 0 && last_day < 366)) //YEAR
            {
                return -1;
            }
        }
        // else
        // {
        //     return -1;
        // }

        has_end_mode  = vatt->vector_value("END_TYPE", end_mode);
        has_end_value  = vatt->vector_value("END_VALUE", end_value);

        if (has_end_mode == 0 && has_end_value == 0)
        {
            // if (end_mode == 1 && end_value < 0) //N_REP
            // {
            //     return -1;
            // }
            else if ( end_mode == 2 ) //DATE
            {
                time_t value = end_value;
                struct tm val_tm;
                localtime_r(&value, &val_tm);
                time_t out = mktime(&val_tm);
                if (out == -1)
                {
                    return -1;
                }
            }
        }
        else
        {
            return -1;
        }

        vatt->remove("DONE");
        vatt->remove("MESSAGE");
    }
    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VMTemplate::post_update_template(string& error)
{
    parse_sched_action();

    return 0;
}

/* ************************************************************************ */
/* VMTemplate :: Misc                                                       */
/* ************************************************************************ */

string& VMTemplate::to_xml(string& xml) const
{
    return to_xml(xml, obj_template);
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

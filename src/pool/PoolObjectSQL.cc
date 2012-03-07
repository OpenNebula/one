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

#include "PoolObjectSQL.h"
#include "PoolObjectAuth.h"
#include "SSLTools.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::to_xml64(string &xml64)
{
    string *str64;
    
    to_xml(xml64);

    str64 = SSLTools::base64_encode(xml64);
   
    xml64 = *str64;

    delete str64;

    return xml64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db, const string& _name, int _uid)
{
    ostringstream oss;

    int rc;
    char * sql_name;

    sql_name = db->escape_str(_name.c_str());

    if ( sql_name == 0 )
    {
        return -1;
    }

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE name = '" << sql_name << "'";

    if ( _uid != -1 )
    {
        oss << " AND uid = " << _uid;
    }

    name  = "";
    uid   = -1;

    rc = db->exec(oss, this);

    unset_callback();

    db->free_str(sql_name);

    if ((rc != 0) || (_name != name) || (_uid != -1 && _uid != uid))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::drop(SqlDB *db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * PoolObjectSQL::error_attribute_name = "ERROR";

void PoolObjectSQL::set_template_error_message(const string& message)
{
    VectorAttribute *  attr;
    map<string,string> error_value;
    
    char   str[26];
    time_t the_time;

    the_time = time(NULL);

#ifdef SOLARIS
    ctime_r(&(the_time),str,sizeof(char)*26);
#else
    ctime_r(&(the_time),str);
#endif

    str[24] = '\0'; // Get rid of final enter character

    error_value.insert(make_pair("TIMESTAMP",str));
    error_value.insert(make_pair("MESSAGE",message));

    //Replace previous error message and insert the new one

    attr = new VectorAttribute(error_attribute_name,error_value);

    obj_template->erase(error_attribute_name);
    obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::replace_template(const string& tmpl_str, string& error)
{
    Template * new_tmpl  = get_new_template();

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }
    
    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    delete obj_template;

    obj_template = new_tmpl;

    return 0;
} 

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::perms_to_xml(string& xml) const
{
    ostringstream   oss;

    oss <<
        "<PERMISSIONS>" <<
            "<OWNER_U>" << owner_u << "</OWNER_U>"  <<
            "<OWNER_M>" << owner_m << "</OWNER_M>"  <<
            "<OWNER_A>" << owner_a << "</OWNER_A>"  <<
            "<GROUP_U>" << group_u << "</GROUP_U>"  <<
            "<GROUP_M>" << group_m << "</GROUP_M>"  <<
            "<GROUP_A>" << group_a << "</GROUP_A>"  <<
            "<OTHER_U>" << other_u << "</OTHER_U>"  <<
            "<OTHER_M>" << other_m << "</OTHER_M>"  <<
            "<OTHER_A>" << other_a << "</OTHER_A>"  <<
        "</PERMISSIONS>";

    xml = oss.str();
    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::perms_from_xml()
{
    int rc = 0;

    rc += xpath(owner_u, "/*/PERMISSIONS/OWNER_U", 0);
    rc += xpath(owner_m, "/*/PERMISSIONS/OWNER_M", 0);
    rc += xpath(owner_a, "/*/PERMISSIONS/OWNER_A", 0);

    rc += xpath(group_u, "/*/PERMISSIONS/GROUP_U", 0);
    rc += xpath(group_m, "/*/PERMISSIONS/GROUP_M", 0);
    rc += xpath(group_a, "/*/PERMISSIONS/GROUP_A", 0);

    rc += xpath(other_u, "/*/PERMISSIONS/OTHER_U", 0);
    rc += xpath(other_m, "/*/PERMISSIONS/OTHER_M", 0);
    rc += xpath(other_a, "/*/PERMISSIONS/OTHER_A", 0);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolObjectSQL::get_permissions(PoolObjectAuth& auth)
{
    auth.obj_type = obj_type;

    auth.oid = oid;
    auth.uid = uid;
    auth.gid = gid;

    auth.owner_u = owner_u;
    auth.owner_m = owner_m;
    auth.owner_a = owner_a;

    auth.group_u = group_u;
    auth.group_m = group_m;
    auth.group_a = group_a;

    auth.other_u = other_u;
    auth.other_m = other_m;
    auth.other_a = other_a;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::set_permissions( int _owner_u,
                                    int _owner_m,
                                    int _owner_a,
                                    int _group_u,
                                    int _group_m,
                                    int _group_a,
                                    int _other_u,
                                    int _other_m,
                                    int _other_a,
                                    string& error_str)
{
    if ( _owner_u < -1 || _owner_u > 1 ) goto error_value;
    if ( _owner_m < -1 || _owner_m > 1 ) goto error_value;
    if ( _owner_a < -1 || _owner_a > 1 ) goto error_value;
    if ( _group_u < -1 || _group_u > 1 ) goto error_value;
    if ( _group_m < -1 || _group_m > 1 ) goto error_value;
    if ( _group_a < -1 || _group_a > 1 ) goto error_value;
    if ( _other_u < -1 || _other_u > 1 ) goto error_value;
    if ( _other_m < -1 || _other_m > 1 ) goto error_value;
    if ( _other_a < -1 || _other_a > 1 ) goto error_value;

    set_perm(owner_u, _owner_u);
    set_perm(owner_m, _owner_m);
    set_perm(owner_a, _owner_a);
    set_perm(group_u, _group_u);
    set_perm(group_m, _group_m);
    set_perm(group_a, _group_a);
    set_perm(other_u, _other_u);
    set_perm(other_m, _other_m);
    set_perm(other_a, _other_a);

    return 0;

error_value:
    error_str = "New permission values must be -1, 0 or 1";
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

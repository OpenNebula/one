/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "NebulaUtil.h"
#include "Nebula.h"
#include "Clusterable.h"

const string PoolObjectSQL::INVALID_NAME_CHARS = "&|:\\\";/'#{}$<>";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::to_xml64(string &xml64)
{
    string *str64;

    to_xml(xml64);

    str64 = one_util::base64_encode(xml64);

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

void PoolObjectSQL::set_template_error_message(const string& message)
{
    set_template_error_message("ERROR", message);
}

/* -------------------------------------------------------------------------- */

void PoolObjectSQL::set_template_error_message(const string& name,
                                               const string& message)
{
    SingleAttribute * attr;
    ostringstream     error_value;

    error_value << one_util::log_time() << " : " << message;

    attr = new SingleAttribute(name, error_value.str());

    obj_template->erase(name);
    obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */

void PoolObjectSQL::clear_template_error_message()
{
    remove_template_attribute("ERROR");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::replace_template(
        const string& tmpl_str, bool keep_restricted, string& error)
{
    Template * old_tmpl = 0;
    Template * new_tmpl = get_new_template();

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (obj_template != 0)
    {
        old_tmpl = new Template(*obj_template);
    }

    if (keep_restricted && new_tmpl->has_restricted())
    {
        new_tmpl->remove_restricted();

        if (obj_template != 0)
        {
            obj_template->remove_all_except_restricted();

            string aux_error;
            new_tmpl->merge(obj_template, aux_error);
        }
    }

    delete obj_template;

    obj_template = new_tmpl;

    if (post_update_template(error) == -1)
    {
        delete obj_template;

        if (old_tmpl != 0)
        {
            obj_template = old_tmpl;
        }
        else
        {
            obj_template = 0;
        }

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::append_template(
        const string& tmpl_str, bool keep_restricted, string& error)
{
    Template * old_tmpl = 0;
    Template * new_tmpl = get_new_template();

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (keep_restricted)
    {
        new_tmpl->remove_restricted();
    }

    if ( obj_template != 0 )
    {
        old_tmpl = new Template(*obj_template);

        obj_template->merge(new_tmpl, error);
        delete new_tmpl;
    }
    else
    {
        obj_template = new_tmpl;
    }

    if (post_update_template(error) == -1)
    {
        delete obj_template;

        if (old_tmpl != 0)
        {
            obj_template = old_tmpl;
        }
        else
        {
            obj_template = 0;
        }

        return -1;
    }

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

    Clusterable* cl = dynamic_cast<Clusterable*>(this);

    if(cl != 0)
    {
        auth.cid = cl->get_cluster_id();
    }
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

void PoolObjectSQL::set_umask(int umask)
{
    int perms;
    bool enable_other;

    Nebula::instance().get_configuration_attribute(
            "ENABLE_OTHER_PERMISSIONS", enable_other);

    if (uid == 0 || gid == 0)
    {
        perms = 0777;
    }
    else if (enable_other)
    {
        perms = 0666;
    }
    else
    {
        perms = 0660;
    }

    perms = perms & ~umask;

    owner_u = ( (perms & 0400) != 0 ) ? 1 : 0;
    owner_m = ( (perms & 0200) != 0 ) ? 1 : 0;
    owner_a = ( (perms & 0100) != 0 ) ? 1 : 0;
    group_u = ( (perms & 0040) != 0 ) ? 1 : 0;
    group_m = ( (perms & 0020) != 0 ) ? 1 : 0;
    group_a = ( (perms & 0010) != 0 ) ? 1 : 0;
    other_u = ( (perms & 0004) != 0 ) ? 1 : 0;
    other_m = ( (perms & 0002) != 0 ) ? 1 : 0;
    other_a = ( (perms & 0001) != 0 ) ? 1 : 0;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool PoolObjectSQL::name_is_valid(const string& obj_name,
                                  const string& extra_chars,
                                  string& error_str)
{
    size_t pos;

    if ( obj_name.empty() )
    {
        error_str = "Invalid NAME, it cannot be empty";
        return false;
    }

    if (extra_chars.empty())
    {
        pos = obj_name.find_first_of(INVALID_NAME_CHARS);
    }
    else
    {
        string invalid_chars = INVALID_NAME_CHARS + extra_chars;
        pos = obj_name.find_first_of(invalid_chars);
    }

    if ( pos != string::npos )
    {
        ostringstream oss;
        oss << "Invalid NAME, char '" << obj_name.at(pos) << "' is not allowed";

        error_str = oss.str();
        return false;
    }

    if ( obj_name.length() > 128 )
    {
        error_str = "Invalid NAME, max length is 128 chars";
        return false;
    }

    return true;
}

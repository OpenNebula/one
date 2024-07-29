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

#include "PoolObjectSQL.h"
#include "PoolObjectAuth.h"
#include "NebulaUtil.h"
#include "SSLUtil.h"
#include "Nebula.h"
#include "Clusterable.h"
#include "ClusterableSingle.h"

using namespace std;

const string PoolObjectSQL::INVALID_NAME_CHARS = "&|:\\\";/'#{}$<>";

const int PoolObjectSQL::LOCK_DB_EXPIRATION = 120;

const long int PoolObjectSQL::LockableObject = PoolObjectSQL::ObjectType::VM
                                               | PoolObjectSQL::ObjectType::TEMPLATE
                                               | PoolObjectSQL::ObjectType::IMAGE
                                               | PoolObjectSQL::ObjectType::MARKETPLACEAPP
                                               | PoolObjectSQL::ObjectType::NET
                                               | PoolObjectSQL::ObjectType::VROUTER
                                               | PoolObjectSQL::ObjectType::VMGROUP
                                               | PoolObjectSQL::ObjectType::VNTEMPLATE
                                               | PoolObjectSQL::ObjectType::DOCUMENT
                                               | PoolObjectSQL::ObjectType::HOOK
                                               | PoolObjectSQL::ObjectType::BACKUPJOB;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::to_xml64(string &xml64)
{
    to_xml(xml64);

    ssl_util::base64_encode(xml64, xml64);

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

    rc = db->exec_rd(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select_oid(SqlDB *db, const char * _table,
                              const string& _name, int _uid)
{
    char * sql_name = db->escape_str(_name);

    if ( sql_name == 0 )
    {
        return -1;
    }

    ostringstream oss;

    oss << "SELECT oid FROM " << _table << " WHERE ";

    db->add_binary(oss);

    oss << "name = '" << sql_name << "'";

    if ( _uid != -1 )
    {
        oss << " AND uid = " << _uid;
    }

    int bd_oid = -1;

    single_cb<int> oid_cb;

    oid_cb.set_callback(&bd_oid);

    int rc = db->exec_rd(oss, &oid_cb);

    oid_cb.unset_callback();

    db->free_str(sql_name);

    if (rc != 0)
    {
        return -1;
    }

    return bd_oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::exist(SqlDB *db, const char * _table, int _oid)
{
    if ( _oid < 0 )
    {
        return -1;
    }

    ostringstream oss;

    oss << "SELECT oid FROM " << _table << " WHERE oid = '" << _oid  << "'";

    int bd_oid = -1;

    single_cb<int> oid_cb;

    oid_cb.set_callback(&bd_oid);

    int rc = db->exec_rd(oss, &oid_cb);

    oid_cb.unset_callback();

    if (rc != 0)
    {
        return -1;
    }

    return bd_oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db, const string& _name, int _uid)
{
    ostringstream oss;

    int rc;
    char * sql_name;

    sql_name = db->escape_str(_name);

    if ( sql_name == 0 )
    {
        return -1;
    }

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE ";

    db->add_binary(oss);

    oss << "name = '" << sql_name << "'";

    if ( _uid != -1 )
    {
        oss << " AND uid = " << _uid;
    }

    name  = "";
    uid   = -1;

    rc = db->exec_rd(oss, this);

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

    rc = db->exec_wr(oss);

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
    string ra;

    unique_ptr<Template> old_tmpl = 0;
    unique_ptr<Template> new_tmpl = get_new_template();

    if ( !new_tmpl )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    if (obj_template)
    {
        if ( keep_restricted &&
             new_tmpl->check_restricted(ra, obj_template.get(), false) )
        {
            error = "Tried to change restricted attribute: " + ra;

            return -1;
        }

        old_tmpl = std::make_unique<Template>(*obj_template);
    }
    else if ( keep_restricted && new_tmpl->check_restricted(ra) )
    {
        error = "Tried to set restricted attribute: " + ra;

        return -1;
    }

    obj_template = move(new_tmpl);

    if (post_update_template(error) == -1)
    {
        if (old_tmpl)
        {
            obj_template = move(old_tmpl);
        }
        else
        {
            obj_template = nullptr;
        }

        return -1;
    }

    encrypt();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::append_template(
        const string& tmpl_str, bool keep_restricted, string& error)
{
    unique_ptr<Template> old_tmpl;
    unique_ptr<Template> new_tmpl = get_new_template();
    string rname;

    if ( !new_tmpl )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    if ( obj_template )
    {
        if (keep_restricted &&
            new_tmpl->check_restricted(rname, obj_template.get(), true))
        {
            error ="User Template includes a restricted attribute " + rname;
            return -1;
        }
        old_tmpl = std::make_unique<Template>(*obj_template);
        obj_template->merge(new_tmpl.get());
    }
    else
    {
        if (keep_restricted && new_tmpl->check_restricted(rname))
        {
            error ="User Template includes a restricted attribute " + rname;
            return -1;
        }
        obj_template = move(new_tmpl);
    }

    if (post_update_template(error) == -1)
    {
        if (old_tmpl)
        {
            obj_template = move(old_tmpl);
        }
        else
        {
            obj_template = nullptr;
        }

        return -1;
    }

    encrypt();

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

    auth.locked = static_cast<int>(locked);

    Clusterable* cl = dynamic_cast<Clusterable*>(this);

    if (cl != 0)
    {
        auth.cids = cl->get_cluster_ids();
    }
    else
    {
        ClusterableSingle* cls = dynamic_cast<ClusterableSingle*>(this);

        if (cls != 0)
        {
            auth.cids.insert(cls->get_cluster_id());
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::set_permissions(int _owner_u,
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::lock_db(const int owner,
                           const int req_id,
                           const int level,
                           const bool is_admin)
{
    if ( level < ST_NONE || level > ST_ADMIN )
    {
        return -1;
    }

    if (locked != ST_NONE && lock_owner != owner && !is_admin)
    {
        // Only admin can override lock
        return -1;
    }

    locked      = static_cast<LockStates>(level);
    lock_time   = time(0);
    lock_owner  = owner;
    lock_req_id = req_id;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::unlock_db(const int owner, const int req_id)
{
    int rc = -1;

    if ( owner == -1 || owner == lock_owner )
    {
        locked      = LockStates::ST_NONE;
        lock_time   = time(0);
        lock_owner  = -1;
        lock_req_id = -1;

        rc = 0;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::lock_db_to_xml(string& xml) const
{
    if (locked == LockStates::ST_NONE)
    {
        xml.clear();
        return xml;
    }

    ostringstream oss;

    oss << "<LOCK>"
        << "<LOCKED>" << static_cast<int>(locked)   << "</LOCKED>"
        << "<OWNER>"  << lock_owner << "</OWNER>"
        << "<TIME>"   << lock_time << "</TIME>"
        << "<REQ_ID>" << lock_req_id << "</REQ_ID>"
        << "</LOCK>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::lock_db_from_xml()
{
    int rc = 0;
    int locked_int;

    vector<xmlNodePtr> content;

    ObjectXML::get_nodes("/*/LOCK/LOCKED", content);

    if ( content.empty() )
    {
        return 0;
    }

    rc += xpath(locked_int,  "/*/LOCK/LOCKED", 0);
    rc += xpath(lock_req_id, "/*/LOCK/REQ_ID", -1);
    rc += xpath(lock_owner,  "/*/LOCK/OWNER", -1);

    xpath<time_t>(lock_time, "/*/LOCK/TIME", time(0));

    locked = static_cast<LockStates>(locked_int);

    ObjectXML::free_nodes(content);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolObjectSQL::encrypt()
{
    std::string one_key;
    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    obj_template->encrypt(one_key);
};

void PoolObjectSQL::decrypt()
{
    std::string one_key;
    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    obj_template->decrypt(one_key);
};

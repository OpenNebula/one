/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include <limits.h>
#include <string.h>
#include <stdlib.h>

#include <iostream>
#include <sstream>
#include <iomanip>

#include "User.h"
#include "Nebula.h"
#include "Group.h"
#include "NebulaUtil.h"

const string User::INVALID_NAME_CHARS = " :\t\n\v\f\r";
const string User::INVALID_PASS_CHARS = " \t\n\v\f\r";

/* ************************************************************************** */
/* User :: Database Access Functions                                          */
/* ************************************************************************** */

const char * User::table = "user_pool";

const char * User::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * User::db_bootstrap = "CREATE TABLE IF NOT EXISTS user_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::select(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::select(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return quota.select(oid, db);
}

/* -------------------------------------------------------------------------- */

int User::select(SqlDB * db, const string& name, int uid)
{
    int rc;

    rc = PoolObjectSQL::select(db,name,uid);

    if ( rc != 0 )
    {
        return rc;
    }

    return quota.select(oid, db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::drop(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 )
    {
        rc += quota.drop(db);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert(SqlDB *db, string& error_str)
{
    int rc;

    rc = insert_replace(db, false, error_str);

    if (rc == 0)
    {
        rc = quota.insert(oid, db, error_str);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_username;
    char * sql_xml;

    // Set itself as the owner
    set_user(oid, name);

    // Update the User

    sql_username = db->escape_str(name.c_str());

    if ( sql_username == 0 )
    {
        goto error_username;
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

    // Construct the SQL statement to Insert or Replace
    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_username    << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          gid             << ","
        <<          owner_u         << ","
        <<          group_u         << ","
        <<          other_u         << ")";


    rc = db->exec(oss);

    db->free_str(sql_username);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_username);
    db->free_str(sql_xml);

    error_str = "Error transforming the User to XML.";

    goto error_common;

error_body:
    db->free_str(sql_username);
    goto error_generic;

error_username:
    goto error_generic;

error_generic:
    error_str = "Error inserting User in DB.";
error_common:
    return -1;
}

/* ************************************************************************** */
/* User :: Misc                                                               */
/* ************************************************************************** */

string& User::to_xml(string& xml) const
{
    return to_xml_extended(xml, false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& User::to_xml_extended(string& xml) const
{
    return to_xml_extended(xml, true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& User::to_xml_extended(string& xml, bool extended) const
{
    ostringstream oss;

    string template_xml;
    string collection_xml;
    string token_xml;

    int  enabled_int = enabled?1:0;

    oss <<
    "<USER>"
         "<ID>"          << oid         <<"</ID>"         <<
         "<GID>"         << gid         <<"</GID>"        <<
         groups.to_xml(collection_xml)  <<
         "<GNAME>"       << gname       <<"</GNAME>"      <<
         "<NAME>"        << name        <<"</NAME>"       <<
         "<PASSWORD>"    <<one_util::escape_xml(password)   <<"</PASSWORD>"   <<
         "<AUTH_DRIVER>" <<one_util::escape_xml(auth_driver)<<"</AUTH_DRIVER>"<<
         "<ENABLED>"     << enabled_int <<"</ENABLED>"    <<
        login_token.to_xml(token_xml) <<
        obj_template->to_xml(template_xml);

    if (extended)
    {
        string quota_xml;
        string def_quota_xml;

        oss << quota.to_xml(quota_xml)
            << Nebula::instance().get_default_user_quota().to_xml(def_quota_xml);
    }

    oss << "</USER>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::from_xml(const string& xml)
{
    int rc = 0;
    int int_enabled;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    rc += xpath(oid,        "/USER/ID",          -1);
    rc += xpath(gid,        "/USER/GID",         -1);
    rc += xpath(gname,      "/USER/GNAME",       "not_found");
    rc += xpath(name,       "/USER/NAME",        "not_found");
    rc += xpath(password,   "/USER/PASSWORD",    "not_found");
    rc += xpath(auth_driver,"/USER/AUTH_DRIVER", UserPool::CORE_AUTH);
    rc += xpath(int_enabled,"/USER/ENABLED",     0);

    enabled = int_enabled;

    // Set itself as the owner
    set_user(oid, name);

    ObjectXML::get_nodes("/USER/LOGIN_TOKEN", content);

    if (!content.empty())
    {
        login_token.from_xml_node(content[0]);
    }

    ObjectXML::free_nodes(content);
    content.clear();

    // Get associated metadata for the user
    ObjectXML::get_nodes("/USER/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    rc += groups.from_xml(this, "/USER/");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::split_secret(const string secret, string& user, string& pass)
{
    size_t pos;
    int    rc = -1;

    pos=secret.find(":");

    if (pos != string::npos)
    {
        user = secret.substr(0,pos);
        pass = secret.substr(pos+1);

        rc = 0;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::set_password(const string& passwd, string& error_str)
{
    int rc = 0;

    if (pass_is_valid(passwd, error_str))
    {
        if (auth_driver == UserPool::CORE_AUTH)
        {
            password = one_util::sha1_digest(passwd);
        }
        else
        {
            password = passwd;
        }

        session.reset();

        login_token.reset();
    }
    else
    {
        rc = -1;
    }

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool User::pass_is_valid(const string& pass, string& error_str)
{
    if ( pass.empty() )
    {
        error_str = "Invalid password, it cannot be empty";
        return false;
    }

    size_t pos = pass.find_first_of(INVALID_PASS_CHARS);

    if ( pos != string::npos )
    {
        ostringstream oss;
        oss << "Invalid password, character '" << pass.at(pos) << "' is not allowed";

        error_str = oss.str();
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::get_umask() const
{
    string umask_st;
    int umask;

    istringstream iss;

    get_template_attribute("UMASK", umask_st);

    if(umask_st.empty())
    {
        Nebula::instance().get_configuration_attribute("DEFAULT_UMASK",umask_st);
    }

    iss.str(umask_st);

    iss >> oct >> umask;

    return (umask & 0777);
}

int User::get_default_umask()
{
    string umask_st;
    int umask;

    istringstream iss;

    Nebula::instance().get_configuration_attribute("DEFAULT_UMASK",umask_st);

    iss.str(umask_st);

    iss >> oct >> umask;

    return (umask & 0777);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

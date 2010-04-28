/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <openssl/evp.h>
#include <iomanip>

#include "User.h"

/* ************************************************************************** */
/* User :: Constructor/Destructor                                  */
/* ************************************************************************** */

User::User(
    int     id,
    string  _username,
    string  _password,
    bool    _enabled):
        PoolObjectSQL(id),
        username     (_username),
        password     (_password),
        enabled      (_enabled)
        {};


User::~User(){};

/* ************************************************************************** */
/* User :: Database Access Functions                                          */
/* ************************************************************************** */

const char * User::table = "user_pool";

const char * User::db_names = "(oid,user_name,password,enabled)";

const char * User::db_bootstrap = "CREATE TABLE user_pool ("
    "oid INTEGER PRIMARY KEY, user_name VARCHAR(256), password TEXT,"
    "enabled INTEGER, UNIQUE(user_name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::select_cb(void *nil, int num, char **values, char **names)
{
    if ((!values[OID]) ||
        (!values[USERNAME]) ||
        (!values[PASSWORD]) ||
        (!values[ENABLED]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid      = atoi(values[OID]);
    username = values[USERNAME];
    password = values[PASSWORD];
    enabled  = (atoi(values[ENABLED])==0)?false:true;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */

int User::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(static_cast<Callbackable::Callback>(&User::select_cb));

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert(SqlDB *db)
{
    int rc;

    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::update(SqlDB *db)
{
    int rc;

    rc = insert_replace(db, true);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;

    char * sql_username;
    char * sql_password;

    int    str_enabled = enabled?1:0;

    // Update the User

    sql_username = db->escape_str(username.c_str());

    if ( sql_username == 0 )
    {
        goto error_username;
    }

    sql_password = db->escape_str(password.c_str());

    if ( sql_password == 0 )
    {
        goto error_password;
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

    oss << " INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << "'" << sql_username << "',"
        << "'" << sql_password << "',"
        << str_enabled << ")";

    rc = db->exec(oss);

    db->free_str(sql_username);
    db->free_str(sql_password);

    return rc;

error_password:
    db->free_str(sql_username);
error_username:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::dump(ostringstream& oss, int num, char **values, char **names)
{
    if ((!values[OID]) ||
        (!values[USERNAME]) ||
        (!values[PASSWORD]) ||
        (!values[ENABLED]) ||
        (num != LIMIT))
    {
        return -1;
    }

    string str_enabled = (atoi(values[ENABLED])==0)?"Fase":"True";

    oss <<
        "<USER>" <<
            "<ID>"      << values[OID]     <<"</ID>"      <<
            "<NAME>"    << values[USERNAME]<<"</NAME>"    <<
            "<PASSWORD>"<< values[PASSWORD]<<"</PASSWORD>"<<
            "<ENABLED>" << str_enabled     <<"</ENABLED>" <<
        "</USER>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::drop(SqlDB * db)
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

/* ************************************************************************** */
/* User :: Misc                                                               */
/* ************************************************************************** */

ostream& operator<<(ostream& os, User& user)
{
    string user_str;

    os << user.to_xml(user_str);

    return os;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& User::to_xml(string& xml) const
{
    ostringstream   oss;

    int  enabled_int = enabled?1:0;

    oss <<
    "<USER>"
         "<ID>"           << oid            <<"</ID>"        <<
         "<NAME>"         << username       <<"</NAME>"      <<
         "<PASSWORD>"     << password       <<"</PASSWORD>"  <<
         "<ENABLED>"      << enabled_int    <<"</ENABLED>"   <<
    "</USER>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& User::to_str(string& str) const
{
    ostringstream   os;

    string enabled_str = enabled?"True":"False";

    os <<
        "ID      = "   << oid      << endl <<
        "NAME = "      << username << endl <<
        "PASSWORD = "  << password << endl <<
        "ENABLED  = "  << enabled_str;

    str = os.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::authenticate(string _password)
{
    if (enabled && _password==password)
    {
        return oid;
    }
    else
    {
        return -1;
    }
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

string User::sha1_digest(const string& pass)
{
    EVP_MD_CTX     mdctx;
    unsigned char  md_value[EVP_MAX_MD_SIZE];
    unsigned int   md_len;
    ostringstream  oss;

    EVP_MD_CTX_init(&mdctx);
    EVP_DigestInit_ex(&mdctx, EVP_sha1(), NULL);

    EVP_DigestUpdate(&mdctx, pass.c_str(), pass.length());

    EVP_DigestFinal_ex(&mdctx,md_value,&md_len);
    EVP_MD_CTX_cleanup(&mdctx);

    for(unsigned int i = 0; i<md_len; i++)
    {
        oss << setfill('0') << setw(2) << hex << nouppercase
            << (unsigned short) md_value[i];
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

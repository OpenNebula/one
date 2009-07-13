/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
	"oid INTEGER,user_name TEXT,password TEXT,"
	"enabled INTEGER, PRIMARY KEY(oid,user_name), UNIQUE(user_name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::unmarshall(int num, char **names, char ** values)
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

extern "C" int user_select_cb (
        void *                  _user,
        int                     num,
        char **                 values,
        char **                 names)
{
    User *    user;

    user = static_cast<User *>(_user);

    if (user == 0)
    {
        return -1;
    }

    return user->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int User::select(SqliteDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;
    
    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, user_select_cb, (void *) this);

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::insert(SqliteDB *db)
{
    int rc;
    
    rc = update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::update(SqliteDB *db)
{
    ostringstream   oss;
    
    int    rc;

    char * sql_username;
    char * sql_password;
    
    int    str_enabled = enabled?1:0;
    
    // Update the User
    
    sql_username = sqlite3_mprintf("%q",username.c_str());

    if ( sql_username == 0 )
    {
        goto error_username;
    }
    
    sql_password = sqlite3_mprintf("%q",password.c_str());

    if ( sql_password == 0 )
    {
        goto error_password;
    }
   
    // Construct the SQL statement to Insert or Replace (effectively, update)

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << "'" << sql_username << "',"
        << "'" << sql_password << "',"
        << str_enabled << ")";

    rc = db->exec(oss);

    sqlite3_free(sql_username);
    sqlite3_free(sql_password);

    return rc;
    
error_password:
    sqlite3_free(sql_username);
error_username:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::unmarshall(ostringstream& oss,
                     int            num,
                     char **        names,
                     char **        values)
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
            "<ID>"           << values[OID]           <<"</ID>"        <<
            "<NAME>"         << values[USERNAME]      <<"</NAME>"      << 
            "<PASSWORD>"     << values[PASSWORD]      <<"</PASSWORD>"  <<
            "<ENABLED>"      << str_enabled           <<"</ENABLED>"   <<
        "</USER>";

    return 0;

}

/* -------------------------------------------------------------------------- */

extern "C" int user_dump_cb (
        void *                  _oss,
        int                     num,
        char **                 values,
        char **                 names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    if (oss == 0)
    {
        return -1;
    }

    return User::unmarshall(*oss,num,names,values);
};

/* -------------------------------------------------------------------------- */

int User::dump(SqliteDB * db, ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    cmd << "SELECT * FROM " << User::table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd,user_dump_cb,(void *) &oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int User::drop(SqliteDB * db)
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
        "ID      = "   << oid            << endl <<
        "NAME = "      << username       << endl <<
        "PASSWORD = "  << password       << endl <<
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

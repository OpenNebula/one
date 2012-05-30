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

/* ************************************************************************** */
/* User Pool                                            	 	      */
/* ************************************************************************** */

#include "UserPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "AuthManager.h"
#include "SSLTools.h"

#include <fstream>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include <pwd.h>
#include <stdlib.h>
#include <fnmatch.h>

const char * UserPool::CORE_AUTH    = "core";
const char * UserPool::SERVER_AUTH  = "server*";
const char * UserPool::PUBLIC_AUTH  = "public";
const char * UserPool::DEFAULT_AUTH = "default";

const char * UserPool::SERVER_NAME  = "serveradmin";

const int   UserPool::ONEADMIN_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t UserPool::_session_expiration_time;

string UserPool::oneadmin_name;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

UserPool::UserPool(SqlDB * db,
                   time_t  __session_expiration_time):
                       PoolSQL(db, User::table, true)
{
    int           one_uid    = -1;
    int           server_uid = -1;
    int           i;

    ostringstream oss;
    string        one_token;
    string        one_name;
    string        one_pass;
    string        one_auth_file;
    string        random;

    const char *  one_auth;
    ifstream      file;

    string        filenames[3];
    string        error_str;
    stringstream  sstr;

    Nebula& nd   = Nebula::instance();

    _session_expiration_time = __session_expiration_time;

    User * oneadmin_user = get(0, true);

    if (oneadmin_user != 0)
    {
        oneadmin_name = oneadmin_user->get_name();
        oneadmin_user->unlock();

        return;
    }

    // User oneadmin needs to be added in the bootstrap
    one_auth = getenv("ONE_AUTH");

    if (!one_auth)
    {
        struct passwd * pw_ent;

        pw_ent = getpwuid(getuid());

        if ((pw_ent != NULL) && (pw_ent->pw_dir != NULL))
        {
            one_auth_file = pw_ent->pw_dir;
            one_auth_file += "/.one/one_auth";

            one_auth = one_auth_file.c_str();
        }
        else
        {
            goto error_no_file;
        }
    }

    file.open(one_auth);

    if (!file.good())
    {
        goto error_file;
    } 

    getline(file,one_token);

    if (file.fail())
    {
        goto error_file_read;
    }

    file.close();

    if (User::split_secret(one_token,one_name,one_pass) != 0)
    {
        goto error_token;
    }

    oneadmin_name = one_name;

    if ( one_name == SERVER_NAME )
    {
        goto error_one_name;
    }

    srand(time(0));
    sstr << rand();

    random = SSLTools::sha1_digest( sstr.str() );

    filenames[0] = nd.get_var_location() + "/.one/sunstone_auth";
    filenames[1] = nd.get_var_location() + "/.one/occi_auth";
    filenames[2] = nd.get_var_location() + "/.one/ec2_auth";

    mkdir(string(nd.get_var_location() + "/.one").c_str(), S_IRWXU);

    for (i=0 ; i < 3; i++)
    {
        int cfile = creat(filenames[i].c_str(), S_IRUSR | S_IWUSR);
        close(cfile);

        ofstream ofile;
        ofile.open(filenames[i].c_str(), ios::out | ios::trunc);

        if ( !ofile.is_open() )
        {
            goto error_no_open;
        }

        ofile << SERVER_NAME << ":" << random << endl;
        ofile.close();
    }

    allocate(&one_uid,
             GroupPool::ONEADMIN_ID,
             one_name,
             GroupPool::ONEADMIN_NAME,
             one_pass,
             UserPool::CORE_AUTH,
             true,
             error_str);

    if ( one_uid != 0 )
    {
        goto error_oneadmin;
    }

    allocate(&server_uid,
             GroupPool::ONEADMIN_ID,
             SERVER_NAME,
             GroupPool::ONEADMIN_NAME,
             SSLTools::sha1_digest(random),
             "server_cipher",
             true,
             error_str);

    if ( server_uid != 1 )
    {
        goto error_serveradmin;
    }

    return;

error_no_file:
    oss << "Could not get one_auth file location";
    goto error_common;

error_file:
    oss << "Could not open file: " << one_auth;
    goto error_common;

error_file_read:
    oss << "Error reading file: " << one_auth;
    goto error_common;

error_token:
    oss << "Wrong format must be <username>:<password>";
    goto error_common;

error_one_name:
    oss << "The name '" << SERVER_NAME << "' is reserved";
    goto error_common;

error_no_open:
    oss << "Could not create configuration file "<< filenames[i];
    goto error_common;

error_oneadmin:
    oss << "Error creating oneadmin user: " << error_str;
    goto error_common;

error_serveradmin:
    oss << "Error creating server_admin user: " << error_str;

error_common:
    NebulaLog::log("ONE",Log::ERROR,oss);
    throw;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::allocate (
    int *   oid,
    int     gid,
    const   string&  uname,
    const   string&  gname,
    const   string&  password,
    const   string&  auth,
    bool    enabled,
    string& error_str)
{
    Nebula&     nd    = Nebula::instance();

    User *      user;
    GroupPool * gpool;
    Group *     group;

    string auth_driver = auth;
    string upass       = password;

    ostringstream   oss;

    // Check username and password
    if ( !User::pass_is_valid(password, error_str) )
    {
        goto error_pass;
    }

    if ( !User::name_is_valid(uname, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    user = get(uname,false);

    if ( user !=0 )
    {
        goto error_duplicated;
    }

    // Set auth driver and hash password for CORE_AUTH
    if (auth_driver.empty())
    {
        auth_driver = UserPool::CORE_AUTH;
    }

    if (auth_driver == UserPool::CORE_AUTH)
    {
        upass = SSLTools::sha1_digest(password);
    }

    // Build a new User object
    user = new User(-1, gid, uname, gname, upass, auth_driver, enabled);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(user, error_str);

    if ( *oid < 0 )
    { 
        return *oid;
    }

    // Adds User to group
    gpool = nd.get_gpool();
    group = gpool->get(gid, true);

    if( group == 0 )
    {
        return -1;
    }

    group->add_user(*oid);

    gpool->update(group);

    group->unlock();

    return *oid;

error_pass:
    oss << error_str << ".";
    goto error_common;

error_name:
    oss << error_str << ".";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by USER " << user->get_oid() << ".";
    goto error_common;

error_common:
    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate_internal(User *        user,
                                     const string& token,
                                     int&          user_id,
                                     int&          group_id,
                                     string&       uname,
                                     string&       gname)
{
    bool result = false;

    ostringstream oss;

    string password;
    string auth_driver;
    string username;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    username = user->name;
    password = user->password;

    user_id  = user->oid;
    group_id = user->gid;

    uname  = user->name;
    gname  = user->gname;

    auth_driver = user->auth_driver;

    result = user->valid_session(token);

    user->unlock();

    if (result)
    {
        return true;
    }

    AuthRequest ar(user_id, group_id);

    if ( auth_driver == UserPool::CORE_AUTH )
    {
        ar.add_authenticate("",username,password,token);

        if (!ar.core_authenticate())
        {
            goto auth_failure;
        }
    }
    else if (auth_driver == UserPool::PUBLIC_AUTH )
    {
        goto auth_failure_public;
    }
    else if ( authm != 0 ) //use auth driver if it was loaded
    {
        //Initialize authentication request and call the driver
        ar.add_authenticate(auth_driver,username,password,token);

        authm->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        if (ar.result!=true) //User was not authenticated
        {
            goto auth_failure_driver;
        }
    }
    else
    {
        goto auth_failure_nodriver;
    }

    user = get(user_id, true);

    if (user != 0)
    {
        user->set_session(token, _session_expiration_time);
        user->unlock();
    }

    return true;

auth_failure_public:
    oss << "User: " << username << " attempted a direct authentication.";
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_driver:
    oss << "Auth Error: " << ar.message;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_nodriver:
    NebulaLog::log("AuM",Log::ERROR,
        "Auth Error: Authentication driver not enabled. "
        "Check AUTH_MAD in oned.conf");

auth_failure:
    user_id  = -1;
    group_id = -1;

    uname = "";
    gname = "";

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate_server(User *        user,
                                   const string& token,
                                   int&          user_id,
                                   int&          group_id,
                                   string&       uname,
                                   string&       gname)
{
    bool result = false;

    ostringstream oss;

    string server_password;
    string auth_driver;
    string server_username;

    string target_username;
    string second_token;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    server_username = user->name;
    server_password = user->password;

    auth_driver = user->auth_driver;

    AuthRequest ar(user->oid, user->gid);

    user->unlock();

    // token = target_username:second_token
    int rc = User::split_secret(token,target_username,second_token);

    if ( rc != 0 )
    {
        goto wrong_server_token;
    }

    user = get(target_username,true);

    if ( user == 0 )
    {
        goto auth_failure_user;
    }

    user_id  = user->oid;
    group_id = user->gid;

    uname  = user->name;
    gname  = user->gname;

    result = user->valid_session(second_token);

    user->unlock();

    if (result)
    {
        return true;
    }

    if ( authm == 0 )
    {
        goto auth_failure_nodriver;
    }

    //Initialize authentication request and call the driver
    ar.add_authenticate(auth_driver,
                        server_username,
                        server_password,
                        second_token);

    authm->trigger(AuthManager::AUTHENTICATE,&ar);
    ar.wait();

    if (ar.result!=true) //User was not authenticated
    {
        goto auth_failure_driver;
    }

    user = get(user_id, true);

    if (user != 0)
    {
        user->set_session(second_token, _session_expiration_time);
        user->unlock();
    }

    return true;

wrong_server_token:
    oss << "Wrong token format";
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_user:
    oss << "User: " << target_username
        << " does not exist. Returned by server auth";
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_driver:
    oss << "Auth Error: " << ar.message;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_nodriver:
    NebulaLog::log("AuM",Log::ERROR,
        "Auth Error: Authentication driver not enabled. "
        "Check AUTH_MAD in oned.conf");

auth_failure:
    user_id  = -1;
    group_id = -1;

    uname = "";
    gname = "";

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
    
bool UserPool::authenticate_external(const string& username,
                                     const string& token,
                                     int&    user_id,
                                     int&    group_id,
                                     string& uname,
                                     string& gname)
{
    ostringstream oss;
    istringstream is;

    string driver_name;
    string mad_name;
    string mad_pass;
    string error_str;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    AuthRequest ar(-1,-1);

    if (authm == 0)
    {
        goto auth_failure_nodriver;
    }

    //Initialize authentication request and call the driver
    ar.add_authenticate(UserPool::DEFAULT_AUTH, username,"-",token);

    authm->trigger(AuthManager::AUTHENTICATE, &ar);
    ar.wait();

    if (ar.result != true) //User was not authenticated
    {   
        goto auth_failure_driver;
    }

    is.str(ar.message);

    user_id = -1;

    if ( is.good() )
    {
        is >> driver_name >> ws;
    }

    if ( !is.fail() )
    {
        is >> mad_name >> ws;
    }

    if ( !is.fail() )
    {
        getline(is, mad_pass);
    }

    if ( !is.fail() )
    {
        allocate(&user_id,
                 GroupPool::USERS_ID,
                 mad_name,
                 GroupPool::USERS_NAME,
                 mad_pass,
                 driver_name,
                 true,
                 error_str);
    }

    if ( user_id == -1 )
    {
        goto auth_failure_user;
    }

    group_id = GroupPool::USERS_ID;

    uname = mad_name;
    gname = GroupPool::USERS_NAME;

    return true;
        
auth_failure_user:
    oss << "Can't create user: " << error_str << ". Driver response: " 
        << ar.message;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_driver:
    oss << "Auth Error: " << ar.message;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_nodriver:
    NebulaLog::log("AuM",Log::ERROR,
        "Auth Error: Authentication driver not enabled. "
        "Check AUTH_MAD in oned.conf");

auth_failure:
    user_id  = -1;
    group_id = -1;

    uname = "";
    gname = "";

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
 
bool UserPool::authenticate(const string& session, 
                            int&          user_id, 
                            int&          group_id,
                            string&       uname,
                            string&       gname)
{
    User * user = 0;
    string username;
    string token;

    int  rc;
    bool ar;

    rc = User::split_secret(session,username,token);

    if ( rc != 0 )
    {
        return false;
    }

    user = get(username,true);

    if (user != 0 ) //User known to OpenNebula
    {
        string driver = user->get_auth_driver();

        if ( fnmatch(UserPool::SERVER_AUTH, driver.c_str(), 0) == 0 )
        {
            ar = authenticate_server(user,token,user_id,group_id,uname,gname);
        }
        else
        {
            ar = authenticate_internal(user,token,user_id,group_id,uname,gname);
        }
    }
    else
    {
        ar = authenticate_external(username,token,user_id,group_id,uname,gname);
    }

   return ar;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::authorize(AuthRequest& ar)
{
    Nebula&       nd    = Nebula::instance();
    AuthManager * authm = nd.get_authm();
    int           rc    = -1;

    if (authm == 0 || !authm->is_authz_enabled())
    {
        if (ar.core_authorize())
        {
            rc = 0;
        }
    }
    else
    {
        authm->trigger(AuthManager::AUTHORIZE,&ar);
        ar.wait();

        if (ar.result==true)
        {
            rc = 0;
        }
        else
        {
            ostringstream oss;
            oss << "Auth Error: " << ar.message;

            NebulaLog::log("AuM",Log::ERROR,oss);
        }
    }

    return rc;
}

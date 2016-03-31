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

/* ************************************************************************** */
/* User Pool                                                                  */
/* ************************************************************************** */

#include "UserPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "AuthManager.h"
#include "NebulaUtil.h"
#include "Client.h"

#include <fstream>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include <stdlib.h>
#include <fnmatch.h>

const char * UserPool::CORE_AUTH    = "core";
const char * UserPool::SERVER_AUTH  = "server*";
const char * UserPool::PUBLIC_AUTH  = "public";

const char * UserPool::SERVER_NAME  = "serveradmin";

const int   UserPool::ONEADMIN_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t UserPool::_session_expiration_time;

string UserPool::oneadmin_name;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

UserPool::UserPool(SqlDB * db,
                   time_t  __session_expiration_time,
                   vector<const VectorAttribute *> hook_mads,
                   const string&             remotes_location,
                   bool                      is_federation_slave):
                       PoolSQL(db, User::table, !is_federation_slave, true)
{
    int           one_uid    = -1;
    int           server_uid = -1;
    int           i;

    ostringstream oss;
    string        one_token;
    string        one_name;
    string        one_pass;
    string        random;

    string        filenames[5];
    string        error_str;

    Nebula& nd   = Nebula::instance();

    _session_expiration_time = __session_expiration_time;

    User * oneadmin_user = get(0, true);

    //Slaves do not need to init the pool, just the oneadmin username
    if (is_federation_slave)
    {
        if (oneadmin_user == 0)
        {
            throw("Database has not been bootstrapped with master data.");
        }

        oneadmin_name = oneadmin_user->get_name();
        oneadmin_user->unlock();

        return;
    }

    if (oneadmin_user != 0)
    {
        oneadmin_name = oneadmin_user->get_name();
        oneadmin_user->unlock();

        register_hooks(hook_mads, remotes_location);

        return;
    }

    // User oneadmin needs to be added in the bootstrap
    if ( Client::read_oneauth(one_token, error_str) != 0 )
    {
        goto error_readoneauth;
    }

    if (User::split_secret(one_token,one_name,one_pass) != 0)
    {
        goto error_token;
    }

    oneadmin_name = one_name;

    if ( one_name == SERVER_NAME )
    {
        goto error_one_name;
    }

    random = one_util::random_password();

    filenames[0] = nd.get_var_location() + "/.one/sunstone_auth";
    filenames[1] = nd.get_var_location() + "/.one/occi_auth";
    filenames[2] = nd.get_var_location() + "/.one/ec2_auth";
    filenames[3] = nd.get_var_location() + "/.one/onegate_auth";
    filenames[4] = nd.get_var_location() + "/.one/oneflow_auth";

    mkdir(string(nd.get_var_location() + "/.one").c_str(), S_IRWXU);

    for (i=0 ; i < 5; i++)
    {
        struct stat file_stat;

        if ( stat(filenames[i].c_str(), &file_stat) == 0 )
        {
            goto erro_exists;
        }

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
             one_util::sha1_digest(random),
             "server_cipher",
             true,
             error_str);

    if ( server_uid != 1 )
    {
        goto error_serveradmin;
    }

    register_hooks(hook_mads, remotes_location);

    return;

error_readoneauth:
    oss << "Error reading one_auth: " << error_str;
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

erro_exists:
    oss << "Password file " << filenames[i] << " already exists "
        << "but OpenNebula is boostraping the database. Check your "
        << "database configuration in oned.conf.";
    goto error_common;

error_oneadmin:
    oss << "Error creating oneadmin user: " << error_str;
    goto error_common;

error_serveradmin:
    oss << "Error creating server_admin user: " << error_str;

error_common:
    NebulaLog::log("ONE",Log::ERROR,oss);
    throw runtime_error(oss.str());
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

    if (nd.is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "UserPool::allocate called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    // Check username and password
    if ( !User::pass_is_valid(password, error_str) )
    {
        goto error_pass;
    }

    if (!PoolObjectSQL::name_is_valid(uname,User::INVALID_NAME_CHARS,error_str))
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
        upass = one_util::sha1_digest(password);
    }

    // Build a new User object
    user = new User(-1, gid, uname, gname, upass, auth_driver, enabled);

    // Add the primary group to the collection
    user->groups.add(gid);

    // Set a password for the OneGate tokens
    user->add_template_attribute("TOKEN_PASSWORD", one_util::random_password());

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

int UserPool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "UserPool::drop called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "UserPool::update called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::update_quotas(User * user)
{
    return user->update_quotas(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate_internal(User *        user,
                                     const string& token,
                                     string&       password,
                                     int&          user_id,
                                     int&          group_id,
                                     string&       uname,
                                     string&       gname,
                                     set<int>&     group_ids,
                                     int&          umask)
{
    bool result = false;

    ostringstream oss;

    string auth_driver;
    string username;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    username = user->name;
    password = user->password;

    user_id  = user->oid;
    group_id = user->gid;

    group_ids = user->get_groups();

    uname = user->name;
    gname = user->gname;

    auth_driver = user->auth_driver;

    //Check if token is a login token
    result = user->login_token.is_valid(token);

    if (!result) //Not a login token check if the token is a session token
    {
        result = user->session.is_valid(token);
    }

    umask = user->get_umask();

    user->unlock();

    if (result) //Good either a valid session or login_token
    {
        return true;
    }

    AuthRequest ar(user_id, group_ids);

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
        user->session.set(token, _session_expiration_time);
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

    password = "";

    group_ids.clear();

    uname = "";
    gname = "";

    umask = 0;

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate_server(User *        user,
                                   const string& token,
                                   string&       password,
                                   int&          user_id,
                                   int&          group_id,
                                   string&       uname,
                                   string&       gname,
                                   set<int>&     group_ids,
                                   int&          umask)
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

    AuthRequest ar(user->oid, user->get_groups());

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

    password = user->get_password();

    user_id  = user->oid;
    group_id = user->gid;

    group_ids = user->get_groups();

    uname  = user->name;
    gname  = user->gname;

    result = user->session.is_valid(second_token);

    umask = user->get_umask();

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
        user->session.set(second_token, _session_expiration_time);
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

    password = "";

    group_ids.clear();

    uname = "";
    gname = "";

    umask = 0;

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate_external(const string&  username,
                                     const string&  token,
                                     string&        password,
                                     int&           user_id,
                                     int&           group_id,
                                     string&        uname,
                                     string&        gname,
                                     set<int>&      group_ids,
                                     int&           umask)
{
    ostringstream oss;
    istringstream is;

    string driver_name;
    string mad_name;
    string mad_pass;
    string error_str;
    string tmp_str;
    string default_auth;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();
    GroupPool *   gpool = nd.get_gpool();

    User*   user;
    Group*  group;

    int     gid = -1;

    set<int>::iterator it;
    set<int> empty_set;

    AuthRequest ar(-1,empty_set);

    if (authm == 0)
    {
        goto auth_failure_nodriver;
    }

    //Initialize authentication request and call the driver
    nd.get_configuration_attribute("DEFAULT_AUTH",default_auth);

    ar.add_authenticate(default_auth, username,"-",token);

    authm->trigger(AuthManager::AUTHENTICATE, &ar);
    ar.wait();

    if (ar.result != true) //User was not authenticated
    {
        goto auth_failure_driver;
    }

    is.str(ar.message);

    user_id = -1;

    //--------------------------------------------------------------------------
    // Parse driver response format is:
    // <driver> <username> <passwd> [gid...]
    //--------------------------------------------------------------------------

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
        is >> mad_pass >> ws;
    }

    while ( is.good() )
    {
        int tmp_gid;

        is >> tmp_gid >> ws;

        if ( is.fail() )
        {
            error_str = "One or more group IDs are malformed";
            goto auth_failure_user;
        }

        if ( gpool->get(tmp_gid, false) == 0 )
        {
            error_str = "One or more group IDs do not exist";
            goto auth_failure_user;
        }

        if ( gid == -1 ) //Keep the first id for primary group
        {
            gid = tmp_gid;
        }

        group_ids.insert(tmp_gid);
    }

    //--------------------------------------------------------------------------
    // Create the user, and set primary group
    //--------------------------------------------------------------------------

    if ( gid == -1 )
    {
        group_id = GroupPool::USERS_ID;
        gname    = GroupPool::USERS_NAME;

        group_ids.insert( group_id );
    }
    else
    {
        group_id = gid;

        group = gpool->get(group_id, true);

        if( group == 0 )
        {
            error_str = "Primary Group no longer exist";
            goto auth_failure_user;
        }

        gname = group->get_name();

        group->unlock();
    }

    if ( !is.fail() )
    {
        allocate(&user_id,
                 group_id,
                 mad_name,
                 gname,
                 mad_pass,
                 driver_name,
                 true,
                 error_str);
    }

    if ( user_id == -1 )
    {
        goto auth_failure_user;
    }

    //--------------------------------------------------------------------------
    // Add the user to the secondary groups
    //--------------------------------------------------------------------------

    user = get(user_id,true);

    if ( user == 0 )
    {
        error_str = "User object could not be retrieved";
        goto auth_failure_user;
    }

    for(it = ++group_ids.begin(); it != group_ids.end(); it++)
    {
        group = gpool->get(*it, true);

        if( group == 0 ) //Secondary group no longer exists
        {
            continue;
        }

        group->add_user(user_id);

        gpool->update(group);

        group->unlock();

        user->add_group(*it);
    }

    update(user);

    user->unlock();

    uname = mad_name;

    password = mad_pass;

    umask = User::get_default_umask();

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

    password = "";

    group_ids.clear();

    uname = "";
    gname = "";

    umask = 0;

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate(const string& session,
                            string&       password,
                            int&          user_id,
                            int&          group_id,
                            string&       uname,
                            string&       gname,
                            set<int>&     group_ids,
                            int&          umask)
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
            ar = authenticate_server(user, token, password, user_id, group_id,
                uname, gname, group_ids, umask);
        }
        else
        {
            ar = authenticate_internal(user, token, password, user_id, group_id,
                uname, gname, group_ids, umask);
        }
    }
    else
    {
        ar = authenticate_external(username, token, password, user_id, group_id,
            uname, gname, group_ids, umask);
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::dump(ostringstream& oss, const string& where, const string& limit)
{
    int     rc;
    string  def_quota_xml;

    ostringstream cmd;

    cmd << "SELECT " << User::table << ".body, "
        << UserQuotas::db_table << ".body"<< " FROM " << User::table
        << " LEFT JOIN " << UserQuotas::db_table << " ON "
        << User::table << ".oid=" << UserQuotas::db_table << ".user_oid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

    if ( !limit.empty() )
    {
        cmd << " LIMIT " << limit;
    }

    oss << "<USER_POOL>";

    set_callback(static_cast<Callbackable::Callback>(&UserPool::dump_cb),
                 static_cast<void *>(&oss));

    rc = db->exec(cmd, this);

    unset_callback();

    oss << Nebula::instance().get_default_user_quota().to_xml(def_quota_xml);

    oss << "</USER_POOL>";

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::dump_cb(void * _oss, int num, char **values, char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    if ( (!values[0]) || (num != 2) )
    {
        return -1;
    }

    *oss << values[0];

    if (values[1] != NULL)
    {
        *oss << values[1];
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

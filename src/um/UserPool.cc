/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

UserPool::UserPool(SqlDB * db, time_t __session_expiration_time, bool is_slave,
        vector<const SingleAttribute *>& restricted_attrs):PoolSQL(db, User::table)
{
    int one_uid    = -1;
    int server_uid = -1;
    int i;

    ostringstream oss;

    string one_token;
    string one_name;
    string one_pass;
    string random;

    set<int> gids;
    set<int> agids;

    string        filenames[5];
    string        error_str;

    Nebula& nd   = Nebula::instance();

    _session_expiration_time = __session_expiration_time;

    // Set restricted attributes
    UserTemplate::parse_restricted(restricted_attrs);

    User * oneadmin_user = get_ro(0);

    //Slaves do not need to init the pool, just the oneadmin username
    if (is_slave)
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

    gids.insert(GroupPool::ONEADMIN_ID);

    allocate(&one_uid,
             one_name,
             GroupPool::ONEADMIN_ID,
             one_pass,
             UserPool::CORE_AUTH,
             true,
             gids,
             agids,
             error_str);

    if ( one_uid != 0 )
    {
        goto error_oneadmin;
    }

    allocate(&server_uid,
             SERVER_NAME,
             GroupPool::ONEADMIN_ID,
             one_util::sha256_digest(random),
             "server_cipher",
             true,
             gids,
             agids,
             error_str);

    if ( server_uid != 1 )
    {
        goto error_serveradmin;
    }

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

static int master_allocate(const string& uname, const string& passwd,
        const string& driver, const set<int>& gids, string& error_str)
{
    Client * client = Client::client();

    xmlrpc_c::value         result;
    vector<xmlrpc_c::value> values;

    std::ostringstream oss("Cannot allocate user at federation master: ",
            std::ios::ate);
    try
    {
        client->call("one.user.allocate", "sssI", &result, uname.c_str(),
                passwd.c_str(), driver.c_str(), &gids);
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( xmlrpc_c::value_boolean(values[0]) == false )
    {
        std::string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error_str = oss.str();

        return -1;
    }

    int oid = xmlrpc_c::value_int(values[1]);

    return oid;
}

/* -------------------------------------------------------------------------- */

static int master_chgrp(int user_id, int group_id, string& error_str)
{
    Client * client = Client::client();

    xmlrpc_c::value         result;
    vector<xmlrpc_c::value> values;

    std::ostringstream oss("Cannot change user group at federation master: ",
            std::ios::ate);
    try
    {
        client->call("one.user.chgrp", "ii", &result, user_id, group_id);
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( xmlrpc_c::value_boolean(values[0]) == false )
    {
        std::string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error_str = oss.str();

        return -1;
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int UserPool::allocate(
    int * oid,
    const string& uname,
    int   gid,
    const string& password,
    const string& auth,
    bool  enabled,
    const set<int>& gids,
    const set<int>& agids,
    string& error_str)
{
    Nebula& nd = Nebula::instance();

    int db_oid;

    User *      user;
    GroupPool * gpool = nd.get_gpool();

    string auth_driver = auth;
    string upass       = password;

    string gname;

    ostringstream   oss;

    if (nd.is_federation_slave())
    {
        *oid = master_allocate(uname, password, auth, gids, error_str);

        if ( *oid < 0 )
        {
            NebulaLog::log("ONE", Log::ERROR, error_str);
            return -1;
        }

        if ( master_chgrp(*oid, gid, error_str) == -1 )
        {
            NebulaLog::log("ONE", Log::ERROR, error_str);
        }

        return *oid;
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
    db_oid = exist(uname);

    if ( db_oid != -1 )
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
        upass = one_util::sha256_digest(password);
    }

    if (gids.empty())
    {
        goto error_no_groups;
    }

    gname = gpool->get_name(gid);

    if(gname.empty())
    {
        goto error_no_groups;
    }

    // Build a new User object
    user = new User(-1, gid, uname, gname, upass, auth_driver, enabled);

    // Add the primary and secondary groups to the collection
    for(set<int>::const_iterator it = gids.begin(); it != gids.end(); it++)
    {
        user->add_group(*it);
    }

    // Set a password for the OneGate tokens
    user->add_template_attribute("TOKEN_PASSWORD", one_util::random_password());

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(user, error_str);

    if ( *oid < 0 )
    {
        return *oid;
    }

    // Add the user to the main and secondary groups
    for(set<int>::const_iterator it = gids.begin(); it != gids.end(); it++)
    {
        Group * group = gpool->get(*it);

        if( group == 0 ) //Secondary group no longer exists
        {
            goto error_group;
        }

        group->add_user(*oid);

        gpool->update(group);

        group->unlock();
    }

    // Set the user group admin
    for(set<int>::const_iterator it = agids.begin(); it != agids.end(); it++)
    {
        Group * group = gpool->get(*it);

        if( group == 0 ) //Secondary group no longer exists
        {
            goto error_group;
        }

        group->add_admin(*oid, error_str);

        gpool->update(group);

        group->unlock();
    }

    return *oid;

error_pass:
    oss << error_str << ".";
    goto error_common;

error_name:
    oss << error_str << ".";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by USER " << db_oid << ".";
    goto error_common;

error_no_groups:
    oss << "The array of groups needs to have at least a valid Group ID.";
    goto error_common;

error_group:
    user = get(*oid);

    if ( user != 0 )
    {
        string aux_str;

        drop(user, aux_str);

        user->unlock();
    }

    // Remove from all the groups, just in case the user id was added to a any
    // of them before a non-existing group was found
    for(set<int>::const_iterator it = gids.begin(); it != gids.end(); it++)
    {
        Group * group = gpool->get(*it);

        if( group == 0 ) //Secondary group no longer exists
        {
            continue;
        }

        group->del_user(*oid);

        gpool->update(group);

        group->unlock();
    }

    oss << "One or more of the groups "
        << one_util::join(gids.begin(), gids.end(), ',') << " do not exist.";
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

    int oid = (static_cast<User *>(objsql))->oid;
    int rc  = PoolSQL::drop(objsql, error_msg);

    if ( rc == 0 )
    {
        delete_session_token(oid);
    }

    return rc;
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

static int parse_auth_msg(
    AuthRequest &ar,
    int         &gid,
    set<int>    &group_ids,
    set<int>    &group_admin_ids,
    string      &driver_name,
    string      &mad_name,
    string      &mad_pass,
    string      &error_str)
{
    istringstream is;

    //--------------------------------------------------------------------------
    // Parse driver response format is:
    // <driver> <username> <passwd> [gid...]
    //--------------------------------------------------------------------------
    is.str(ar.message);

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
        int  tmp_gid;
        bool gr_admin = false;

        char c = is.peek();

        if ( c == '*' )
        {
            is.get(c);
            gr_admin = true;
        }

        is >> tmp_gid >> ws;

        if ( is.fail() )
        {
            error_str = "One or more group IDs are malformed";
            return -1;
        }

        if ( Nebula::instance().get_gpool()->exist(tmp_gid) == -1 )
        {
            error_str = "One or more group IDs do not exist";
            return -1;
        }

        if ( gid == -1 ) //Keep the first id for primary group
        {
            gid = tmp_gid;
        }

        group_ids.insert(tmp_gid);

        if ( gr_admin )
        {
            group_admin_ids.insert(tmp_gid);
        }
    }

    return 0;
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
    ostringstream oss;

    string auth_driver;
    string username;
    string error_str;

    bool driver_managed_groups = false;

    int egid    = -1;
    int new_gid = -1;
    string new_gname;

    set<int> new_group_ids;
    set<int> group_admin_ids;
    set<int> new_group_admin_ids;

    set<int> groups_remove;
    set<int> groups_add;
    set<int> groups_same;
    set<int>::iterator it;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    Group* group;
    GroupPool* gpool = nd.get_gpool();

    // -------------------------------------------------------------------------
    // Initialize authentication variables
    // -------------------------------------------------------------------------
    username = user->name;
    password = user->password;

    user_id  = user->oid;
    group_id = user->gid;

    group_ids = user->get_groups();

    uname = user->name;
    gname = user->gname;

    umask = user->get_umask();

    auth_driver = user->auth_driver;

    if (nd.get_auth_conf_attribute(auth_driver, "DRIVER_MANAGED_GROUPS",
            driver_managed_groups) != 0)
    {
        driver_managed_groups = false;
    }

    AuthRequest ar(user_id, group_ids);

    // -------------------------------------------------------------------------
    // Update SHA1 to SHA256
    // -------------------------------------------------------------------------
    if (password == one_util::sha1_digest(token))
    {
        int rc = user->set_password(token, error_str);

        if ( rc == 0 )
        {
            update(user);
        }
    }

    // -------------------------------------------------------------------------
    // Check if token is a login or session token, and set EGID if needed
    // -------------------------------------------------------------------------
    bool exists_token = false;

    if ( user->login_tokens.is_valid(token, egid, exists_token) )
    {
        if ( egid != -1 && !user->is_in_group(egid) )
        {
            user->login_tokens.reset(token);

            update(user);

            user->unlock();

            goto auth_failure_egid;
        }

        user->unlock();

        if ( egid != -1 )
        {
            group_id = egid;
            gname    = gpool->get_name(egid);

            group_ids.clear();
            group_ids.insert(egid);
        }

        return true;
    }
    else if (user->session->is_valid(token))
    {
        user->unlock();
        return true;
    }
    else if ( exists_token )
    {
        user->unlock();
        goto auth_failure_token;
    }

    user->unlock();

    // -------------------------------------------------------------------------
    // Not a valid token, perform authentication
    // -------------------------------------------------------------------------
    if ( auth_driver == UserPool::CORE_AUTH )
    {
        ar.add_authenticate("",username,password,token);

        if ( !ar.core_authenticate() )
        {
            goto auth_failure;
        }
    }
    else if (auth_driver == UserPool::PUBLIC_AUTH )
    {
        goto auth_failure_public;
    }
    else if ( authm != 0 )
    {
        ar.add_authenticate(auth_driver,username,password,token);

        authm->trigger(AMAction::AUTHENTICATE,&ar);

        ar.wait();

        if ( ar.result != true )
        {
            goto auth_failure_driver;
        }

        if ( driver_managed_groups ) // Parse driver response
        {
            string str;

            if ( parse_auth_msg(ar, new_gid, new_group_ids, new_group_admin_ids,
                        str, str, str, error_str) != 0 )
            {
                goto auth_failure_parse;
            };

            new_gname = gpool->get_name(new_gid);
        }
    }
    else
    {
        goto auth_failure_nodriver;
    }

    //--------------------------------------------------------------------------
    //  Cache session token
    //--------------------------------------------------------------------------
    user = get(user_id);

    if ( user == 0 )
    {
        return false;
    }

    user->session->set(token, _session_expiration_time);

    // Search and store previous groups where user was admin
    for(it = group_ids.begin(); it != group_ids.end(); it++)
    {
        group = gpool->get_ro(*it);
        if( group == 0 ) // group no longer exists
        {
            continue;
        }

        if ( group->is_admin(user_id) )
        {
            group_admin_ids.insert(*it);
        }

        group->unlock();
    }

    if ( !driver_managed_groups || new_gid == -1 ||
            ( new_group_ids == group_ids
              && group_admin_ids == new_group_admin_ids ) )
    {
        user->unlock();
        return true;
    }

    //--------------------------------------------------------------------------
    //  Update user groups with driver response & primary group if needed
    //--------------------------------------------------------------------------
    //Primary group disappears from the list of new groups
    if ( new_group_ids.count(group_id) == 0 && !new_gname.empty() )
    {
        group_id = new_gid;
        gname    = new_gname;

        user->set_group(group_id, gname);
    }

    // Previous groups that were not returned this time
    std::set_difference(group_ids.begin(), group_ids.end(),
            new_group_ids.begin(), new_group_ids.end(),
            std::inserter(groups_remove, groups_remove.end()));

    // New groups
    std::set_difference(new_group_ids.begin(), new_group_ids.end(),
            group_ids.begin(), group_ids.end(),
            std::inserter(groups_add, groups_add.end()));

    // Same groups
    std::set_intersection(group_ids.begin(), group_ids.end(),
            new_group_ids.begin(), new_group_ids.end(),
            std::inserter(groups_same, groups_same.end()));

    for(it = groups_add.begin(); it != groups_add.end(); it++)
    {
        if ( gpool->exist(*it) != -1 )
        {
            user->add_group(*it);
        }
    }

    for(it = groups_remove.begin(); it != groups_remove.end(); it++)
    {
        user->del_group(*it);
    }

    group_ids = user->get_groups();

    update(user);

    user->unlock();

    // -------------------------------------------------------------------------
    // Add/remove user ID from the group objects
    // -------------------------------------------------------------------------
    for(it = groups_add.begin(); it != groups_add.end(); it++)
    {
        group = gpool->get(*it);

        if (group == 0)
        {
            continue;
        }

        group->add_user(*it);

        if ( new_group_admin_ids.find(*it) != new_group_admin_ids.end() )
        {
            group->add_admin(*it, error_str);
        }

        group->add_user(user_id);

        gpool->update(group);

        group->unlock();
    }

    for(it = groups_remove.begin(); it != groups_remove.end(); it++)
    {
        group = gpool->get(*it);

        if (group == 0)
        {
            continue;
        }

        group->del_user(user_id);

        gpool->update(group);

        group->unlock();
    }

    // -------------------------------------------------------------------------
    // For groups which user remained member also check if the admin status
    // did not changed
    // -------------------------------------------------------------------------
    for(it = groups_same.begin(); it != groups_same.end(); it++)
    {
        // user was admin before but is not now
        if ( group_admin_ids.find(*it) != group_admin_ids.end()
             && new_group_admin_ids.find(*it) == new_group_admin_ids.end() )
        {
            group = gpool->get(*it);

            group->del_admin(user_id, error_str);

            gpool->update(group);

            group->unlock();
        }

        // user was not admin before but is now
        if ( group_admin_ids.find(*it) == group_admin_ids.end()
             && new_group_admin_ids.find(*it) != new_group_admin_ids.end() )
        {
            group = gpool->get(*it);

            group->add_admin(user_id, error_str);

            gpool->update(group);

            group->unlock();
        }
    }

    return true;

auth_failure_egid:
    oss << "Token sets an EGID no longer part of user group list";
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_parse:
    oss << "An error ocurred parsing the driver message: " << error_str;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_public:
    oss << "User: " << username << " attempted a direct authentication.";
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_driver:
    oss << "Auth Error: " << ar.message;
    NebulaLog::log("AuM",Log::ERROR,oss);

    goto auth_failure;

auth_failure_token:
    NebulaLog::log("AuM", Log::ERROR, "Token has expired.");
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
    string egid;

    istringstream iss;

    int egid_i = -1;

    Nebula& nd         = Nebula::instance();
    AuthManager* authm = nd.get_authm();
    GroupPool* gpool   = nd.get_gpool();

    server_username = user->name;
    server_password = user->password;

    auth_driver = user->auth_driver;

    AuthRequest ar(user->oid, user->get_groups());

    user->unlock();

    // token = target_username:second_token
    int rc = User::split_secret(token, target_username, second_token);

    if ( rc != 0 )
    {
        goto wrong_server_token;
    }

    // Look for a EGID in the user token. The second token can be:
    // second_token = egid:server_admin_auth
    // second_token = server_admin_auth
    rc = User::split_secret(second_token, egid, second_token);

    if ( rc == -1 ) //No EGID found
    {
        egid_i = -1;
    }
    else
    {
        iss.str(egid);

        iss >> egid_i;

        if (iss.fail() || !iss.eof())
        {
            goto wrong_server_token;
        }
    }

    user = get_ro(target_username);

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

    result = user->session->is_valid(second_token);

    umask  = user->get_umask();

    user->unlock();

    //server_admin token set a EGID, update auth info
    if ( egid_i != - 1 )
    {
        group_id = egid_i;
        gname    = gpool->get_name(egid_i);

        group_ids.clear();
        group_ids.insert(egid_i);
    }

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

    authm->trigger(AMAction::AUTHENTICATE,&ar);
    ar.wait();

    if (ar.result!=true) //User was not authenticated
    {
        goto auth_failure_driver;
    }

    user = get(user_id);

    if (user != 0)
    {
        user->session->set(second_token, _session_expiration_time);
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

    string driver_name;
    string mad_name;
    string mad_pass;
    string error_str;
    string tmp_str;
    string default_auth;

    Nebula& nd = Nebula::instance();

    AuthManager * authm = nd.get_authm();
    GroupPool *   gpool = nd.get_gpool();

    int gid = -1;
    int rc;

    set<int>::iterator it;
    set<int> empty_set;
    set<int> group_admin_ids;

    AuthRequest ar(-1,empty_set);

    if (authm == 0)
    {
        goto auth_failure_nodriver;
    }

    //Initialize authentication request and call the driver
    nd.get_configuration_attribute("DEFAULT_AUTH",default_auth);

    ar.add_authenticate(default_auth, username,"-",token);

    authm->trigger(AMAction::AUTHENTICATE, &ar);
    ar.wait();

    if (ar.result != true) //User was not authenticated
    {
        goto auth_failure_driver;
    }

    user_id = -1;

    //--------------------------------------------------------------------------
    // Parse driver response
    //--------------------------------------------------------------------------
    rc = parse_auth_msg(ar, gid, group_ids, group_admin_ids,
            driver_name, mad_name, mad_pass, error_str);

    if (rc != 0)
    {
        goto auth_failure_user;
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
        gname    = gpool->get_name(group_id);

        if(gname.empty())
        {
            error_str = "Primary Group no longer exist";
            goto auth_failure_user;
        }
    }

    allocate(&user_id,
             mad_name,
             group_id,
             mad_pass,
             driver_name,
             true,
             group_ids,
             group_admin_ids,
             error_str);

    if ( user_id == -1 )
    {
        goto auth_failure_user;
    }

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

    user = get(username);

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
        authm->trigger(AMAction::AUTHORIZE,&ar);
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

int UserPool::dump(string& oss, const string& where, int sid, int eid, bool desc)
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

    if ( desc == true )
    {
        cmd << " DESC";
    }

    if ( eid != -1 )
    {
        cmd << " " << db->limit_string(sid, eid);
    }

    oss.append("<USER_POOL>");

    string_cb cb(2);

    cb.set_callback(&oss);

    rc = db->exec_rd(cmd, &cb);

    cb.unset_callback();

    oss.append(Nebula::instance().get_default_user_quota().to_xml(def_quota_xml));

    oss.append("</USER_POOL>");

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string UserPool::get_token_password(int oid, int bck_oid){

    string token_password = "";
    User * user = get_ro(oid);

    if (user != 0)
    {
        user->get_template_attribute("TOKEN_PASSWORD", token_password);
        user->unlock();
    }
    else
    {
        user = get_ro(bck_oid);

        if (user != 0)
        {
            user->get_template_attribute("TOKEN_PASSWORD", token_password);
            user->unlock();
        }
    }
    return token_password;
}

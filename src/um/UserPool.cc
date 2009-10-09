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

/* ************************************************************************** */
/* User Pool                                            	 	      */
/* ************************************************************************** */

#include "UserPool.h"
#include "Nebula.h"

#include <fstream>
#include <sys/types.h>
#include <pwd.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C"
{
    static int getuids_cb(
        void *                  _known_users,
        int                     num,
        char **                 values,
        char **                 names)
    {
        map<string, int> *   known_users;
    
        known_users = static_cast<map<string, int> *>(_known_users);
    
        if ( num == 0 || values == 0 || values[0] == 0 )
        {
            return -1;
        }
    
        known_users->insert(make_pair(values[1],atoi(values[0])));
    
        return 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

UserPool::UserPool(SqliteDB * db):PoolSQL(db,User::table)
{
    // The known_users table needs to be rebuilt
    
    ostringstream   sql;
    
    sql  << "SELECT oid,user_name FROM " <<  User::table;
         
    db->exec(sql, getuids_cb, (void *) &known_users);     
    
    if ((int) known_users.size() == 0)   
    {
        // User oneadmin needs to be added in the bootstrap
        int           one_uid = -1;
        ostringstream oss;
        string        one_token;
        string        one_name;
        string        one_pass;
            
        const char *  one_auth;
        ifstream      file;

        one_auth = getenv("ONE_AUTH");

        if (!one_auth)
        {
            struct passwd * pw_ent;
        
            pw_ent = getpwuid(getuid());

            if ((pw_ent != NULL) && (pw_ent->pw_dir != NULL))
            {                                                       
                string one_auth_file = pw_ent->pw_dir;
            
                one_auth_file += "/.one/one_auth";
                one_auth = one_auth_file.c_str();
            }   
            else
            {
                oss << "Could not get one_auth file location";
            }
        }
   
        file.open(one_auth);

        if (file.good())
        {
            getline(file,one_token);

            if (file.fail())
            {
                oss << "Error reading file: " << one_auth;
            }
            else
            {
                if (User::split_secret(one_token,one_name,one_pass) == 0)
                {
                    string sha1_pass = User::sha1_digest(one_pass);
                    allocate(&one_uid, one_name, sha1_pass, true);
                }
                else
                {
                    oss << "Wrong format must be <username>:<password>";
                }
            }
        }
        else
        {
            oss << "Cloud not open file: " << one_auth;
        }

        file.close();
        
        if (one_uid != 0)
        {
            Nebula::log("ONE",Log::ERROR,oss);
            throw;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::allocate (
    int *  oid,
    string username,
    string password,
    bool   enabled)
{
    User *        user;

    // Build a new User object

    user = new User(-1,
        username,
        password,
        enabled);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(user);
    
    // Add the user to the map of known_users
    known_users.insert(make_pair(username,*oid));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::authenticate(string& session)
{
    map<string, int>::iterator index;
    
    string username;
    string password;
    
    int   user_id = -1; 
    
    // session holds username:password

    if ( User::split_secret(session,username,password) == 0 )
    {
        index = known_users.find(username);

        if ( index != known_users.end() )
        {
            User * user = get((int)index->second,false);
            user_id     = user->authenticate(password);
        }
    }
    
    return user_id;
}

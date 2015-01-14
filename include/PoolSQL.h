/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef POOL_SQL_H_
#define POOL_SQL_H_

#include <map>
#include <string>
#include <queue>
#include <set>

#include "SqlDB.h"
#include "PoolObjectSQL.h"
#include "Log.h"
#include "Hook.h"

using namespace std;

/**
 * PoolSQL class. Provides a base class to implement persistent generic pools.
 * The PoolSQL provides a synchronization mechanism (mutex) to operate in
 * multithreaded applications. Any modification or access function to the pool
 * SHOULD block the mutex.
 */
class PoolSQL: public Callbackable, public Hookable
{
public:
    /**
     * Initializes the oid counter. This function sets lastOID to
     * the last used Object identifier by querying the corresponding database
     * table. This function SHOULD be called before any pool related function.
     *   @param _db a pointer to the database
     *   @param _table the name of the table supporting the pool (to set the oid
     *   counter). If null the OID counter is not updated.
     *   @param cache True to enable the cache
     *   @param cache_by_name True if the objects can be retrieved by name
     */
    PoolSQL(SqlDB * _db, const char * _table, bool cache, bool cache_by_name);

    virtual ~PoolSQL();

    /**
     *  Allocates a new object, writting it in the pool database. No memory is
     *  allocated for the object.
     *   @param objsql an initialized ObjectSQL
     *   @return the oid assigned to the object or -1 in case of failure
     */
    virtual int allocate(
        PoolObjectSQL   *objsql,
        string&          error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param oid the object unique identifier
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get(int oid, bool lock);

    /**
     * Updates the cache name index. Must be called when the owner of an object
     * is changed
     *
     * @param old_name Object's name before the change
     * @param old_uid Object's owner ID before the change
     * @param new_name Object's name after the change
     * @param new_uid Object's owner ID after the change
     */
    void update_cache_index(string& old_name,
                            int     old_uid,
                            string& new_name,
                            int     new_uid);

    /**
     *  Finds a set objects that satisfies a given condition
     *   @param oids a vector with the oids of the objects.
     *   @param the name of the DB table.
     *   @param where condition in SQL format.
     *
     *   @return 0 on success
     */
    virtual int search(
        vector<int>&    oids,
        const char *    table,
        const string&   where);

    /**
     *  List the objects in the pool
     *   @param oids a vector with the oids of the objects.
     *   @param table the name of the DB table.
     *
     *   @return 0 on success
     */
    int list(
        vector<int>&    oids,
        const char *    table)
    {
        return search(oids, table, "");
    }

    /**
     *  Updates the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *
     *    @return 0 on success.
     */
    virtual int update(
        PoolObjectSQL * objsql)
    {
        int rc;

        rc = objsql->update(db);

        if ( rc == 0 )
        {
            do_hooks(objsql, Hook::UPDATE);
        }

        return rc;
    };

    /**
     *  Drops the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     */
    virtual int drop(PoolObjectSQL * objsql, string& error_msg)
    {
        int rc = objsql->drop(db);

        if ( rc != 0 )
        {
            error_msg = "SQL DB error";
            return -1;
        }
        else
        {
            do_hooks(objsql, Hook::REMOVE);
        }

        return 0;
    };

    /**
     *  Removes all the elements from the pool
     */
    void clean();

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return dump(oss, where, "");
    }

    /**
     *  Dumps the pool in XML format. A filter and limit can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */

    virtual int dump(ostringstream& oss, const string& where,
                     const string& limit) = 0;

    // -------------------------------------------------------------------------
    // Function to generate dump filters
    // -------------------------------------------------------------------------

    /**
     *  Creates a filter for those objects (oids) or objects owned by a given
     *  group that an user can access based on the ACL rules
     *    @param uid the user id
     *    @param user_groups Set of group IDs that the user is part of
     *    @param auth_object object type
     *    @param all returns if the user can access all objects
     *    @param disable_all_acl e.g. NET\*
     *    @param disable_cluster_acl e.g. NET/%100
     *    @param disable_group_acl e.g. NET/@102
     *    @param filter the resulting filter string
     *
     */
    static void acl_filter(int                       uid,
                           const set<int>&           user_groups,
                           PoolObjectSQL::ObjectType auth_object,
                           bool&                     all,
                           bool                      disable_all_acl,
                           bool                      disable_cluster_acl,
                           bool                      disable_group_acl,
                           string&                   filter);
    /**
     *  Creates a filter for the objects owned by a given user/group
     *    @param uid the user id
     *    @param user_groups Set of group IDs that the user is part of
     *    @param filter_flag query type (ALL, MINE, GROUP)
     *    @param all user can access all objects
     *    @param filter the resulting filter string
     */
    static void usr_filter(int              uid,
                           const set<int>&  user_groups,
                           int              filter_flag,
                           bool             all,
                           const string&    acl_str,
                           string&          filter);
    /**
     *  Creates a filter for a given set of objects based on their id
     *    @param start_id first id
     *    @param end_id last id
     *    @param filter the resulting filter string
     */
    static void oid_filter(int     start_id,
                           int     end_id,
                           string& filter);
protected:

    /**
     *  Register on "CREATE" and on "REMOVE" hooks for the pool. The hooks are
     *  meant to be executed locally by the generic AllocateHook and RemoveHook
     *  classes.
     *    @param hook_mads, array of HOOKs to be installed
     *    @param remotes_location, path to remotes in the front-end where the
     *    hooks are installed
     */
    void register_hooks(vector<const Attribute *> hook_mads,
                        const string&             remotes_location);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get(const string& name, int uid, bool lock);

    /**
     *  Pointer to the database.
     */
    SqlDB * db;

    /**
     *  Dumps the pool in XML format. A filter and limit can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param elem_name Name of the root xml pool name
     *  @param table Pool table name
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss,
             const string&  elem_name,
             const char *   table,
             const string&  where,
             const string&  limit);

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param elem_name Name of the root xml pool name
     *  @param table Pool table name
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss,
             const string&  elem_name,
             const char *   table,
             const string&  where)
    {
        return dump(oss, elem_name, table, where, "");
    }

    /**
     *  Dumps the output of the custom sql query into an xml
     *
     *   @param oss The output stream to dump the xml contents
     *   @param root_elem_name Name of the root xml element name
     *   @param sql_query The SQL query to execute
     *
     *   @return 0 on success
     */
    int dump(ostringstream&  oss,
             const string&   root_elem_name,
             ostringstream&  sql_query);

    /**
     * Child classes can add extra elements to the dump xml, right after all the
     * pool objects
     *
     * @param oss The output stream to dump the xml contents
     */
    virtual void add_extra_xml(ostringstream&  oss){};

    /* ---------------------------------------------------------------------- */
    /* Interface to access the lastOID assigned by the pool                   */
    /* ---------------------------------------------------------------------- */

    /**
     *  Gets the value of the last identifier assigned by the pool
     *   @return the lastOID of the pool
     */
    int get_lastOID()
    {
        return lastOID;
    };

    /**
     *  Sets the lastOID of the pool and updates the control database
     *    @param _lastOID for the pool
     */
    void set_update_lastOID(int _lastOID)
    {
        lastOID = _lastOID;

        update_lastOID();
    };

private:

    pthread_mutex_t mutex;

    /**
     *  Max size for the pool, to control the memory footprint of the pool. This
     *  number MUST be greater than the max. number of objects that are
     *  accessed simultaneously.
     */
    static const unsigned int MAX_POOL_SIZE;

    /**
     *  Last object ID assigned to an object. It must be initialized by the
     *  target pool.
     */
    int lastOID;

    /**
     *  Tablename for this pool
     */
    string table;

    /**
     *  The pool is implemented with a Map of SQL object pointers, using the
     *  OID as key.
     */
    map<int,PoolObjectSQL *> pool;

    /**
     * Whether or not this pool uses the cache
     */
    bool cache;

    /**
     * Whether or not this pool uses the name_pool index
     */
    bool uses_name_pool;

    /**
     *  This is a name index for the pool map. The key is the name of the object
     *  , that may be combained with the owner id.
     */
    map<string,PoolObjectSQL *> name_pool;

    /**
     *  Factory method, must return an ObjectSQL pointer to an allocated pool
     *  specific object.
     */
    virtual PoolObjectSQL * create() = 0;

    /**
     *  OID queue to implement a FIFO-like replacement policy for the pool
     *  cache.
     */
    queue<int> oid_queue;

    /**
     *  Function to lock the pool
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the pool
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };

    /**
     *  FIFO-like replacement policy function. Before removing an object (pop)
     *  from  the cache its lock is checked. The object is removed only if
     *  the associated mutex IS NOT blocked. Otherwise the oid is sent to the
     *  back of the queue.
     */
    void replace();

    /**
     * Cleans all the objects in the cache, except the ones locked.
     * The object with the given oid will not be ignored if locked, the
     * method will wait for it to be unlocked and ensure it is erased from
     * the cache
     *
     * @param oid
     */
    void flush_cache(int oid);

    /**
     * Same as flush_cache(int), but with the object name-uid key
     *
     * @param name_key
     */
    void flush_cache(const string& name_key);

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    virtual string key(const string& name, int uid)
    {
        ostringstream key;

        key << name << ':' << uid;

        return key.str();
    };

    /**
     *  Inserts the last oid into the pool_control table
     */
    void update_lastOID();

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    /**
     *  Callback to set the lastOID (PoolSQL::PoolSQL)
     */
    int  init_cb(void *nil, int num, char **values, char **names);

    /**
     *  Callback to store the IDs of pool objects (PoolSQL::search)
     */
    int  search_cb(void *_oids, int num, char **values, char **names);

    /**
     *  Callback function to get output in XML format
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int dump_cb(void * _oss, int num, char **values, char **names);
};

#endif /*POOL_SQL_H_*/

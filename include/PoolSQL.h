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

#ifndef POOL_SQL_H_
#define POOL_SQL_H_

#include <string>

#include "SqlDB.h"
#include "PoolObjectSQL.h"
#include "PoolSQLCache.h"

using namespace std;

/**
 * PoolSQL class. Provides a base class to implement persistent generic pools.
 * The PoolSQL provides a synchronization mechanism (mutex) to operate in
 * multithreaded applications. Any modification or access function to the pool
 * SHOULD block the mutex.
 */
class PoolSQL
{
public:
    /**
     * Initializes the oid counter. This function sets lastOID to
     * the last used Object identifier by querying the corresponding database
     * table. This function SHOULD be called before any pool related function.
     *   @param _db a pointer to the database
     *   @param _table the name of the table supporting the pool (to set the oid
     *   counter). If null the OID counter is not updated.
     */
    PoolSQL(SqlDB * _db, const char * _table);

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
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get(int oid);

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database).
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get_ro(int oid);

    /**
     *  Check if there is an object with the same for a given user
     *    @param name of object
     *    @param ouid of user
     *
     *    @return oid of the object if it exists, -1 otherwise
     */
    int exist(const string& name, int ouid)
    {
        return PoolObjectSQL::select_oid(db, table.c_str(), name, ouid);
    }

    int exist(const string& name)
    {
        return PoolObjectSQL::select_oid(db, table.c_str(), name, -1);
    }

    int exist(int oid)
    {
        return PoolObjectSQL::exist(db, table.c_str(), oid);
    }

    void exist(const string& id_str, std::set<int>& id_list);

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
        return objsql->update(db);;
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
        int rc  = objsql->drop(db);

        if ( rc != 0 )
        {
            error_msg = "SQL DB error";
            return -1;
        }

        return 0;
    };

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, bool desc)
    {
        return dump(oss, where, 0, -1, desc);
    }

    /**
     *  Dumps the pool in XML format. A filter and limit can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    virtual int dump(string& oss, const string& where, int sid, int eid,
            bool desc) = 0;

    /**
     *  Dumps the pool in extended XML format
     *  A filter and limit can be also added to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    virtual int dump_extended(string& oss,
                      const string& where,
                      int sid,
                      int eid,
                      bool desc)
    {
        return dump(oss, where, sid, eid, desc);
    }

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
     *    @param gid the primary group of the user
     *    @param user_groups Set of group IDs that the user is part of
     *    @param filter_flag query type (ALL, MINE, GROUP)
     *    @param all user can access all objects
     *    @param filter the resulting filter string
     */
    static void usr_filter(int              uid,
                           int              gid,
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

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement. The string is encoded to an escaped SQL string, taking into
     *  account the current character set of the connection.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const string& str)
    {
        return db->escape_str(str);
    }

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str)
    {
        db->free_str(str);
    }

    /**
     * Return true if feature is supported
     */
     bool supports(SqlDB::SqlFeature ft)
     {
         return db->supports(ft);
     }

protected:

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get(const string& name, int uid);

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    PoolObjectSQL * get_ro(const string& name, int uid);

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
     *  @param start_id first element used for pagination
     *  @param end_id last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss,
             const string&  elem_name,
             const string&  column,
             const char *   table,
             const string&  where,
             int            start_id,
             int            end_id,
             bool           desc);

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param elem_name Name of the root xml pool name
     *  @param table Pool table name
     *  @param where filter for the objects, defaults to all
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss,
             const string&  elem_name,
             const char *   table,
             const string&  where,
             bool           desc)
    {
        return dump(oss, elem_name, "body", table, where, 0, -1, desc);
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
    int dump(string&  oss,
             const string&   root_elem_name,
             ostringstream&  sql_query);

    /* ---------------------------------------------------------------------- */
    /* Interface to access the lastOID assigned by the pool                   */
    /* ---------------------------------------------------------------------- */
    /**
     *  Gets the value of the last identifier assigned by the pool
     *   @return the lastOID of the pool
     */
    int get_lastOID();

    /**
     *  Sets the lastOID of the pool and updates the control database
     *    @param _lastOID for the pool
     */
    void set_lastOID(int _lastOID);

private:

    pthread_mutex_t mutex;

    /**
     *  Tablename for this pool
     */
    string table;

    /**
     *  The pool cache is implemented with a Map of SQL object pointers,
     *  using the OID as key.
     */
    PoolSQLCache cache;

    /**
     *  Factory method, must return an ObjectSQL pointer to an allocated pool
     *  specific object.
     */
    virtual PoolObjectSQL * create() = 0;

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
};

#endif /*POOL_SQL_H_*/

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef MARKETPLACEAPP_POOL_H_
#define MARKETPLACEAPP_POOL_H_

#include "MarketPlaceApp.h"

class SqlDB;

class MarketPlaceAppPool : public PoolSQL
{
public:
    MarketPlaceAppPool(SqlDB * db):PoolSQL(db, MarketPlaceApp::table){};

    ~MarketPlaceAppPool(){};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new MarketPlaceApp, writing it in the pool database.
     *    @param uid the user id of the MarketPlace owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param apptemplate MarketPlaceApp definition template
     *    @param mp_id of the MarketPlace to store de App
     *    @param mp_name of the MarketPlace
     *    @param oid the id assigned to the MarketPlace
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(
            int                uid,
            int                gid,
            const std::string& uname,
            const std::string& gname,
            int                umask,
            MarketPlaceAppTemplate * apptemplate,
            int                mp_id,
            const std::string& mp_name,
            int *              oid,
            std::string&       error_str);

    /**
     *  Drops the MarketPlaceApp from the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the MarketPlace object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     */
    int drop(PoolObjectSQL * objsql, std::string& error_msg);

    /**
     *  Imports an app into the marketplace, as reported by the monitor driver
     *    @param template to generate app with the from_template64 function
     *    @param mp_id of the MarketPlace to store de App
     *    @param mp_name of the MarketPlace
     *    @param app_id of the imported app
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure, -2
     *    already imported
     */
    int import(const std::string& t64, int mp_id, const std::string& mp_name,
            int& app_id, std::string& error_str);

    /**
     *  Function to get a MarketPlaceApp from the pool
     *    @param oid MarketPlaceApp unique id
     *    @param lock locks the MarketPlaceApp mutex
     *    @return a pointer to the MarketPlaceApp, 0 if not loaded
     */
    MarketPlaceApp * get(int oid)
    {
        return static_cast<MarketPlaceApp *>(PoolSQL::get(oid));
    };

    /**
     *  Function to get a read only MarketPlaceApp from the pool
     *    @param oid MarketPlaceApp unique id
     *    @return a pointer to the MarketPlaceApp, 0 if not loaded
     */
    MarketPlaceApp * get_ro(int oid)
    {
        return static_cast<MarketPlaceApp *>(PoolSQL::get_ro(oid));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    MarketPlaceApp * get(const std::string& name, int uid)
    {
        return static_cast<MarketPlaceApp *>(PoolSQL::get(name, uid));
    };

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    MarketPlaceApp * get_ro(const std::string& name, int uid)
    {
        return static_cast<MarketPlaceApp *>(PoolSQL::get_ro(name, uid));
    };

    /**
     *  Bootstraps the database table(s) associated to the MarketPlace pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return MarketPlaceApp::bootstrap(_db);
    };

    /**
     *  Dumps the MarketPlace pool in XML format. A filter can be also added to
     *  the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where,
		const std::string& limit, bool desc)
    {
        return PoolSQL::dump(oss, "MARKETPLACEAPP_POOL", "body", MarketPlaceApp::table,
                where, limit, desc);
    };

    /** Update a particular MarketPlaceApp
     *    @param zone pointer to Zone
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql);

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new MarketPlaceApp(-1,-1,"","", 0, 0);
    };

    /**
     * Check an element into map
     *   @param map_id of the app
     *   @return true if the app has to be deleted
     */
    bool test_map_check(int map_id);

    /**
     *  Resets the counter of missing monitors of an app
     *    @param app_id of the app
     */
    void reset_map_check(int app_id);

private:

    /**
     *  Hash to store the number of times an app was missing from monitor data
     */
    map<int, int> map_check;

    /**
     *  Max number of monitor that an app may be missing before deleting it
     */
    static const int MAX_MISSING_MONITORS;
};

#endif /*MARKETPLACE_POOL_H_*/

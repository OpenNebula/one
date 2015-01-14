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

#ifndef ZONE_POOL_H_
#define ZONE_POOL_H_

#include "PoolSQL.h"
#include "Zone.h"

using namespace std;


class ZonePool : public PoolSQL
{
public:
    ZonePool(SqlDB * db,
             bool    is_federation_slave);

    ~ZonePool(){};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new Zone, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param zone_template a Template object
     *    @param oid the id assigned to the Zone
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(Template * zone_template,
                 int *      oid,
                 string&    error_str);

    /**
     *  Function to get a Zone from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Zone unique id
     *    @param lock locks the Zone mutex
     *    @return a pointer to the Zone, 0 if the Zone could not be loaded
     */
    Zone * get(int oid, bool lock)
    {
        return static_cast<Zone *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Zone * get(const string& name, bool lock)
    {
        // The owner is set to -1, because it is not used in the key() method
        return static_cast<Zone *>(PoolSQL::get(name,-1,lock));
    };

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    string key(const string& name, int uid)
    {
        // Name is enough key because Zones can't repeat names.
        return name;
    };

    /** Update a particular Zone
     *    @param zone pointer to Zone
     *    @return 0 on success
     */
    int update(Zone * zone);

    /**
     *  Drops the Zone from the data base. The object mutex SHOULD be
     *  locked.
     * @param objsql a pointer to a Zone object
     * @param error_msg Error reason, if any
     * @return  0 on success,
     *          -1 DB error,
     *          -2 object is a default Zone (ID < 100)
     */
    int drop(PoolObjectSQL * objsql, string& error_msg);

    /**
     *  Bootstraps the database table(s) associated to the Zone pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return Zone::bootstrap(_db);
    };

    /**
     *  Dumps the Zone pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where, const string& limit)
    {
        return PoolSQL::dump(oss, "ZONE_POOL", Zone::table, where, limit);
    };

    /**
     * ID for the special local zone in stand-alone mode
     */
    static const int STANDALONE_ZONE_ID;
private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Zone(-1,0);
    };
};

#endif /*ZONE_POOL_H_*/

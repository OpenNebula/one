/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VDC_POOL_H_
#define VDC_POOL_H_

#include "PoolSQL.h"
#include "Vdc.h"
#include "OneDB.h"


class VdcPool : public PoolSQL
{
public:
    VdcPool(SqlDB * db,
            bool    is_federation_slave);

    ~VdcPool() {};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new Vdc, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param vdc_template a Template object
     *    @param oid the id assigned to the Vdc
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(std::unique_ptr<Template> vdc_template,
                 int *        oid,
                 std::string& error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Vdc unique identifier
     *   @return a pointer to the Vdc, nullptr in case of failure
     */
    std::unique_ptr<Vdc> get(int oid)
    {
        return PoolSQL::get<Vdc>(oid);
    }

    /** Update a particular Vdc
     *    @param vdc pointer to Vdc
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     *  Drops the Vdc from the data base. The object mutex SHOULD be
     *  locked.
     * @param objsql a pointer to a Vdc object
     * @param error_msg Error reason, if any
     * @return  0 on success,
     *          -1 DB error,
     *          -2 object is a default Vdc (ID < 100)
     */
    int drop(PoolObjectSQL * objsql, std::string& error_msg) override;

    /**
     *  Bootstraps the database table(s) associated to the Vdc pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return Vdc::bootstrap(_db);
    };

    /**
     *  Dumps the Vdc pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
             bool desc) override
    {
        return PoolSQL::dump(oss, "VDC_POOL", "body", one_db::vdc_table,
                             where, sid, eid, desc);
    };

    /**
     *  Lists the VDC ids
     *  @param oids a vector with the oids of the objects.
     *
     *  @return 0 on success
     */
    int list(std::vector<int>& oids)
    {
        return PoolSQL::list(oids, one_db::vdc_table);
    }

    /**
     *  Default name for the default VDC
     */
    static const std::string DEFAULT_NAME;

    /**
     *  Identifier for the default VDC
     */
    static const int DEFAULT_ID;

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create() override
    {
        return new Vdc(-1, 0);
    };
};

#endif /*VDC_POOL_H_*/

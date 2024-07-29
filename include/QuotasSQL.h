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

#ifndef GROUP_QUOTAS_H_
#define GROUP_QUOTAS_H_

#include "Quotas.h"
#include "ObjectSQL.h"
#include "OneDB.h"

class QuotasSQL : public Quotas, ObjectSQL
{
public:
    /**
     *  Reads the ObjectSQL (identified with its OID) from the database.
     *    @param oid the Group/User oid
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(int _oid, SqlDB *db)
    {
        oid = _oid;
        return select(db);
    };

    /**
     *  Writes the Quotas in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(int _oid, SqlDB *db, std::string& error_str)
    {
        oid = _oid;
        return insert(db, error_str);
    };

    /**
     *  Writes/updates the Quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(int _oid, SqlDB *db)
    {
        oid = _oid;
        return update(db);
    }

    /**
     *  Removes the Quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db) override;

protected:

    QuotasSQL(const char * ds_xpath,
              const char * net_xpath,
              const char * img_xpath,
              const char * vm_xpath):
        Quotas(ds_xpath, net_xpath, img_xpath, vm_xpath, false),
        ObjectSQL(),
        oid(-1) {};

    virtual ~QuotasSQL() {};

    virtual const char * table() const = 0;

    virtual const char * table_names() const = 0;

    virtual const char * table_oid_column() const = 0;

    int from_xml(const std::string& xml);

private:
    /**
     * User/Group oid. Must be set before a DB write operation
     */
    int oid;

    /**
     *  Reads the ObjectSQL (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Writes the Quotas in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the Quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Callback function to read a Quotas object (Quotas::select)
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Generates a string representation of the quotas in XML format, enclosed
     *  in the QUOTAS tag
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    std::string& to_xml_db(std::string& xml) const;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupQuotas : public QuotasSQL
{
public:
    GroupQuotas():QuotasSQL(
                "/QUOTAS/DATASTORE_QUOTA",
                "/QUOTAS/NETWORK_QUOTA",
                "/QUOTAS/IMAGE_QUOTA",
                "/QUOTAS/VM_QUOTA") {};

    virtual ~GroupQuotas() {};

    /**
     *  Bootstraps the database table for group quotas
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        std::ostringstream oss_quota(one_db::group_quotas_db_bootstrap);

        return db->exec_local_wr(oss_quota);
    };

protected:

    const char * table() const override
    {
        return one_db::group_quotas_db_table;
    };

    const char * table_names() const override
    {
        return one_db::group_quotas_db_names;
    };

    const char * table_oid_column() const override
    {
        return one_db::group_quotas_db_oid_column;
    };

private:

    friend class GroupPool;

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserQuotas : public QuotasSQL
{
public:
    UserQuotas():QuotasSQL(
                "/QUOTAS/DATASTORE_QUOTA",
                "/QUOTAS/NETWORK_QUOTA",
                "/QUOTAS/IMAGE_QUOTA",
                "/QUOTAS/VM_QUOTA") {};

    /**
     *  Bootstraps the database table for user quotas
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        std::ostringstream oss_quota(one_db::user_quotas_db_bootstrap);

        return db->exec_local_wr(oss_quota);
    };

protected:

    const char * table() const override
    {
        return one_db::user_quotas_db_table;
    };

    const char * table_names() const override
    {
        return one_db::user_quotas_db_names;
    };

    const char * table_oid_column() const override
    {
        return one_db::user_quotas_db_oid_column;
    };

private:

    friend class UserPool;
};

#endif /*QUOTAS_SQL_H_*/

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

#ifndef DEFAULT_QUOTAS_H_
#define DEFAULT_QUOTAS_H_

#include "Quotas.h"
#include "SqlDB.h"
#include "ObjectSQL.h"

class DefaultQuotas : public Quotas, ObjectSQL
{
public:
    DefaultQuotas(
            const char * _root_elem,
            const char * _ds_xpath,
            const char * _net_xpath,
            const char * _img_xpath,
            const char * _vm_xpath):
               Quotas(_ds_xpath, _net_xpath, _img_xpath, _vm_xpath),
               root_elem(_root_elem)
    {
        datastore_quota.make_default();
        network_quota.make_default();
        image_quota.make_default();
        vm_quota.make_default();
    };

    ~DefaultQuotas(){};

    /**
     *  Generates a string representation of the quotas in XML format
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    string& to_xml(string& xml) const;

    /**
     *  Writes the quotas in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str)
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the quotas data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    };

    /**
     *  Reads the Quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB *db);

    /**
     *  Bootstraps the database table(s) associated to the default quotas
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

private:
    const char * root_elem;

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Callback function to unmarshall a PoolObjectSQL
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names)
    {
        if ( (!values[0]) || (num != 1) )
        {
            return -1;
        }

        return from_xml(values[0]);
    };

    /**
     *  Builds quota object from an ObjectXML
     *    @param xml The xml-formatted string
     *    @return 0 on success
     */
    int from_xml(const string& xml);

    /**
     *  Removes the Quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db)
    {
        return -1;  // Not supported
    };
};

#endif /*DEFAULT_QUOTAS_H_*/

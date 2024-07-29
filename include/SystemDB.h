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

#ifndef SYSTEM_DB_H_
#define SYSTEM_DB_H_

#include "Callbackable.h"

class Nebula;
class SqlDB;

/**
 *  This class represents the OpenNebula core system data tables:
 *    - pool_control
 *    - db_versioning
 *    - system attributes
 */
class SystemDB: public Callbackable
{
public:
    /**
     *  Reads a System attribute from the DB
     *    @param attr_name name of the attribute
     *    @param attr_xml the attribute in a XML document
     *    @return 0 on success
     */
    int select_sys_attribute(const std::string& attr_name, std::string& attr_zml);

    /**
     *  Writes a system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert_sys_attribute(
            const std::string& attr_name,
            const std::string& xml_attr,
            std::string&       error_str)
    {
        return insert_replace(attr_name, xml_attr, false, error_str);
    };

    /**
     *  Updates the system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_sys_attribute(
            const std::string& attr_name,
            const std::string& xml_attr,
            std::string&       error_str)
    {
        return insert_replace(attr_name, xml_attr, true, error_str);
    };

private:
    friend class Nebula; //Only for Nebula class

    SystemDB(SqlDB *_db):db(_db) {};

    ~SystemDB() {};

    // Pool control table
    static const char * pc_names;

    static const char * pc_bootstrap;

    static const char * pc_table;

    // DB versioning table
    static const char * shared_ver_names;

    static const char * shared_ver_bootstrap;

    static const char * shared_ver_table;

    // DB slave versioning table
    static const char * local_ver_names;

    static const char * local_ver_bootstrap;

    static const char * local_ver_table;

    // System attributes table
    static const char * sys_names;

    static const char * sys_bootstrap;

    static const char * sys_table;

    // Pointer to the db database
    SqlDB *db;

    /**
     *  Execute an INSERT or REPLACE Sql query for a system attribute.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(const std::string& attr_name,
                       const std::string& xml_attr,
                       bool               replace,
                       std::string&       error_str);
    /**
     *  Bootstraps the database control tables for shared tables
     *
     *    @return 0 on success
     */
    int shared_bootstrap();

    /**
     *  Bootstraps the database control tables for a local DB tables
     *
     *    @return 0 on success
     */
    int local_bootstrap();

    /**
     *  Callback function for the check_db_version method. Stores the read
     *  version in loaded_db_version
     *    @param _loaded_db_version returned columns
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *_loaded_db_version,
                  int  num,
                  char **values,
                  char **names);
    /**
     *  Callback function for selecting system attributes
     */
    int select_attr_cb(void *_attr_xml,
                       int  num,
                       char **values,
                       char **names);
    /**
     * Reads the current DB version.
     * @param is_federation_slave
     * @param local_bs boostrap local DB tables
     * @param shared_bs boostrap shared DB tables
     *
     * @return  0 on success,
     *          -1 if there is a version mismatch, or replica config error.
     */
    int check_db_version(bool is_slave, bool& local_bs, bool& shared_bs);

    /**
     *  check_db_version to check versioning
     *  @param table name of the DB table
     *  @param version target DB version
     *  @return 0 success, -1 upgrade needed, -2 bootstrap needed
     */
    int check_db_version(const std::string& table,
                         const std::string& version,
                         std::string& error);
};

#endif //SYSTEM_DB_H

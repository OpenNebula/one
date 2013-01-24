/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "SqlDB.h"
#include "Callbackable.h"

class Nebula;

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
    int select_sys_attribute(const string& attr_name, string& attr_zml);

    /**
     *  Writes a system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert_sys_attribute(
        const string& attr_name,
        const string& xml_attr,
        string&       error_str)
    {
        return insert_replace(attr_name, xml_attr, false, error_str);
    };

    /**
     *  Updates the system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_sys_attribute(
        const string& attr_name,
        const string& xml_attr,
        string&       error_str)
    {
        return insert_replace(attr_name, xml_attr, true, error_str);
    };

private:
    friend class Nebula; //Only for Nebula class

    SystemDB(SqlDB *_db):db(_db){};

    ~SystemDB(){};

    // Pool control table
    static const char * pc_names;

    static const char * pc_bootstrap;

    static const char * pc_table;

    // DB versioning table
    static const char * ver_names;

    static const char * ver_bootstrap;

    static const char * ver_table;

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
    int insert_replace(const string& attr_name,
                       const string& xml_attr,
                       bool          replace,
                       string&       error_str);
    /**
     *  Bootstraps the database control tables
     *
     *    @return 0 on success
     */
    int bootstrap();

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
     *
     * @return  0 on success,
     *          -1 if there is a version mismatch,
     *          -2 if the DB needs a bootstrap
     */
    int check_db_version();
};

#endif //SYSTEM_DB_H

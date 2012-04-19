/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef DATASTORE_H_
#define DATASTORE_H_

#include "PoolSQL.h"
#include "ObjectCollection.h"
#include "DatastoreTemplate.h"
#include "Clusterable.h"
#include "Image.h"

/**
 *  The Datastore class.
 */
class Datastore : public PoolObjectSQL, ObjectCollection, public Clusterable
{
public:

    /**
     * Function to print the Datastore object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Adds this image's ID to the set.
     *    @param id of the image to be added to the Datastore
     *    @return 0 on success
     */
    int add_image(int id)
    {
        return add_collection_id(id);
    };

    /**
     *  Deletes this image's ID from the set.
     *    @param id of the image to be deleted from the Datastore
     *    @return 0 on success
     */
    int del_image(int id)
    {
        return del_collection_id(id);
    };

    /**
     *  Retrieves TM mad name
     *    @return string tm mad name
     */
    const string& get_tm_mad() const
    {
        return tm_mad;
    };

    /**
     *  Retrieves the base path
     *    @return base path string
     */
    const string& get_base_path() const
    {
        return base_path;
    };

    /**
     *  Retrieves the disk type
     *    @return disk type
     */
    Image::DiskType get_disk_type() const
    {
        return disk_type;
    };
    /**
     * Modifies the given VM disk attribute adding the relevant datastore
     * attributes
     *
     * @param disk
     * @return 0 on success
     */
    int disk_attribute(VectorAttribute * disk);

    /**
     *  Replace template for this object. Object should be updated
     *  after calling this method
     *    @param tmpl string representation of the template
     */
    int replace_template(const string& tmpl_str, string& error);

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class DatastorePool;

    // *************************************************************************
    // Datastore Private Attributes
    // *************************************************************************

    /**
     * Name of the datastore driver used to register new images
     */
    string ds_mad;

    /**
     *  Name of the TM driver used to transfer file to and from the hosts
     */
    string tm_mad;

    /**
     * Base path for the storage
     */
    string base_path;

    /**
     * Disk types for the Images created in this datastore
     */
     Image::DiskType disk_type;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Datastore(
            int                 uid,
            int                 gid,
            const string&       uname,
            const string&       gname,
            DatastoreTemplate*  ds_template,
            int                 cluster_id,
            const string&       cluster_name);

    virtual ~Datastore(){};

    // *************************************************************************
    // DataBase implementation (Private)
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
     *  Bootstraps the database table(s) associated to the Datastore
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(Datastore::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the Datastore in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Datastore's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for virtual network templates
     */
    Template * get_new_template() const
    {
        return new DatastoreTemplate;
    }
};

#endif /*DATASTORE_H_*/

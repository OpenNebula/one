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

#ifndef CLUSTER_H_
#define CLUSTER_H_

#include "PoolSQL.h"
#include "ObjectCollection.h"
#include "DatastorePool.h"

using namespace std;

/**
 *  The Cluster class.
 */
class Cluster : public PoolObjectSQL
{
public:

    // *************************************************************************
    // Object Collections (Public)
    // *************************************************************************

    /**
     *  Adds this host ID to the set.
     *    @param id to be added to the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int add_host(int id, string& error_msg)
    {
        int rc = hosts.add_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Host ID is already in the cluster set.";
        }

        return rc;
    }

    /**
     *  Deletes this host ID from the set.
     *    @param id to be deleted from the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int del_host(int id, string& error_msg)
    {
        int rc = hosts.del_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Host ID is not part of the cluster set.";
        }

        return rc;
    }

    /**
     *  Adds this datastore ID to the set.
     *    @param id to be added to the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int add_datastore(int id, string& error_msg)
    {
        if ( id == DatastorePool::SYSTEM_DS_ID )
        {
            ostringstream oss;
            oss << "Datastore '"<< DatastorePool::SYSTEM_DS_NAME
                << "' cannot be added to any cluster.";

            error_msg = oss.str();

            return -1;
        }

        int rc = datastores.add_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Datastore ID is already in the cluster set.";
        }

        return rc;
    }

    /**
     *  Deletes this datastore ID from the set.
     *    @param id to be deleted from the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int del_datastore(int id, string& error_msg)
    {
        int rc = datastores.del_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Datastore ID is not part of the cluster set.";
        }

        return rc;
    }

    /**
     *  Adds this vnet ID to the set.
     *    @param id to be added to the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int add_vnet(int id, string& error_msg)
    {
        int rc = vnets.add_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Network ID is already in the cluster set.";
        }

        return rc;
    }

    /**
     *  Deletes this vnet ID from the set.
     *    @param id to be deleted from the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int del_vnet(int id, string& error_msg)
    {
        int rc = vnets.del_collection_id(id);

        if ( rc < 0 )
        {
            error_msg = "Network ID is not part of the cluster set.";
        }

        return rc;
    }

    // *************************************************************************
    // DataBase implementation (Public)
    // *************************************************************************

    /**
     * Function to print the Cluster object into a string in XML format
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

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class ClusterPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Cluster(int id, const string& name):
        PoolObjectSQL(id,CLUSTER,name,-1,-1,"","",table),
        hosts("HOSTS"),
        datastores("DATASTORES"),
        vnets("VNETS"){};

    virtual ~Cluster(){};

    // *************************************************************************
    // Object Collections (Private)
    // *************************************************************************

    ObjectCollection hosts;
    ObjectCollection datastores;
    ObjectCollection vnets;

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
     *  Bootstraps the database table(s) associated to the Cluster
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(Cluster::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the Cluster in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str)
    {
        return insert_replace(db, false, error_str);
    }

    /**
     *  Writes/updates the Cluster's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Checks if all the collections are empty, and therefore this cluster
     * can be dropped.
     *
     * @param error_msg Error message, if any.
     * @return 0 if cluster can be dropped, -1 otherwise
     */
    int check_drop(string& error_msg);
};

#endif /*CLUSTER_H_*/

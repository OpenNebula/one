/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems              */
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
#include "ClusterTemplate.h"

using namespace std;

/**
 *  The Cluster class.
 */
class Cluster : public PoolObjectSQL
{
public:
    /**
     * Returns the DATASTORE_LOCATION for the hosts of the cluster. If not
     * defined that in oned.conf is returned.
     *
     * @param ds_location string to copy the DATASTORE_LOCATION to
     * @return DATASTORE_LOCATION
     */
    string& get_ds_location(string &ds_location);

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
        int rc = hosts.add(id);

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
        int rc = hosts.del(id);

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
    int add_datastore(int id, string& error_msg);

    /**
     *  Deletes this datastore ID from the set.
     *    @param id to be deleted from the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int del_datastore(int id, string& error_msg);

    /**
     *  Returns a copy of the datastore IDs set
     */
    set<int> get_datastores()
    {
        return datastores.clone();
    };

    /**
     *  Returns a system DS for the cluster when none is set at the API level
     *    @return the ID of the System
     */
    static int get_default_system_ds(const set<int>& ds_collection);

    /**
     *  Adds this vnet ID to the set.
     *    @param id to be added to the cluster
     *    @param error_msg Error message, if any
     *    @return 0 on success
     */
    int add_vnet(int id, string& error_msg)
    {
        int rc = vnets.add(id);

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
        int rc = vnets.del(id);

        if ( rc < 0 )
        {
            error_msg = "Network ID is not part of the cluster set.";
        }

        return rc;
    }

    /**
     *  Returns a copy of the host IDs set
     */
    set<int> get_host_ids()
    {
        return hosts.clone();
    }

    /**
     *  Returns a copy of the datastore IDs set
     */
    set<int> get_datastore_ids()
    {
        return datastores.clone();
    }

    /**
     *  Returns a copy of the vnet IDs set
     */
    set<int> get_vnet_ids()
    {
        return vnets.clone();
    }

    /**
     *  Get the default reserved capacity for hosts in the cluster. It can be
     *  overridden if defined in the host template.
     *    @param cpu reserved cpu (in percentage)
     *    @param mem reserved mem (in KB)
     */
    void get_reserved_capacity(long long &cpu, long long& mem)
    {
        get_template_attribute("RESERVED_CPU", cpu);

        get_template_attribute("RESERVED_MEM", mem);
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

    Cluster(int id,
            const string& name,
            ClusterTemplate*  cl_template);

    virtual ~Cluster(){};

    // *************************************************************************
    // Attributes (Private)
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

    /**
     *  Factory method for cluster templates
     */
    Template * get_new_template() const
    {
        return new ClusterTemplate;
    }
};

#endif /*CLUSTER_H_*/

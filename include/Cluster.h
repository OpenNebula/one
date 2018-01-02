/* ------------------------------------------------------------------------ */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems              */
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
#include "BitMap.h"

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
     *    @param cpu reserved cpu (percentage, or absolute)
     *    @param mem reserved mem (in KB)
     */
    void get_reserved_capacity(string& cpu, string& mem)
    {
        get_template_attribute("RESERVED_CPU", cpu);

        get_template_attribute("RESERVED_MEM", mem);
    }

    // *************************************************************************
    // VNC Port management function
    // *************************************************************************

    /**
     *  Returns a free VNC port, it will try first to allocate base_port + vmid.
     *  If this port is not free the first lower port from the VNC_PORT/START
     *  port is returned.
     *    @param vmid of the VM
     *    @param port reserved
     *    @return 0 on success
     */
    int get_vnc_port(int vmid, unsigned int& port)
    {
        unsigned int base_port = vnc_bitmap.get_start_bit();
        unsigned int hint_port = base_port + (vmid % (65535 - base_port));

        return vnc_bitmap.get(hint_port,port);
    }

    void release_vnc_port(int port)
    {
        vnc_bitmap.reset(port);
    }

    int set_vnc_port(int port)
    {
        return vnc_bitmap.set(port);
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
    Cluster(int id, const string& name, ClusterTemplate*  cl_template,
            const VectorAttribute& vnc_conf);

    virtual ~Cluster(){};

    // *************************************************************************
    // Attributes (Private)
    // *************************************************************************
    ObjectCollection hosts;
    ObjectCollection datastores;
    ObjectCollection vnets;

    BitMap<65536> vnc_bitmap;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************
    static const char * db_names;
    static const char * db_bootstrap;
    static const char * table;

    static const char * datastore_table;
    static const char * datastore_db_names;
    static const char * datastore_db_bootstrap;

    static const char * network_table;
    static const char * network_db_names;
    static const char * network_db_bootstrap;

    static const char * bitmap_table;
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
        int rc;
        ostringstream oss;

        oss.str(Cluster::db_bootstrap);
        rc = db->exec_local_wr(oss);

        oss.str(Cluster::datastore_db_bootstrap);
        rc += db->exec_local_wr(oss);

        oss.str(Cluster::network_db_bootstrap);
        rc += db->exec_local_wr(oss);

        return rc;
    };

    /**
     *  Writes the Cluster in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str)
    {
        int rc;

        rc = insert_replace(db, false, error_str);

        if ( rc != 0 )
        {
            return rc;
        }

        return vnc_bitmap.insert(oid, db);
    }

    /**
     *  Writes/updates the Cluster's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;

        int rc = insert_replace(db, true, error_str);

        rc += vnc_bitmap.update(db);

        return rc;
    }

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB *db)
    {
        int rc = PoolObjectSQL::select(db);

        if ( rc != 0 )
        {
            return rc;
        }

        return vnc_bitmap.select(oid, db);
    }

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
     int select(SqlDB *db, const string& _name, int _uid)
     {
         int rc = PoolObjectSQL::select(db, _name, _uid);

         if ( rc != 0 )
         {
             return rc;
         }

         return vnc_bitmap.select(oid, db);
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

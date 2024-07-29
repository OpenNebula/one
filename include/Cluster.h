/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

#include "PoolObjectSQL.h"
#include "ClusterTemplate.h"
#include "BitMap.h"
#include "ObjectCollection.h"


/**
 *  The Cluster class.
 */
class Cluster : public PoolObjectSQL
{
public:

    virtual ~Cluster() = default;

    // *************************************************************************
    // Object Collections (Public)
    // *************************************************************************

    /**
     *  Returns a system DS for the cluster when none is set at the API level
     *    @return the ID of the System
     */
    static int get_default_system_ds(const std::set<int>& ds_collection);

    /**
     *  Returns a copy of the host IDs set
     */
    const std::set<int>& get_host_ids() const
    {
        return hosts.get_collection();
    }

    /**
     *  Returns a copy of the datastore IDs set
     */
    const std::set<int>& get_datastore_ids() const
    {
        return datastores.get_collection();
    }

    /**
     *  Returns a copy of the vnet IDs set
     */
    const std::set<int>& get_vnet_ids() const
    {
        return vnets.get_collection();
    }

    /**
     *  Get the default reserved capacity for hosts in the cluster. It can be
     *  overridden if defined in the host template.
     *    @param cpu reserved cpu (percentage, or absolute)
     *    @param mem reserved mem (in KB)
     */
    void get_reserved_capacity(std::string& cpu, std::string& mem) const
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
    std::string& to_xml(std::string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class ClusterPool;
    friend class PoolSQL;

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
    int get_vnc_port(int vmid, unsigned int& port) const
    {
        unsigned int base_port = vnc_bitmap.get_start_bit();
        unsigned int hint_port = base_port + (vmid % (65535 - base_port));

        return vnc_bitmap.get(hint_port, port);
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
    // Constructor
    // *************************************************************************
    Cluster(int id, const std::string& name,
            std::unique_ptr<ClusterTemplate>  cl_template,
            const VectorAttribute& vnc_conf);

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

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Cluster
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the Cluster in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override
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
    int update(SqlDB *db) override
    {
        std::string error_str;

        return insert_replace(db, true, error_str);
    }

    /**
     *  Writes/updates the vnc_bitmap data in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_vnc_bitmap(SqlDB *db)
    {
        return vnc_bitmap.update(db);
    }

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB *db) override
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
    int select(SqlDB *db, const std::string& _name, int _uid) override
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
    int check_drop(std::string& error_msg);

    /**
     *  Factory method for cluster templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<ClusterTemplate>();
    }

    /**
     * Add a resource to the corresponding set.
     * @return 0 on success
     */
    int add_resource(PoolObjectSQL::ObjectType type, int resource_id,
                     std::string& error_msg)
    {
        std::ostringstream oss;

        int rc;

        switch (type)
        {
            case PoolObjectSQL::DATASTORE:
                rc = datastores.add(resource_id);
                break;
            case PoolObjectSQL::NET:
                rc = vnets.add(resource_id);
                break;
            case PoolObjectSQL::HOST:
                rc = hosts.add(resource_id);
                break;
            default:
                oss << "Invalid resource type: "<< PoolObjectSQL::type_to_str(type);
                error_msg = oss.str();
                return -1;
        }

        if (rc != 0)
        {
            oss << PoolObjectSQL::type_to_str(type) << " ID is already in the cluster set.";
            error_msg = oss.str();
        }

        return rc;
    }

    /**
     * Remove a resource from the corresponding set.
     * @return 0 on success
     */
    int del_resource(PoolObjectSQL::ObjectType type, int resource_id,
                     std::string& error_msg)
    {
        int rc;

        switch (type)
        {
            case PoolObjectSQL::DATASTORE:
                rc = datastores.del(resource_id);
                break;
            case PoolObjectSQL::NET:
                rc = vnets.del(resource_id);
                break;
            case PoolObjectSQL::HOST:
                rc = hosts.del(resource_id);
                break;
            default:
                error_msg = "Invalid resource type: " + PoolObjectSQL::type_to_str(type);
                return -1;
        }

        if (rc != 0)
        {
            error_msg = PoolObjectSQL::type_to_str(type) + " is not in the cluster set.";
        }

        return rc;
    }
};

#endif /*CLUSTER_H_*/

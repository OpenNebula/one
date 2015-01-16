/* ------------------------------------------------------------------------ */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs      */
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

#ifndef VDC_H_
#define VDC_H_

#include <set>

#include "PoolObjectSQL.h"
#include "NebulaLog.h"

using namespace std;

/**
 *  The Vdc class.
 */
class Vdc : public PoolObjectSQL
{
public:

    /**
     * Function to print the Vdc object into a string in XML format
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
     * Adds a Group to the VDC. ACL Rules are updated only for this group.
     *
     * @param group_id ID of the group
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_group(int group_id, string& error_msg);

    /**
     * Deletes a Group from the VDC. ACL Rules are updated only for this group.
     *
     * @param group_id ID of the group
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_group(int group_id, string& error_msg);

    /**
     * Adds a cluster to the VDC
     *
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_cluster(int zone_id, int cluster_id, string& error_msg);

    /**
     * Deletes a cluster from the VDC
     *
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_cluster(int zone_id, int cluster_id, string& error_msg);

    /**
     * Adds a host to the VDC
     *
     * @param zone_id ID of the zone
     * @param host_id ID of the host
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_host(int zone_id, int host_id, string& error_msg);

    /**
     * Deletes a host from the VDC
     *
     * @param zone_id ID of the zone
     * @param host_id ID of the host
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_host(int zone_id, int host_id, string& error_msg);

    /**
     * Adds a datastore to the VDC
     *
     * @param zone_id ID of the zone
     * @param datastore_id ID of the datastore
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_datastore(int zone_id, int datastore_id, string& error_msg);

    /**
     * Deletes a datastore from the VDC
     *
     * @param zone_id ID of the zone
     * @param datastore_id ID of the datastore
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_datastore(int zone_id, int datastore_id, string& error_msg);

    /**
     * Adds a vnet to the VDC
     *
     * @param zone_id ID of the zone
     * @param vnet_id ID of the vnet
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_vnet(int zone_id, int vnet_id, string& error_msg);

    /**
     * Deletes a vnet from the VDC
     *
     * @param zone_id ID of the zone
     * @param vnet_id ID of the vnet
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_vnet(int zone_id, int vnet_id, string& error_msg);

    /**
     * Special ID to refer to all OpenNebula resources, from any cluster
     * or in cluster none (* in ACL rules).
     */
    static const int ALL_RESOURCES;

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class VdcPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Vdc(int id, Template* vdc_template);

    ~Vdc();

    // *************************************************************************
    // Attributes (Private)
    // *************************************************************************

    set<int> groups;

    set<pair<int,int> > clusters;
    set<pair<int,int> > hosts;
    set<pair<int,int> > datastores;
    set<pair<int,int> > vnets;

    void add_group_rules(int group);
    void del_group_rules(int group);

    void add_cluster_rules(int group, int zone_id, int cluster_id);
    void del_cluster_rules(int group, int zone_id, int cluster_id);

    void add_host_rules(int group, int zone_id, int host_id);
    void del_host_rules(int group, int zone_id, int host_id);

    void add_datastore_rules(int group, int zone_id, int ds_id);
    void del_datastore_rules(int group, int zone_id, int ds_id);

    void add_vnet_rules(int group, int zone_id, int vnet_id);
    void del_vnet_rules(int group, int zone_id, int vnet_id);

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
     *  Bootstraps the database table(s) associated to the Vdc
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(Vdc::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the Vdc in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Vdc's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Drops the Vdc from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db);

    /**
     *  Factory method for Vdc templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }
};

#endif /*VDC_H_*/

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

#ifndef VDC_H_
#define VDC_H_

#include <set>

#include "PoolObjectSQL.h"

/**
 *  Represents a set of resources in a zone. The class is able to manage
 *  the ACL rules associated to the set.
 */
class ResourceSet
{
public:
    static std::string type_to_vdc_str(PoolObjectSQL::ObjectType type)
    {
        switch (type)
        {
            case PoolObjectSQL::HOST:      return "HOST";
            case PoolObjectSQL::NET:       return "VNET";
            case PoolObjectSQL::DATASTORE: return "DATASTORE";
            case PoolObjectSQL::CLUSTER:   return "CLUSTER";
            default: return "";
        }
    }

    /**
     *  Constructor for the ResourceSet, ACL rules are set based on the
     *  resource type
     */
    ResourceSet(PoolObjectSQL::ObjectType _type);

    /**
     *  Writes the ResourceSet in XML form the the given stream, in the form:
     *  <RESOURCE>
     *    <ZONE_ID>
     *    <RESOURCE_ID>
     *  </RESOURCE>
     *  RESOURCE is set from xml_name attribute.
     *    @param oss the outpur string stream
     */
    void to_xml(std::ostringstream &oss) const;

    /**
     *  Builds the ResourceSet from the xml node
     *    @param content of the resource set
     *    @return 0 on success
     */
    int from_xml_node(std::vector<xmlNodePtr>& content);

    /**
     * Adds a resource to the set. The ACL rules are updated for the groups
     *
     * @param groups set of groups to apply the rules to
     * @param zone_id ID of the zone
     * @param id ID of the vnet
     * @param error returns the error reason, if any
     *
     * @return 0 on success
     */
    int add(const std::set<int>& groups, int zone_id, int id, std::string& error);

    /**
     * Deletes a resource from the set. The ACL rules are updated
     *
     * @param groups set of groups to apply the rules to
     * @param zone_id ID of the zone
     * @param id ID of the vnet
     * @param error returns the error reason, if any
     *
     * @return 0 on success
     */
    int del(const std::set<int>& groups, int zone_id, int id, std::string& error);

    /**
     * Set ACL rules for a group to access this resource set
     *
     * @param group_id the group
     */
    void add_group_rules(int group_id);

    /**
     * Remove ACL access rules to this resource set for a group
     *
     * @param group_id the group
     */
    void del_group_rules(int group_id);

    /**
     *  Add an ACL rule for group and resource
     *
     *  @param group_id of the group
     *  @param zone_id of the zone
     *  @param id of the resource
     */
    void add_rule(int group_id, int zone_id, int id);

    /**
     *  Remove an ACL rule for group and resource
     */
    void del_rule(int group_id, int zone_id, int id);


private:
    /**
     *  <ZONE_ID, RESOURCE_ID> pairs for the resource set
     */
    std::set<std::pair<int, int> > resources;

    /**
     *  <resource, rights> pairs to add/remove to ACL list for this set.
     */
    std::set<std::pair<long long, long long> > rules;

    /**
     *  The resource type of this set.
     */
    PoolObjectSQL::ObjectType type;

    /**
     *  XML Name of the resource
     */
    std::string xml_name;

    /**
     *  Insert acl rules into rules attribute.
     *
     *  @param name_attr the name of the configuration attribute.
     *  @param type Object type for the acls.
     */
    void insert_default_rules(const std::string& name_attr,
                              PoolObjectSQL::ObjectType type);
};

/**
 *  The Vdc class.
 */
class Vdc : public PoolObjectSQL
{
public:

    virtual ~Vdc() = default;

    /**
     * Function to print the Vdc object into a string in XML format
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

    /**
     * Adds a Group to the VDC. ACL Rules are updated only for this group.
     *
     * @param group_id ID of the group
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_group(int group_id, std::string& error_msg);

    /**
     * Deletes a Group from the VDC. ACL Rules are updated only for this group.
     *
     * @param group_id ID of the group
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_group(int group_id, std::string& error_msg);

    /**
     * Adds a cluster to the VDC
     *
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_cluster(int zone_id, int cluster_id, std::string& error_msg)
    {
        return clusters.add(groups, zone_id, cluster_id, error_msg);
    }

    /**
     * Deletes a cluster from the VDC
     *
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_cluster(int zone_id, int cluster_id, std::string& error_msg)
    {
        return clusters.del(groups, zone_id, cluster_id, error_msg);
    }

    /**
     * Adds a host to the VDC
     *
     * @param zone_id ID of the zone
     * @param host_id ID of the host
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_host(int zone_id, int host_id, std::string& error_msg)
    {
        return hosts.add(groups, zone_id, host_id, error_msg);
    }

    /**
     * Deletes a host from the VDC
     *
     * @param zone_id ID of the zone
     * @param host_id ID of the host
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_host(int zone_id, int host_id, std::string& error_msg)
    {
        return hosts.del(groups, zone_id, host_id, error_msg);
    }

    /**
     * Adds a datastore to the VDC
     *
     * @param zone_id ID of the zone
     * @param datastore_id ID of the datastore
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_datastore(int zone_id, int datastore_id, std::string& error_msg)
    {
        return datastores.add(groups, zone_id, datastore_id, error_msg);
    }

    /**
     * Deletes a datastore from the VDC
     *
     * @param zone_id ID of the zone
     * @param datastore_id ID of the datastore
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_datastore(int zone_id, int datastore_id, std::string& error_msg)
    {
        return datastores.del(groups, zone_id, datastore_id, error_msg);
    }

    /**
     * Adds a vnet to the VDC
     *
     * @param zone_id ID of the zone
     * @param vnet_id ID of the vnet
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_vnet(int zone_id, int vnet_id, std::string& error_msg)
    {
        return vnets.add(groups, zone_id, vnet_id, error_msg);
    }

    /**
     * Deletes a vnet from the VDC
     *
     * @param zone_id ID of the zone
     * @param vnet_id ID of the vnet
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_vnet(int zone_id, int vnet_id, std::string& error_msg)
    {
        return vnets.del(groups, zone_id, vnet_id, error_msg);
    }

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

    Vdc(int id, std::unique_ptr<Template> vdc_template);

    // *************************************************************************
    // Attributes (Private)
    // *************************************************************************

    std::set<int> groups;

    ResourceSet clusters;
    ResourceSet hosts;
    ResourceSet datastores;
    ResourceSet vnets;

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
     *  Bootstraps the database table(s) associated to the Vdc
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the Vdc in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the Vdc's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Drops the Vdc from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;

    /**
     *  Factory method for Vdc templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>();
    }
};

#endif /*VDC_H_*/




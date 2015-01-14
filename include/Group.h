/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs      */
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

#ifndef GROUP_H_
#define GROUP_H_

#include "PoolSQL.h"
#include "ObjectCollection.h"
#include "User.h"
#include "QuotasSQL.h"
#include "Template.h"

using namespace std;

/**
 *  The Group class.
 */
class Group : public PoolObjectSQL, ObjectCollection
{
public:

    /**
     * Function to print the Group object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     * Function to print the Group object into a string in
     * XML format. The extended XML includes the default quotas
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Adds this user's ID to the set.
     *    @param id of the user to be added to the group
     *    @return 0 on success
     */
    int add_user(int id)
    {
        return add_collection_id(id);
    }

    /**
     *  Deletes this users's ID from the set.
     *    @param id of the user to be deleted from the group
     *    @return 0 on success
     */
    int del_user(int id)
    {
        return del_collection_id(id);
    }

    /**
     * Adds a resource provider
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_resource_provider(int zone_id, int cluster_id, string& error_msg);

    /**
     * Deletes a resource provider
     * @param zone_id ID of the zone
     * @param cluster_id ID of the cluster
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_resource_provider(int zone_id, int cluster_id, string& error_msg);

    /**
     *  Object quotas, provides set and check interface
     */
    GroupQuotas quota;

    /**
     *  Writes/updates the Group quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_quotas(SqlDB *db)
    {
        return quota.update(oid, db);
    };

    /**
     *  Factory method for Group templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class GroupPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Group(int id, const string& name):
        PoolObjectSQL(id,GROUP,name,-1,-1,"","",table),
        ObjectCollection("USERS"),
        quota()
    {
        // Allow users in this group to see it
        group_u = 1;

        obj_template = new Template;
    };

    virtual ~Group()
    {
        delete obj_template;
    };

    // *************************************************************************
    // Attributes (Private)
    // *************************************************************************

    set<pair<int,int> > providers;

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
     *  Bootstraps the database table(s) associated to the Group
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss_group(Group::db_bootstrap);

        return db->exec(oss_group);
    };

    /**
     *  Reads the Group (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db);

    /**
     *  Reads the Group (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @param name of the group
     *    @param uid of the owner
     *
     *    @return 0 on success
     */
    int select(SqlDB * db, const string& name, int uid);

    /**
     *  Reads the Group quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select_quotas(SqlDB * db);

    /**
     *  Drops the group from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db);

    /**
     *  Writes the Group in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Group's data fields in the database. This method does
     *  not update the Group's Quotas
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    };

    /**
     * Function to print the Group object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, default quotas are included
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, bool extended) const;
};

#endif /*GROUP_H_*/

/* ------------------------------------------------------------------------ */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)           */
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

using namespace std;

/**
 *  The Group class.
 */
class Group : public PoolObjectSQL, ObjectCollection
{
public:
    /**
     *  Function to write a Group on an output stream
     */
     friend ostream& operator<<(ostream& os, Group& group);

    /**
     * Function to print the Group object into a string in XML format
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
     *  Adds this object's ID to the set. The object MUST be a User, locked.
     *  The group's ID is added to the User's set.
     *    @param object The new object
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add_collection_id(PoolObjectSQL* object);

    /**
     *  Deletes this object's ID from the set. The object MUST be a User,
     *  locked. The group's ID is deleted form the User's set.
     *    @param object The object
     *
     *    @return 0 on success, -1 if the ID was not in the set
     */
    int del_collection_id(PoolObjectSQL* object);


private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class GroupPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Group(int id, int uid, const string& name);

    virtual ~Group();

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
     *    @return 0 one success
    */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Bootstraps the database table(s) associated to the Group
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss(Group::db_bootstrap);

        db->exec(oss);
    };

    /**
     *  Writes the Group in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Group's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db);


    // *************************************************************************
    // ID Set management
    // *************************************************************************

    int add_del_collection_id(User* object, bool add);
};

#endif /*GROUP_H_*/

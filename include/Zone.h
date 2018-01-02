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

#ifndef ZONE_H_
#define ZONE_H_

#include "PoolObjectSQL.h"
#include "NebulaLog.h"

using namespace std;

class ZoneServers;
class ZoneServer;
/**
 *  The Zone class.
 */
class Zone : public PoolObjectSQL
{
public:

    /**
     * Function to print the Zone object into a string in XML format
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
     *  Add servers to this zone
     *    @param tmpl with SERVER definitions
     *    @param sid id of the new sever
     *    @param xmlep endpoint of the new server
     *    @param error
     *
     *    @return 0 on success, -1 otherwise
     */
    int add_server(Template& tmpl, int& sid, string& xmlep, string& error);

    /**
     *  Delete a server from this zone
     *    @param it of the SERVER
     *    @param error if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int delete_server(int id, string& error);

    /**
     *  @return the servers in this zone
     */
    ZoneServers * get_servers()
    {
        return servers;
    }

    /**
	 *  @param server_id
     *  @return the server
     */
	ZoneServer * get_server(int server_id);

    /**
     *  @return the number of servers in this zone
     */
    unsigned int servers_size();

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class ZonePool;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    Zone(int id, Template* zone_template);

    ~Zone();

    // -------------------------------------------------------------------------
    // Zone servers
    // -------------------------------------------------------------------------
    Template servers_template;

    ZoneServers * servers;

    // -------------------------------------------------------------------------
    // DataBase implementation (Private)
    // -------------------------------------------------------------------------
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
     *  Bootstraps the database table(s) associated to the Zone
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(Zone::db_bootstrap);

        return db->exec_local_wr(oss);
    };

    /**
     *  Writes the Zone in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Zone's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for Zone templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error);
};

#endif /*ZONE_H_*/

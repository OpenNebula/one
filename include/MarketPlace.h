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

#ifndef MARKETPLACE_H_
#define MARKETPLACE_H_

#include "PoolSQL.h"
#include "ObjectCollection.h"
#include "MarketPlaceTemplate.h"
#include "MarketPlaceApp.h"
#include "ActionSet.h"

/**
 *  The MarketPlace class. It represents an abstract container for OpenNebula
 *  objects (Image, VM Templates or Flows)
 */
class MarketPlace : public PoolObjectSQL
{
public:
    /**
     * Function to print the MarketPlace object into a string in XML format
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
     *  Adds this marketplace app's ID to the set.
     *    @param id of the app to be added to the MarketPlace
     *    @return 0 on success
     */
    int add_marketapp(int id)
    {
        return marketapps.add(id);
    };

    /**
     *  Deletes this image's ID from the set.
     *    @param id of the image to be deleted from the MarketPlace
     *    @return 0 on success
     */
    int del_marketapp(int id)
    {
        return marketapps.del(id);
    };

    /**
     *  Returns a copy of the Image IDs set
     */
    set<int> get_marketapp_ids()
    {
        return marketapps.clone();
    }

    /**
     *  Retrieves marketplace mad name
     *    @return string mp mad name
     */
    const string& get_market_mad() const
    {
        return market_mad;
    };

    /**
     *  Get zone for this market
     *    @return zone id
     */
    int get_zone_id() const
    {
        return zone_id;
    };
    /**
     *  Set monitor information for the MarketPlace
     *    @param data template with monitor information
     */
    void update_monitor(const Template& data);

    /**
     *  Check if action is supported for the apps
     *    @param action
     *    @return true if it is supported
     */
    bool is_action_supported(MarketPlaceApp::Action action) const
    {
        return supported_actions.is_set(action);
    }

    bool is_public() const;

private:

    friend class MarketPlacePool;

    // *************************************************************************
    // MarketPlace Attributes
    // *************************************************************************
    /**
     * Name of the marketplace driver used to import apps
     */
    string market_mad;

    /**
     * Total capacity in MB
     */
     long long total_mb;

    /**
     * Available capacity in MB
     */
     long long free_mb;

    /**
     * Used capacity in MB
     */
     long long used_mb;

    /**
     * Zone where this market lives
     */
     int zone_id;

    /**
     *  Supported actions on MarketPlaceApps
     */
    ActionSet<MarketPlaceApp::Action> supported_actions;

    /**
     *  Collection of MarketPlaceApps in this MarketPlace
     */
    ObjectCollection marketapps;

    // *************************************************************************
    // Constructor
    // *************************************************************************
    MarketPlace(
            int                  uid,
            int                  gid,
            const string&        uname,
            const string&        gname,
            int                  umask,
            MarketPlaceTemplate* mp_template);

    virtual ~MarketPlace();

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Builds the marketplace from the template. This function MUST be called
     *  with the template initialized
     *    @param error_str describing the error
     *    @return 0 on success;
     */
    int parse_template(string& error_str);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the MarketPlace
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the MarketPlace in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the MarketPlace's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for marketplace templates
     */
    Template * get_new_template() const
    {
        return new MarketPlaceTemplate;
    }

    /**
     *  Verify the proper definition of the Market by checking the
     *  attributes of the MARKET_MAD_CONF parameter
     */
    int set_market_mad(string &tm_mad, string &error_str);

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error);
};

#endif /*MARKETPLACE_H*/


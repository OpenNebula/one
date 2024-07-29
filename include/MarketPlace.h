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
    enum MarketPlaceState
    {
        ENABLED  = 0, /**< Enabled */
        DISABLED = 1  /**< Disabled */
    };

    /**
     *  Functions to convert to/from string the MarketPlace states
     */
    static int str_to_state(std::string& st, MarketPlaceState& state)
    {
        one_util::toupper(st);

        state = ENABLED;

        if ( st == "ENABLED" )
        {
            state = ENABLED;
        }
        else if ( st == "DISABLED" )
        {
            state = DISABLED;
        }
        else
        {
            return -1;
        }

        return 0;
    }

    static std::string state_to_str(MarketPlaceState state)
    {
        std::string st = "";

        switch (state)
        {
            case ENABLED:
                st = "ENABLED";
                break;
            case DISABLED:
                st = "DISABLED";
                break;
        }

        return st;
    }

    virtual ~MarketPlace() = default;

    /**
     * Function to print the MarketPlace object into a string in XML format
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
     *  Deletes all apps images from the set.
     */
    void clear_marketapps()
    {
        marketapps.clear();
    }

    /**
     *  Returns a copy of the Image IDs set
     */
    const std::set<int>& get_marketapp_ids() const
    {
        return marketapps.get_collection();
    }

    /**
     *  Retrieves marketplace mad name
     *    @return string mp mad name
     */
    const std::string& get_market_mad() const
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

    /**
     *  @return true if this is a public (external) marketplace
     */
    bool is_public() const;

    /**
     *  Disbale de monitor action for this marketplace
     *    @return true if the monitor was enabled
     */
    bool disable_monitor()
    {
        bool enabled = supported_actions.is_set(MarketPlaceApp::MONITOR);

        supported_actions.clear(MarketPlaceApp::MONITOR);

        return enabled;
    }
    /**
     *   Enable the monitor action
     */
    void enable_monitor()
    {
        supported_actions.set(MarketPlaceApp::MONITOR);
    }

    MarketPlaceState get_state() const
    {
        return state;
    }

    /**
     * Enable or disable the MarketPlace
     */
    void enable(bool enabled)
    {
        if (enabled)
        {
            state = ENABLED;
        }
        else
        {
            state = DISABLED;
        }
    }

private:

    friend class MarketPlacePool;

    // *************************************************************************
    // MarketPlace Attributes
    // *************************************************************************

    /**
     * State of the marketplace
     */
    MarketPlaceState state;

    /**
     * Name of the marketplace driver used to import apps
     */
    std::string market_mad;

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
            const std::string&   uname,
            const std::string&   gname,
            int                  umask,
            std::unique_ptr<MarketPlaceTemplate> mp_template);

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Builds the marketplace from the template. This function MUST be called
     *  with the template initialized
     *    @param error_str describing the error
     *    @return 0 on success;
     */
    int parse_template(std::string& error_str);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the MarketPlace
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the MarketPlace in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the MarketPlace's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for marketplace templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<MarketPlaceTemplate>();
    }

    /**
     *  Verify the proper definition of the Market by checking the
     *  attributes of the MARKET_MAD_CONF parameter
     */
    int set_market_mad(std::string &tm_mad, std::string &error_str);

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;
};

#endif /*MARKETPLACE_H*/


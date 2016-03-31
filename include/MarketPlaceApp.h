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

#ifndef MARKETPLACEAPP_H_
#define MARKETPLACEAPP_H_

#include "PoolSQL.h"
#include "ObjectCollection.h"
#include "MarketPlaceAppTemplate.h"

/**
 *  The MarketPlaceApp class. It represents an abstract application for
 *  OpenNebula objects (Image, VM Templates or Flows)
 */
class MarketPlaceApp : public PoolObjectSQL
{
public:
    /**
     *  MarketPlaceApp actions
     */
    enum Action
    {
        NONE    = 0,
        CREATE  = 1,
        DELETE  = 2,
        MONITOR = 3
    };

    static int action_from_str(string& st, Action& action)
    {
        if (st == "create")
        {
            action = CREATE;
        }
        else if (st == "delete")
        {
            action = DELETE;
        }
        else if (st == "monitor")
        {
            action = MONITOR;
        }
        else
        {
            action = NONE;
            return -1;
        }

        return 0;
    };

    /**
     *  MarketPlaceApp states
     */
    enum State
    {
        INIT      = 0, /** < Initialization state */
        READY     = 1, /** < Ready to use */
        LOCKED    = 2, /** < Operation in process */
        ERROR     = 3, /** < Error state the operation failed*/
        DISABLED  = 4
    };

    /**
     * Returns the string representation of an MarketplaceApp State
     * @param state The state
     * @return the string representation
     */
    static string state_to_str(State state)
    {
        switch(state)
        {
            case INIT:     return "INIT";   break;
            case READY:    return "READY";  break;
            case LOCKED:   return "LOCKED"; break;
            case ERROR:    return "ERROR";  break;
            case DISABLED: return "DISABLED";  break;
            default:     return "";
        }
    };

    /**
     *  MarketPlaceApp container types
     */
    enum Type
    {
		UNKNOWN          = 0, /** < Unknown types     */
        IMAGE            = 1, /** < Image MarketPlace App*/
        VMTEMPLATE       = 2, /** < VM Template MarketPlace App*/
        SERVICE_TEMPLATE = 3  /** < Service Template MarketPlace App*/
    };

    /**
     *  Return the string representation of a MarketPlaceType
     *    @param ob the type
     *    @return the string
     */
    static string type_to_str(Type ob)
    {
        switch (ob)
        {
            case IMAGE:            return "IMAGE"; break;
            case VMTEMPLATE:       return "VMTEMPLATE"; break;
            case SERVICE_TEMPLATE: return "SERVICE_TEMPLATE"; break;
            default:               return "";
        }
    };

    /**
     *  Return the string representation of a MarketPlaceType, By default it will
     *  return IMAGE_MP.
     *    @param str_type string representing the type
     *    @return the MarketPlaceType
     */
    static Type str_to_type(string& str_type);

    /**
     * Function to print the MarketPlaceApp object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(std::string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str);

    /**
     *  Rebuilds the object from base64 encoded template representation
     *    @param str The template string, base64 encoded
     *    @param error_str Returns the error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_template64(const std::string &xml_str, std::string& error_str);

    /**
     *  Copies the special attributes of the App to the template
     *    @param tmp The template object
     *    @param error_str Returns the error reason, if any
     */
    void to_template(Template * tmpl) const;

    /**
     * Enable or disable the app. A disabled app cannot be exported
     * @param enable true to enable
     * @param error_str Returns the error reason, if any
     *
     * @return 0 on success
     */
    int enable(bool enable, std::string& error_str);

    /**
     * Returns the marketplace ID
     */
    int get_market_id() const
    {
        return market_id;
    };

    /**
     * Returns the marketplace name
     */
    const std::string& get_market_name() const
    {
        return market_name;
    };

    /**
     * Updates the marketplace name
     */
    void set_market_name(const std::string& name)
    {
        market_name = name;
    };

    /**
     * Returns the marketplace app type
     *    @return marketplace app type
     */
    Type get_type() const
    {
        return type;
    };

    /**
     * Returns the ID of the object originating this app
     *    @return the image, vmtemplate or flow id
     */
    int get_origin_id() const
    {
        return origin_id;
    };

    const string& get_source() const
    {
        return source;
    }

    const string& get_md5() const
    {
        return md5;
    }

    long long get_size() const
    {
        return size_mb;
    }

    const string& get_format() const
    {
        return format;
    }


    State get_state() const
    {
        return state;
    }

    int get_zone_id() const
    {
        return zone_id;
    }

    //--------------------------------------------------------------------------
    // Set Marketplace app attributes
    //--------------------------------------------------------------------------
    void set_state(State _state)
    {
        state = _state;
    };

    void set_source(const std::string& _source)
    {
        source = _source;
    };

    void set_md5(const std::string& _md5)
    {
        md5 = _md5;
    };

    void set_size(long long _size_mb)
    {
        size_mb = _size_mb;
    };

    void set_format(const std::string&  _format)
    {
        format = _format;
    };

private:

    friend class MarketPlaceAppPool;

    // *************************************************************************
    // MarketPlaceApp Attributes
    // *************************************************************************
    /**
     *  Publishing date
     */
    time_t      regtime;

    /**
     *  Source URL for the marketplace app
     */
    std::string source;

    /**
     *  Source URL for the marketplace app
     */
    std::string md5;

    /**
     *  Size of this app
     */
    long long size_mb;

    /**
     *  Description of the App
     */
    std::string description;

    /**
     *  Version of the app
     */
    std::string version;

    /**
     *  format of the disk images
     */
    std::string format;

    /**
     * App template to import it
     */
    std::string apptemplate64;

    /**
     *  Marketplace ID that holds this app
     */
    int market_id;

    /**
     *  Marketplace name
     */
    std::string market_name;

    /**
     *  Marketplace App state
     */
    State state;

    /**
     * The marketplace type
     */
    Type type;

    /**
     *  Origin of this App
     */
    int origin_id;

    /**
     * ID of the zone where this app lives
     */
    int zone_id;

    // *************************************************************************
    // Constructor
    // *************************************************************************
    MarketPlaceApp(
            int                     uid,
            int                     gid,
            const std::string&      uname,
            const std::string&      gname,
            int                     umask,
            MarketPlaceAppTemplate* app_template);

    virtual ~MarketPlaceApp();

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Builds the market app from the template. This function MUST be called
     *  with apptemplate initialized
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
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

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
    int insert(SqlDB *db, std::string& error_str);

    /**
     *  Writes/updates the MarketPlace's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error);

    /**
     *  Factory method for marketplace app templates
     */
    Template * get_new_template() const
    {
        return new MarketPlaceAppTemplate;
    }
};

#endif /*MARKETPLACEAPP_H*/


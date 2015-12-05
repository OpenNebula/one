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

/**
 *  The MarketPlace class. It represents an abstract container for OpenNebula
 *  objects (Image, VM Templates or Flows)
 */
class MarketPlace : public PoolObjectSQL, ObjectCollection
{
public:
    /**
     *  MarketPlace container types
     */
    enum MarketPlaceType
    {
		UNKNOWN       = 0, /** < Unknown types     */
        IMAGE_MP      = 1, /** < Image MarketPlace */
        VMTEMPLATE_MP = 2, /** < VM Template MarketPlace */
        FLOW_MP       = 3  /** < Flow MarketPlace */
    };

    /**
     *  Return the string representation of a MarketPlaceType
     *    @param ob the type
     *    @return the string
     */
    static string type_to_str(MarketPlaceType ob)
    {
        switch (ob)
        {
            case IMAGE_MP:      return "IMAGE_MP"; break;
            case VMTEMPLATE_MP: return "VMTEMPLATE_MP"; break;
            case FLOW_MP:       return "FLOW_MP"; break;
            default:            return "";
        }
    };

    /**
     *  Return the string representation of a MarketPlaceType, By default it will
     *  return IMAGE_MP.
     *    @param str_type string representing the type
     *    @return the MarketPlaceType
     */
    static MarketPlaceType str_to_type(string& str_type);

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
        return add_collection_id(id);
    };

    /**
     *  Deletes this image's ID from the set.
     *    @param id of the image to be deleted from the MarketPlace
     *    @return 0 on success
     */
    int del_marketapp(int id)
    {
        return del_collection_id(id);
    };

    /**
     *  Returns a copy of the Image IDs set
     */
    set<int> get_marketapp_ids()
    {
        return get_collection_copy();
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
     * Returns the marketplace type
     *    @return marketplace type
     */
    MarketPlaceType get_type() const
    {
        return type;
    };

    /**
     *  Set monitor information for the MarketPlace
     *    @param total_mb
     *    @param free_mb
     *    @param used_mb
     */
    void update_monitor(long long total, long long free, long long used)
    {
        total_mb = total;
        free_mb  = free;
        used_mb  = used;
    }

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
     * The marketplace type
     */
    MarketPlaceType type;

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
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error);
};

#endif /*MARKETPLACE_H*/


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

#include <sstream>
#include "MarketPlace.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Nebula.h"

/* ************************************************************************ */
/* MarketPlace:: Database Definition                                        */
/* ************************************************************************ */

const char * MarketPlace::table = "marketplace_pool";

const char * MarketPlace::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * MarketPlace::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS marketplace_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ************************************************************************ */
/* MarketPlace:: Constructor / Destructor                                   */
/* ************************************************************************ */

MarketPlace::MarketPlace(
    int                   uid,
    int                   gid,
    const std::string&    uname,
    const std::string&    gname,
    int                   umask,
    MarketPlaceTemplate * mp_template):
        PoolObjectSQL(-1, MARKETPLACE, "", uid, gid, uname, gname, table),
        market_mad(""),
        total_mb(0),
        free_mb(0),
        used_mb(0),
        zone_id(-1),
        marketapps("MARKETPLACEAPPS")
{
    if (mp_template != 0)
    {
        obj_template = mp_template;
    }
    else
    {
        obj_template = new MarketPlaceTemplate;
    }

    set_umask(umask);
};

MarketPlace::~MarketPlace()
{
    delete obj_template;
};

/* *************************************************************************** */
/* MartketPlace :: Database Access Functions                                   */
/* *************************************************************************** */

/* -------------------------------------------------------------------------- */

int MarketPlace::set_market_mad(std::string &mad, std::string &error_str)
{
    const VectorAttribute* vatt;
    std::vector <std::string> vrequired_attrs;

    int    rc;
    std::string required_attrs, required_attr, value;

    std::ostringstream oss;

    rc = Nebula::instance().get_market_conf_attribute(mad, vatt);

    if ( rc != 0 )
    {
        goto error_conf;
    }

    rc = vatt->vector_value("REQUIRED_ATTRS", required_attrs);

    if ( rc == -1 ) //No required attributes
    {
        return 0;
    }

    vrequired_attrs = one_util::split(required_attrs, ',');

    for ( std::vector<std::string>::const_iterator it = vrequired_attrs.begin();
         it != vrequired_attrs.end(); it++ )
    {
        required_attr = *it;

        required_attr = one_util::trim(required_attr);
        one_util::toupper(required_attr);

        get_template_attribute(required_attr.c_str(), value);

        if ( value.empty() )
        {
            goto error_required;
        }
    }

    return 0;

error_conf:
    oss << "MARKET_MAD_CONF named \"" << mad << "\" is not defined in oned.conf";
    goto error_common;

error_required:
    oss << "MarketPlace template is missing the \"" << required_attr
        << "\" attribute or it's empty.";

error_common:
    error_str = oss.str();
    return -1;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlace::parse_template(string& error_str)
{
	//MarketPlacePool::allocate checks NAME & ZONE_ID
    erase_template_attribute("NAME", name);
    remove_template_attribute("ZONE_ID");

    get_template_attribute("MARKET_MAD", market_mad);

    if ( market_mad.empty() == true )
    {
        goto error_mad;
    }

    if (set_market_mad(market_mad, error_str) != 0)
    {
        goto error_common;
    }

    return 0;

error_mad:
    error_str = "No marketplace driver (MARKET_MAD) in template.";

error_common:
    NebulaLog::log("MKP", Log::ERROR, error_str);
    return -1;
}

int MarketPlace::insert(SqlDB *db, string& error_str)
{
    return insert_replace(db, false, error_str);
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlace::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    std::ostringstream   oss;

    int rc;
    std::string xml_body;

    char * sql_name;
    char * sql_xml;

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace
    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_name            << "',"
        << "'" <<   sql_xml             << "',"
        <<          uid                 << ","
        <<          gid                 << ","
        <<          owner_u             << ","
        <<          group_u             << ","
        <<          other_u             << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the marketplace to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting marketplace in DB.";
error_common:
    return -1;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

/* *************************************************************************** */
/* MartketPlace :: Template Functions                                          */
/* *************************************************************************** */
std::string& MarketPlace::to_xml(std::string& xml) const
{
	std::ostringstream oss;
	std::string        template_xml;
	std::string        collection_xml;
	std::string        perm_str;


    oss << "<MARKETPLACE>"
			"<ID>"    << oid   << "</ID>"  <<
			"<UID>"   << uid   << "</UID>" <<
			"<GID>"   << gid   << "</GID>" <<
			"<UNAME>" << uname << "</UNAME>" <<
			"<GNAME>" << gname << "</GNAME>" <<
			"<NAME>"  << name  << "</NAME>"  <<
			"<MARKET_MAD>"<<one_util::escape_xml(market_mad)<<"</MARKET_MAD>"<<
			"<ZONE_ID>"   <<one_util::escape_xml(zone_id)<<"</ZONE_ID>"<<
			"<TOTAL_MB>" << total_mb << "</TOTAL_MB>" <<
			"<FREE_MB>"  << free_mb  << "</FREE_MB>"  <<
			"<USED_MB>"  << used_mb  << "</USED_MB>"  <<
            marketapps.to_xml(collection_xml) <<
			perms_to_xml(perm_str) <<
			obj_template->to_xml(template_xml) <<
        "</MARKETPLACE>";

    xml = oss.str();

    return xml;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

static void set_supported_actions(ActionSet<MarketPlaceApp::Action>& as,
        const string& astr)
{
    std::vector<std::string> actions;
    std::vector<std::string>::iterator vit;

    std::string action;
    MarketPlaceApp::Action id;

    actions = one_util::split(astr, ',');

    for (vit = actions.begin() ; vit != actions.end() ; ++vit)
    {
        action = one_util::trim(*vit);

        if ( MarketPlaceApp::action_from_str(action, id) != 0 )
        {
            NebulaLog::log("MKP", Log::ERROR, "Wrong action: " + action);
            continue;
        }

        as.set(id);
    }
}

int MarketPlace::from_xml(const std::string &xml_str)
{
    int rc = 0;
    std::vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // ----- MARKETPLACE base attributes -----
    rc += xpath(oid,   "/MARKETPLACE/ID",    -1);
    rc += xpath(uid,   "/MARKETPLACE/UID",   -1);
    rc += xpath(gid,   "/MARKETPLACE/GID",   -1);
    rc += xpath(uname, "/MARKETPLACE/UNAME", "not_found");
    rc += xpath(gname, "/MARKETPLACE/GNAME", "not_found");
    rc += xpath(name,  "/MARKETPLACE/NAME",  "not_found");

    rc += xpath(market_mad, "/MARKETPLACE/MARKET_MAD", "not_found");
    rc += xpath(zone_id,    "/MARKETPLACE/ZONE_ID", -1);

    rc += xpath<long long>(total_mb, "/MARKETPLACE/TOTAL_MB", 0);
    rc += xpath<long long>(free_mb,  "/MARKETPLACE/FREE_MB",  0);
    rc += xpath<long long>(used_mb,  "/MARKETPLACE/USED_MB",  0);

	// ----- Permissions -----
    rc += perms_from_xml();

	// ----- MARKETPLACEAPP Collection  -----
    ObjectXML::get_nodes("/MARKETPLACE/MARKETPLACEAPPS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += marketapps.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    content.clear();

	// ----- TEMPLATE -----
    ObjectXML::get_nodes("/MARKETPLACE/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    // ------ SUPPORTED ACTIONS, regenerated from oned.conf ------
    const VectorAttribute* vatt;
    string actions;

    if (Nebula::instance().get_market_conf_attribute(market_mad, vatt) == 0)
    {
        actions = vatt->vector_value("APP_ACTIONS");
    }

    if (actions.empty())
    {
        if (market_mad == "http" || market_mad == "s3")
        {
            actions = "create, monitor, delete";
        }
        else if ( market_mad == "one" )
        {
            actions = "create, monitor";
        }
    }

    set_supported_actions(supported_actions, actions);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlace::post_update_template(std::string& error)
{
	std::string new_market_mad;

    erase_template_attribute("MARKET_MAD", new_market_mad);

    if (!new_market_mad.empty())
    {
        if (set_market_mad(new_market_mad, error) != 0)
        {
            add_template_attribute("MARKET_MAD", market_mad);
            return -1;
        }

        market_mad = new_market_mad;
    }

    add_template_attribute("MARKET_MAD", market_mad);

	return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlace::update_monitor(const Template& data)
{
    data.get("TOTAL_MB", total_mb);
    data.get("FREE_MB",  free_mb);
    data.get("USED_MB",  used_mb);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool MarketPlace::is_public() const
{
    const VectorAttribute* vatt;
    bool _public = false;

    if (Nebula::instance().get_market_conf_attribute(market_mad, vatt) == 0)
    {
        vatt->vector_value("PUBLIC", _public);
    }

    return _public;
}

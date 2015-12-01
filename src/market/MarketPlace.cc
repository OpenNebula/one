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
    MarketPlaceTemplate*  mp_template):
        PoolObjectSQL(-1, MARKETPLACE, "", uid, gid, uname, gname, table),
        ObjectCollection("MARKETPLACEAPPS"),
        mp_mad(""),
        type(IMAGE_MP),
        total_mb(0),
        free_mb(0),
        used_mb(0)
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

int MarketPlace::insert(SqlDB *db, string& error_str)
{
    std::ostringstream oss;

    std::string s_mp_type;

    // -------------------------------------------------------------------------
    // Check default marketplace attributes
    // -------------------------------------------------------------------------

	//MarketPlacePool::allocate checks NAME
    erase_template_attribute("NAME", name);

    get_template_attribute("MP_MAD", mp_mad);

    if ( mp_mad.empty() == true )
    {
        goto error_mad;
    }

    erase_template_attribute("TYPE", s_mp_type);

    type = str_to_type(s_mp_type);

	if ( type == UNKNOWN )
	{
		goto error_type;
	}

    add_template_attribute("TYPE", type_to_str(type));

    //--------------------------------------------------------------------------

    return insert_replace(db, false, error_str);

error_mad:
    error_str = "No MarketPlace driver (MP_MAD) in template.";
    goto error_common;
error_type:
	error_str = "Unknown MarketPlace type: " + s_mp_type;
	goto error_common;

error_common:
    NebulaLog::log("MARKETPLACE", Log::ERROR, error_str);
    return -1;
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

    error_str = "Error transforming the MarketPlace to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting MarketPlace in DB.";
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

    ObjectCollection::to_xml(collection_xml);

    oss << "<MARKETPLACE>"
			"<ID>"    << oid   << "</ID>"  <<
			"<UID>"   << uid   << "</UID>" <<
			"<GID>"   << gid   << "</GID>" <<
			"<UNAME>" << uname << "</UNAME>" <<
			"<GNAME>" << gname << "</GNAME>" <<
			"<NAME>"  << name  << "</NAME>"  <<
			"<MP_MAD>"<< one_util::escape_xml(mp_mad) << "</MP_MAD>" <<
			"<TOTAL_MB>" << total_mb << "</TOTAL_MB>" <<
			"<FREE_MB>"  << free_mb  << "</FREE_MB>"  <<
			"<USED_MB>"  << used_mb  << "</USED_MB>"  <<
			collection_xml <<
			perms_to_xml(perm_str) <<
			obj_template->to_xml(template_xml) <<
        "</MARKETPLACE>";

    xml = oss.str();

    return xml;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlace::from_xml(const std::string &xml_str)
{
    int rc = 0;
    int itype;
    std::vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // ----- MARKETPLACE base attributes -----
    rc += xpath(oid,    "/MARKETPLACE/ID",     -1);
    rc += xpath(uid,    "/MARKETPLACE/UID",    -1);
    rc += xpath(gid,    "/MARKETPLACE/GID",    -1);
    rc += xpath(uname,  "/MARKETPLACE/UNAME",  "not_found");
    rc += xpath(gname,  "/MARKETPLACE/GNAME",  "not_found");
    rc += xpath(name,   "/MARKETPLACE/NAME",   "not_found");
    rc += xpath(mp_mad, "/MARKETPLACE/MP_MAD", "not_found");
    rc += xpath(itype,  "/MARKETPLACE/TYPE",   -1);

    rc += xpath(total_mb, "/MARKETPLACE/TOTAL_MB", 0);
    rc += xpath(free_mb,  "/MARKETPLACE/FREE_MB",  0);
    rc += xpath(used_mb,  "/MARKETPLACE/USED_MB",  0);

    type = static_cast<MarketPlace::MarketPlaceType>(itype);

	// ----- Permissions -----
    rc += perms_from_xml();

	// ----- MARKETPLACEAPP Collection  -----
    ObjectXML::get_nodes("/MARKETPLACE/MARKETPLACEAPPS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += ObjectCollection::from_xml_node(content[0]);

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

    return 0;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlace::post_update_template(string& error)
{
	std::string new_s_type;
	std::string new_mp_mad;

	MarketPlaceType new_type;

	// -------------------------------------------------------------------------
    // Sanitize TYPE and MP_MAD attributes
    // -------------------------------------------------------------------------
    erase_template_attribute("TYPE", new_s_type);

    new_type = str_to_type(new_s_type);

	if ( new_type == UNKNOWN )
	{
		error = "Unknown MarketPlace type: " + new_s_type;
		return -1;
	}

	type = new_type;

    add_template_attribute("TYPE", type_to_str(type));

    erase_template_attribute("MP_MAD", new_mp_mad);

    if (!new_mp_mad.empty())
    {
        mp_mad = new_mp_mad;
    }

    add_template_attribute("MP_MAD", mp_mad);

	return 0;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

MarketPlace::MarketPlaceType MarketPlace::str_to_type(string& str_type)
{
    one_util::toupper(str_type);

    if ( str_type == "IMAGE_MP" )
    {
        return IMAGE_MP;
    }
    else if ( str_type == "VMTEMPLATE_MP" )
    {
        return VMTEMPLATE_MP;
    }
    else if ( str_type == "FLOW_MP" )
    {
        return FLOW_MP;
    }

    return UNKNOWN;
}


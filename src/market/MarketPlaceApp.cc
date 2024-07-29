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

#include <sstream>
#include "MarketPlaceApp.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "SSLUtil.h"
#include "OneDB.h"

using namespace std;

/* ************************************************************************ */
/* MarketPlaceApp:: Constructor / Destructor                                */
/* ************************************************************************ */

MarketPlaceApp::MarketPlaceApp(
        int                      uid,
        int                      gid,
        const std::string&       uname,
        const std::string&       gname,
        int                      umask,
        unique_ptr<MarketPlaceAppTemplate> app_template):
    PoolObjectSQL(-1, MARKETPLACEAPP, "", uid, gid, uname, gname, one_db::mp_app_table),
    source(""),
    md5(""),
    size_mb(0),
    description(""),
    version(""),
    apptemplate64(""),
    market_id(-1),
    market_name(""),
    state(INIT),
    type(IMAGE),
    zone_id(-1)
{
    if (app_template)
    {
        obj_template = move(app_template);
    }
    else
    {
        obj_template = make_unique<MarketPlaceAppTemplate>();
    }

    set_umask(umask);
}

/* ************************************************************************ */
/* MartketPlaceApp:: Database Access Functions                              */
/* ************************************************************************ */

int MarketPlaceApp::parse_template(string& error_str)
{
    //MarketPlaceAppPool::allocate checks NAME & ZONE_ID
    erase_template_attribute("NAME", name);
    remove_template_attribute("ZONE_ID");

    //Atrributes updated after export
    remove_template_attribute("SOURCE");
    remove_template_attribute("SIZE");
    remove_template_attribute("MD5");
    remove_template_attribute("FORMAT");
    remove_template_attribute("REGTIME");

    regtime = time(NULL);

    std::string str_type;

    get_template_attribute("TYPE", str_type);

    if (!str_type.empty())
    {
        type = str_to_type(str_type);
    }
    else
    {
        type = IMAGE;
    }

    //Known attributes
    //ORIGIN_ID
    //DESCRIPTION
    //APPTEMPLATE64
    //VERSION
    if (!get_template_attribute("ORIGIN_ID", origin_id))
    {
        goto error_origin;
    }

    remove_template_attribute("ORIGIN_ID");

    get_template_attribute("DESCRIPTION", description);

    get_template_attribute("APPTEMPLATE64", apptemplate64);

    get_template_attribute("VERSION", version);

    if (version.empty())
    {
        version = "0.0";
    }

    if ( type == Type::VMTEMPLATE || type == Type::SERVICE_TEMPLATE )
    {
        state = READY;
    }
    else
    {
        state = LOCKED;
    }

    return 0;

error_origin:
    error_str = "Missing ORIGIN_ID for the MARKETPLACEAPP";

    NebulaLog::log("MKP", Log::ERROR, error_str);
    return -1;
}

int MarketPlaceApp::insert(SqlDB *db, string& error_str)
{
    return insert_replace(db, false, error_str);
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlaceApp::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    std::ostringstream   oss;

    int rc;
    std::string xml_body;

    char * sql_name;
    char * sql_xml;

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

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
        oss << "UPDATE " << one_db::mp_app_table << " SET "
            << "name = '"   << sql_name << "', "
            << "body = '"   << sql_xml  << "', "
            << "uid = "     << uid      << ", "
            << "gid = "     << gid      << ", "
            << "owner_u = " << owner_u  << ", "
            << "group_u = " << group_u  << ", "
            << "other_u = " << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::mp_app_table
            << " (" <<  one_db::mp_app_db_names << ") VALUES ("
            <<          oid                 << ","
            << "'" <<   sql_name            << "',"
            << "'" <<   sql_xml             << "',"
            <<          uid                 << ","
            <<          gid                 << ","
            <<          owner_u             << ","
            <<          group_u             << ","
            <<          other_u             << ")";
    }

    db->free_str(sql_name);
    db->free_str(sql_xml);

    rc = db->exec_wr(oss);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the marketplace app to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting marketplace app in DB.";
error_common:
    return -1;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlaceApp::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::mp_app_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

/* *************************************************************************** */
/* MartketPlaceApp :: Template Functions                                          */
/* *************************************************************************** */
std::string& MarketPlaceApp::to_xml(std::string& xml) const
{
    std::ostringstream oss;
    std::string        template_xml;
    std::string        perm_str;
    string lock_str;

    oss << "<MARKETPLACEAPP>"
        "<ID>"             << oid           << "</ID>"  <<
        "<UID>"            << uid           << "</UID>" <<
        "<GID>"            << gid           << "</GID>" <<
        "<UNAME>"          << uname         << "</UNAME>" <<
        "<GNAME>"          << gname         << "</GNAME>" <<
        lock_db_to_xml(lock_str) <<
        "<REGTIME>"        << regtime       << "</REGTIME>" <<
        "<NAME>"           << name          << "</NAME>" <<
        "<ZONE_ID>"   << one_util::escape_xml(zone_id)  << "</ZONE_ID>" <<
        "<ORIGIN_ID>" << one_util::escape_xml(origin_id)<< "</ORIGIN_ID>" <<
        "<SOURCE>"    << one_util::escape_xml(source)   << "</SOURCE>" <<
        "<MD5>"       << one_util::escape_xml(md5)      << "</MD5>" <<
        "<SIZE>"           << size_mb       << "</SIZE>" <<
        "<DESCRIPTION>"   << one_util::escape_xml(description)   << "</DESCRIPTION>" <<
        "<VERSION>"       << one_util::escape_xml(version)       << "</VERSION>" <<
        "<FORMAT>"        << one_util::escape_xml(format)        << "</FORMAT>" <<
        "<APPTEMPLATE64>" << one_util::escape_xml(apptemplate64) << "</APPTEMPLATE64>" <<
        "<MARKETPLACE_ID>" << market_id     << "</MARKETPLACE_ID>" <<
        "<MARKETPLACE>"    << market_name   << "</MARKETPLACE>" <<
        "<STATE>"          << state         << "</STATE>" <<
        "<TYPE>"           << type          << "</TYPE>"  <<
        perms_to_xml(perm_str) <<
        obj_template->to_xml(template_xml) <<
        "</MARKETPLACEAPP>";

    xml = oss.str();

    return xml;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlaceApp::from_xml(const std::string &xml_str)
{
    int rc = 0;
    int istate;
    int itype;
    std::vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // ----- MARKETPLACEAPP base attributes -----
    rc += xpath(oid,          "/MARKETPLACEAPP/ID", -1);
    rc += xpath(uid,          "/MARKETPLACEAPP/UID", -1);
    rc += xpath(gid,          "/MARKETPLACEAPP/GID", -1);
    rc += xpath(uname,        "/MARKETPLACEAPP/UNAME", "not_found");
    rc += xpath(gname,        "/MARKETPLACEAPP/GNAME", "not_found");
    rc += xpath(name,         "/MARKETPLACEAPP/NAME", "not_found");
    rc += xpath<time_t>(regtime, "/MARKETPLACEAPP/REGTIME", -1);
    rc += xpath(source,       "/MARKETPLACEAPP/SOURCE", "not_found");
    rc += xpath(origin_id,    "/MARKETPLACEAPP/ORIGIN_ID", -1);
    rc += xpath(zone_id,      "/MARKETPLACEAPP/ZONE_ID", -1);
    rc += xpath(istate,       "/MARKETPLACEAPP/STATE", -1);
    rc += xpath(itype,        "/MARKETPLACEAPP/TYPE",  -1);
    rc += xpath(description,  "/MARKETPLACEAPP/DESCRIPTION", "not_found");
    rc += xpath<long long>(size_mb, "/MARKETPLACEAPP/SIZE", -1);
    rc += xpath(version,      "/MARKETPLACEAPP/VERSION", "not_found");
    rc += xpath(md5,          "/MARKETPLACEAPP/MD5", "not_found");
    rc += xpath(format,       "/MARKETPLACEAPP/FORMAT", "not_found");
    rc += xpath(apptemplate64, "/MARKETPLACEAPP/APPTEMPLATE64", "not_found");
    rc += xpath(market_name,  "/MARKETPLACEAPP/MARKETPLACE", "not_found");
    rc += xpath(market_id,    "/MARKETPLACEAPP/MARKETPLACE_ID", -1);

    state = static_cast<State>(istate);
    type  = static_cast<Type>(itype);

    // ----- Permissions -----
    rc += perms_from_xml();

    // ------ Lock -------
    rc += lock_db_from_xml();

    // ----- TEMPLATE -----
    ObjectXML::get_nodes("/MARKETPLACEAPP/TEMPLATE", content);

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

int MarketPlaceApp::post_update_template(string& error)
{
    // -------------------------------------------------------------------------
    // Update well known attributes
    // -------------------------------------------------------------------------
    get_template_attribute("DESCRIPTION",   description);
    get_template_attribute("APPTEMPLATE64", apptemplate64);
    get_template_attribute("VERSION",       version);

    // -------------------------------------------------------------------------
    // Remove non-update attributes
    // -------------------------------------------------------------------------
    remove_template_attribute("SOURCE");
    remove_template_attribute("SIZE");
    remove_template_attribute("MD5");
    remove_template_attribute("FORMAT");
    remove_template_attribute("REGTIME");
    remove_template_attribute("ORIGIN_ID");

    return 0;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

MarketPlaceApp::Type MarketPlaceApp::str_to_type(string& str_type)
{
    one_util::toupper(str_type);

    if ( str_type == "IMAGE" )
    {
        return IMAGE;
    }
    else if ( str_type == "VMTEMPLATE" )
    {
        return VMTEMPLATE;
    }
    else if ( str_type == "SERVICE_TEMPLATE" )
    {
        return SERVICE_TEMPLATE;
    }

    return UNKNOWN;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlaceApp::enable(bool enable, string& error_str)
{
    switch (state)
    {
        case INIT:
        case LOCKED:
        case ERROR:
            break;

        case READY:
        case DISABLED:
            if (enable)
            {
                state = READY;
            }
            else
            {
                state = DISABLED;
            }
            break;
    }

    return 0;
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

void MarketPlaceApp::to_template(Template * tmpl) const
{
    tmpl->replace("FROM_APP_NAME", get_name());
    tmpl->replace("PATH", get_source());
    tmpl->replace("FORMAT", get_format());
    tmpl->replace("FROM_APP_MD5", get_md5());
}

/* --------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------- */

int MarketPlaceApp::from_template64(const std::string &info64, std::string& err)
{
    std::string info;

    ssl_util::base64_decode(info64, info);

    char * error_msg;

    obj_template->clear();

    int rc = obj_template->parse(info, &error_msg);

    if ( rc != 0 )
    {
        err = error_msg;

        free(error_msg);
        return -1;
    }

    state = READY;

    std::string str_type;

    get_template_attribute("TYPE", str_type);

    if (!str_type.empty())
    {
        type = str_to_type(str_type);
    }
    else
    {
        type = IMAGE;
    }

    origin_id = -1;

    remove_template_attribute("TYPE");
    remove_template_attribute("ORIGIN_ID");

    erase_template_attribute("NAME", name);
    erase_template_attribute("SOURCE", source);
    erase_template_attribute("SIZE", size_mb);
    erase_template_attribute("MD5", md5);
    erase_template_attribute("FORMAT", format);
    erase_template_attribute("REGTIME", regtime);

    get_template_attribute("DESCRIPTION", description);
    get_template_attribute("VERSION", version);
    get_template_attribute("APPTEMPLATE64", apptemplate64);

    return 0;
}


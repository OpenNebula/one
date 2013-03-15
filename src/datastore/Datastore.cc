/* ------------------------------------------------------------------------ */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs      */
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
/* ------------------------------------------------------------------------ */

#include "Datastore.h"
#include "GroupPool.h"
#include "NebulaLog.h"
#include "Nebula.h"

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)

const char * Datastore::table = "datastore_pool";

const char * Datastore::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u, cid";

const char * Datastore::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS datastore_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "cid INTEGER, UNIQUE(name))";

/* ************************************************************************ */
/* Datastore :: Constructor/Destructor                                      */
/* ************************************************************************ */

Datastore::Datastore(
        int                 uid,
        int                 gid,
        const string&       uname,
        const string&       gname,
        int                 umask,
        DatastoreTemplate*  ds_template,
        int                 cluster_id,
        const string&       cluster_name):
            PoolObjectSQL(-1,DATASTORE,"",uid,gid,uname,gname,table),
            ObjectCollection("IMAGES"),
            Clusterable(cluster_id, cluster_name),
            ds_mad(""),
            tm_mad(""),
            base_path(""),
            type(IMAGE_DS)
{
    if (ds_template != 0)
    {
        obj_template = ds_template;
    }
    else
    {
        obj_template = new DatastoreTemplate;
    }

    set_umask(umask);

    group_u = 1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::disk_attribute(VectorAttribute * disk)
{
    ostringstream oss;

    oss << oid;

    disk->replace("DATASTORE",      get_name());
    disk->replace("DATASTORE_ID",   oss.str());
    disk->replace("TM_MAD",         get_tm_mad());

    if ( get_cluster_id() != ClusterPool::NONE_CLUSTER_ID )
    {
        oss.str("");
        oss << get_cluster_id();

        disk->replace("CLUSTER_ID", oss.str());
    }

    return 0;
}

/* ************************************************************************ */
/* Datastore :: Database Access Functions                                   */
/* ************************************************************************ */

Datastore::DatastoreType Datastore::str_to_type(string& str_type)
{
    Datastore::DatastoreType dst = IMAGE_DS;

    if (str_type.empty())
    {
        return dst;
    }

    TO_UPPER(str_type);

    if ( str_type == "IMAGE_DS" )
    {
        dst = IMAGE_DS;
    }
    else if ( str_type == "SYSTEM_DS" )
    {
        dst = SYSTEM_DS;
    }
    else if ( str_type == "FILE_DS" )
    {
        dst = FILE_DS;
    }

    return dst;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::insert(SqlDB *db, string& error_str)
{
    int           rc;
    ostringstream oss;
    string        s_disk_type;
    string        s_ds_type;

    Nebula& nd = Nebula::instance();

    // -------------------------------------------------------------------------
    // Check default datastore attributes
    // -------------------------------------------------------------------------

    erase_template_attribute("NAME", name);//DatastorePool::allocate checks NAME

    get_template_attribute("DS_MAD", ds_mad);
    get_template_attribute("TYPE", s_ds_type);

    type = str_to_type(s_ds_type);

    if ( type == SYSTEM_DS )
    {
        if ( !ds_mad.empty() )
        {
            goto error_exclusive;
        }

        ds_mad = "-";
    }
    else if ( ds_mad.empty() == true )
    {
        goto error_ds;
    }

    get_template_attribute("TM_MAD", tm_mad);

    if ( tm_mad.empty() == true )
    {
        goto error_tm;
    }

    oss << nd.get_ds_location() << oid;

    base_path = oss.str();

    disk_type = Image::FILE;

    if ( type == IMAGE_DS )
    {
        erase_template_attribute("DISK_TYPE", s_disk_type);

        if (s_disk_type == "BLOCK")
        {
            disk_type = Image::BLOCK;
        }
        else if (s_disk_type == "CDROM")
        {
            disk_type = Image::CD_ROM;
        }
        else if (s_disk_type == "RBD")
        {
            disk_type = Image::RBD;
        }
    }

    if ( tm_mad.empty() == true )
    {
        goto error_tm;
    }
    //--------------------------------------------------------------------------
    // Insert the Datastore
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_exclusive:
    error_str = "SYSTEM datastores cannot have DS_MAD defined.";
    goto error_common;

error_ds:
    error_str = "No DS_MAD in template.";
    goto error_common;

error_tm:
    error_str = "No TM_MAD in template.";
    goto error_common;

error_common:
    NebulaLog::log("DATASTORE", Log::ERROR, error_str);
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Datastore

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
        <<          other_u             << ","
        <<          cluster_id          << ")";


    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Datastore to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Datastore in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Datastore::to_xml(string& xml) const
{
    ostringstream   oss;
    string          collection_xml;
    string          template_xml;
    string          perms_xml;

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<DATASTORE>"    <<
        "<ID>"          << oid          << "</ID>"          <<
        "<UID>"         << uid          << "</UID>"         <<
        "<GID>"         << gid          << "</GID>"         <<
        "<UNAME>"       << uname        << "</UNAME>"       <<
        "<GNAME>"       << gname        << "</GNAME>"       <<
        "<NAME>"        << name         << "</NAME>"        <<
        perms_to_xml(perms_xml)                             <<
        "<DS_MAD>"      << ds_mad       << "</DS_MAD>"      <<
        "<TM_MAD>"      << tm_mad       << "</TM_MAD>"      <<
        "<BASE_PATH>"   << base_path    << "</BASE_PATH>"   <<
        "<TYPE>"        << type         << "</TYPE>"        <<
        "<DISK_TYPE>"   << disk_type    << "</DISK_TYPE>"   <<
        "<CLUSTER_ID>"  << cluster_id   << "</CLUSTER_ID>"  <<
        "<CLUSTER>"     << cluster      << "</CLUSTER>"     <<
        collection_xml  <<
        obj_template->to_xml(template_xml)                  <<
    "</DATASTORE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::from_xml(const string& xml)
{
    int rc = 0;
    int int_disk_type;
    int int_ds_type;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,          "/DATASTORE/ID",        -1);
    rc += xpath(uid,          "/DATASTORE/UID",       -1);
    rc += xpath(gid,          "/DATASTORE/GID",       -1);
    rc += xpath(uname,        "/DATASTORE/UNAME",     "not_found");
    rc += xpath(gname,        "/DATASTORE/GNAME",     "not_found");
    rc += xpath(name,         "/DATASTORE/NAME",      "not_found");
    rc += xpath(ds_mad,       "/DATASTORE/DS_MAD",    "not_found");
    rc += xpath(tm_mad,       "/DATASTORE/TM_MAD",    "not_found");
    rc += xpath(base_path,    "/DATASTORE/BASE_PATH", "not_found");
    rc += xpath(int_ds_type,  "/DATASTORE/TYPE",    -1);
    rc += xpath(int_disk_type,"/DATASTORE/DISK_TYPE", -1);

    rc += xpath(cluster_id, "/DATASTORE/CLUSTER_ID", -1);
    rc += xpath(cluster,    "/DATASTORE/CLUSTER",    "not_found");

    // Permissions
    rc += perms_from_xml();

    disk_type = static_cast<Image::DiskType>(int_disk_type);
    type      = static_cast<Datastore::DatastoreType>(int_ds_type);

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/IMAGES", content);

    if (content.empty())
    {
        return -1;
    }

    // Set of IDs
    rc += ObjectCollection::from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/TEMPLATE", content);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Datastore::replace_template(const string& tmpl_str, string& error_str)
{
    string new_ds_mad;
    string new_tm_mad;
    string s_ds_type;

    DatastoreType new_ds_type;
    Template *    new_tmpl  = new DatastoreTemplate;

    if ( new_tmpl == 0 )
    {
        error_str = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error_str) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Set the TYPE of the Datastore (class & template)                       */
    /* ---------------------------------------------------------------------- */

    new_tmpl->get("TYPE", s_ds_type);

    if (!s_ds_type.empty())
    {
        new_ds_type = str_to_type(s_ds_type);

        if (get_cluster_id() != ClusterPool::NONE_CLUSTER_ID)//It's in a cluster
        {
            if (type == SYSTEM_DS && new_ds_type != SYSTEM_DS)
            {
                error_str = "Datastore is associated to a cluster, and it is "
                            "the SYSTEM_DS, remove it from cluster first to "
                            "update its type.";

                delete new_tmpl;
                return -1;
            }
            else if (new_ds_type == SYSTEM_DS && type != SYSTEM_DS)
            {
                error_str = "Datastore is associated to a cluster, cannot set "
                            "type to SYSTEM_DS. Remove it from cluster first "
                            "to update its type.";

                delete new_tmpl;
                return -1;
            }
        }
    }
    else //No TYPE in the new Datastore template
    {
        new_ds_type = type;
    }

    /* --- Update the Datastore template --- */

    delete obj_template;

    obj_template = new_tmpl;

    /* ---------------------------------------------------------------------- */
    /* Set the TYPE of the Datastore (class & template)                       */
    /* ---------------------------------------------------------------------- */

    if ( oid == DatastorePool::SYSTEM_DS_ID )
    {
        type = SYSTEM_DS;
    }
    else
    {
        type = new_ds_type;
    }

    replace_template_attribute("TYPE", type_to_str(type));

    /* ---------------------------------------------------------------------- */
    /* Set the DS_MAD of the Datastore (class & template)                     */
    /* ---------------------------------------------------------------------- */

    if ( type == SYSTEM_DS )
    {
        new_ds_mad = "-";
    }
    else
    {
        get_template_attribute("DS_MAD", new_ds_mad);
    }

    if ( !new_ds_mad.empty() )
    {
        ds_mad = new_ds_mad;
    }

    replace_template_attribute("DS_MAD", ds_mad);

    /* ---------------------------------------------------------------------- */
    /* Set the TM_MAD of the Datastore (class & template)                     */
    /* ---------------------------------------------------------------------- */

    get_template_attribute("TM_MAD", new_tm_mad);

    if ( !new_tm_mad.empty() )
    {
        tm_mad = new_tm_mad;
    }
    else
    {
        replace_template_attribute("TM_MAD", tm_mad);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */


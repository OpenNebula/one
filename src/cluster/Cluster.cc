/* ------------------------------------------------------------------------ */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems              */
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

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "Cluster.h"
#include "GroupPool.h"
#include "Nebula.h"

const char * Cluster::table = "cluster_pool";

const char * Cluster::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Cluster::db_bootstrap = "CREATE TABLE IF NOT EXISTS cluster_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

const char * Cluster::datastore_table = "cluster_datastore_relation";
const char * Cluster::datastore_db_names = "cid, oid";
const char * Cluster::datastore_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS cluster_datastore_relation ("
    "cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid))";

const char * Cluster::network_table = "cluster_network_relation";
const char * Cluster::network_db_names = "cid, oid";
const char * Cluster::network_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS cluster_network_relation ("
    "cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid))";

const char * Cluster::bitmap_table = "cluster_vnc_bitmap";

/* ************************************************************************** */
/* Cluster :: Constructor/Destructor                                          */
/* ************************************************************************** */

Cluster::Cluster(
        int id,
        const string& name,
        ClusterTemplate*  cl_template,
        const VectorAttribute& vnc_conf):
            PoolObjectSQL(id,CLUSTER,name,-1,-1,"","",table),
            hosts("HOSTS"),
            datastores("DATASTORES"),
            vnets("VNETS"),
            vnc_bitmap(vnc_conf, id, bitmap_table)
{
    if (cl_template != 0)
    {
        obj_template = cl_template;
    }
    else
    {
        obj_template = new ClusterTemplate;
    }

    add_template_attribute("RESERVED_CPU", "");
    add_template_attribute("RESERVED_MEM", "");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::check_drop(string& error_msg)
{
    ostringstream oss;

    if ( hosts.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << hosts.size() << " hosts.";

        goto error_common;
    }

    if ( datastores.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << datastores.size() << " datastores.";

        goto error_common;
    }

    if ( vnets.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << vnets.size() << " vnets.";

        goto error_common;
    }

    return 0;

error_common:
    error_msg = oss.str();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::add_datastore(int id, string& error_msg)
{
   int rc = datastores.add(id);

    if ( rc < 0 )
    {
        error_msg = "Datastore ID is already in the cluster set.";
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::del_datastore(int id, string& error_msg)
{
    int rc = datastores.del(id);

    if ( rc < 0 )
    {
        error_msg = "Datastore ID is not part of the cluster set.";
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::get_default_system_ds(const set<int>& ds_set)
{
    Nebula& nd = Nebula::instance();

    DatastorePool*  dspool = nd.get_dspool();
    Datastore*      ds;

    for (set<int>::const_iterator it = ds_set.begin(); it != ds_set.end(); it++)
    {
        ds = dspool->get(*it, true);

        if (ds == 0)
        {
            continue;
        }

        if (ds->get_type() == Datastore::SYSTEM_DS)
        {
            ds->unlock();

            return *it;
        }

        ds->unlock();
    }

    return -1;
}

/* ************************************************************************** */
/* Cluster :: Database Access Functions                                       */
/* ************************************************************************** */

int Cluster::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // Update the Cluster

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

    if (rc == 0)
    {
        if (db->multiple_values_support())
        {
            set<int>::iterator i;

            rc = 0;

            oss.str("");
            oss << "DELETE FROM " << network_table  << " WHERE cid = " << oid;
            rc += db->exec(oss);

            oss.str("");
            oss << "DELETE FROM " << datastore_table<< " WHERE cid = " << oid;
            rc += db->exec(oss);

            set<int> datastore_set = datastores.get_collection();

            if (!datastore_set.empty())
            {
                oss.str("");
                oss << "INSERT INTO " << datastore_table
                    << " (" << datastore_db_names << ") VALUES ";

                i = datastore_set.begin();

                oss << "(" << oid  << "," << *i << ")";

                for(++i; i != datastore_set.end(); i++)
                {
                    oss << ", (" << oid  << "," << *i << ")";
                }

                rc += db->exec(oss);
            }

            set<int> vnet_set = vnets.get_collection();

            if (!vnet_set.empty())
            {
                oss.str("");
                oss << "INSERT INTO " << network_table
                    << " (" << network_db_names << ") VALUES ";

                i = vnet_set.begin();

                oss << "(" << oid  << "," << *i << ")";

                for(++i; i != vnet_set.end(); i++)
                {
                    oss << ", (" << oid  << "," << *i << ")";
                }

                rc += db->exec(oss);
            }
        }
        else
        {
            oss.str("");

            oss <<"BEGIN; "
                <<"DELETE FROM "<< network_table  <<" WHERE cid = "<< oid<< "; "
                <<"DELETE FROM "<< datastore_table<<" WHERE cid = "<< oid<< "; ";

            set<int>::iterator i;

            set<int> datastore_set = datastores.get_collection();

            for(i = datastore_set.begin(); i != datastore_set.end(); i++)
            {
                oss << "INSERT INTO " << datastore_table
                    << " (" << datastore_db_names << ") VALUES ("
                    << oid  << ","
                    << *i   << "); ";
            }

            set<int> vnet_set = vnets.get_collection();

            for(i = vnet_set.begin(); i != vnet_set.end(); i++)
            {
                oss << "INSERT INTO " << network_table
                    << " (" << network_db_names << ") VALUES ("
                    << oid  << ","
                    << *i   << "); ";
            }

            oss << "COMMIT";

            rc = db->exec(oss);
        }
    }

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Cluster to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Cluster in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Cluster::to_xml(string& xml) const
{
    ostringstream   oss;
    string          host_collection_xml;
    string          ds_collection_xml;
    string          vnet_collection_xml;
    string          template_xml;

    oss <<
    "<CLUSTER>"  <<
        "<ID>"          << oid          << "</ID>"          <<
        "<NAME>"        << name         << "</NAME>"        <<
        hosts.to_xml(host_collection_xml)    <<
        datastores.to_xml(ds_collection_xml) <<
        vnets.to_xml(vnet_collection_xml)    <<
        obj_template->to_xml(template_xml)   <<
    "</CLUSTER>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/CLUSTER/ID",          -1);
    rc += xpath(name,       "/CLUSTER/NAME",        "not_found");

    // Set oneadmin as the owner
    set_user(0,"");

    // Set the Cluster ID as the cluster it belongs to
    set_group(oid, name);

    // Get associated classes
    rc += hosts.from_xml(this, "/CLUSTER/");
    rc += datastores.from_xml(this, "/CLUSTER/");
    rc += vnets.from_xml(this, "/CLUSTER/");

    ObjectXML::get_nodes("/CLUSTER/TEMPLATE", content);

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


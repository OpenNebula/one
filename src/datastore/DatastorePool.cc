/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include "DatastorePool.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "DatastoreTemplate.h"
#include "ClusterPool.h"
#include "ImageManager.h"

#include <stdexcept>

using namespace std;

/* -------------------------------------------------------------------------- */
/* There is a default datastore boostrapped by the core:                      */
/* The first 100 IDs are reserved for system datastores. Regular ones start   */
/* from ID 100                                                                */
/* -------------------------------------------------------------------------- */

const string DatastorePool::SYSTEM_DS_NAME = "system";
const int    DatastorePool::SYSTEM_DS_ID   = 0;

const string DatastorePool::DEFAULT_DS_NAME = "default";
const int    DatastorePool::DEFAULT_DS_ID   = 1;

const string DatastorePool::FILE_DS_NAME = "files";
const int    DatastorePool::FILE_DS_ID   = 2;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

DatastorePool::DatastorePool(
        SqlDB * db,
        const vector<const SingleAttribute *>& _inherit_attrs,
        const vector<const SingleAttribute *>& encrypted_attrs) :
    PoolSQL(db, one_db::ds_table)

{
    ostringstream oss;
    string        error_str;

    for (auto sattr : _inherit_attrs)
    {
        inherit_attrs.push_back(sattr->value());
    }

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int      rc;
        set<int> cluster_ids;

        cluster_ids.insert(ClusterPool::DEFAULT_CLUSTER_ID);

        // ---------------------------------------------------------------------
        // Create the system datastore
        // ---------------------------------------------------------------------

        oss << "NAME   = " << SYSTEM_DS_NAME << endl
            << "TYPE   = SYSTEM_DS" << endl
            << "TM_MAD = ssh";

        auto ds_tmpl = make_unique<DatastoreTemplate>();
        rc = ds_tmpl->parse_str_or_xml(oss.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        allocate(UserPool::ONEADMIN_ID,
                 GroupPool::ONEADMIN_ID,
                 UserPool::oneadmin_name,
                 GroupPool::ONEADMIN_NAME,
                 0137,
                 move(ds_tmpl),
                 &rc,
                 cluster_ids,
                 error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        // ---------------------------------------------------------------------
        // Create the default datastore
        // ---------------------------------------------------------------------
        oss.str("");

        oss << "NAME   = "   << DEFAULT_DS_NAME << endl
            << "TYPE   = IMAGE_DS" << endl
            << "DS_MAD = fs" << endl
            << "TM_MAD = ssh";

        ds_tmpl = make_unique<DatastoreTemplate>();
        rc = ds_tmpl->parse_str_or_xml(oss.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        allocate(UserPool::ONEADMIN_ID,
                 GroupPool::ONEADMIN_ID,
                 UserPool::oneadmin_name,
                 GroupPool::ONEADMIN_NAME,
                 0137,
                 move(ds_tmpl),
                 &rc,
                 cluster_ids,
                 error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        // ---------------------------------------------------------------------
        // Create the default file datastore
        // ---------------------------------------------------------------------
        oss.str("");

        oss << "NAME   = "   << FILE_DS_NAME << endl
            << "TYPE   = FILE_DS" << endl
            << "DS_MAD = fs" << endl
            << "TM_MAD = ssh";

        ds_tmpl = make_unique<DatastoreTemplate>();
        rc = ds_tmpl->parse_str_or_xml(oss.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        allocate(UserPool::ONEADMIN_ID,
                 GroupPool::ONEADMIN_ID,
                 UserPool::oneadmin_name,
                 GroupPool::ONEADMIN_NAME,
                 0137,
                 move(ds_tmpl),
                 &rc,
                 cluster_ids,
                 error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        // User created datastores will start from ID 100
        set_lastOID(99);
    }

    // Parse encrypted attributes
    DatastoreTemplate::parse_encrypted(encrypted_attrs);

    return;

error_bootstrap:
    oss.str("");
    oss << "Error trying to create default datastore: " << error_str;
    NebulaLog::log("DATASTORE", Log::ERROR, oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::allocate(
        int                 uid,
        int                 gid,
        const string&       uname,
        const string&       gname,
        int                 umask,
        std::unique_ptr<DatastoreTemplate> ds_template,
        int *               oid,
        const set<int>      &cluster_ids,
        string&             error_str)
{
    Datastore * ds;

    int    db_oid;
    string name;

    ostringstream oss;

    ds = new Datastore(uid, gid, uname, gname, umask,
                       move(ds_template), cluster_ids);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    ds->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    db_oid = exist(name);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(ds, error_str);

    if ( *oid != -1 )
    {
        Nebula& nd        = Nebula::instance();
        ImageManager * im = nd.get_imagem();

        if (im != 0 ) //Do not monitor during bootstrap
        {
            im->monitor_datastore(*oid);
        }
    }

    return *oid;

error_duplicated:
    oss << "NAME is already taken by DATASTORE " << db_oid << ".";
    error_str = oss.str();

error_name:
    delete ds;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Datastore * datastore = static_cast<Datastore*>(objsql);

    int rc;

    if( datastore->images_size() > 0 )
    {
        ostringstream oss;
        oss << "Datastore " << datastore->get_oid() << " is not empty.";
        error_msg = oss.str();
        NebulaLog::log("DATASTORE", Log::ERROR, error_msg);

        return -3;
    }

    rc = datastore->drop(db);

    if( rc != 0 )
    {
        error_msg = "SQL DB error";
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::disk_attribute(int ds_id, VirtualMachineDisk * disk)
{
    auto ds = get_ro(ds_id);

    if (!ds)
    {
        return -1;
    }

    ds->disk_attribute(disk, inherit_attrs);

    return 0;
}


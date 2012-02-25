/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <stdexcept>

/* -------------------------------------------------------------------------- */
/* There is a default datastore boostrapped by the core:                      */
/* The first 100 IDs are reserved for system datastores. Regular ones start   */
/* from ID 100                                                                */
/* -------------------------------------------------------------------------- */

const string DatastorePool::SYSTEM_DS_NAME = "system_ds";
const int    DatastorePool::SYSTEM_DS_ID   = 0;

const string DatastorePool::DEFAULT_DS_NAME = "default_ds";
const int    DatastorePool::DEFAULT_DS_ID   = 1;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

DatastorePool::DatastorePool(SqlDB * db):
                        PoolSQL(db, Datastore::table)
{
    ostringstream oss;
    string        error_str;

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int         rc;
        Datastore * ds;
        DatastoreTemplate * ds_tmpl;

        // ---------------------------------------------------------------------
        // Create the system datastore 
        // ---------------------------------------------------------------------

        oss << "NAME        = " << SYSTEM_DS_NAME       << endl
            << "BASE_PATH   = /var/lib/one/system_ds"   << endl
            << "TYPE        = fs"                       << endl
            << "TM_MAD      = tm_shared";

        ds_tmpl = new DatastoreTemplate;
        rc = ds_tmpl->parse_str_or_xml(oss.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        ds = new Datastore(-1, ds_tmpl);

        rc = PoolSQL::allocate(ds, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        // ---------------------------------------------------------------------
        // Create the default datastore 
        // ---------------------------------------------------------------------
        oss.str("");

        oss << "NAME        = " << DEFAULT_DS_NAME      << endl
            << "BASE_PATH   = /var/lib/one/default_ds"      << endl
            << "TYPE        = fs"                       << endl
            << "TM_MAD      = tm_shared";

        ds_tmpl = new DatastoreTemplate;
        rc = ds_tmpl->parse_str_or_xml(oss.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        ds = new Datastore(-1, ds_tmpl);

        rc = PoolSQL::allocate(ds, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        set_update_lastOID(99);
    }

    return;

error_bootstrap:
    oss.str("");
    oss << "Error trying to create default datastore: " << error_str;
    NebulaLog::log("DATASTORE",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::allocate(DatastoreTemplate * ds_template,
                            int *               oid,
                            string&             error_str)
{
    Datastore *     ds;
    Datastore *     ds_aux = 0;
    string          name;
    ostringstream   oss;

    ds = new Datastore(-1, ds_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    ds->get_template_attribute("NAME", name);

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    ds_aux = get(name,false);

    if( ds_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(ds, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by DATASTORE " << ds_aux->get_oid() << ".";

error_common:
    delete ds;

    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Datastore * datastore = static_cast<Datastore*>(objsql);

    int rc;

    // Return error if the datastore is a default one.
    if( datastore->get_oid() < 100 )
    {
        error_msg = "System Datastores (ID < 100) cannot be deleted.";
        NebulaLog::log("DATASTORE", Log::ERROR, error_msg);
        return -2;
    }

    if( datastore->get_collection_size() > 0 )
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

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

const string DatastorePool::SYSTEM_DS_NAME = "default";
const int    DatastorePool::SYSTEM_DS_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

DatastorePool::DatastorePool(SqlDB * db):PoolSQL(db, Datastore::table)
{
    ostringstream oss;
    string        error_str;

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int         rc;
        Datastore * ds;

        // Build the default datastore
        ds = new Datastore(SYSTEM_DS_ID, SYSTEM_DS_NAME);

        rc = PoolSQL::allocate(ds, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        set_update_lastOID(99);
    }

    return;

error_bootstrap:
    oss << "Error trying to create default datastore: " << error_str;
    NebulaLog::log("DATASTORE",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastorePool::allocate(string name, int * oid, string& error_str)
{
    Datastore *         datastore;
    ostringstream   oss;

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    // Check for duplicates
    datastore = get(name, false);

    if( datastore != 0 )
    {
        goto error_duplicated;
    }

    // Build a new Datastore object
    datastore = new Datastore(-1, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(datastore, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by DATASTORE " << datastore->get_oid() << ".";

error_common:
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

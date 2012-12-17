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

#include "RequestManagerUpdateTemplate.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUpdateTemplate::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int    rc;
    string error_str;

    int    oid  = xmlrpc_c::value_int(paramList.getInt(1));
    string tmpl = xmlrpc_c::value_string(paramList.getString(2));
    
    PoolObjectSQL * object;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);

        return;
    }

    rc = object->replace_template(tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,
                request_error("Cannot update template",error_str),
                att);
        object->unlock();

        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DatastoreUpdateTemplate::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int    rc;
    string error_str;

    int    oid  = xmlrpc_c::value_int(paramList.getInt(1));
    string tmpl = xmlrpc_c::value_string(paramList.getString(2));

    Datastore * object;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = static_cast<DatastorePool*>(pool)->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);

        return;
    }

    Datastore::DatastoreType prev_type = object->get_type();
    Datastore::DatastoreType new_type = Datastore::type_in_template(tmpl);

    int cluster_id = object->get_cluster_id();

    if ( (prev_type == Datastore::SYSTEM_DS || new_type == Datastore::SYSTEM_DS) &&
        prev_type != new_type &&
        cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        object->unlock();

        Cluster *cluster = Nebula::instance().get_clpool()->get(cluster_id, true);

        if ( cluster == 0 )
        {
            failure_response(NO_EXISTS,
                    get_error(object_name(PoolObjectSQL::CLUSTER),cluster_id),
                    att);

            return;
        }

        if ( new_type == Datastore::SYSTEM_DS )
        {
            if ( cluster->get_ds_id() == DatastorePool::SYSTEM_DS_ID )
            {
                // Cluster has a new system ds
                cluster->set_ds_id(oid);
            }
            else
            {
                ostringstream oss;
                oss << "Cannot change datastore type to "
                    << Datastore::type_to_str(Datastore::SYSTEM_DS)
                    << ". Cluster " << cluster_id
                    << " already contains the System Datastore "
                    << cluster->get_ds_id() << ".";

                failure_response(INTERNAL,
                        request_error(oss.str(),error_str),
                        att);

                cluster->unlock();

                return;
            }
        }
        else if ( cluster->get_ds_id() == oid )
        {
            // This was the cluster's system DS, now it must be set to '0'
            cluster->set_ds_id( DatastorePool::SYSTEM_DS_ID );
        }

        Nebula::instance().get_clpool()->update(cluster);
        cluster->unlock();

        object = static_cast<DatastorePool*>(pool)->get(oid,true);

        if ( object == 0 )
        {
            failure_response(NO_EXISTS,
                    get_error(object_name(auth_object),oid),
                    att);

            return;
        }
    }

    rc = object->replace_template(tmpl, error_str);

    if ( rc != 0 )
    {
        // TODO: rollback

        failure_response(INTERNAL,
                request_error("Cannot update template",error_str),
                att);
        object->unlock();

        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}



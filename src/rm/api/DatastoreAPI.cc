/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "DatastoreAPI.h"
#include "ClusterPool.h"
#include "VdcPool.h"
#include "ImagePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DatastoreAPI::enable(int oid,
                                        bool enable_flag,
                                        RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto ds = dspool->get(oid);

    if ( !ds )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( ds->enable(enable_flag, att.resp_msg) != 0  )
    {
        return Request::INTERNAL;
    }

    dspool->update(ds.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastoreAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                       bool recursive,
                       RequestAttributes& att)
{
    int oid = object->get_oid();

    int rc = SharedAPI::drop(std::move(object), recursive, att);

    if (rc != 0)
    {
        return rc;
    }

    // Remove datastore from vdc
    Nebula& nd  = Nebula::instance();
    int zone_id = nd.get_zone_id();

    VdcPool * vdcpool = nd.get_vdcpool();

    std::string error;
    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_datastore(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DatastoreAPI::batch_rename(int oid)
{
    set<int> images;
    string image_name;

    if ( auto datastore = dspool->get_ro(oid) )
    {
        images = datastore->get_image_ids();

        image_name = datastore->get_name();
    }
    else
    {
        return;
    }

    ImagePool * ipool = Nebula::instance().get_ipool();

    for (auto iid : images)
    {
        if (auto image = ipool->get(iid))
        {
            if (image->get_ds_id() == oid)
            {
                image->set_ds_name(image_name);
                ipool->update(image.get());
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode DatastoreAllocateAPI::allocate(const std::string& str_tmpl,
                                                  int cluster_id,
                                                  int& oid,
                                                  RequestAttributes& att)
{
    if ( cluster_id == ClusterPool::NONE_CLUSTER_ID )
    {
        cluster_id = ClusterPool::DEFAULT_CLUSTER_ID;
    }

    return SharedAPI::allocate(str_tmpl, cluster_id, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode DatastoreAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                       int& id,
                                                       RequestAttributes& att,
                                                       int cluster_id,
                                                       const std::string& cluster_name)
{
    unique_ptr<DatastoreTemplate> ds_tmpl(
            static_cast<DatastoreTemplate *>(tmpl.release()));

    set<int> cluster_ids;

    if (cluster_id != ClusterPool::NONE_CLUSTER_ID)
    {
        cluster_ids.insert(cluster_id);
    }

    int rc = dspool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              std::move(ds_tmpl), &id, cluster_ids, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
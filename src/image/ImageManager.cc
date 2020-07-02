/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#include "ImageManager.h"
#include "ImagePool.h"
#include "Nebula.h"
#include "DatastorePool.h"
#include "RaftManager.h"

using namespace std;

const char * ImageManager::image_driver_name = "image_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * image_action_loop(void *arg)
{
    ImageManager *  im;

    if ( arg == 0 )
    {
        return 0;
    }

    NebulaLog::log("ImM",Log::INFO,"Image Manager started.");

    im = static_cast<ImageManager *>(arg);

    im->am.loop(im->timer_period);

    NebulaLog::log("ImM",Log::INFO,"Image Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = 0;

    NebulaLog::log("ImM",Log::INFO,"Loading Image Manager driver.");

    if (_mads.size() > 0)
    {
        vattr = _mads[0];
    }

    if (vattr == nullptr)
    {
        NebulaLog::log("ImM",Log::INFO,"Failed to load Image Manager driver.");
        return -1;
    }

    VectorAttribute image_conf("IMAGE_MAD",vattr->value());

    image_conf.replace("NAME", image_driver_name);

    if (load_driver(&image_conf) != 0)
    {
        NebulaLog::error("ImM", "Unable to load Image Manager driver");
        return -1;
    }

    NebulaLog::info("ImM", "\tImage Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    using namespace std::placeholders; // for _1

    register_action(ImageManagerMessages::UNDEFINED,
            &ImageManager::_undefined);

    register_action(ImageManagerMessages::STAT,
            bind(&ImageManager::_stat, this, _1));

    register_action(ImageManagerMessages::CP,
            bind(&ImageManager::_cp, this, _1));

    register_action(ImageManagerMessages::CLONE,
            bind(&ImageManager::_clone, this, _1));

    register_action(ImageManagerMessages::MKFS,
            bind(&ImageManager::_mkfs, this, _1));

    register_action(ImageManagerMessages::RM,
            bind(&ImageManager::_rm, this, _1));

    register_action(ImageManagerMessages::MONITOR,
            bind(&ImageManager::_monitor, this, _1));

    register_action(ImageManagerMessages::SNAP_DELETE,
            bind(&ImageManager::_snap_delete, this, _1));

    register_action(ImageManagerMessages::SNAP_REVERT,
            bind(&ImageManager::_snap_revert, this, _1));

    register_action(ImageManagerMessages::SNAP_FLATTEN,
            bind(&ImageManager::_snap_flatten, this, _1));

    register_action(ImageManagerMessages::LOG,
            &ImageManager::_log);

    NebulaLog::info("ImM", "Starting Image Manager...");

    string error;
    if (DriverManager::start(error) != 0)
    {
        NebulaLog::error("ImM", "Unable to start Image Manager driver: "
            + error);
        return -1;
    }

    pthread_attr_init(&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&imagem_thread,&pattr,image_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::timer_action(const ActionRequest& ar)
{
    static int mark = 0;
    static int tics = monitor_period;

    mark += timer_period;
    tics += timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("ImM",Log::INFO,"--Mark--");
        mark = 0;
    }

    if ( tics < monitor_period )
    {
        return;
    }

    tics = 0;

    int rc;

    vector<int>           datastores;

    Nebula& nd             = Nebula::instance();
    DatastorePool * dspool = nd.get_dspool();
    RaftManager * raftm    = nd.get_raftm();

    if ( !raftm->is_leader() && !raftm->is_solo() )
    {
        return;
    }

    rc = dspool->list(datastores);

    if ( rc != 0 )
    {
        return;
    }

    for (auto ds : datastores)
    {
        monitor_datastore(ds);
    }

    return;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::monitor_datastore(int ds_id)
{
    static map<int,int> monitor_vm_disk_counter;
    string  ds_data, ds_location, ds_name;

    bool shared;

    Nebula& nd             = Nebula::instance();
    DatastorePool * dspool = nd.get_dspool();

    Datastore::DatastoreType ds_type;

    ostringstream oss;

    const auto* imd = get();

    if ( imd == 0 )
    {
        oss << "Error getting ImageManagerDriver";

        NebulaLog::log("InM", Log::ERROR, oss);
        return;
    }

    Datastore * ds = dspool->get_ro(ds_id);

    if ( ds == 0 )
    {
        return;
    }

    ds->to_xml(ds_data);

    shared     = ds->is_shared();
    ds_type    = ds->get_type();
    ds_name    = ds->get_name();

    ds->unlock();

    ds_location = "";

    switch (ds_type)
    {
        case Datastore::SYSTEM_DS:
            if ( !shared )
            {
                return;
            }

            nd.get_ds_location(ds_location);
            oss << "<DATASTORE_LOCATION>"
                << ds_location
                << "</DATASTORE_LOCATION>";

            if ( monitor_vm_disk > 0)
            {
                bool vm_monitor = --monitor_vm_disk_counter[ds_id] <= 0;
                oss << "<MONITOR_VM_DISKS>"
                    << vm_monitor
                    << "</MONITOR_VM_DISKS>";
                if (vm_monitor)
                {
                    monitor_vm_disk_counter[ds_id] = monitor_vm_disk;
                }
            }

            ds_location = oss.str();

            break;

        case Datastore::FILE_DS:
        case Datastore::IMAGE_DS:
            break;
    }

    unique_ptr<string> drv_msg(ImageManager::format_message("", ds_data, ds_location));

    oss.str("");
    oss << "Monitoring datastore " << ds_name  << " (" << ds_id << ")";

    NebulaLog::log("InM", Log::DEBUG, oss);

    image_msg_t msg(ImageManagerMessages::MONITOR, "", ds_id, *drv_msg);
    imd->write(msg);
}

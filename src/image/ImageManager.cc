/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaLog.h"
#include "ImagePool.h"
#include "Nebula.h"

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

    im->am.loop(im->timer_period, 0);

    NebulaLog::log("ImM",Log::INFO,"Image Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::load_mads(int uid)
{
    ImageManagerDriver *    imagem_mad;
    ostringstream           oss;
    const VectorAttribute * vattr = 0;
    int                     rc;

    NebulaLog::log("ImM",Log::INFO,"Loading Image Manager driver.");

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("ImM",Log::INFO,"Failed to load Image Manager driver.");
        return -1;
    }

    VectorAttribute image_conf("IMAGE_MAD",vattr->value());

    image_conf.replace("NAME",image_driver_name);

    imagem_mad= new ImageManagerDriver(0,image_conf.value(),false,ipool,dspool);

    rc = add(imagem_mad);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tImage Manager loaded";

        NebulaLog::log("ImM",Log::INFO,oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("ImM",Log::INFO,"Starting Image Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&imagem_thread,&pattr,image_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::do_action(const string &action, void * arg)
{
    if (action == ACTION_TIMER)
    {
        timer_action();
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("ImM",Log::INFO,"Stopping Image Manager...");
        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("ImM", Log::ERROR, oss);
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::timer_action()
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
    vector<int>::iterator it;

    Nebula& nd             = Nebula::instance();
    DatastorePool * dspool = nd.get_dspool();

    rc = dspool->list(datastores);

    if ( rc != 0 )
    {
        return;
    }

    for(it = datastores.begin() ; it != datastores.end(); it++)
    {
        monitor_datastore(*it);
    }

    return;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::monitor_datastore(int ds_id)
{
    string  ds_data, ds_location, ds_name;
    string* drv_msg;

    bool shared;

    Nebula& nd             = Nebula::instance();
    DatastorePool * dspool = nd.get_dspool();

    Datastore::DatastoreType ds_type;

    ostringstream oss;

    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        oss << "Error getting ImageManagerDriver";

        NebulaLog::log("InM", Log::ERROR, oss);
        return;
    }

    Datastore * ds = dspool->get(ds_id, true);

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
            ds_location = oss.str();

            break;

        case Datastore::FILE_DS:
        case Datastore::IMAGE_DS:
            break;
    }

    drv_msg = ImageManager::format_message("", ds_data, ds_location);

    oss.str("");
    oss << "Monitoring datastore " << ds_name  << " (" << ds_id << ")";

    NebulaLog::log("InM", Log::DEBUG, oss);

    imd->monitor(ds_id, *drv_msg);

    delete drv_msg;
}

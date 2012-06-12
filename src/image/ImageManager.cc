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

#include "ImageManager.h"
#include "NebulaLog.h"
#include "ImagePool.h"

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

    im->am.loop(0,0);

    NebulaLog::log("ImM",Log::INFO,"Image Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::load_mads(int uid)
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
        return;
    }

    VectorAttribute image_conf("IMAGE_MAD",vattr->value());

    image_conf.replace("NAME",image_driver_name);

    imagem_mad = new ImageManagerDriver(0,image_conf.value(),false,ipool);

    rc = add(imagem_mad);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tImage Manager loaded";

        NebulaLog::log("ImM",Log::INFO,oss);
    }
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
    if (action == ACTION_FINALIZE)
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

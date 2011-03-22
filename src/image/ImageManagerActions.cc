/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::acquire_image(Image *img)
{
    int rc = 0;

    switch (img->get_state())
    {
        case Image::READY:
            img->inc_running();
            img->set_state(Image::USED);
        break;

        case Image::USED:
             if (img->isPersistent())
             {
                 rc = -1;
             }
             else
             {
                 img->inc_running();
             }
        break;

        case Image::DISABLED:
        case Image::LOCKED:
        case Image::ERROR:
        default:
           rc = -1;
        break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::release_image(Image *img)
{
    int rc = 0;
    int rvms;

    switch (img->get_state())
    {
        case Image::USED:
            rvms = img->dec_running();

            if ( img->isPersistent() )
            {
                img->set_state(Image::LOCKED);
            }
            else if ( rvms == 0)
            {
                img->set_state(Image::READY);
            }
        break;

        case Image::DISABLED:
        case Image::READY:
        case Image::ERROR:
        case Image::LOCKED:
        default:
            rc = -1;
        break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::saveas_image(int image_id, const string& src)
{

}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::enable_image(Image *img, bool to_enable)
{
    int rc = 0;

    if ( to_enable == true )
    {
        switch (img->get_state())
        {
            case Image::DISABLED:
            case Image::ERROR:
                img->set_state(Image::READY);
            break;
            default:
                rc = -1;
            break;
        }
    }
    else 
    {
        switch (img->get_state())
        {
            case Image::USED:
            case Image::ERROR:
                img->set_state(Image::DISABLED);
            break;
            default:
                rc = -1;
            break;
        }
    }

    return rc;
}

int ImageManager::register_image(Image *img)
{
    /* TEmplate src.... */
    /* CALL DRIVER */

    
}

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

#include "RequestManagerImage.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageEnable::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributes& att)
{
    int     id          = xmlrpc_c::value_int(paramList.getInt(1));
    bool    enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    string err_msg;

    Nebula&          nd     = Nebula::instance();
    ImageManager *   imagem = nd.get_imagem();

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = imagem->enable_image(id,enable_flag);

    if( rc < 0 )
    {
        if (enable_flag == true)
        {
            err_msg = "Could not enable image";
        }
        else
        {
            err_msg = "Could not disable image";
        }

        failure_response(INTERNAL, request_error(err_msg,""), att);
        return;
    }

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImagePersistent::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributes& att)
{
    int     id              = xmlrpc_c::value_int(paramList.getInt(1));
    bool    persistent_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    Image * image;
    string  err_msg;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    image = static_cast<Image *>(pool->get(id,true));

    if ( image == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    rc = image->persistent(persistent_flag, err_msg);

    if ( rc != 0  )
    {
        if (persistent_flag == true)
        {
            err_msg = "Could not make image persistent: " + err_msg;
        }
        else
        {
            err_msg = "Could not make image non-persistent: " + err_msg;
        }

        failure_response(INTERNAL,request_error(err_msg,""), att);

        image->unlock();
        return;
    }

    pool->update(image);

    image->unlock();

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageChangeType::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributes& att)
{
    int     id   = xmlrpc_c::value_int(paramList.getInt(1));
    string  type = xmlrpc_c::value_string(paramList.getString(2));
    int     rc;

    Image * image;
    string  err_msg;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    image = static_cast<Image *>(pool->get(id,true));

    if ( image == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    rc = image->set_type(type);

    if ( rc != 0  )
    {
        err_msg = "Unknown type " + type;

        failure_response(INTERNAL,request_error(err_msg,""), att);

        image->unlock();
        return;
    }

    pool->update(image);

    image->unlock();

    success_response(id, att);
}

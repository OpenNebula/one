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

#include "QuotaImage.h"
#include "Quotas.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const std::vector<std::string> QuotaImage::IMAGE_METRICS = {"RVMS"};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaImage::check(Template * tmpl, Quotas& default_quotas, string& error)
{
    vector<VectorAttribute*> disk;

    string image_id;
    int num;

    map<string, float> image_request;

    image_request.insert(make_pair("RVMS", 1));

    num = tmpl->get("DISK", disk);

    for (int i = 0 ; i < num ; i++)
    {
        image_id = disk[i]->vector_value("IMAGE_ID");

        if ( !image_id.empty() )
        {
            if ( !check_quota(image_id, image_request, default_quotas, error) )
            {
                return false;
            }
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaImage::del(Template * tmpl)
{

    vector<VectorAttribute*> disk;

    string image_id;
    int num;

    map<string, float> image_request;

    image_request.insert(make_pair("RVMS", 1));

    num = tmpl->get("DISK", disk);

    for (int i = 0 ; i < num ; i++)
    {
        image_id = disk[i]->vector_value("IMAGE_ID");

        del_quota(image_id, image_request);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaImage::get_default_quota(
        const string& id,
        Quotas& default_quotas,
        VectorAttribute **va)
{
    return default_quotas.image_get(id, va);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

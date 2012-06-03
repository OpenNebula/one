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

#include "QuotaDatastore.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaDatastore::check(Template * tmpl,  string& error)
{
    VectorAttribute *   ds_quota; 

    int img_limit  = 0; 
    int size_limit = 0;
    int img_used   = 0;
    int size_used  = 0;

    bool img_ok;
    bool size_ok;

    string ds_id;
    int    size;

    // --------------------- Get data from the Template --------------------

    tmpl->get("DATASTORE", ds_id);

    if ( ds_id.empty() )
    {
        error = "Datastore not defined for image";
        return false;
    }

    if ( tmpl->get("SIZE", size) == false )
    {
        error = "Size not defined for image";
        return false;
    }

    // ------ There are no quotas for this datastore, create a new one ------

    ds_quota = get_quota(ds_id);

    if ( ds_quota == 0 )
    {
        map<string,string> ds_quota;
        ostringstream      size_str;

        size_str << size;

        ds_quota.insert(make_pair("ID",          ds_id));
        ds_quota.insert(make_pair("IMAGES",      "0"));
        ds_quota.insert(make_pair("SIZE",        "0"));
        ds_quota.insert(make_pair("IMAGES_USED", "1"));
        ds_quota.insert(make_pair("SIZE_USED",   size_str.str()));

        add(new VectorAttribute("DATASTORE", ds_quota));

        return true;
    }

    // ------ Check usage limits ------

    ds_quota->vector_value("IMAGES", img_limit);
    ds_quota->vector_value("SIZE",   size_limit);

    ds_quota->vector_value("IMAGES_USED", img_used);
    ds_quota->vector_value("SIZE_USED",   size_used);

    img_ok  = (img_limit == 0) || ((img_used + 1)     <= img_limit );
    size_ok = (size_limit== 0) || ((size_used + size) <= size_limit);

    if ( img_ok && size_ok )
    {
        add_to_quota(ds_quota, "IMAGES_USED", +1);
        add_to_quota(ds_quota, "SIZE_USED",   +size);
    }
    else if (!img_ok)
    {
        ostringstream oss;

        oss << "Maximum number of images limit (" << img_limit << ")"
            << " reached for datastore " << ds_id;

        error = oss.str();
    } 
    else if (!size_ok)
    {
        ostringstream oss;

        oss << "Maximum storage capacity limit (" << size_limit << ")"
            << " reached for datastore " << ds_id;

        error = oss.str();
    }

    return img_ok && size_ok;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaDatastore::del(Template * tmpl)
{
    VectorAttribute * ds_quota;

    string ds_id;
    int    size;

    tmpl->get("DATASTORE", ds_id);

    if ( ds_id.empty() )
    {
        return;
    }

    if ( tmpl->get("SIZE", size) == false )
    {
        return;
    }

    ds_quota = get_quota(ds_id);

    if ( ds_quota == 0 )
    {
        return;
    }

    add_to_quota(ds_quota, "IMAGES_USED", -1);
    add_to_quota(ds_quota, "SIZE_USED",   -size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaDatastore::update_limits(VectorAttribute *       quota, 
                                  const VectorAttribute * va)
{        
    string images_limit;
    string size_limit;
    string ds_id;

    if ( get_limits(va, ds_id, images_limit, size_limit) != 0 )
    {
        return -1;
    }

    quota->replace("IMAGES", images_limit);
    quota->replace("SIZE", size_limit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * QuotaDatastore::new_quota(VectorAttribute * va)
{
    string images_limit = "0";
    string size_limit   = "0";
    string ds_id;

    if ( get_limits(va, ds_id, images_limit, size_limit) != 0 )
    {
        return 0;
    }        

    map<string,string> limits;
 
    limits.insert(make_pair("ID", ds_id));

    limits.insert(make_pair("IMAGES", images_limit));
    limits.insert(make_pair("SIZE",   size_limit));

    limits.insert(make_pair("IMAGES_USED", "0"));
    limits.insert(make_pair("SIZE_USED",   "0"));

    return new VectorAttribute("DATASTORE",limits);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaDatastore::get_limits(const VectorAttribute * va, 
                               string&           ds_id,
                               string&           images, 
                               string&           size)
{
    int images_limit = 0; 
    int size_limit   = 0;

    images = va->vector_value("IMAGES", images_limit);
    size   = va->vector_value("SIZE", size_limit);
    ds_id  = va->vector_value("ID");

    if ( images_limit < 0 || size_limit < 0 || ds_id.empty())
    {
        return -1;
    }

    return 0;           
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

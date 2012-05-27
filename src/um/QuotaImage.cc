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

#include "QuotaImage.h"

bool QuotaImage::check(const string& ds_name, int size,  string& error)
{
    vector<Attribute *> vector_ds_limit;
    VectorAttribute *   ds_limit; 

    int img_limit  = 0; 
    int size_limit = 0;
    int img_used   = 0;
    int size_used  = 0;

    bool img_ok;
    bool size_ok;

    // There is no quotas for this datastore, create a new one
    if ( get(ds_name,vector_ds_limit) == 0 )
    {
        map<string,string> ds_quota;
        VectorAttribute *  attr;

        ds_quota.insert(make_pair("IMAGES",      "0"));
        ds_quota.insert(make_pair("SIZE",        "0"));
        ds_quota.insert(make_pair("IMAGES_USED", "1"));
        ds_quota.insert(make_pair("SIZE_USED",   "0"));

        attr = new VectorAttribute(ds_name, ds_quota);

        attributes.insert(make_pair(ds_name, attr));

        return true;
    }

    ds_limit = dynamic_cast<VectorAttribute *>(vector_ds_limit[0]);

    if (ds_limit == 0)
    {
        error = "Internal error checking quota limits";
        return false;
    }

    ds_limit->vector_value("IMAGES", img_limit);
    ds_limit->vector_value("SIZE",   size_limit);

    ds_limit->vector_value("IMAGES_USED", img_used);
    ds_limit->vector_value("SIZE_USED",   size_used);

    img_ok  = (img_limit == 0) || ((img_used + 1)     <= img_limit );
    size_ok = (size_limit== 0) || ((size_used + size) <= size_limit);

    if ( img_ok && size_ok )
    {
        add_to_quota(ds_limit, "IMAGES_USED", +1);
        add_to_quota(ds_limit, "SIZE_USED",   +size);
    }
    else if (!img_ok)
    {
        ostringstream oss;

        oss << "Maximum number of images limit (" << img_limit << ")"
            << " reached for datastore " << ds_name;

        error = oss.str();
    } 
    else if (!size_ok)
    {
        ostringstream oss;

        oss << "Maximum storage capacity limit (" << size_limit << ")"
            << " reached for datastore " << ds_name;

        error = oss.str();
    }

    return img_ok && size_ok;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaImage::del_usage(const string& ds_name, int size)
{
    vector<Attribute *> vector_ds_limit;
    VectorAttribute *   ds_limit; 

    if ( get(ds_name,vector_ds_limit) == 0 )
    {
        return;
    }

    ds_limit = dynamic_cast<VectorAttribute *>(vector_ds_limit[0]);

    if (ds_limit == 0)
    {
        return;
    }

    add_to_quota(ds_limit, "IMAGES_USED", -1);
    add_to_quota(ds_limit, "SIZE_USED",   -size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaImage::add_size_usage(const string& ds_name, int size)
{
    vector<Attribute *> vector_ds_limit;
    VectorAttribute *   ds_limit; 

    if ( get(ds_name,vector_ds_limit) == 0 )
    {
        return;
    }

    ds_limit = dynamic_cast<VectorAttribute *>(vector_ds_limit[0]);

    if (ds_limit == 0)
    {
        return;
    }

    add_to_quota(ds_limit, "SIZE_USED",   +size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaImage::update_limits(Attribute * quota, Attribute * va)
{        
    string images_limit;
    string size_limit;

    VectorAttribute * vquota = dynamic_cast<VectorAttribute *>(quota);

    if ( vquota == 0 || get_limits(va, images_limit, size_limit) != 0 )
    {
        return -1;
    }

    vquota->replace("IMAGES", images_limit);
    vquota->replace("SIZE", size_limit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Attribute * QuotaImage::new_quota(Attribute * va)
{
    string images_limit = "0";
    string size_limit   = "0";

    if ( va != 0 )
    {
        if (get_limits(va, images_limit, size_limit) != 0 )
        {
            return 0;
        }        
    }

    map<string,string> limits;

    limits.insert(make_pair("IMAGES",images_limit));
    limits.insert(make_pair("SIZE",size_limit));
    limits.insert(make_pair("IMAGES_USED","0"));
    limits.insert(make_pair("SIZE_USED","0"));

    return new VectorAttribute(va->name(),limits);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaImage::get_limits(Attribute * va_ptr, string& images, string& size)
{
    int images_limit = 0; 
    int size_limit   = 0;

    ostringstream oss;

    VectorAttribute * va = dynamic_cast<VectorAttribute *>(va_ptr);

    if ( va == 0 )
    {
        return -1;
    }

    va->vector_value("IMAGES", images_limit);
    va->vector_value("SIZE", size_limit);

    if ( images_limit < 0 || size_limit < 0 )
    {
        return -1;
    }

    oss << images_limit;

    images = oss.str();

    oss.str("");

    oss << size_limit;

    size = oss.str();

    return 0;           
}

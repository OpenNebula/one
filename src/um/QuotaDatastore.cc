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

VectorAttribute * QuotaDatastore::get_datastore_quota(const string& ds_name)
{
    vector<Attribute *> vquota;
    VectorAttribute *   ds_quota = 0;

    int num = get("DATASTORE", vquota);

    for (int i = 0; i< num ; i++)
    {
        ds_quota = dynamic_cast<VectorAttribute *>(vquota[i]);

        if (ds_quota == 0)
        {
            continue;
        }

        if ( ds_quota->vector_value("NAME") == ds_name )
        {
            return ds_quota;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Attribute * QuotaDatastore::get_quota(Attribute * resource)
{
    VectorAttribute * vresource = dynamic_cast<VectorAttribute *>(resource);
    string ds_name;

    if (vresource == 0)
    {
        return 0;
    }

    ds_name = vresource->vector_value("NAME");

    if (ds_name.empty())
    {
        return 0;
    }

    return get_datastore_quota(ds_name);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaDatastore::check_add(Template * tmpl,  string& error)
{
    VectorAttribute *   ds_quota; 

    int img_limit  = 0; 
    int size_limit = 0;
    int img_used   = 0;
    int size_used  = 0;

    bool img_ok;
    bool size_ok;

    string ds_name;
    int    size;

    // --------------------- Get data from the Template --------------------

    tmpl->get("DATASTORE", ds_name);

    if ( ds_name.empty() )
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

    ds_quota = get_datastore_quota(ds_name);

    if ( ds_quota == 0 )
    {
        map<string,string> ds_quota;
        VectorAttribute *  attr;
        ostringstream      size_str;

        size_str << size;

        ds_quota.insert(make_pair("NAME",        ds_name));
        ds_quota.insert(make_pair("IMAGES",      "0"));
        ds_quota.insert(make_pair("SIZE",        "0"));
        ds_quota.insert(make_pair("IMAGES_USED", "1"));
        ds_quota.insert(make_pair("SIZE_USED",   size_str.str()));

        attr = new VectorAttribute("DATASTORE",  ds_quota);

        attributes.insert(make_pair("DATASTORE", attr));

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

void QuotaDatastore::del(Template * tmpl)
{
    VectorAttribute * ds_quota;

    string ds_name;
    int    size;

    tmpl->get("DATASTORE", ds_name);

    if ( ds_name.empty() )
    {
        return;
    }

    if ( tmpl->get("SIZE", size) == false )
    {
        return;
    }

    ds_quota = get_datastore_quota(ds_name);

    if ( ds_quota == 0 )
    {
        return;
    }

    add_to_quota(ds_quota, "IMAGES_USED", -1);
    add_to_quota(ds_quota, "SIZE_USED",   -size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaDatastore::update_limits(Attribute * quota, Attribute * va)
{        
    string images_limit;
    string size_limit;
    string ds;

    VectorAttribute * vquota = dynamic_cast<VectorAttribute *>(quota);
    int               rc     = get_limits(va, ds, images_limit, size_limit);

    if ( vquota == 0 || rc != 0 )
    {
        return -1;
    }

    vquota->replace("IMAGES", images_limit);
    vquota->replace("SIZE", size_limit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Attribute * QuotaDatastore::new_quota(Attribute * va)
{
    string images_limit = "0";
    string size_limit   = "0";
    string ds_name;

    int rc = get_limits(va, ds_name, images_limit, size_limit);

    if ( rc != 0 || ds_name.empty())
    {
        return 0;
    }        

    map<string,string> limits;
 
    limits.insert(make_pair("NAME", ds_name));

    limits.insert(make_pair("IMAGES", images_limit));
    limits.insert(make_pair("SIZE",   size_limit));

    limits.insert(make_pair("IMAGES_USED", "0"));
    limits.insert(make_pair("SIZE_USED",   "0"));

    return new VectorAttribute("DATASTORE",limits);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaDatastore::get_limits(Attribute * va_ptr, 
                               string&     ds_name,
                               string&     images, 
                               string&     size)
{
    int images_limit = 0; 
    int size_limit   = 0;

    VectorAttribute * va = dynamic_cast<VectorAttribute *>(va_ptr);

    if ( va == 0 )
    {
        return -1;
    }

    images  = va->vector_value("IMAGES", images_limit);
    size    = va->vector_value("SIZE", size_limit);
    ds_name = va->vector_value("NAME");

    if ( images_limit < 0 || size_limit < 0 )
    {
        return -1;
    }

    return 0;           
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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

const char * QuotaDatastore::DS_METRICS[] = {"SIZE", "IMAGES"};

const int QuotaDatastore::NUM_DS_METRICS  = 2;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaDatastore::check(Template * tmpl,  string& error)
{
    map<string, int> ds_request;

    string ds_id;
    int    size;

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

    ds_request.insert(make_pair("IMAGES",1));
    ds_request.insert(make_pair("SIZE",  size));
    
    return check_quota(ds_id, ds_request, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaDatastore::del(Template * tmpl)
{
    map<string, int> ds_request;

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

    ds_request.insert(make_pair("IMAGES",1));
    ds_request.insert(make_pair("SIZE",  size));

    del_quota(ds_id, ds_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

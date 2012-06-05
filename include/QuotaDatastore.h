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

#ifndef QUOTA_DATASTORE_H_
#define QUOTA_DATASTORE_H_

#include "Quota.h"

/**
 *  DataStore Quotas, defined as:
 *    DATASTORE = [
 *        ID     = <ID of the datastore>
 *        IMAGES = <Max. number of images allowed in the datastore>
 *        SIZE   = <Max. number of MB used in the datastore>
 *        IMAGES_USED = Current number of images in the datastore
 *        SIZE_USED   = Current storage capacity un the datastore
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaDatastore :  public Quota
{
public:
    
    QuotaDatastore():Quota("DATASTORE_QUOTA",
                           "DATASTORE",
                           DS_METRICS, 
                           NUM_DS_METRICS)
    {};

    ~QuotaDatastore(){};

    /**
     *  Check if the resource allocation will exceed the quota limits. If not 
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param error string 
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl,  string& error);

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl);

protected:
    static const char * DS_METRICS[];

    static const int NUM_DS_METRICS;
};

#endif /*QUOTA_DATASTORE_H_*/
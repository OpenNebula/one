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

#ifndef QUOTA_IMAGE_H_
#define QUOTA_IMAGE_H_

#include "Quota.h"

/**
 *  Image Quotas, defined as:
 *    IMAGE = [
 *        ID   = <ID of the image>
 *        RVMS       = <Max. number times the image can be instantiated>
 *        RVMS _USED = Current number of VMs using the image
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaImage :  public Quota
{
public:
    
    QuotaImage():Quota("IMAGE_QUOTA",
                       "IMAGE",
                       IMAGE_METRICS, 
                       NUM_IMAGE_METRICS)
    {};

    ~QuotaImage(){};

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
    static const char * IMAGE_METRICS[];

    static const int NUM_IMAGE_METRICS;
};

#endif /*QUOTA_IMAGE_H_*/

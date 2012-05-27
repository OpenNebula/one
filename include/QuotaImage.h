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
 *    <DATASTORE_NAME> = [
 *        IMAGES = <Max. number of images allowed in the datastore>
 *        SIZE   = <Max. number of MB used in the datastore>
 *        IMAGES_USED = Current number of images in the datastore
 *        SIZE_USED   = Current storage capacity un the datastore
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaImage : public Quota
{
    QuotaImage():Quota("IMAGE_QUOTA"){};

    ~QuotaImage(){};

    /**
     *  Check if image allocation will exceed the quota limits. If not the
     *  usage counters are updated
     *    @param ds_name the datastore where the image is going to be allocated
     *    @param size of the image
     *    @param error string 
     *    @return true if the operation can be performed
     */
    bool check(const string& ds_name, int size,  string& error);

    /**
     *  Decrement usage counters when deallocating image
     *    @param ds_name the datastore where the image is allocated
     *    @param size of the image
     */
    void del_usage(const string& ds_name, int size);

    /**
     *  Increment size usage counters
     *    @param ds_name the datastore where the image is allocated
     *    @param size of the image
     */
    void add_size_usage(const string& ds_name, int size);

protected:

    /** 
     *  Sets new limit values for the quota
     *    @param quota to be updated
     *    @param va attribute with the new limits
     *    @return 0 on success or -1 if wrong limits
     */
    int update_limits(Attribute * quota, Attribute * va);

    /**
     *  Creates an empty quota based on the given attribute. The attribute va
     *  contains the limits for the quota.
     *    @param va limits for the new quota if 0 limits will be 0
     *    @return a new attribute representing the quota
     */
    Attribute * new_quota(Attribute * va);

private:
    /**
     *  Return the limits for image and size stored in the a given quota.
     *    @param va_ptr the attribute that stores the quota
     *    @param images the limit for the number of images
     *    @param size the limit for the total storage size
     *
     *    @return -1 if the limits are wrong 0 otherwise
     */
    int get_limits(Attribute * va_ptr, string& images, string& size);
};

#endif /*QUOTA_IMAGE_H_*/
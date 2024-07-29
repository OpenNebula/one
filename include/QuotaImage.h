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

class QuotaImage : public Quota
{
public:

    QuotaImage(bool is_default):
        Quota("IMAGE_QUOTA",
              "IMAGE",
              IMAGE_METRICS,
              is_default)
    {};

    ~QuotaImage() {};

    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl, Quotas& default_quotas, std::string& error) override;

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl) override;

protected:

    /**
     * Gets the default quota identified by its ID.
     *
     *    @param id of the quota
     *    @param default_quotas Quotas that contain the default limits
     *    @param va The quota, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    int get_default_quota(const std::string& id,
                          Quotas& default_quotas,
                          VectorAttribute **va) override;

    static const std::vector<std::string> IMAGE_METRICS;
};

#endif /*QUOTA_IMAGE_H_*/

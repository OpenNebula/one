/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#ifndef HOST_SHARE_DATASTORE_H_
#define HOST_SHARE_DATASTORE_H_

#include "Template.h"

class HostShareCapacity;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HostShareDatastore : public Template
{
public:
    HostShareDatastore() : Template(false, '=', "DATASTORES"), disk_usage(0),
        max_disk(0), free_disk(0), used_disk(0) {};

    virtual ~HostShareDatastore() {};

    /**
     *  Updates the Datastore information from the monitorization template.
     *    @param ht monitoring template. DS information will be removed.
     */
    void set_monitorization(Template& ht);

    /**
     *  Add VM capacity to this datastore share
     *    @param sr requested capacity by the VM
     */
    void add(HostShareCapacity &sr);

    /**
     *  Del VM capacity from this datastore share
     *    @param sr requested capacity by the VM
     */
    void del(HostShareCapacity &sr);

    /**
     *  Builds the datastore list from its XML representation. This function
     *  is used when importing it from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

private:

    long long disk_usage; /**< Disk allocated to VMs (in MB).        */

    long long max_disk;   /**< Total disk capacity (in MB)           */
    long long free_disk;  /**< Free disk from the IM monitor         */
    long long used_disk;  /**< Used disk from the IM monitor         */

    /**
     *  Update the contents of the template to reflect the current values
     *  of the monitor metrics
     */
    void update();
};


#endif /*HOST_SHARE_DATASTORE_H_*/

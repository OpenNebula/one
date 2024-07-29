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


#ifndef DATASTORE_XML_H_
#define DATASTORE_XML_H_

#include "ObjectXML.h"
#include "PoolObjectAuth.h"


class DatastoreXML : public ObjectXML
{
public:
    DatastoreXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    DatastoreXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    /**
     *  Tests whether a new VM can be hosted by the datastore
     *    @param vm_disk_mb capacity needed by the VM
     *    @param error error message
     *    @return true if the datastore can host the VM
     */
    bool test_capacity(long long vm_disk_mb, std::string & error) const;

    /**
     *  Tests whether a new VM can be hosted by the datastore
     *    @param vm_disk_mb capacity needed by the VM
     *    @return true if the datastore can host the VM
     */
    bool test_capacity(long long vm_disk_mb) const
    {
        std::string tmp_st;
        return test_capacity(vm_disk_mb, tmp_st);
    }

    /**
     *  Adds a new VM to the datastore
     *    @param vm_disk_mb capacity needed by the VM
     *    @return 0 on success
     */
    void add_capacity(long long vm_disk_mb)
    {
        free_mb  -= vm_disk_mb;
    };

    int get_oid() const
    {
        return oid;
    };

    bool is_in_cluster(int cid) const
    {
        return cluster_ids.count(cid) != 0;
    };

    /**
     * Returns true if the DS contains the SHARED = YES attribute
     * @return true if the DS is shared
     */
    bool is_shared()
    {
        return shared;
    };

    /**
     * Returns true if the DS free_mb is not 0. Only for shared DS
     * @return true if the DS is monitored
     */
    bool is_monitored()
    {
        return monitored;
    };

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes
     *    @param auths to be filled
     */
    void get_permissions(PoolObjectAuth& auth);

private:

    int oid;
    std::set<int> cluster_ids;

    int uid;
    int gid;

    int owner_u;
    int owner_m;
    int owner_a;

    int group_u;
    int group_m;
    int group_a;

    int other_u;
    int other_m;
    int other_a;

    long long free_mb; /**< Free disk for VMs (in MB). */

    bool monitored;

    bool shared;

    static const char *ds_paths[]; /**< paths for search function */

    static int ds_num_paths; /**< number of paths*/

    void init_attributes();
};

#endif /* DATASTORE_XML_H_ */

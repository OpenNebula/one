/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

using namespace std;

class DatastoreXML : public ObjectXML
{
public:
    DatastoreXML(const string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    DatastoreXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    /**
     *  Tests whether a new VM can be hosted by the datasotre
     *    @param vm_disk_mb capacity needed by the VM
     *    @return true if the datastore can host the VM
     */
    bool test_capacity(long long vm_disk_mb) const
    {
        return (vm_disk_mb < free_mb);
    };

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

    int get_cid() const
    {
        return cluster_id;
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


private:

    int oid;
    int cluster_id;

    long long free_mb; /**< Free disk for VMs (in MB). */

    bool monitored;

    bool shared;

    static const char *ds_paths[]; /**< paths for search function */

    static int ds_num_paths; /**< number of paths*/

    void init_attributes();
};

#endif /* DATASTORE_XML_H_ */

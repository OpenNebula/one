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


#ifndef VNET_XML_H_
#define VNET_XML_H_

#include "ObjectXML.h"
#include "PoolObjectAuth.h"


class VirtualNetworkXML : public ObjectXML
{
public:
    VirtualNetworkXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    VirtualNetworkXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    /**
     *  Tests whether a new NIC can be attached to a vnet
     *    @param error error message
     *    @return true if the VNET can host the VM
     */
    bool test_leases(std::string & error) const;

    /**
     *  Tests whether a new NIC can be attached to a vnet
     *    @param num_leases num leases needs by VM
     *    @return true if the VNET can host the VM
     */
    bool test_leases() const
    {
        std::string tmp_st;
        return test_leases(tmp_st);
    }

    /**
     *  Adds a new lease to the VNET
     */
    void add_lease()
    {
        free_leases--;
    };

    void rollback_leases(int num_leases)
    {
        free_leases += num_leases;
    }

    int get_oid() const
    {
        return oid;
    };

    bool is_in_cluster(int cid) const
    {
        return cluster_ids.count(cid) != 0;
    };

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes
     *    @param auths to be filled
     */
    void get_permissions(PoolObjectAuth& auth) const;

    /**
     *  Prints the Virtual Network information to an output stream. This function is used
     *  for logging purposes.
     */
    friend std::ostream& operator<<(std::ostream& o, const VirtualNetworkXML& p);

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

    int free_leases;

    static const char *net_paths[]; /**< paths for search function */

    static int net_num_paths; /**< number of paths*/

    void init_attributes();
};

#endif /* VNET_XML_H_ */

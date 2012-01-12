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


#ifndef VM_POOL_XML_H_
#define VM_POOL_XML_H_

#include "PoolXML.h"
#include "VirtualMachineXML.h"

using namespace std;

class VirtualMachinePoolXML : public PoolXML
{
public:

    VirtualMachinePoolXML(
                             Client*        client,
                             unsigned int   machines_limit
                         ):PoolXML(client, machines_limit){};

    ~VirtualMachinePoolXML(){};

    int set_up();

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VirtualMachineXML * get(int oid) const
    {
        return static_cast<VirtualMachineXML *>(PoolXML::get(oid));
    };

    int dispatch(int vid, int hid) const;

protected:

    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        return get_nodes("/VM_POOL/VM", content);
    };

    virtual void add_object(xmlNodePtr node);

    virtual int load_info(xmlrpc_c::value &result);
};

#endif /* VM_POOL_XML_H_ */

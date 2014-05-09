/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef ADDRESS_RANGE_POOL_H_
#define ADDRESS_RANGE_POOL_H_

#include <string>
#include <vector>
#include <map>

#include <libxml/parser.h>

#include "Template.h"
#include "AddressRange.h"

using namespace std;

class AddressRangePool
{
public:
    AddressRangePool();

    virtual ~AddressRangePool();

    /**
     *  Builds the address range set from an array of VectorAttributes. This
     *  function is used to create address ranges.
     *    @param ars the vector of address ranges
     *    @param error_msg describing the error
     *    @return 0 on success
     */
    int from_vattr(vector<Attribute *> ars, string& error_msg);

    /**
     *  Builds the address range set from its XML representation. This function
     *  is used to rebuild the address ranges from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

    string& to_xml(string& sstream, bool extended) const;

private:
    Template ar_template;

    unsigned int next_ar;

    map<unsigned int, AddressRange *> ar_pool;
};

#endif

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

#include "VirtualMachineTemplate.h"
#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const string VirtualMachineTemplate::RESTRICTED_ATTRIBUTES[] = {
	"CONTEXT/FILES",
	"DISK/SOURCE",
	"NIC/MAC",
	"NIC/VLAN_ID",
	"RANK"
};

const int VirtualMachineTemplate::RS_ATTRS_LENGTH = 5;
	
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineTemplate::check(string& rs_attr)
{
	size_t pos;
	string avector, vattr;
    vector<const Attribute *> values;

	for (int i=0; i < RS_ATTRS_LENGTH ;i++)
	{
	    pos = RESTRICTED_ATTRIBUTES[i].find("/");

	    if (pos != string::npos) //Vector Attribute
	    {
		    int num;

	        avector = RESTRICTED_ATTRIBUTES[i].substr(0,pos);
	        vattr   = RESTRICTED_ATTRIBUTES[i].substr(pos+1);

	        if ((num = get(avector,values)) > 0 ) //Template contains the attr
	        {
	        	const VectorAttribute * attr;

	        	for (int j=0; j<num ; j++ )
	        	{
		        	attr = dynamic_cast<const VectorAttribute *>(values[j]);
	        	
	        		if (attr == 0)
	        		{
	        			continue;
	        		}

	        		if ( !attr->vector_value(vattr.c_str()).empty() )
	        		{
	        			rs_attr = RESTRICTED_ATTRIBUTES[i];
	        			return true;
	        		}
	        	}

	        }
	    }
	    else //Single Attribute
	    {
			if (get(RESTRICTED_ATTRIBUTES[i],values) > 0 )
			{
				rs_attr = RESTRICTED_ATTRIBUTES[i];
				return true;
			}	    	
	    }
	}

	return false;
}

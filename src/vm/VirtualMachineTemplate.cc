/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "Host.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

vector<string> VirtualMachineTemplate::restricted_attributes;

/* ************************************************************************ */
/* Hybrid Attributes                                          */
/* ************************************************************************ */

const char * VirtualMachineTemplate::HYBRID_ATTRIBUTES[] = {"EC2"};

const int VirtualMachineTemplate::NUM_HYBRID_ATTRIBUTES  = 1;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineTemplate::remove_restricted()
{
    size_t pos;
    string avector, vattr;
    vector<Attribute *> values;

    for (unsigned int i=0; i < restricted_attributes.size(); i++)
    {
        pos = restricted_attributes[i].find("/");

        if (pos != string::npos) //Vector Attribute
        {
            int num;

            avector = restricted_attributes[i].substr(0,pos);
            vattr   = restricted_attributes[i].substr(pos+1);

            if ((num = get(avector,values)) > 0 ) //Template contains the attr
            {
                VectorAttribute * attr;

                for (int j=0; j<num ; j++ )
                {
                    attr = dynamic_cast<VectorAttribute *>(values[j]);

                    if (attr == 0)
                    {
                        continue;
                    }

                    attr->remove(vattr);
                }
            }
        }
        else //Single Attribute
        {
            erase(restricted_attributes[i]);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineTemplate::remove_all_except_restricted()
{
    size_t pos;
    string avector, vattr;
    vector<Attribute *> values;

    vector<Attribute *> restricted;

    for (unsigned int i=0; i < restricted_attributes.size(); i++)
    {
        pos = restricted_attributes[i].find("/");

        if (pos != string::npos) //Vector Attribute
        {
            int num;

            avector = restricted_attributes[i].substr(0,pos);
            vattr   = restricted_attributes[i].substr(pos+1);

            if ((num = get(avector,values)) > 0 ) //Template contains the attr
            {
                VectorAttribute * attr;

                for (int j=0; j<num ; j++ )
                {
                    attr = dynamic_cast<VectorAttribute *>(values[j]);

                    if (attr == 0)
                    {
                        continue;
                    }

                    if ( !attr->vector_value(vattr.c_str()).empty() )
                    {
                        restricted.push_back(attr);
                    }
                }
            }
        }
        else //Single Attribute
        {
            this->get(restricted_attributes[i], restricted);
        }
    }

    vector<Attribute *>::iterator res_it;

    for (res_it = restricted.begin(); res_it != restricted.end(); res_it++)
    {
        remove(*res_it);
    }

    multimap<string,Attribute *>::iterator  att_it;

    for ( att_it = attributes.begin(); att_it != attributes.end(); att_it++)
    {
        delete att_it->second;
    }

    attributes.clear();

    for (res_it = restricted.begin(); res_it != restricted.end(); res_it++)
    {
        set(*res_it);
    }
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineTemplate::get_hybrid_hypervisor(string& hypervisor) const
{
    vector<const Attribute *> attrs;
    bool found_it = false;

    for(int i=0; i < NUM_HYBRID_ATTRIBUTES; i++)
    {
        if(get(HYBRID_ATTRIBUTES[i],attrs))
        {
            hypervisor = Host::get_hybrid_hypervisor_by_id(i);
            found_it   = true;
            break;
        }
    }

    return found_it;
}

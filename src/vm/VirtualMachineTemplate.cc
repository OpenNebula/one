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

#include "VirtualMachineTemplate.h"
#include "Host.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

vector<string> VirtualMachineTemplate::restricted_attributes;

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

int VirtualMachineTemplate::replace_disk_image(int target_id, const string&
    target_name, const string& target_uname, const string& new_name,
    const string& new_uname)
{
    int num_disks;
    int tmp_id;

    string tmp_name;
    string tmp_uname;

    vector<Attribute  *> disks;
    VectorAttribute *    disk = 0;

    num_disks = get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        if (disk->vector_value("IMAGE_ID", tmp_id) == 0) //DISK has IMAGE_ID
        {
            if (tmp_id == target_id)
            {
                break;
            }
        }
        else //IMAGE and IMAGE_UNAME
        {
            tmp_name  = disk->vector_value("IMAGE");
            tmp_uname = disk->vector_value("IMAGE_UNAME");

            bool uname = tmp_uname.empty() || tmp_uname == target_uname;

            if ( tmp_name == target_name && uname )
            {
                break;
            }
        }

        disk = 0;
    }

    if ( disk == 0 )
    {
        return -1;
    }

    disk->remove("IMAGE_ID");

    disk->replace("IMAGE", new_name);

    disk->replace("IMAGE_UNAME", new_uname);

    return 0;
}

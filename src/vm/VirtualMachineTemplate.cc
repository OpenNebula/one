/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

vector<string> VirtualMachineTemplate::restricted_attributes;

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

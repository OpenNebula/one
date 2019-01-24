/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

std::map<std::string, std::set<std::string> > VirtualMachineTemplate::restricted;

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

    vector<VectorAttribute  *> disks;
    VectorAttribute *    disk = 0;

    num_disks = get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        disk = disks[i];

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualMachineTemplate::to_xml_short(string& xml) const
{
    ostringstream oss;
    string labels;

    string schd_rank, schd_ds_rank;
    string schd_req, schd_ds_req;

    string user_prio;

    vector<const VectorAttribute*> attrs;

    if (attributes.empty())
    {
        oss << "<USER_TEMPLATE/>";
    }
    else
    {
         oss << "<USER_TEMPLATE>";

        /* ------------------------------------------------------------------ */
        /* Attributes required by Sunstone                                    */
        /*  - LABELS                                                          */
        /* ------------------------------------------------------------------ */
        if (get("LABELS", labels))
        {
            oss << "<LABELS>" << one_util::escape_xml(labels) << "</LABELS>";
        }

        /* ------------------------------------------------------------------ */
        /* Attributes required by Scheduler                                   */
        /*  - SCHED_RANK (RANK - deprecated)                                  */
        /*  - SCHED_DS_RANK                                                   */
        /*  - SCHED_REQUIREMENTS                                              */
        /*  - SCHED_DS_REQUIREMENTS                                           */
        /*                                                                    */
        /*  - SCHED_ACTION                                                    */
        /*  - PUBLIC_CLOUD                                                    */
        /* ------------------------------------------------------------------ */
        if (get("SCHED_RANK", schd_rank))
        {
            oss << "<SCHED_RANK>" << one_util::escape_xml(schd_rank) 
                << "</SCHED_RANK>";
        }

        if (get("SCHED_DS_RANK", schd_ds_rank))
        {
            oss << "<SCHED_DS_RANK>" << one_util::escape_xml(schd_ds_rank) 
                << "</SCHED_DS_RANK>";
        }

        if (get("SCHED_REQUIREMENTS", schd_req))
        {
            oss << "<SCHED_REQUIREMENTS>" << one_util::escape_xml(schd_req) 
                << "</SCHED_REQUIREMENTS>";
        }

        if (get("SCHED_DS_REQUIREMENTS", schd_ds_req))
        {
            oss << "<SCHED_DS_REQUIREMENTS>" << one_util::escape_xml(schd_ds_req) 
                << "</SCHED_DS_REQUIREMENTS>";
        }

        if (get("USER_PRIORITY", user_prio))
        {
            oss << "<USER_PRIORITY>" << one_util::escape_xml(user_prio) 
                << "</USER_PRIORITY>";
        }

        if ( get("PUBLIC_CLOUD", attrs) > 0 )
        {
            vector<const VectorAttribute *>::const_iterator it;

            for (it = attrs.begin(); it != attrs.end(); it++)
            {
                (*it)->to_xml(oss);
            }
        }

        attrs.clear();

        if ( get("SCHED_ACTION", attrs) > 0 )
        {
            vector<const VectorAttribute *>::const_iterator it;

            for (it = attrs.begin(); it != attrs.end(); it++)
            {
                (*it)->to_xml(oss);
            }
        }

        oss << "</USER_TEMPLATE>";
    }

    xml = oss.str();

    return xml;
}


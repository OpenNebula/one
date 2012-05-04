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

#include <algorithm>

#include "VirtualMachineXML.h"

void VirtualMachineXML::init_attributes()
{
    vector<string> result;

    oid = atoi(((*this)["/VM/ID"] )[0].c_str());
    uid = atoi(((*this)["/VM/UID"])[0].c_str());
    gid = atoi(((*this)["/VM/GID"])[0].c_str());

    result = ((*this)["/VM/TEMPLATE/MEMORY"]);
    if (result.size() > 0)
    {
        memory = atoi(result[0].c_str());
    }
    else
    {
        memory = 0;
    }

    result = ((*this)["/VM/TEMPLATE/CPU"]);
    if (result.size() > 0)
    {
        istringstream   iss;
        iss.str( result[0] );
        iss >> cpu;
    }
    else
    {
        cpu = 0;
    }

    result = ((*this)["/VM/TEMPLATE/RANK"]);
    if (result.size() > 0)
    {
        rank = result[0];
    }
    else
    {
        rank = "";
    }

    result = ((*this)["/VM/TEMPLATE/REQUIREMENTS"]);
    if (result.size() > 0)
    {
        requirements = result[0];
    }
    else
    {
        requirements = "";
    }    

    result = ((*this)["/VM/HISTORY_RECORDS/HISTORY/HID"]);

    if (result.size() > 0) 
    {
        hid = atoi(result[0].c_str());
    }
    else
    {
        hid = -1;
    }

    result = ((*this)["/VM/RESCHED"]);

    if (result.size() > 0)
    {
        resched = atoi(result[0].c_str());
    }
    else
    {
        resched = 0;
    }    
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineXML::~VirtualMachineXML()
{
    vector<VirtualMachineXML::Host *>::iterator	jt;

    for (jt=hosts.begin();jt!=hosts.end();jt++)
    {
        delete *jt;
    }

    hosts.clear();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::add_host(int host_id)
{
    if (( resched == 1 && host_id != hid ) || ( resched == 0 ))
    {
        VirtualMachineXML::Host * ss;

        ss = new VirtualMachineXML::Host(host_id);

        hosts.push_back(ss);            
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::get_matching_hosts(vector<int>& mh)
{
    vector<VirtualMachineXML::Host *>::iterator i;

    for(i=hosts.begin();i!=hosts.end();i++)
    {
        mh.push_back((*i)->hid);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::set_priorities(vector<float>& total)
{
    if ( hosts.size() != total.size() )
    {
        NebulaLog::log("VM",Log::ERROR,"Wrong size for priority vector");
        return;
    }

    for (unsigned int i=0; i<hosts.size(); i++)
    {
        hosts[i]->priority = total[i];
    }

    //Sort the shares using the priority
    sort(hosts.begin(),hosts.end(),VirtualMachineXML::host_cmp);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineXML::get_host(int&          hid,
                                HostPoolXML * hpool,
                                map<int,int>& host_vms,
                                int           max_vms)
{
    vector<VirtualMachineXML::Host *>::reverse_iterator  i;

    vector<int>::iterator   j;
    HostXML *         host;

    int cpu;
    int mem;
    int dsk;

    pair<map<int,int>::iterator,bool> rc;

    get_requirements(cpu,mem,dsk);

    for (i=hosts.rbegin();i!=hosts.rend();i++)
    {
        host = hpool->get( (*i)->hid );

        if ( host == 0 )
        {
            continue;
        }

        if (host->test_capacity(cpu,mem,dsk)==true)
        {
            rc = host_vms.insert(make_pair((*i)->hid,0));

            if ( rc.first->second < max_vms )
            {
                host->add_capacity(cpu,mem,dsk);
                hid  = (*i)->hid;

                rc.first->second++;
                return 0;
            }
        }
    }

    hid  = -1;

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::get_requirements (int& cpu, int& memory, int& disk)
{
    if (this->memory == 0 || this->cpu == 0)
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    cpu    = (int) (this->cpu * 100);//now in 100%
    memory = this->memory * 1024;    //now in bytes
    disk   = 0;
}

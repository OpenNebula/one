/* ------------------------------------------------------------------------*/
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)          */
/*                                                                         */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may */
/* not use this file except in compliance with the License. You may obtain */
/* a copy of the License at                                                */
/*                                                                         */
/* http://www.apache.org/licenses/LICENSE-2.0                              */
/*                                                                         */
/* Unless required by applicable law or agreed to in writing, software     */
/* distributed under the License is distributed on an "AS IS" BASIS,       */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.*/
/* See the License for the specific language governing permissions and     */
/* limitations under the License.                                          */
/* ------------------------------------------------------------------------*/

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>
#include <algorithm>

#include "HostShare.h"

/* ************************************************************************ */
/* HostShare :: Constructor/Destructor                                      */
/* ************************************************************************ */

HostShare::HostShare(
        int     _max_disk,
        int     _max_mem,
        int     _max_cpu):
        ObjectXML(),
        disk_usage(0),
        mem_usage(0),
        cpu_usage(0),
        max_disk(_max_disk),
        max_mem(_max_mem),
        max_cpu(_max_cpu),
        free_disk(0),
        free_mem(0),
        free_cpu(0),
        used_disk(0),
        used_mem(0),
        used_cpu(0),
        running_vms(0){};

ostream& operator<<(ostream& os, HostShare& hs)
{
    string str;

    os << hs.to_xml(str);

    return os;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& HostShare::to_xml(string& xml) const
{
    string template_xml;
    ostringstream   oss;

    oss << "<HOST_SHARE>"
          << "<DISK_USAGE>" << disk_usage << "</DISK_USAGE>"
          << "<MEM_USAGE>"  << mem_usage  << "</MEM_USAGE>"
          << "<CPU_USAGE>"  << cpu_usage  << "</CPU_USAGE>"
          << "<MAX_DISK>"   << max_disk   << "</MAX_DISK>"
          << "<MAX_MEM>"    << max_mem    << "</MAX_MEM>"
          << "<MAX_CPU>"    << max_cpu    << "</MAX_CPU>"
          << "<FREE_DISK>"  << free_disk  << "</FREE_DISK>"
          << "<FREE_MEM>"   << free_mem   << "</FREE_MEM>"
          << "<FREE_CPU>"   << free_cpu   << "</FREE_CPU>"
          << "<USED_DISK>"  << used_disk  << "</USED_DISK>"
          << "<USED_MEM>"   << used_mem   << "</USED_MEM>"
          << "<USED_CPU>"   << used_cpu   << "</USED_CPU>"
          << "<RUNNING_VMS>"<<running_vms <<"</RUNNING_VMS>"
        << "</HOST_SHARE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int HostShare::from_xml_node(const xmlNodePtr node)
{
    int rc = 0;

    // Initialize the internal XML object
    ObjectXML::update_from_node(node);

    rc += xpath(disk_usage, "/HOST_SHARE/DISK_USAGE", -1);
    rc += xpath(mem_usage,  "/HOST_SHARE/MEM_USAGE",  -1);
    rc += xpath(cpu_usage,  "/HOST_SHARE/CPU_USAGE",  -1);

    rc += xpath(max_disk,   "/HOST_SHARE/MAX_DISK",   -1);
    rc += xpath(max_mem ,   "/HOST_SHARE/MAX_MEM",    -1);
    rc += xpath(max_cpu ,   "/HOST_SHARE/MAX_CPU",    -1);

    rc += xpath(free_disk,  "/HOST_SHARE/FREE_DISK",  -1);
    rc += xpath(free_mem ,  "/HOST_SHARE/FREE_MEM",   -1);
    rc += xpath(free_cpu ,  "/HOST_SHARE/FREE_CPU",   -1);

    rc += xpath(used_disk,  "/HOST_SHARE/USED_DISK",  -1);
    rc += xpath(used_mem ,  "/HOST_SHARE/USED_MEM",   -1);
    rc += xpath(used_cpu ,  "/HOST_SHARE/USED_CPU",   -1);

    rc += xpath(running_vms,"/HOST_SHARE/RUNNING_VMS",-1);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

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

#include "XMLDriver.h"
#include "Nebula.h"
#include <sstream>
#include <fstream>
#include <math.h>

int XMLDriver::deployment_description(
    const VirtualMachine *  vm,
    const string&           file_name) const
{
    ofstream    file;
    string      xml;
    
    file.open(file_name.c_str(), ios::out);
    
    if (file.fail() == true)
    {
        vm->log("VMM", Log::ERROR, "Could not open XML deployment file.");
        return -1;
    }
    
    file << vm->template_to_xml(xml);

    file.close();

    return 0;
}

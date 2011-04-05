/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef VIRTUAL_MACHINE_TEMPLATE_H_
#define VIRTUAL_MACHINE_TEMPLATE_H_

#include "Template.h"

#include <string.h>

using namespace std;

/**
 *  Virtual Machine Template class, it represents a VM configuration file.
 */
class VirtualMachineTemplate : public Template
{
public:
    VirtualMachineTemplate():
        Template(false,'=',"TEMPLATE"){};

    ~VirtualMachineTemplate(){};

    /**
     *  Copies the attributes of the original template into this one.
     *    @param original Original template
     *    @param error_msg error string, must be freed by the calling funtion.
     *    This string is null if no error occurred.
     */
    int merge(const VirtualMachineTemplate * original, char **error_msg)
    {
        int                         rc;

        *error_msg = 0;

        rc = merge_att(original, "TEMPLATE_ID");

        if( rc != 0 )
        {
            goto error_tid;
        }

        merge_att(original, "NAME");
        return 0;

    error_tid:
        *error_msg = strdup("TEMPLATE_ID attribute not found");
        return -1;
    };

private:
    friend class VirtualMachine;

    int merge_att(const VirtualMachineTemplate * original, const char * name)
    {
        vector<const Attribute *>   attrs;
        SingleAttribute *           sattr;
        const SingleAttribute *     original_attr;
        int                         number;

        string att_name = name;

        number = original->get(att_name,attrs);

        if( number == 0 )
        {
            return -1;
        }

        original_attr = dynamic_cast<const SingleAttribute *>(attrs[0]);

        if ( original_attr != 0 )
        {
            erase(att_name);

            sattr = new SingleAttribute(*original_attr);
            set(sattr);
        }

        return 0;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_TEMPLATE_H_*/

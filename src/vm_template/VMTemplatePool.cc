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

/* ************************************************************************** */
/* Template Pool                                                              */
/* ************************************************************************** */

#include "VMTemplatePool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMTemplatePool::allocate (
        int                      uid,
        string                   user_name,
        VirtualMachineTemplate * template_contents,
        int *                    oid,
        string&                  error_str)
{
    VMTemplate * vm_template;

    // ------------------------------------------------------------------------
    // Build a new VMTemplate object
    // ------------------------------------------------------------------------
    vm_template = new VMTemplate(-1, uid, user_name, template_contents);

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm_template, error_str);

    return *oid;
}

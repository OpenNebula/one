/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
        int                      gid,
        const string&            uname,
        const string&            gname,
        int                      umask,
        VirtualMachineTemplate * template_contents,
        int *                    oid,
        string&                  error_str)
{
    VMTemplate *  vm_template;
    VMTemplate *  aux = 0;

    string  name;

    ostringstream oss;

    // ------------------------------------------------------------------------
    // Build a new VMTemplate object
    // ------------------------------------------------------------------------
    vm_template = new VMTemplate(-1, uid, gid, uname, gname, umask, template_contents);

    // Check name
    vm_template->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    aux = get(name, uid, false);

    if( aux != 0 )
    {
            goto error_duplicated;
    }

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm_template, error_str);

    return *oid;


error_duplicated:
    oss << "NAME is already taken by TEMPLATE " << aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete vm_template;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              str_template;

    const string        method_name = "VirtualMachineAllocate";

    int                 vid, uid;
    int                 rc;

    Nebula&             nd    = Nebula::instance();
    ImagePool *         ipool = nd.get_ipool();
    VirtualNetworkPool* vnpool= nd.get_vnpool();
    VirtualMachinePool* vmpool= nd.get_vmpool();

    ostringstream       oss;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    VirtualMachineTemplate * vm_template;
    char *                   error_msg = 0;

    int                   num;
    vector<Attribute  * > vectors;
    VectorAttribute *     vector;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineAllocate invoked");

    session      = xmlrpc_c::value_string(paramList.getString(0));
    str_template = xmlrpc_c::value_string(paramList.getString(1));
    str_template += "\n";

    //--------------------------------------------------------------------------
    //   Authenticate the user
    //--------------------------------------------------------------------------
    uid = VirtualMachineAllocate::upool->authenticate(session);

    if (uid == -1)
    {
        goto error_authenticate;
    }

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------

    vm_template = new VirtualMachineTemplate;

    rc = vm_template->parse(str_template,&error_msg);

    if ( rc != 0 )
    {
        goto error_parse;
    }

    if ( uid != 0 )
    {
        AuthRequest ar(uid);
        string      t64;

        num = vm_template->get("DISK",vectors);

        for(int i=0; i<num; i++)
        {

            vector = dynamic_cast<VectorAttribute * >(vectors[i]);

            if ( vector == 0 )
            {
                continue;
            }

            ipool->authorize_disk(vector,&ar);
        }

        num = vm_template->get("NIC",vectors);

        for(int i=0; i<num; i++)
        {
            vector = dynamic_cast<VectorAttribute * >(vectors[i]);

            if ( vector == 0 )
            {
                continue;
            }

            vnpool->authorize_nic(vector,&ar);
        }

        ar.add_auth(AuthRequest::VM,
                    vm_template->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    //--------------------------------------------------------------------------
    //   Allocate the VirtualMAchine
    //--------------------------------------------------------------------------

    rc = vmpool->allocate(uid,vm_template,&vid,false);

    if ( rc < 0 )
    {
        goto error_allocate;

    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(vid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "CREATE", "VM", uid, -1));
    delete vm_template;
    goto error_common;

error_parse:
    oss.str(action_error(method_name, "PARSE", "VM TEMPLATE",-2,rc));
    if (error_msg != 0)
    {
        oss << "Reason: " << error_msg;
        free(error_msg);
    }

    delete vm_template;
    goto error_common;

error_allocate:
    oss.str(action_error(method_name, "CREATE", "VM", -2, rc));
    goto error_common;

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));  // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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

#ifndef REQUEST_MANAGER_VM_TEMPLATE_H
#define REQUEST_MANAGER_VM_TEMPLATE_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVMTemplate: public Request
{
protected:
    RequestManagerVMTemplate(const string& method_name,
                             const string& help,
                             const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();

        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~RequestManagerVMTemplate(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMTemplateInstantiate : public RequestManagerVMTemplate
{
public:
    VMTemplateInstantiate():
        RequestManagerVMTemplate("TemplateInstantiate",
                                 "Instantiates a new virtual machine using a template",
                                 "A:sisbs")
    {
        auth_op = AuthRequest::USE;
    };

    ~VMTemplateInstantiate(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    /**
     * Instantiates the VM Template, checking permissions, quotas, etc
     * @param id VM Template ID
     * @param name Name for the new VM. Can be empty
     * @param on_hold True to start the VM on HOLD state
     * @param str_uattrs Template supplied by user to merge with the original
     * contents. Can be empty
     * @param extra_attrs Template to be merged. It should contain internal
     * configuration, and it won't be authenticated or checked for restricted
     * attributes. Can be 0
     * @param vmid on success of the new VM
     * @param att the specific request attributes
     *
     * @return ErroCode for the request.
     */
    static ErrorCode instantiate(int id, string name, bool on_hold,
            const string &str_uattrs, Template* extra_attrs, int& vid,
            RequestAttributes& att);

    static ErrorCode merge(
                    Template *      tmpl,
                    const string    &str_uattrs,
                    RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

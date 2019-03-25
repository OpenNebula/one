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

#ifndef REQUEST_MANAGER_VN_TEMPLATE_H
#define REQUEST_MANAGER_VN_TEMPLATE_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVNTemplate: public Request
{
protected:
    RequestManagerVNTemplate(const string& method_name,
                             const string& help,
                             const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();

        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~RequestManagerVNTemplate(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateInstantiate : public RequestManagerVNTemplate
{
public:
    VNTemplateInstantiate():
        RequestManagerVNTemplate("one.vntemplate.instantiate", "Instantiates a new "
            "virtual network using a template", "A:siss")
    {
        auth_op = AuthRequest::USE;
    };

    ~VNTemplateInstantiate(){};

    /**
     * Instantiates the VN Template, checking permissions, quotas, etc
     * @param id VN Template ID
     * @param name Name for the new VN. Can be empty
     * @param s_uattr Template supplied by user to merge with the original
     * contents. Can be empty
     * @param extra_attrs Template to be merged. It should contain internal
     * configuration, and it won't be authenticated or checked for restricted
     * attributes. Can be 0
     * @param vnid on success of the new VN
     * @param att the specific request attributes
     *
     * @return ErroCode for the request.
     */
    ErrorCode request_execute(int id, string name,
        const string& s_uattr, Template* extra_attrs, int& vid,
        RequestAttributes& att);

	/**
     * Parse & merge user attributes (check if the request user is not oneadmin)
     *  @param tmpl to merge the attributes to
     *  @param s_uattr Template supplied by user to merge with the original
     *  contents. Can be empty
     *  @param att the specific request attributes
     */
    ErrorCode merge(Template * tmpl, const string &s_uattr, RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

#endif

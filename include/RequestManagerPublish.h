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

#ifndef REQUEST_MANAGER_PUBLISH_H_
#define REQUEST_MANAGER_PUBLISH_H_

#include "Request.h"
#include "Nebula.h"
#include "AuthManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerPublish: public Request
{
protected:
    RequestManagerPublish(const string& method_name,
                          const string& help)
        :Request(method_name,"A:sib",help)
    {
        auth_op = AuthRequest::MANAGE;
    }

    ~RequestManagerPublish(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList);

    virtual int publish(PoolObjectSQL *object, bool pflag) = 0;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePublish : public RequestManagerPublish
{
public:
    TemplatePublish():
        RequestManagerPublish("TemplatePublish",
                             "Publish a virtual machine template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = AuthRequest::TEMPLATE;
    };

    ~TemplatePublish(){};

    int publish(PoolObjectSQL *object, bool pflag)
    {
        VMTemplate * robject;

        robject = static_cast<VMTemplate *>(object);

        return robject->publish(pflag);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPublish: public RequestManagerPublish
{
public:
    VirtualNetworkPublish():
        RequestManagerPublish("VirtualNetworkPublish",
                             "Publish a virtual network")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = AuthRequest::NET;
    };

    ~VirtualNetworkPublish(){};

    int publish(PoolObjectSQL *object, bool pflag)
    {
        VirtualNetwork * robject;

        robject = static_cast<VirtualNetwork *>(object);

        robject->publish(pflag);

        return 0;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePublish: public RequestManagerPublish
{
public:
    ImagePublish():
        RequestManagerPublish("ImagePublish", "Publish an image")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = AuthRequest::IMAGE;
    };

    ~ImagePublish(){};

    int publish(PoolObjectSQL *object, bool pflag)
    {
        Image * robject;

        robject = static_cast<Image *>(object);

        return robject->publish(pflag);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

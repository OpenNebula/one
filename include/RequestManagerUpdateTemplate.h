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

#ifndef REQUEST_MANAGER_UPDATE_TEMPLATE_H
#define REQUEST_MANAGER_UPDATE_TEMPLATE_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUpdateTemplate: public Request
{
protected:
    RequestManagerUpdateTemplate(const string& method_name,
                                 const string& help)
        :Request(method_name,"A:sis",help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUpdateTemplate(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    TemplateUpdateTemplate():
        RequestManagerUpdateTemplate("TemplateUpdateTemplate",
                                     "Updates a virtual machine template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    ImageUpdateTemplate():
        RequestManagerUpdateTemplate("ImageUpdateTemplate",
                                     "Updates an image template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    HostUpdateTemplate():
        RequestManagerUpdateTemplate("HostUpdateTemplate",
                                     "Updates a host template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    VirtualNetworkUpdateTemplate():
        RequestManagerUpdateTemplate("VirtualNetworkUpdateTemplate",
                                     "Updates a vnet template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    UserUpdateTemplate():
        RequestManagerUpdateTemplate("UserUpdateTemplate",
                                     "Updates a user template")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    DatastoreUpdateTemplate():
        RequestManagerUpdateTemplate("DatastoreUpdateTemplate",
                                     "Updates a datastore template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreUpdateTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

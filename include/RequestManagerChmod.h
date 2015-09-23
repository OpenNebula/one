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

#ifndef REQUEST_MANAGER_CHMOD_H_
#define REQUEST_MANAGER_CHMOD_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerChmod : public Request
{
protected:
    RequestManagerChmod(const string& method_name,
                        const string& help)
        :Request(method_name, "A:siiiiiiiiii", help){};

    ~RequestManagerChmod(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChmod : public RequestManagerChmod
{
public:
    VirtualMachineChmod():
        RequestManagerChmod("VirtualMachineChmod",
                            "Changes permission bits of a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChmod : public RequestManagerChmod
{
public:
    TemplateChmod():
        RequestManagerChmod("TemplateChmod",
                            "Changes permission bits of a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkChmod: public RequestManagerChmod
{
public:
    VirtualNetworkChmod():
        RequestManagerChmod("VirtualNetworkChmod",
                           "Changes permission bits of a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkChmod(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChmod: public RequestManagerChmod
{
public:
    ImageChmod():
        RequestManagerChmod("ImageChmod",
                            "Changes permission bits of an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageChmod(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreChmod: public RequestManagerChmod
{
public:
    DatastoreChmod():
        RequestManagerChmod("DatastoreChmod",
                           "Changes permission bits of a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreChmod(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChmod : public RequestManagerChmod
{
public:
    DocumentChmod():
        RequestManagerChmod("DocumentChmod",
                            "Changes permission bits of a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChmod: public RequestManagerChmod
{
public:
    SecurityGroupChmod():
        RequestManagerChmod("SecurityGroupChmod",
                            "Changes permission bits of a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupChmod(){};

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

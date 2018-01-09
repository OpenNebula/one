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

#ifndef REQUEST_MANAGER_LOCK_H_
#define REQUEST_MANAGER_LOCK_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerLock: public Request
{
protected:
    RequestManagerLock(const string& method_name,
                       const string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerLock(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    int lock_db(PoolObjectSQL * object, const int owner, const int req_id, const int level)
    {
        return object->lock_db(owner, req_id, level);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUnlock: public Request
{
protected:
    RequestManagerUnlock(const string& method_name,
                         const string& help)
        :Request(method_name, "A:sii", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUnlock(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    void unlock_db(PoolObjectSQL * object, const int owner, const int req_id)
    {
        object->unlock_db(owner, req_id);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentLock : public RequestManagerLock
{
public:
    DocumentLock():
        RequestManagerLock("one.document.lock",
                           "Tries to acquire the object's lock")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentLock(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUnlock : public RequestManagerUnlock
{
public:
    DocumentUnlock():
        RequestManagerUnlock("one.document.unlock",
                           "Unlocks the object")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentUnlock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineLock: public RequestManagerLock
{
public:
    VirtualMachineLock():
        RequestManagerLock("one.vm.lock",
                           "Lock a VM"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::VM;
        pool        =  nd.get_vmpool();
    };

    ~VirtualMachineLock(){};
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineUnlock: public RequestManagerUnlock
{
public:
    VirtualMachineUnlock():
        RequestManagerUnlock("one.vm.unlock",
                           "Lock a VM"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::VM;
        pool        =  nd.get_vmpool();
    };

    ~VirtualMachineUnlock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMTemplateLock: public RequestManagerLock
{
public:
    VMTemplateLock():
        RequestManagerLock("one.template.lock",
                           "Lock a Template"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::TEMPLATE;
        pool        =  nd.get_tpool();
    };

    ~VMTemplateLock(){};
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMTemplateUnlock: public RequestManagerUnlock
{
public:
    VMTemplateUnlock():
        RequestManagerUnlock("one.template.unlock",
                           "Lock a Template"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::TEMPLATE;
        pool        =  nd.get_tpool();
    };

    ~VMTemplateUnlock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkLock: public RequestManagerLock
{
public:
    VirtualNetworkLock():
        RequestManagerLock("one.vn.lock",
                           "Lock a VNet"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::NET;
        pool        =  nd.get_vnpool();
    };

    ~VirtualNetworkLock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkUnlock: public RequestManagerUnlock
{
public:
    VirtualNetworkUnlock():
        RequestManagerUnlock("one.vn.unlock",
                           "Lock a VNet"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::NET;
        pool        =  nd.get_vnpool();
    };

    ~VirtualNetworkUnlock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageLock: public RequestManagerLock
{
public:
    ImageLock():
        RequestManagerLock("one.image.lock",
                           "Lock a Image"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::IMAGE;
        pool        =  nd.get_ipool();
    };

    ~ImageLock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageUnlock: public RequestManagerUnlock
{
public:
    ImageUnlock():
        RequestManagerUnlock("one.image.unlock",
                           "Lock a Image"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::IMAGE;
        pool        =  nd.get_ipool();
    };

    ~ImageUnlock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppLock: public RequestManagerLock
{
public:
    MarketPlaceAppLock():
        RequestManagerLock("one.marketapp.lock",
                           "Lock a MarketPlaceApp"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  nd.get_apppool();
    };

    ~MarketPlaceAppLock(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppUnlock: public RequestManagerUnlock
{
public:
    MarketPlaceAppUnlock():
        RequestManagerUnlock("one.marketapp.unlock",
                           "Lock a MarketPlaceApp"){
        Nebula& nd  = Nebula::instance();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  nd.get_apppool();
    };

    ~MarketPlaceAppUnlock(){};
};
#endif

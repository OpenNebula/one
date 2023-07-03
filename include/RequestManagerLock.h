/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerLock: public Request
{
protected:
    RequestManagerLock(const std::string& method_name,
                       const std::string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE_NO_LCK;
    };

    ~RequestManagerLock() = default;

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    int lock_db(PoolObjectSQL * object,
                const int owner,
                const int req_id,
                const int level,
                const bool is_admin)
    {
        return object->lock_db(owner, req_id, level, is_admin);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUnlock: public Request
{
protected:
    RequestManagerUnlock(const std::string& method_name,
                         const std::string& help)
        :Request(method_name, "A:sii", help)
    {
        auth_op = AuthRequest::MANAGE_NO_LCK;
    };

    ~RequestManagerUnlock() = default;

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    int unlock_db(PoolObjectSQL * object, const int owner, const int req_id)
    {
        return object->unlock_db(owner, req_id);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentLock : public RequestManagerLock
{
public:
    DocumentLock();

    ~DocumentLock() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUnlock : public RequestManagerUnlock
{
public:
    DocumentUnlock();

    ~DocumentUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineLock: public RequestManagerLock
{
public:
    VirtualMachineLock();

    ~VirtualMachineLock() = default;
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineUnlock: public RequestManagerUnlock
{
public:
    VirtualMachineUnlock();

    ~VirtualMachineUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMTemplateLock: public RequestManagerLock
{
public:
    VMTemplateLock();

    ~VMTemplateLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMTemplateUnlock: public RequestManagerUnlock
{
public:
    VMTemplateUnlock();

    ~VMTemplateUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VNTemplateLock: public RequestManagerLock
{
public:
    VNTemplateLock();

    ~VNTemplateLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VNTemplateUnlock: public RequestManagerUnlock
{
public:
    VNTemplateUnlock();

    ~VNTemplateUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkLock: public RequestManagerLock
{
public:
    VirtualNetworkLock();

    ~VirtualNetworkLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkUnlock: public RequestManagerUnlock
{
public:
    VirtualNetworkUnlock();

    ~VirtualNetworkUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageLock: public RequestManagerLock
{
public:
    ImageLock();

    ~ImageLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageUnlock: public RequestManagerUnlock
{
public:
    ImageUnlock();

    ~ImageUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppLock: public RequestManagerLock
{
public:
    MarketPlaceAppLock();

    ~MarketPlaceAppLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppUnlock: public RequestManagerUnlock
{
public:
    MarketPlaceAppUnlock();

    ~MarketPlaceAppUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualRouterLock: public RequestManagerLock
{
public:
    VirtualRouterLock();

    ~VirtualRouterLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualRouterUnlock: public RequestManagerUnlock
{
public:
    VirtualRouterUnlock();

    ~VirtualRouterUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupLock: public RequestManagerLock
{
public:
    VMGroupLock();

    ~VMGroupLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupUnlock: public RequestManagerUnlock
{
public:
    VMGroupUnlock();

    ~VMGroupUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookLock: public RequestManagerLock
{
public:
    HookLock();

    ~HookLock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookUnlock: public RequestManagerUnlock
{
public:
    HookUnlock();

    ~HookUnlock() = default;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobLock: public RequestManagerLock
{
public:
    BackupJobLock();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobUnlock: public RequestManagerUnlock
{
public:
    BackupJobUnlock();
};


#endif

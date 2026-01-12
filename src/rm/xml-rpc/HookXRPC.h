/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOOK_XRPC_H
#define HOOK_XRPC_H

#include "RequestXRPC.h"
#include "RMHookAPI.h"
#include "HookPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookAllocateXRPC : public RequestXRPC, public RMHookAllocateAPI
{
public:
    HookAllocateXRPC() :
        RequestXRPC("one.hook.allocate",
                    "Allocates a new hook",
                    "A:ss"),
        RMHookAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookDeleteXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookDeleteXRPC() :
        RequestXRPC("one.hook.delete",
                    "Deletes a hook",
                    "A:si"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookUpdateXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookUpdateXRPC() :
        RequestXRPC("one.hook.update",
                    "Updates a hook template",
                    "A:sisi"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookRenameXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookRenameXRPC() :
        RequestXRPC("one.hook.rename",
                    "Renames a hook",
                    "A:sis"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookLockXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookLockXRPC()
        : RequestXRPC("one.hook.lock",
                      "Lock a Hook",
                      "A:siib")
        , RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookUnlockXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookUnlockXRPC()
        : RequestXRPC("one.hook.unlock",
                      "Unlock a Hook",
                      "A:si")
        , RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookRetryXRPC : public RequestXRPC, public RMHookAPI
{
public:
    HookRetryXRPC()
        : RequestXRPC("one.hook.retry",
                      "Retry a hook execution",
                      "A:sii")
        , RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookInfoXRPC : public RequestXRPC, public RMHookInfoAPI
{
public:
    HookInfoXRPC():
        RequestXRPC("one.hook.info",
                    "Returns hook information",
                    "A:sib"),
        RMHookInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookPoolInfoXRPC : public RequestXRPC, public HookPoolAPI
{
public:
    HookPoolInfoXRPC()
        : RequestXRPC("one.hookpool.info",
                      "Returns the hook pool",
                      "A:siii")
        , HookPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookPoolLogInfoXRPC : public RequestXRPC, public HookPoolAPI
{
public:
    HookPoolLogInfoXRPC() :
        RequestXRPC("one.hooklog.info",
                    "Returns the hook pool log info",
                    "A:siiii"),
        HookPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif

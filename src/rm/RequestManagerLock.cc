/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerLock.h"
#include "Nebula.h"
#include "BackupJobPool.h"
#include "DocumentPool.h"
#include "HookPool.h"
#include "ImagePool.h"
#include "MarketPlaceAppPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerLock::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int oid   = xmlrpc_c::value_int(paramList.getInt(1));
    int level = xmlrpc_c::value_int(paramList.getInt(2));
    int owner = att.uid;
    int test  = false;

    if ( paramList.size() > 3 )
    {
        test = xmlrpc_c::value_boolean(paramList.getBoolean(3));
    }

    int             rc;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    switch(level)
    {
        case 1: //USE + MANAGE + ADMIN
            level = PoolObjectSQL::ST_USE;
            break;
        case 2: //MANAGE + ADMIN
            level = PoolObjectSQL::ST_MANAGE;
            break;
        case 3: //ADMIN
            level = PoolObjectSQL::ST_ADMIN;
            break;
        case 4: //ALL equals USE
            level = PoolObjectSQL::ST_USE;
            break;

        default:
            att.resp_msg = "Wrong lock level specified";
            failure_response(ACTION, att);
            return;
    }

    if ((auth_object & PoolObjectSQL::LockableObject) != 0)
    {
        if ( test && object->test_lock_db(att.resp_msg) != 0 )
        {
            failure_response(ACTION, att);
        }
        else
        {
            rc = lock_db(object.get(), owner, att.req_id, level, att.is_admin());

            pool->update(object.get());

            if (rc != 0)
            {
                att.resp_msg = "Error trying to lock the resource.";
                failure_response(ACTION, att);
            }
            else
            {
                success_response(oid, att);
            }
        }
    }
    else
    {
        att.resp_msg = "Object cannot be locked.";
        failure_response(AUTHORIZATION, att);
    }

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUnlock::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    int     oid     = xmlrpc_c::value_int(paramList.getInt(1));

    int owner  = att.uid;
    int req_id = att.req_id;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( att.is_admin() ) //admins can unlock even if nor owners of lock
    {
        owner = -1;
    }

    if ( unlock_db(object.get(), owner, req_id) == -1 )
    {
        att.resp_msg = "Cannot unlock: Lock is owned by another user";
        failure_response(ACTION, att);

        return;
    }

    pool->update(object.get());

    success_response(oid, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DocumentLock::DocumentLock()
    : RequestManagerLock("one.document.lock",
                         "Tries to acquire the object's lock")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_docpool();
    auth_object = PoolObjectSQL::DOCUMENT;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DocumentUnlock::DocumentUnlock():
    RequestManagerUnlock("one.document.unlock",
                         "Unlocks the object")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_docpool();
    auth_object = PoolObjectSQL::DOCUMENT;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachineLock::VirtualMachineLock()
    : RequestManagerLock("one.vm.lock",
                         "Lock a VM")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VM;
    pool        = nd.get_vmpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualMachineUnlock::VirtualMachineUnlock()
    : RequestManagerUnlock("one.vm.unlock",
                           "Unlock a VM")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VM;
    pool        = nd.get_vmpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VMTemplateLock::VMTemplateLock()
    : RequestManagerLock("one.template.lock",
                         "Lock a Template")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::TEMPLATE;
    pool        = nd.get_tpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VMTemplateUnlock::VMTemplateUnlock()
    : RequestManagerUnlock("one.template.unlock",
                           "Unlock a Template")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::TEMPLATE;
    pool        = nd.get_tpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VNTemplateLock::VNTemplateLock()
    : RequestManagerLock("one.vntemplate.lock",
                         "Lock a VN Template")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VNTEMPLATE;
    pool        = nd.get_vntpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VNTemplateUnlock::VNTemplateUnlock()
    : RequestManagerUnlock("one.vntemplate.unlock",
                           "Unlock a VN Template")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VNTEMPLATE;
    pool        = nd.get_vntpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkLock::VirtualNetworkLock()
    : RequestManagerLock("one.vn.lock",
                         "Lock a VNet")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::NET;
    pool        = nd.get_vnpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkUnlock::VirtualNetworkUnlock()
    : RequestManagerUnlock("one.vn.unlock",
                           "Unlock a VNet")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::NET;
    pool        = nd.get_vnpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ImageLock::ImageLock()
    : RequestManagerLock("one.image.lock",
                         "Lock a Image")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::IMAGE;
    pool        = nd.get_ipool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ImageUnlock::ImageUnlock()
    : RequestManagerUnlock("one.image.unlock",
                           "Unlock a Image")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::IMAGE;
    pool        = nd.get_ipool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlaceAppLock::MarketPlaceAppLock()
    : RequestManagerLock("one.marketapp.lock",
                         "Lock a MarketPlaceApp")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::MARKETPLACEAPP;
    pool        = nd.get_apppool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlaceAppUnlock::MarketPlaceAppUnlock()
    : RequestManagerUnlock("one.marketapp.unlock",
                           "Unlock a MarketPlaceApp")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::MARKETPLACEAPP;
    pool        = nd.get_apppool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualRouterLock::VirtualRouterLock()
    : RequestManagerLock("one.vrouter.lock",
                         "Lock a VirtualRouter")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VROUTER;
    pool        = nd.get_vrouterpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualRouterUnlock::VirtualRouterUnlock()
    : RequestManagerUnlock("one.vrouter.unlock",
                           "Unlock a VirtualRouter")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VROUTER;
    pool        = nd.get_vrouterpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VMGroupLock::VMGroupLock()
    : RequestManagerLock("one.vmgroup.lock",
                         "Lock a VMGroup")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VMGROUP;
    pool        = nd.get_vmgrouppool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VMGroupUnlock::VMGroupUnlock()
    : RequestManagerUnlock("one.vmgroup.unlock",
                           "Unlock a VMGroup")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::VMGROUP;
    pool        = nd.get_vmgrouppool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HookLock::HookLock()
    : RequestManagerLock("one.hook.lock",
                         "Lock a Hook")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::HOOK;
    pool        = nd.get_hkpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HookUnlock::HookUnlock()
    : RequestManagerUnlock("one.hook.unlock",
                           "Unlock a Hook")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::HOOK;
    pool        = nd.get_hkpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

BackupJobLock::BackupJobLock()
    : RequestManagerLock("one.backupjob.lock",
                         "Lock a Backup Job")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::BACKUPJOB;
    pool        = nd.get_bjpool();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

BackupJobUnlock::BackupJobUnlock()
    : RequestManagerUnlock("one.backupjob.unlock",
                           "Unlock a BackupJob")
{
    Nebula& nd  = Nebula::instance();
    auth_object = PoolObjectSQL::BACKUPJOB;
    pool        = nd.get_bjpool();
}

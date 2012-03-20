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

#ifndef NEBULA_TEST_H_
#define NEBULA_TEST_H_

#include "SqlDB.h"

#include "NebulaTemplate.h"

#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "HostPool.h"
#include "UserPool.h"
#include "VMTemplatePool.h"
#include "DatastorePool.h"
#include "ClusterPool.h"

#include "VirtualMachineManager.h"
#include "LifeCycleManager.h"
#include "InformationManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "RequestManager.h"
#include "HookManager.h"
#include "AuthManager.h"
#include "AclManager.h"
#include "ImageManager.h"

class NebulaTest
{
protected:

    NebulaTest():mysql(false), need_host_pool(false), need_vm_pool(false),
                need_vnet_pool(false), need_image_pool(false), 
                need_user_pool(false), need_template_pool(false),
                need_group_pool(false), need_datastore_pool(false),
                need_cluster_pool(false),
                need_vmm(false),
                need_im(false), need_tm(false),
                need_lcm(false), need_dm(false),
                need_rm(false), need_hm(false),
                need_authm(false), need_aclm(false), need_imagem(false)
    {};

    virtual ~NebulaTest(){};

    static NebulaTest * the_tester; /*<< Pointer to the actual tester */

public:
    bool mysql;

    bool need_host_pool;
    bool need_vm_pool;
    bool need_vnet_pool;
    bool need_image_pool;
    bool need_user_pool;
    bool need_template_pool;
    bool need_group_pool;
    bool need_datastore_pool;
    bool need_cluster_pool;

    bool need_vmm;
    bool need_im;
    bool need_tm;
    bool need_lcm;
    bool need_dm;
    bool need_rm;
    bool need_hm;
    bool need_authm;
    bool need_aclm;
    bool need_imagem;

    static NebulaTest * instance()
    {
        return the_tester;
    };

    // ------------------------------------------------------------------------
    // Pools
    // ------------------------------------------------------------------------

    virtual VirtualMachinePool* create_vmpool(SqlDB* db, 
        string hook_location, string vloc);

    virtual HostPool* create_hpool(SqlDB* db, string hook_location, string vloc);

    virtual VirtualNetworkPool* create_vnpool(SqlDB* db,
                                               string mac_prefix, 
                                               int    size);

    virtual UserPool* create_upool(SqlDB* db);

    virtual ImagePool* create_ipool( SqlDB* db,
                                    string default_image_type,
                                    string default_device_prefix);

    virtual VMTemplatePool* create_tpool(SqlDB* db);

    virtual GroupPool* create_gpool(SqlDB* db);

    virtual DatastorePool* create_dspool(SqlDB* db);

    virtual ClusterPool* create_clpool(SqlDB* db);

    // ------------------------------------------------------------------------
    // Managers
    // ------------------------------------------------------------------------

    virtual VirtualMachineManager* create_vmm(VirtualMachinePool* vmpool,
                                             HostPool*           hpool,
                                             time_t              timer_period,
                                             time_t              poll_period);

    virtual LifeCycleManager* create_lcm(VirtualMachinePool* vmpool,
                                         HostPool* hpool);

    virtual InformationManager* create_im(HostPool*   hpool,
                                          time_t      timer_period,
                                          string      remotes_location);

    virtual TransferManager* create_tm(VirtualMachinePool* vmpool,
                                       HostPool*           hpool);

    virtual DispatchManager* create_dm(VirtualMachinePool* vmpool,
                                       HostPool*           hpool);

    virtual RequestManager* create_rm(string log_file);

    virtual HookManager* create_hm(VirtualMachinePool * vmpool);

    virtual AuthManager* create_authm(time_t timer_period);

    virtual AclManager* create_aclm(SqlDB* db);

    virtual ImageManager* create_imagem(ImagePool * ipool);
};

#endif /*NEBULA_TEST_H_*/

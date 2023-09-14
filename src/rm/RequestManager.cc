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

#include <cerrno>

#include "NebulaLog.h"

#include "RequestManager.h"
#include "RequestManagerConnection.h"

#include "RequestManagerPoolInfoFilter.h"
#include "RequestManagerInfo.h"
#include "RequestManagerDelete.h"
#include "RequestManagerAllocate.h"
#include "RequestManagerAllocateDB.h"
#include "RequestManagerUpdateTemplate.h"
#include "RequestManagerUpdateDB.h"
#include "RequestManagerDropDB.h"
#include "RequestManagerChown.h"
#include "RequestManagerChmod.h"
#include "RequestManagerClone.h"
#include "RequestManagerRename.h"
#include "RequestManagerZone.h"
#include "RequestManagerLock.h"

#include "RequestManagerVirtualNetwork.h"
#include "RequestManagerVirtualMachine.h"
#include "RequestManagerVMTemplate.h"
#include "RequestManagerHost.h"
#include "RequestManagerImage.h"
#include "RequestManagerUser.h"
#include "RequestManagerAcl.h"
#include "RequestManagerCluster.h"
#include "RequestManagerGroup.h"
#include "RequestManagerVdc.h"
#include "RequestManagerDatastore.h"
#include "RequestManagerMarketPlaceApp.h"
#include "RequestManagerVirtualRouter.h"
#include "RequestManagerSecurityGroup.h"
#include "RequestManagerVMGroup.h"
#include "RequestManagerVNTemplate.h"
#include "RequestManagerHook.h"
#include "RequestManagerMarketPlace.h"
#include "RequestManagerSchedAction.h"
#include "RequestManagerBackupJob.h"

#include "RequestManagerSystem.h"
#include "RequestManagerProxy.h"

#include "Request.h"

#include <sys/signal.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <netdb.h>
#include <unistd.h>
#include <fcntl.h>
#include <cstring>

using namespace std;


RequestManager::RequestManager(
        const string& _port,
        int _max_conn,
        int _max_conn_backlog,
        int _keepalive_timeout,
        int _keepalive_max_conn,
        int _timeout,
        const string& _xml_log_file,
        const string& call_log_format,
        const string& _listen_address,
        int message_size):
            end(false),
            port(_port),
            socket_fd(-1),
            max_conn(_max_conn),
            max_conn_backlog(_max_conn_backlog),
            keepalive_timeout(_keepalive_timeout),
            keepalive_max_conn(_keepalive_max_conn),
            timeout(_timeout),
            xml_log_file(_xml_log_file),
            listen_address(_listen_address)
{
    Request::set_call_log_format(call_log_format);

    xmlrpc_limit_set(XMLRPC_XML_SIZE_LIMIT_ID, message_size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManager::~RequestManager()
{
    if (xml_server_thread.joinable())
    {
        xml_server_thread.join();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::xml_server_loop()
{
    // -------------------------------------------------------------------------
    // Set cancel state for the thread
    // -------------------------------------------------------------------------
    listen(socket_fd, max_conn_backlog);

    // -------------------------------------------------------------------------
    // Main connection loop
    // -------------------------------------------------------------------------
    cm = make_unique<ConnectionManager>(max_conn);

    while (true)
    {
        ostringstream oss;

        cm->wait();

        {
            std::lock_guard<std::mutex> lock(end_lock);

            if (end)
            {
                break;
            }
        }

        struct sockaddr_storage addr;

        socklen_t addr_len = sizeof(struct sockaddr_storage);

        int client_fd = accept(socket_fd, (struct sockaddr*) &addr, &addr_len);

        if (client_fd == -1)
        {
            break;
        }

        int nc = cm->add();

        oss << "Number of active connections: " << nc;

        NebulaLog::log("ReM", Log::DDEBUG, oss);

        thread conn_thread([client_fd, this]{
            xmlrpc_c::serverAbyss * as = create_abyss();

            as->runConn(client_fd);

            delete as;

            cm->del();

            close(client_fd);

            return;
        });

        conn_thread.detach();
    }

    NebulaLog::log("ReM",Log::INFO,"XML-RPC server stopped.");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

xmlrpc_c::serverAbyss * RequestManager::create_abyss()
{
    xmlrpc_c::serverAbyss::constrOpt opt = xmlrpc_c::serverAbyss::constrOpt();

    opt.registryP(&RequestManagerRegistry.registry);
    opt.keepaliveTimeout(keepalive_timeout);
    opt.keepaliveMaxConn(keepalive_max_conn);
    opt.timeout(timeout);

    if (!xml_log_file.empty())
    {
        opt.logFileName(xml_log_file);
    }

    return new xmlrpc_c::serverAbyss(opt);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManager::setup_socket()
{
    int rc;
    int yes = 1;

    struct addrinfo hints;
    struct addrinfo * result;

    memset(&hints, 0, sizeof hints);

    hints.ai_family   = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags    = AI_PASSIVE;

    rc = getaddrinfo(listen_address.c_str(), port.c_str(), &hints, &result);

    if ( rc != 0 )
    {
        ostringstream oss;

        oss << "Cannot open server socket: " << gai_strerror(rc);
        NebulaLog::log("ReM",Log::ERROR,oss);

        return -1;
    }

    socket_fd = socket(result->ai_family, result->ai_socktype, 0);

    if ( socket_fd == -1 )
    {
        ostringstream oss;

        oss << "Cannot open server socket: " << strerror(errno);
        NebulaLog::log("ReM",Log::ERROR,oss);

        freeaddrinfo(result);

        return -1;
    }

    rc = setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int));

    if ( rc == -1 )
    {
        ostringstream oss;

        oss << "Cannot set socket options: " << strerror(errno);
        NebulaLog::log("ReM",Log::ERROR,oss);

        close(socket_fd);

        freeaddrinfo(result);

        return -1;
    }

    fcntl(socket_fd,F_SETFD,FD_CLOEXEC); // Close socket in MADs

    rc = ::bind(socket_fd, result->ai_addr, result->ai_addrlen);

    freeaddrinfo(result);

    if ( rc == -1)
    {
        ostringstream oss;

        oss << "Cannot bind to " << listen_address << ":" << port << " : "
            << strerror(errno);

        NebulaLog::log("ReM",Log::ERROR,oss);

        close(socket_fd);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManager::start()
{
    ostringstream   oss;

    NebulaLog::log("ReM",Log::INFO,"Starting Request Manager...");

    int rc = setup_socket();

    if ( rc != 0 )
    {
        return -1;
    }

    register_xml_methods();

    oss << "Starting XML-RPC server, port " << port << " ...";
    NebulaLog::log("ReM",Log::INFO,oss);

    xml_server_thread = thread(&RequestManager::xml_server_loop, this);

    NebulaLog::log("ReM",Log::INFO,"Request Manager started");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::register_xml_methods()
{
    Nebula& nebula = Nebula::instance();

    // VMTemplate Methods
    xmlrpc_c::methodPtr template_instantiate(new VMTemplateInstantiate());

    // VNTemplate Methods
    xmlrpc_c::methodPtr vntemplate_instantiate(new VNTemplateInstantiate());

    // VirtualMachine Methods
    xmlrpc_c::methodPtr vm_deploy(new VirtualMachineDeploy());
    xmlrpc_c::methodPtr vm_migrate(new VirtualMachineMigrate());
    xmlrpc_c::methodPtr vm_action(new VirtualMachineAction());
    xmlrpc_c::methodPtr vm_monitoring(new VirtualMachineMonitoring());
    xmlrpc_c::methodPtr vm_attach(new VirtualMachineAttach());
    xmlrpc_c::methodPtr vm_detach(new VirtualMachineDetach());
    xmlrpc_c::methodPtr vm_attachnic(new VirtualMachineAttachNic());
    xmlrpc_c::methodPtr vm_detachnic(new VirtualMachineDetachNic());
    xmlrpc_c::methodPtr vm_updatenic(new VirtualMachineUpdateNic());
    xmlrpc_c::methodPtr vm_resize(new VirtualMachineResize());
    xmlrpc_c::methodPtr vm_snap_create(new VirtualMachineSnapshotCreate());
    xmlrpc_c::methodPtr vm_snap_revert(new VirtualMachineSnapshotRevert());
    xmlrpc_c::methodPtr vm_snap_delete(new VirtualMachineSnapshotDelete());
    xmlrpc_c::methodPtr vm_dsaveas(new VirtualMachineDiskSaveas());
    xmlrpc_c::methodPtr vm_dsnap_create(new VirtualMachineDiskSnapshotCreate());
    xmlrpc_c::methodPtr vm_dsnap_revert(new VirtualMachineDiskSnapshotRevert());
    xmlrpc_c::methodPtr vm_dsnap_delete(new VirtualMachineDiskSnapshotDelete());
    xmlrpc_c::methodPtr vm_dsnap_rename(new VirtualMachineDiskSnapshotRename());
    xmlrpc_c::methodPtr vm_recover(new VirtualMachineRecover());
    xmlrpc_c::methodPtr vm_updateconf(new VirtualMachineUpdateConf());
    xmlrpc_c::methodPtr vm_disk_resize(new VirtualMachineDiskResize());
    xmlrpc_c::methodPtr vm_sched_add(new RequestManagerSchedAdd());
    xmlrpc_c::methodPtr vm_sched_delete(new RequestManagerSchedDelete());
    xmlrpc_c::methodPtr vm_sched_update(new RequestManagerSchedUpdate());
    xmlrpc_c::methodPtr vm_attachsg(new VirtualMachineAttachSG());
    xmlrpc_c::methodPtr vm_detachsg(new VirtualMachineDetachSG());
    xmlrpc_c::methodPtr vm_backup(new VirtualMachineBackup());
    xmlrpc_c::methodPtr vm_backupcancel(new VirtualMachineBackupCancel());

    xmlrpc_c::methodPtr vm_pool_acct(new VirtualMachinePoolAccounting());
    xmlrpc_c::methodPtr vm_pool_monitoring(new VirtualMachinePoolMonitoring());

    xmlrpc_c::methodPtr vm_pool_showback(new VirtualMachinePoolShowback());
    xmlrpc_c::methodPtr vm_pool_calculate_showback(new VirtualMachinePoolCalculateShowback());

    // VirtualNetwork Methods
    xmlrpc_c::methodPtr vn_add_ar(new VirtualNetworkAddAddressRange());
    xmlrpc_c::methodPtr vn_rm_ar(new VirtualNetworkRmAddressRange());
    xmlrpc_c::methodPtr vn_free_ar(new VirtualNetworkFreeAddressRange());
    xmlrpc_c::methodPtr vn_update_ar(new VirtualNetworkUpdateAddressRange());
    xmlrpc_c::methodPtr vn_hold(new VirtualNetworkHold());
    xmlrpc_c::methodPtr vn_release(new VirtualNetworkRelease());
    xmlrpc_c::methodPtr vn_reserve(new VirtualNetworkReserve());
    xmlrpc_c::methodPtr vn_recover(new VirtualNetworkRecover());

    // Update Template Methods
    xmlrpc_c::methodPtr image_update(new ImageUpdateTemplate());
    xmlrpc_c::methodPtr vm_update(new VirtualMachineUpdateTemplate());
    xmlrpc_c::methodPtr template_update(new TemplateUpdateTemplate());
    xmlrpc_c::methodPtr host_update(new HostUpdateTemplate());
    xmlrpc_c::methodPtr vn_update(new VirtualNetworkUpdateTemplate());
    xmlrpc_c::methodPtr datastore_update(new DatastoreUpdateTemplate());
    xmlrpc_c::methodPtr doc_update(new DocumentUpdateTemplate());
    xmlrpc_c::methodPtr cluster_update(new ClusterUpdateTemplate());
    xmlrpc_c::methodPtr secg_update(new SecurityGroupUpdateTemplate());
    xmlrpc_c::methodPtr vrouter_update(new VirtualRouterUpdateTemplate());
    xmlrpc_c::methodPtr vmg_update(new VMGroupUpdateTemplate());
    xmlrpc_c::methodPtr vntemplate_update(new VirtualNetworkTemplateUpdateTemplate());
    xmlrpc_c::methodPtr hook_update(new HookUpdateTemplate());
    xmlrpc_c::methodPtr backupjob_update(new BackupJobUpdateTemplate());

    // Allocate Methods
    xmlrpc_c::methodPtr vm_allocate(new VirtualMachineAllocate());
    xmlrpc_c::methodPtr image_allocate(new ImageAllocate());
    xmlrpc_c::methodPtr vn_allocate(new VirtualNetworkAllocate());
    xmlrpc_c::methodPtr template_allocate(new TemplateAllocate());
    xmlrpc_c::methodPtr host_allocate(new HostAllocate());
    xmlrpc_c::methodPtr datastore_allocate(new DatastoreAllocate());
    xmlrpc_c::methodPtr cluster_allocate(new ClusterAllocate());
    xmlrpc_c::methodPtr doc_allocate(new DocumentAllocate());
    xmlrpc_c::methodPtr secg_allocate(new SecurityGroupAllocate());
    xmlrpc_c::methodPtr vrouter_allocate(new VirtualRouterAllocate());
    xmlrpc_c::methodPtr vmg_allocate(new VMGroupAllocate());
    xmlrpc_c::methodPtr vntemplate_allocate(new VirtualNetworkTemplateAllocate());
    xmlrpc_c::methodPtr hook_allocate(new HookAllocate());
    xmlrpc_c::methodPtr backupjob_allocate(new BackupJobAllocate());

    // Clone Methods
    xmlrpc_c::methodPtr template_clone(new VMTemplateClone());
    xmlrpc_c::methodPtr doc_clone(new DocumentClone());
    xmlrpc_c::methodPtr secg_clone(new SecurityGroupClone());
    xmlrpc_c::methodPtr vntemplate_clone(new VNTemplateClone());

    // Delete Methods
    xmlrpc_c::methodPtr host_delete(new HostDelete());
    xmlrpc_c::methodPtr template_delete(new TemplateDelete());
    xmlrpc_c::methodPtr vn_delete(new VirtualNetworkDelete());
    xmlrpc_c::methodPtr image_delete(new ImageDelete());
    xmlrpc_c::methodPtr datastore_delete(new DatastoreDelete());
    xmlrpc_c::methodPtr cluster_delete(new ClusterDelete());
    xmlrpc_c::methodPtr doc_delete(new DocumentDelete());
    xmlrpc_c::methodPtr secg_delete(new SecurityGroupDelete());
    xmlrpc_c::methodPtr vrouter_delete(new VirtualRouterDelete());
    xmlrpc_c::methodPtr vmg_delete(new VMGroupDelete());
    xmlrpc_c::methodPtr vntemplate_delete(new VirtualNetworkTemplateDelete());
    xmlrpc_c::methodPtr hook_delete(new HookDelete());
    xmlrpc_c::methodPtr backupjob_delete(new BackupJobDelete());

    // Info Methods
    xmlrpc_c::methodPtr vm_info(new VirtualMachineInfo());
    xmlrpc_c::methodPtr host_info(new HostInfo());
    xmlrpc_c::methodPtr template_info(new TemplateInfo());
    xmlrpc_c::methodPtr vn_info(new VirtualNetworkInfo());
    xmlrpc_c::methodPtr vntemplate_info(new VirtualNetworkTemplateInfo());
    xmlrpc_c::methodPtr image_info(new ImageInfo());
    xmlrpc_c::methodPtr datastore_info(new DatastoreInfo());
    xmlrpc_c::methodPtr cluster_info(new ClusterInfo());
    xmlrpc_c::methodPtr doc_info(new DocumentInfo());
    xmlrpc_c::methodPtr secg_info(new SecurityGroupInfo());
    xmlrpc_c::methodPtr vrouter_info(new VirtualRouterInfo());
    xmlrpc_c::methodPtr vmg_info(new VMGroupInfo());
    xmlrpc_c::methodPtr hook_info(new HookInfo());
    xmlrpc_c::methodPtr backupjob_info(new BackupJobInfo());

    // Lock Methods
    xmlrpc_c::methodPtr doc_lock(new DocumentLock());
    xmlrpc_c::methodPtr doc_unlock(new DocumentUnlock());
    xmlrpc_c::methodPtr vm_lock(new VirtualMachineLock());
    xmlrpc_c::methodPtr vm_unlock(new VirtualMachineUnlock());
    xmlrpc_c::methodPtr template_lock(new VMTemplateLock());
    xmlrpc_c::methodPtr template_unlock(new VMTemplateUnlock());
    xmlrpc_c::methodPtr vn_lock(new VirtualNetworkLock());
    xmlrpc_c::methodPtr vn_unlock(new VirtualNetworkUnlock());
    xmlrpc_c::methodPtr image_lock(new ImageLock());
    xmlrpc_c::methodPtr image_unlock(new ImageUnlock());
    xmlrpc_c::methodPtr vrouter_lock(new VirtualRouterLock());
    xmlrpc_c::methodPtr vrouter_unlock(new VirtualRouterUnlock());
    xmlrpc_c::methodPtr vmg_lock(new VMGroupLock());
    xmlrpc_c::methodPtr vmg_unlock(new VMGroupUnlock());
    xmlrpc_c::methodPtr vntemplate_lock(new VNTemplateLock());
    xmlrpc_c::methodPtr vntemplate_unlock(new VNTemplateUnlock());
    xmlrpc_c::methodPtr hook_lock(new HookLock());
    xmlrpc_c::methodPtr hook_unlock(new HookUnlock());
    xmlrpc_c::methodPtr backupjob_lock(new BackupJobLock());
    xmlrpc_c::methodPtr backupjob_unlock(new BackupJobUnlock());

    // PoolInfo Methods
    xmlrpc_c::methodPtr hostpool_info(new HostPoolInfo());
    xmlrpc_c::methodPtr datastorepool_info(new DatastorePoolInfo());
    xmlrpc_c::methodPtr vm_pool_info(new VirtualMachinePoolInfo());
    xmlrpc_c::methodPtr vm_pool_info_extended(new VirtualMachinePoolInfoExtended());
    xmlrpc_c::methodPtr vm_pool_info_set(new VirtualMachinePoolInfoSet());
    xmlrpc_c::methodPtr template_pool_info(new TemplatePoolInfo());
    xmlrpc_c::methodPtr vnpool_info(new VirtualNetworkPoolInfo());
    xmlrpc_c::methodPtr vntemplate_pool_info(new VirtualNetworkTemplatePoolInfo());
    xmlrpc_c::methodPtr imagepool_info(new ImagePoolInfo());
    xmlrpc_c::methodPtr clusterpool_info(new ClusterPoolInfo());
    xmlrpc_c::methodPtr docpool_info(new DocumentPoolInfo());
    xmlrpc_c::methodPtr secgpool_info(new SecurityGroupPoolInfo());
    xmlrpc_c::methodPtr vmgpool_info(new VMGroupPoolInfo());
    xmlrpc_c::methodPtr vrouter_pool_info(new VirtualRouterPoolInfo());
    xmlrpc_c::methodPtr hookpool_info(new HookPoolInfo());
    xmlrpc_c::methodPtr backupjobpool_info(new BackupJobPoolInfo());

    // Host Methods
    xmlrpc_c::methodPtr host_status(new HostStatus());
    xmlrpc_c::methodPtr host_monitoring(new HostMonitoring());
    xmlrpc_c::methodPtr host_pool_monitoring(new HostPoolMonitoring());

    // Image Methods
    xmlrpc_c::methodPtr image_persistent(new ImagePersistent());
    xmlrpc_c::methodPtr image_enable(new ImageEnable());
    xmlrpc_c::methodPtr image_chtype(new ImageChangeType());
    xmlrpc_c::methodPtr image_clone(new ImageClone());
    xmlrpc_c::methodPtr image_snap_delete(new ImageSnapshotDelete());
    xmlrpc_c::methodPtr image_snap_revert(new ImageSnapshotRevert());
    xmlrpc_c::methodPtr image_snap_flatten(new ImageSnapshotFlatten());
    xmlrpc_c::methodPtr image_restore(new ImageRestore());

    // Datastore Methods
    xmlrpc_c::methodPtr datastore_enable(new DatastoreEnable());

    // Chown Methods
    xmlrpc_c::methodPtr vm_chown(new VirtualMachineChown());
    xmlrpc_c::methodPtr template_chown(new TemplateChown());
    xmlrpc_c::methodPtr vn_chown(new VirtualNetworkChown());
    xmlrpc_c::methodPtr image_chown(new ImageChown());
    xmlrpc_c::methodPtr datastore_chown(new DatastoreChown());
    xmlrpc_c::methodPtr doc_chown(new DocumentChown());
    xmlrpc_c::methodPtr secg_chown(new SecurityGroupChown());
    xmlrpc_c::methodPtr vrouter_chown(new VirtualRouterChown());
    xmlrpc_c::methodPtr vmg_chown(new VMGroupChown());
    xmlrpc_c::methodPtr vntemplate_chown(new VirtualNetworkTemplateChown());
    xmlrpc_c::methodPtr backupjob_chown(new BackupJobChown());

    // Chmod Methods
    xmlrpc_c::methodPtr vm_chmod(new VirtualMachineChmod());
    xmlrpc_c::methodPtr template_chmod(new TemplateChmod());
    xmlrpc_c::methodPtr vn_chmod(new VirtualNetworkChmod());
    xmlrpc_c::methodPtr image_chmod(new ImageChmod());
    xmlrpc_c::methodPtr datastore_chmod(new DatastoreChmod());
    xmlrpc_c::methodPtr doc_chmod(new DocumentChmod());
    xmlrpc_c::methodPtr secg_chmod(new SecurityGroupChmod());
    xmlrpc_c::methodPtr vrouter_chmod(new VirtualRouterChmod());
    xmlrpc_c::methodPtr vmg_chmod(new VMGroupChmod());
    xmlrpc_c::methodPtr vntemplate_chmod(new VirtualNetworkTemplateChmod());
    xmlrpc_c::methodPtr backupjob_chmod(new BackupJobChmod());

    // Cluster Methods
    xmlrpc_c::methodPtr cluster_addhost(new ClusterAddHost());
    xmlrpc_c::methodPtr cluster_delhost(new ClusterDelHost());
    xmlrpc_c::methodPtr cluster_addds(new ClusterAddDatastore());
    xmlrpc_c::methodPtr cluster_delds(new ClusterDelDatastore());
    xmlrpc_c::methodPtr cluster_addvnet(new ClusterAddVNet());
    xmlrpc_c::methodPtr cluster_delvnet(new ClusterDelVNet());

    // System Methods
    xmlrpc_c::methodPtr system_version(new SystemVersion());
    xmlrpc_c::methodPtr system_config(new SystemConfig());
    xmlrpc_c::methodPtr system_sql(new SystemSql());
    xmlrpc_c::methodPtr system_sqlquery(new SystemSqlQuery());

    // Rename Methods
    xmlrpc_c::methodPtr vm_rename(new VirtualMachineRename());
    xmlrpc_c::methodPtr template_rename(new TemplateRename());
    xmlrpc_c::methodPtr vn_rename(new VirtualNetworkRename());
    xmlrpc_c::methodPtr image_rename(new ImageRename());
    xmlrpc_c::methodPtr doc_rename(new DocumentRename());
    xmlrpc_c::methodPtr cluster_rename(new ClusterRename());
    xmlrpc_c::methodPtr datastore_rename(new DatastoreRename());
    xmlrpc_c::methodPtr host_rename(new HostRename());
    xmlrpc_c::methodPtr secg_rename(new SecurityGroupRename());
    xmlrpc_c::methodPtr vrouter_rename(new VirtualRouterRename());
    xmlrpc_c::methodPtr vmg_rename(new VMGroupRename());
    xmlrpc_c::methodPtr vntemplate_rename(new VirtualNetworkTemplateRename());
    xmlrpc_c::methodPtr hook_rename(new HookRename());
    xmlrpc_c::methodPtr backupjob_rename(new BackupJobRename());

    // Virtual Router Methods
    xmlrpc_c::methodPtr vrouter_instantiate(new VirtualRouterInstantiate());
    xmlrpc_c::methodPtr vrouter_attachnic(new VirtualRouterAttachNic());
    xmlrpc_c::methodPtr vrouter_detachnic(new VirtualRouterDetachNic());

    // Security Group methods
    xmlrpc_c::methodPtr secg_commit(new SecurityGroupCommit());

    // VMGroup methods
    xmlrpc_c::methodPtr vmg_addrole(new VMGroupAddRole());
    xmlrpc_c::methodPtr vmg_delrole(new VMGroupDelRole());
    xmlrpc_c::methodPtr vmg_updaterole(new VMGroupUpdateRole());

    // Hook methods
    xmlrpc_c::methodPtr hook_retry(new HookRetry());

    // HookLog methods
    xmlrpc_c::methodPtr hooklog_info(new HookLogInfo());

    // Backup Job methods
    xmlrpc_c::methodPtr backupjob_backup(new BackupJobBackup());
    xmlrpc_c::methodPtr backupjob_cancel(new BackupJobCancel());
    xmlrpc_c::methodPtr backupjob_retry(new BackupJobRetry());
    xmlrpc_c::methodPtr backupjob_priority(new BackupJobPriority());
    xmlrpc_c::methodPtr backupjob_schedadd(new BackupJobSchedAdd());
    xmlrpc_c::methodPtr backupjob_scheddelete(new BackupJobSchedDelete());
    xmlrpc_c::methodPtr backupjob_schedupdate(new BackupJobSchedUpdate());

    /* VM related methods  */
    RequestManagerRegistry.addMethod("one.vm.deploy", vm_deploy);
    RequestManagerRegistry.addMethod("one.vm.action", vm_action);
    RequestManagerRegistry.addMethod("one.vm.migrate", vm_migrate);
    RequestManagerRegistry.addMethod("one.vm.allocate", vm_allocate);
    RequestManagerRegistry.addMethod("one.vm.info", vm_info);
    RequestManagerRegistry.addMethod("one.vm.chown", vm_chown);
    RequestManagerRegistry.addMethod("one.vm.chmod", vm_chmod);
    RequestManagerRegistry.addMethod("one.vm.monitoring", vm_monitoring);
    RequestManagerRegistry.addMethod("one.vm.attach", vm_attach);
    RequestManagerRegistry.addMethod("one.vm.detach", vm_detach);
    RequestManagerRegistry.addMethod("one.vm.attachnic", vm_attachnic);
    RequestManagerRegistry.addMethod("one.vm.detachnic", vm_detachnic);
    RequestManagerRegistry.addMethod("one.vm.updatenic", vm_updatenic);
    RequestManagerRegistry.addMethod("one.vm.rename", vm_rename);
    RequestManagerRegistry.addMethod("one.vm.resize", vm_resize);
    RequestManagerRegistry.addMethod("one.vm.update", vm_update);
    RequestManagerRegistry.addMethod("one.vm.snapshotcreate", vm_snap_create);
    RequestManagerRegistry.addMethod("one.vm.snapshotrevert", vm_snap_revert);
    RequestManagerRegistry.addMethod("one.vm.snapshotdelete", vm_snap_delete);
    RequestManagerRegistry.addMethod("one.vm.disksaveas", vm_dsaveas);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotcreate", vm_dsnap_create);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotrevert", vm_dsnap_revert);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotdelete", vm_dsnap_delete);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotrename", vm_dsnap_rename);
    RequestManagerRegistry.addMethod("one.vm.recover", vm_recover);
    RequestManagerRegistry.addMethod("one.vm.updateconf", vm_updateconf);
    RequestManagerRegistry.addMethod("one.vm.lock", vm_lock);
    RequestManagerRegistry.addMethod("one.vm.unlock", vm_unlock);
    RequestManagerRegistry.addMethod("one.vm.diskresize", vm_disk_resize);
    RequestManagerRegistry.addMethod("one.vm.schedadd", vm_sched_add);
    RequestManagerRegistry.addMethod("one.vm.scheddelete", vm_sched_delete);
    RequestManagerRegistry.addMethod("one.vm.schedupdate", vm_sched_update);
    RequestManagerRegistry.addMethod("one.vm.attachsg", vm_attachsg);
    RequestManagerRegistry.addMethod("one.vm.detachsg", vm_detachsg);
    RequestManagerRegistry.addMethod("one.vm.backup", vm_backup);
    RequestManagerRegistry.addMethod("one.vm.backupcancel", vm_backupcancel);

    RequestManagerRegistry.addMethod("one.vmpool.info", vm_pool_info);
    RequestManagerRegistry.addMethod("one.vmpool.infoextended", vm_pool_info_extended);
    RequestManagerRegistry.addMethod("one.vmpool.infoset", vm_pool_info_set);
    RequestManagerRegistry.addMethod("one.vmpool.accounting", vm_pool_acct);
    RequestManagerRegistry.addMethod("one.vmpool.monitoring", vm_pool_monitoring);
    RequestManagerRegistry.addMethod("one.vmpool.showback", vm_pool_showback);
    RequestManagerRegistry.addMethod("one.vmpool.calculateshowback", vm_pool_calculate_showback);

    /* VM Template related methods*/
    RequestManagerRegistry.addMethod("one.template.update", template_update);
    RequestManagerRegistry.addMethod("one.template.instantiate",template_instantiate);
    RequestManagerRegistry.addMethod("one.template.allocate",template_allocate);
    RequestManagerRegistry.addMethod("one.template.delete", template_delete);
    RequestManagerRegistry.addMethod("one.template.info", template_info);
    RequestManagerRegistry.addMethod("one.template.chown", template_chown);
    RequestManagerRegistry.addMethod("one.template.chmod", template_chmod);
    RequestManagerRegistry.addMethod("one.template.clone", template_clone);
    RequestManagerRegistry.addMethod("one.template.rename", template_rename);
    RequestManagerRegistry.addMethod("one.template.lock", template_lock);
    RequestManagerRegistry.addMethod("one.template.unlock", template_unlock);
    RequestManagerRegistry.addMethod("one.templatepool.info",template_pool_info);

    /* VN Template related methods */
    RequestManagerRegistry.addMethod("one.vntemplate.update", vntemplate_update);
    RequestManagerRegistry.addMethod("one.vntemplate.instantiate",vntemplate_instantiate);
    RequestManagerRegistry.addMethod("one.vntemplate.allocate",vntemplate_allocate);
    RequestManagerRegistry.addMethod("one.vntemplate.delete", vntemplate_delete);
    RequestManagerRegistry.addMethod("one.vntemplate.info", vntemplate_info);
    RequestManagerRegistry.addMethod("one.vntemplate.chown", vntemplate_chown);
    RequestManagerRegistry.addMethod("one.vntemplate.chmod", vntemplate_chmod);
    RequestManagerRegistry.addMethod("one.vntemplate.clone", vntemplate_clone);
    RequestManagerRegistry.addMethod("one.vntemplate.rename", vntemplate_rename);
    RequestManagerRegistry.addMethod("one.vntemplate.lock", vntemplate_lock);
    RequestManagerRegistry.addMethod("one.vntemplate.unlock", vntemplate_unlock);
    RequestManagerRegistry.addMethod("one.vntemplatepool.info",vntemplate_pool_info);

    /* Host related methods*/
    RequestManagerRegistry.addMethod("one.host.status", host_status);
    RequestManagerRegistry.addMethod("one.host.update", host_update);
    RequestManagerRegistry.addMethod("one.host.allocate", host_allocate);
    RequestManagerRegistry.addMethod("one.host.delete", host_delete);
    RequestManagerRegistry.addMethod("one.host.info", host_info);
    RequestManagerRegistry.addMethod("one.host.monitoring", host_monitoring);
    RequestManagerRegistry.addMethod("one.host.rename", host_rename);

    RequestManagerRegistry.addMethod("one.hostpool.info", hostpool_info);
    RequestManagerRegistry.addMethod("one.hostpool.monitoring", host_pool_monitoring);

    /* Group related methods */

    xmlrpc_c::method * group_allocate_pt;
    xmlrpc_c::method * group_update_pt;
    xmlrpc_c::method * group_delete_pt;
    xmlrpc_c::method * group_add_admin_pt;
    xmlrpc_c::method * group_del_admin_pt;

    if (nebula.is_federation_slave())
    {
        group_allocate_pt       = new RequestManagerProxy("one.group.allocate");
        group_delete_pt         = new RequestManagerProxy("one.group.delete");
        group_update_pt         = new RequestManagerProxy("one.group.update");
        group_add_admin_pt      = new RequestManagerProxy("one.group.addadmin");
        group_del_admin_pt      = new RequestManagerProxy("one.group.deladmin");
    }
    else
    {
        group_allocate_pt       = new GroupAllocate();
        group_delete_pt         = new GroupDelete();
        group_update_pt         = new GroupUpdateTemplate();
        group_add_admin_pt      = new GroupAddAdmin();
        group_del_admin_pt      = new GroupDelAdmin();
    }

    xmlrpc_c::methodPtr group_allocate(group_allocate_pt);
    xmlrpc_c::methodPtr group_delete(group_delete_pt);
    xmlrpc_c::methodPtr group_update(group_update_pt);
    xmlrpc_c::methodPtr group_add_admin(group_add_admin_pt);
    xmlrpc_c::methodPtr group_del_admin(group_del_admin_pt);

    xmlrpc_c::methodPtr group_info(new GroupInfo());
    xmlrpc_c::methodPtr group_set_quota(new GroupSetQuota());
    xmlrpc_c::methodPtr grouppool_info(new GroupPoolInfo());
    xmlrpc_c::methodPtr group_get_default_quota(new GroupQuotaInfo());
    xmlrpc_c::methodPtr group_set_default_quota(new GroupQuotaUpdate());

    RequestManagerRegistry.addMethod("one.group.allocate",   group_allocate);
    RequestManagerRegistry.addMethod("one.group.delete",     group_delete);
    RequestManagerRegistry.addMethod("one.group.info",       group_info);
    RequestManagerRegistry.addMethod("one.group.quota",      group_set_quota);
    RequestManagerRegistry.addMethod("one.group.update",     group_update);
    RequestManagerRegistry.addMethod("one.group.addadmin",   group_add_admin);
    RequestManagerRegistry.addMethod("one.group.deladmin",   group_del_admin);

    RequestManagerRegistry.addMethod("one.grouppool.info",  grouppool_info);

    RequestManagerRegistry.addMethod("one.groupquota.info", group_get_default_quota);
    RequestManagerRegistry.addMethod("one.groupquota.update", group_set_default_quota);

    /* Network related methods*/
    RequestManagerRegistry.addMethod("one.vn.reserve", vn_reserve);
    RequestManagerRegistry.addMethod("one.vn.add_ar", vn_add_ar);
    RequestManagerRegistry.addMethod("one.vn.rm_ar", vn_rm_ar);
    RequestManagerRegistry.addMethod("one.vn.update_ar", vn_update_ar);
    RequestManagerRegistry.addMethod("one.vn.free_ar", vn_free_ar);
    RequestManagerRegistry.addMethod("one.vn.hold", vn_hold);
    RequestManagerRegistry.addMethod("one.vn.release", vn_release);
    RequestManagerRegistry.addMethod("one.vn.allocate", vn_allocate);
    RequestManagerRegistry.addMethod("one.vn.update", vn_update);
    RequestManagerRegistry.addMethod("one.vn.delete", vn_delete);
    RequestManagerRegistry.addMethod("one.vn.info", vn_info);
    RequestManagerRegistry.addMethod("one.vn.chown", vn_chown);
    RequestManagerRegistry.addMethod("one.vn.chmod", vn_chmod);
    RequestManagerRegistry.addMethod("one.vn.rename", vn_rename);
    RequestManagerRegistry.addMethod("one.vn.lock", vn_lock);
    RequestManagerRegistry.addMethod("one.vn.unlock", vn_unlock);
    RequestManagerRegistry.addMethod("one.vn.recover", vn_recover);

    RequestManagerRegistry.addMethod("one.vnpool.info", vnpool_info);

    /* User related methods*/

    xmlrpc_c::method * user_allocate_pt;
    xmlrpc_c::method * user_update_pt;
    xmlrpc_c::method * user_delete_pt;
    xmlrpc_c::method * user_change_password_pt;
    xmlrpc_c::method * user_chown_pt;
    xmlrpc_c::method * user_add_group_pt;
    xmlrpc_c::method * user_del_group_pt;
    xmlrpc_c::method * user_change_auth_pt;
    xmlrpc_c::method * user_login_pt;
    xmlrpc_c::method * user_enable_pt;

    if (nebula.is_federation_slave())
    {
        user_allocate_pt        = new RequestManagerProxy("one.user.allocate");
        user_update_pt          = new RequestManagerProxy("one.user.update");
        user_delete_pt          = new RequestManagerProxy("one.user.delete");
        user_change_password_pt = new RequestManagerProxy("one.user.passwd");
        user_chown_pt           = new RequestManagerProxy("one.user.chgrp");
        user_add_group_pt       = new RequestManagerProxy("one.user.addgroup");
        user_del_group_pt       = new RequestManagerProxy("one.user.delgroup");
        user_change_auth_pt     = new RequestManagerProxy("one.user.chauth");
        user_login_pt           = new RequestManagerProxy("one.user.login");
        user_enable_pt          = new RequestManagerProxy("one.user.enable");

        static_cast<RequestManagerProxy*>(user_allocate_pt)->hide_argument(2);
        static_cast<RequestManagerProxy*>(user_change_password_pt)->hide_argument(2);
        static_cast<RequestManagerProxy*>(user_change_auth_pt)->hide_argument(3);
    }
    else
    {
        user_allocate_pt        = new UserAllocate();
        user_update_pt          = new UserUpdateTemplate();
        user_delete_pt          = new UserDelete();
        user_change_password_pt = new UserChangePassword();
        user_chown_pt           = new UserChown();
        user_add_group_pt       = new UserAddGroup();
        user_del_group_pt       = new UserDelGroup();
        user_change_auth_pt     = new UserChangeAuth();
        user_login_pt           = new UserLogin();
        user_enable_pt          = new UserEnable();
    }

    xmlrpc_c::methodPtr user_allocate(user_allocate_pt);
    xmlrpc_c::methodPtr user_update(user_update_pt);
    xmlrpc_c::methodPtr user_delete(user_delete_pt);
    xmlrpc_c::methodPtr user_change_password(user_change_password_pt);
    xmlrpc_c::methodPtr user_chown(user_chown_pt);
    xmlrpc_c::methodPtr user_add_group(user_add_group_pt);
    xmlrpc_c::methodPtr user_del_group(user_del_group_pt);
    xmlrpc_c::methodPtr user_change_auth(user_change_auth_pt);
    xmlrpc_c::methodPtr user_login(user_login_pt);
    xmlrpc_c::methodPtr user_enable(user_enable_pt);

    xmlrpc_c::methodPtr user_info(new UserInfo());
    xmlrpc_c::methodPtr user_set_quota(new UserSetQuota());
    xmlrpc_c::methodPtr userpool_info(new UserPoolInfo());
    xmlrpc_c::methodPtr user_get_default_quota(new UserQuotaInfo());
    xmlrpc_c::methodPtr user_set_default_quota(new UserQuotaUpdate());

    RequestManagerRegistry.addMethod("one.user.allocate", user_allocate);
    RequestManagerRegistry.addMethod("one.user.update", user_update);
    RequestManagerRegistry.addMethod("one.user.delete", user_delete);
    RequestManagerRegistry.addMethod("one.user.info", user_info);
    RequestManagerRegistry.addMethod("one.user.passwd", user_change_password);
    RequestManagerRegistry.addMethod("one.user.chgrp", user_chown);
    RequestManagerRegistry.addMethod("one.user.addgroup", user_add_group);
    RequestManagerRegistry.addMethod("one.user.delgroup", user_del_group);
    RequestManagerRegistry.addMethod("one.user.chauth", user_change_auth);
    RequestManagerRegistry.addMethod("one.user.quota", user_set_quota);
    RequestManagerRegistry.addMethod("one.user.login", user_login);
    RequestManagerRegistry.addMethod("one.user.enable", user_enable);

    RequestManagerRegistry.addMethod("one.userpool.info", userpool_info);

    RequestManagerRegistry.addMethod("one.userquota.info", user_get_default_quota);
    RequestManagerRegistry.addMethod("one.userquota.update", user_set_default_quota);

    /* Image related methods*/
    RequestManagerRegistry.addMethod("one.image.persistent", image_persistent);
    RequestManagerRegistry.addMethod("one.image.enable", image_enable);
    RequestManagerRegistry.addMethod("one.image.update", image_update);
    RequestManagerRegistry.addMethod("one.image.allocate", image_allocate);
    RequestManagerRegistry.addMethod("one.image.delete", image_delete);
    RequestManagerRegistry.addMethod("one.image.info", image_info);
    RequestManagerRegistry.addMethod("one.image.chown", image_chown);
    RequestManagerRegistry.addMethod("one.image.chmod", image_chmod);
    RequestManagerRegistry.addMethod("one.image.chtype", image_chtype);
    RequestManagerRegistry.addMethod("one.image.clone", image_clone);
    RequestManagerRegistry.addMethod("one.image.rename", image_rename);
    RequestManagerRegistry.addMethod("one.image.snapshotdelete", image_snap_delete);
    RequestManagerRegistry.addMethod("one.image.snapshotrevert", image_snap_revert);
    RequestManagerRegistry.addMethod("one.image.snapshotflatten", image_snap_flatten);
    RequestManagerRegistry.addMethod("one.image.restore", image_restore);
    RequestManagerRegistry.addMethod("one.image.lock", image_lock);
    RequestManagerRegistry.addMethod("one.image.unlock", image_unlock);

    RequestManagerRegistry.addMethod("one.imagepool.info", imagepool_info);

    /* ACL related methods */

    xmlrpc_c::method * acl_addrule_pt;
    xmlrpc_c::method * acl_delrule_pt;

    if (nebula.is_federation_slave())
    {
        acl_addrule_pt = new RequestManagerProxy("one.acl.addrule");
        acl_delrule_pt = new RequestManagerProxy("one.acl.delrule");
    }
    else
    {
        acl_addrule_pt = new AclAddRule();
        acl_delrule_pt = new AclDelRule();
    }

    xmlrpc_c::methodPtr acl_addrule(acl_addrule_pt);
    xmlrpc_c::methodPtr acl_delrule(acl_delrule_pt);

    xmlrpc_c::methodPtr acl_info(new AclInfo());

    RequestManagerRegistry.addMethod("one.acl.addrule", acl_addrule);
    RequestManagerRegistry.addMethod("one.acl.delrule", acl_delrule);
    RequestManagerRegistry.addMethod("one.acl.info",    acl_info);

    /* Datastore related methods */
    RequestManagerRegistry.addMethod("one.datastore.allocate",datastore_allocate);
    RequestManagerRegistry.addMethod("one.datastore.delete",  datastore_delete);
    RequestManagerRegistry.addMethod("one.datastore.info",    datastore_info);
    RequestManagerRegistry.addMethod("one.datastore.update",  datastore_update);
    RequestManagerRegistry.addMethod("one.datastore.chown",   datastore_chown);
    RequestManagerRegistry.addMethod("one.datastore.chmod",   datastore_chmod);
    RequestManagerRegistry.addMethod("one.datastore.rename",  datastore_rename);
    RequestManagerRegistry.addMethod("one.datastore.enable",  datastore_enable);

    RequestManagerRegistry.addMethod("one.datastorepool.info",datastorepool_info);

    /* Cluster related methods */
    RequestManagerRegistry.addMethod("one.cluster.allocate",cluster_allocate);
    RequestManagerRegistry.addMethod("one.cluster.delete",  cluster_delete);
    RequestManagerRegistry.addMethod("one.cluster.info",    cluster_info);
    RequestManagerRegistry.addMethod("one.cluster.update",  cluster_update);
    RequestManagerRegistry.addMethod("one.cluster.rename",  cluster_rename);

    RequestManagerRegistry.addMethod("one.cluster.addhost", cluster_addhost);
    RequestManagerRegistry.addMethod("one.cluster.delhost", cluster_delhost);
    RequestManagerRegistry.addMethod("one.cluster.adddatastore", cluster_addds);
    RequestManagerRegistry.addMethod("one.cluster.deldatastore", cluster_delds);
    RequestManagerRegistry.addMethod("one.cluster.addvnet", cluster_addvnet);
    RequestManagerRegistry.addMethod("one.cluster.delvnet", cluster_delvnet);

    RequestManagerRegistry.addMethod("one.clusterpool.info",clusterpool_info);

    /* Generic Document objects related methods*/
    RequestManagerRegistry.addMethod("one.document.allocate",doc_allocate);
    RequestManagerRegistry.addMethod("one.document.delete",  doc_delete);
    RequestManagerRegistry.addMethod("one.document.info",    doc_info);
    RequestManagerRegistry.addMethod("one.document.update",  doc_update);
    RequestManagerRegistry.addMethod("one.document.chown",   doc_chown);
    RequestManagerRegistry.addMethod("one.document.chmod",   doc_chmod);
    RequestManagerRegistry.addMethod("one.document.clone",   doc_clone);
    RequestManagerRegistry.addMethod("one.document.rename",  doc_rename);
    RequestManagerRegistry.addMethod("one.document.lock",    doc_lock);
    RequestManagerRegistry.addMethod("one.document.unlock",  doc_unlock);

    RequestManagerRegistry.addMethod("one.documentpool.info",docpool_info);

    /* Zone related methods */

    xmlrpc_c::method * zone_allocate_pt;
    xmlrpc_c::method * zone_update_pt;
    xmlrpc_c::method * zone_delete_pt;
    xmlrpc_c::method * zone_rename_pt;

    if (nebula.is_federation_slave())
    {
        zone_allocate_pt    = new RequestManagerProxy("one.zone.allocate");
        zone_update_pt      = new RequestManagerProxy("one.zone.update");
        zone_delete_pt      = new RequestManagerProxy("one.zone.delete");
        zone_rename_pt      = new RequestManagerProxy("one.zone.rename");
    }
    else
    {
        zone_allocate_pt    = new ZoneAllocate();
        zone_update_pt      = new ZoneUpdateTemplate();
        zone_delete_pt      = new ZoneDelete();
        zone_rename_pt      = new ZoneRename();

        xmlrpc_c::methodPtr zone_updatedb(new ZoneUpdateDB());

        RequestManagerRegistry.addMethod("one.zone.updatedb", zone_updatedb);
    }

    xmlrpc_c::methodPtr zone_allocate(zone_allocate_pt);
    xmlrpc_c::methodPtr zone_update(zone_update_pt);
    xmlrpc_c::methodPtr zone_delete(zone_delete_pt);
    xmlrpc_c::methodPtr zone_rename(zone_rename_pt);
    xmlrpc_c::methodPtr zone_enable(new ZoneEnable());
    xmlrpc_c::methodPtr zone_addserver(new ZoneAddServer());
    xmlrpc_c::methodPtr zone_delserver(new ZoneDeleteServer());
    xmlrpc_c::methodPtr zone_resetserver(new ZoneResetServer());
    xmlrpc_c::methodPtr zone_replicatelog(new ZoneReplicateLog());
    xmlrpc_c::methodPtr zone_voterequest(new ZoneVoteRequest());
    xmlrpc_c::methodPtr zone_raftstatus(new ZoneRaftStatus());
    xmlrpc_c::methodPtr zone_fedreplicatelog(new ZoneReplicateFedLog());

    xmlrpc_c::methodPtr zone_info(new ZoneInfo());
    xmlrpc_c::methodPtr zonepool_info(new ZonePoolInfo());

    RequestManagerRegistry.addMethod("one.zone.allocate", zone_allocate);
    RequestManagerRegistry.addMethod("one.zone.update",   zone_update);
    RequestManagerRegistry.addMethod("one.zone.delete",   zone_delete);
    RequestManagerRegistry.addMethod("one.zone.info",     zone_info);
    RequestManagerRegistry.addMethod("one.zone.rename",   zone_rename);
    RequestManagerRegistry.addMethod("one.zone.enable",   zone_enable);
    RequestManagerRegistry.addMethod("one.zone.replicate",zone_replicatelog);
    RequestManagerRegistry.addMethod("one.zone.fedreplicate",zone_fedreplicatelog);
    RequestManagerRegistry.addMethod("one.zone.voterequest",zone_voterequest);
    RequestManagerRegistry.addMethod("one.zone.raftstatus", zone_raftstatus);

    RequestManagerRegistry.addMethod("one.zone.addserver", zone_addserver);
    RequestManagerRegistry.addMethod("one.zone.delserver", zone_delserver);
    RequestManagerRegistry.addMethod("one.zone.resetserver", zone_resetserver);

    RequestManagerRegistry.addMethod("one.zonepool.info",zonepool_info);

    /* Security Group objects related methods*/

    RequestManagerRegistry.addMethod("one.secgroup.allocate",secg_allocate);
    RequestManagerRegistry.addMethod("one.secgroup.delete",  secg_delete);
    RequestManagerRegistry.addMethod("one.secgroup.info",    secg_info);
    RequestManagerRegistry.addMethod("one.secgroup.update",  secg_update);
    RequestManagerRegistry.addMethod("one.secgroup.chown",   secg_chown);
    RequestManagerRegistry.addMethod("one.secgroup.chmod",   secg_chmod);
    RequestManagerRegistry.addMethod("one.secgroup.clone",   secg_clone);
    RequestManagerRegistry.addMethod("one.secgroup.rename",  secg_rename);
    RequestManagerRegistry.addMethod("one.secgroup.commit",  secg_commit);

    RequestManagerRegistry.addMethod("one.secgrouppool.info",secgpool_info);

    /* VM Group objects related methods*/

    RequestManagerRegistry.addMethod("one.vmgroup.allocate", vmg_allocate);
    RequestManagerRegistry.addMethod("one.vmgroup.delete",   vmg_delete);
    RequestManagerRegistry.addMethod("one.vmgroup.info",     vmg_info);
    RequestManagerRegistry.addMethod("one.vmgroup.chown",    vmg_chown);
    RequestManagerRegistry.addMethod("one.vmgroup.chmod",    vmg_chmod);
    RequestManagerRegistry.addMethod("one.vmgroup.rename",   vmg_rename);
    RequestManagerRegistry.addMethod("one.vmgroup.update",   vmg_update);
    RequestManagerRegistry.addMethod("one.vmgroup.lock",     vmg_lock);
    RequestManagerRegistry.addMethod("one.vmgroup.unlock",   vmg_unlock);
    RequestManagerRegistry.addMethod("one.vmgroup.roleadd",  vmg_addrole);
    RequestManagerRegistry.addMethod("one.vmgroup.roledelete", vmg_delrole);
    RequestManagerRegistry.addMethod("one.vmgroup.roleupdate", vmg_updaterole);

    RequestManagerRegistry.addMethod("one.vmgrouppool.info", vmgpool_info);

    /* Vdc related methods */

    xmlrpc_c::method * vdc_allocate_pt;
    xmlrpc_c::method * vdc_update_pt;
    xmlrpc_c::method * vdc_delete_pt;
    xmlrpc_c::method * vdc_rename_pt;

    xmlrpc_c::method * vdc_add_group_pt;
    xmlrpc_c::method * vdc_del_group_pt;
    xmlrpc_c::method * vdc_add_cluster_pt;
    xmlrpc_c::method * vdc_del_cluster_pt;
    xmlrpc_c::method * vdc_add_host_pt;
    xmlrpc_c::method * vdc_del_host_pt;
    xmlrpc_c::method * vdc_add_datastore_pt;
    xmlrpc_c::method * vdc_del_datastore_pt;
    xmlrpc_c::method * vdc_add_vnet_pt;
    xmlrpc_c::method * vdc_del_vnet_pt;

    if (nebula.is_federation_slave())
    {
        vdc_allocate_pt     = new RequestManagerProxy("one.vdc.allocate");
        vdc_update_pt       = new RequestManagerProxy("one.vdc.update");
        vdc_delete_pt       = new RequestManagerProxy("one.vdc.delete");
        vdc_rename_pt       = new RequestManagerProxy("one.vdc.rename");

        vdc_add_group_pt    = new RequestManagerProxy("one.vdc.addgroup");
        vdc_del_group_pt    = new RequestManagerProxy("one.vdc.delgroup");
        vdc_add_cluster_pt  = new RequestManagerProxy("one.vdc.addcluster");
        vdc_del_cluster_pt  = new RequestManagerProxy("one.vdc.delcluster");
        vdc_add_host_pt     = new RequestManagerProxy("one.vdc.addhost");
        vdc_del_host_pt     = new RequestManagerProxy("one.vdc.delhost");
        vdc_add_datastore_pt= new RequestManagerProxy("one.vdc.adddatastore");
        vdc_del_datastore_pt= new RequestManagerProxy("one.vdc.deldatastore");
        vdc_add_vnet_pt     = new RequestManagerProxy("one.vdc.addvnet");
        vdc_del_vnet_pt     = new RequestManagerProxy("one.vdc.delvnet");
    }
    else
    {
        vdc_allocate_pt     = new VdcAllocate();
        vdc_update_pt       = new VdcUpdateTemplate();
        vdc_delete_pt       = new VdcDelete();
        vdc_rename_pt       = new VdcRename();

        vdc_add_group_pt    = new VdcAddGroup();
        vdc_del_group_pt    = new VdcDelGroup();
        vdc_add_cluster_pt  = new VdcAddCluster();
        vdc_del_cluster_pt  = new VdcDelCluster();
        vdc_add_host_pt     = new VdcAddHost();
        vdc_del_host_pt     = new VdcDelHost();
        vdc_add_datastore_pt= new VdcAddDatastore();
        vdc_del_datastore_pt= new VdcDelDatastore();
        vdc_add_vnet_pt     = new VdcAddVNet();
        vdc_del_vnet_pt     = new VdcDelVNet();
    }

    xmlrpc_c::methodPtr vdc_allocate(vdc_allocate_pt);
    xmlrpc_c::methodPtr vdc_update(vdc_update_pt);
    xmlrpc_c::methodPtr vdc_delete(vdc_delete_pt);
    xmlrpc_c::methodPtr vdc_rename(vdc_rename_pt);

    xmlrpc_c::methodPtr vdc_add_group(vdc_add_group_pt);
    xmlrpc_c::methodPtr vdc_del_group(vdc_del_group_pt);
    xmlrpc_c::methodPtr vdc_add_cluster(vdc_add_cluster_pt);
    xmlrpc_c::methodPtr vdc_del_cluster(vdc_del_cluster_pt);
    xmlrpc_c::methodPtr vdc_add_host(vdc_add_host_pt);
    xmlrpc_c::methodPtr vdc_del_host(vdc_del_host_pt);
    xmlrpc_c::methodPtr vdc_add_datastore(vdc_add_datastore_pt);
    xmlrpc_c::methodPtr vdc_del_datastore(vdc_del_datastore_pt);
    xmlrpc_c::methodPtr vdc_add_vnet(vdc_add_vnet_pt);
    xmlrpc_c::methodPtr vdc_del_vnet(vdc_del_vnet_pt);


    xmlrpc_c::methodPtr vdc_info(new VdcInfo());
    xmlrpc_c::methodPtr vdcpool_info(new VdcPoolInfo());

    RequestManagerRegistry.addMethod("one.vdc.allocate",    vdc_allocate);
    RequestManagerRegistry.addMethod("one.vdc.update",      vdc_update);
    RequestManagerRegistry.addMethod("one.vdc.delete",      vdc_delete);

    RequestManagerRegistry.addMethod("one.vdc.addgroup",    vdc_add_group);
    RequestManagerRegistry.addMethod("one.vdc.delgroup",    vdc_del_group);
    RequestManagerRegistry.addMethod("one.vdc.addcluster",  vdc_add_cluster);
    RequestManagerRegistry.addMethod("one.vdc.delcluster",  vdc_del_cluster);

    RequestManagerRegistry.addMethod("one.vdc.addhost",     vdc_add_host);
    RequestManagerRegistry.addMethod("one.vdc.delhost",     vdc_del_host);
    RequestManagerRegistry.addMethod("one.vdc.adddatastore",vdc_add_datastore);
    RequestManagerRegistry.addMethod("one.vdc.deldatastore",vdc_del_datastore);
    RequestManagerRegistry.addMethod("one.vdc.addvnet",     vdc_add_vnet);
    RequestManagerRegistry.addMethod("one.vdc.delvnet",     vdc_del_vnet);

    RequestManagerRegistry.addMethod("one.vdc.info",        vdc_info);
    RequestManagerRegistry.addMethod("one.vdc.rename",      vdc_rename);

    RequestManagerRegistry.addMethod("one.vdcpool.info",    vdcpool_info);

    /* Virtual Router related methods*/
    RequestManagerRegistry.addMethod("one.vrouter.update", vrouter_update);
    RequestManagerRegistry.addMethod("one.vrouter.allocate",vrouter_allocate);
    RequestManagerRegistry.addMethod("one.vrouter.delete", vrouter_delete);
    RequestManagerRegistry.addMethod("one.vrouter.info", vrouter_info);
    RequestManagerRegistry.addMethod("one.vrouter.chown", vrouter_chown);
    RequestManagerRegistry.addMethod("one.vrouter.chmod", vrouter_chmod);
    RequestManagerRegistry.addMethod("one.vrouter.rename", vrouter_rename);
    RequestManagerRegistry.addMethod("one.vrouter.instantiate",vrouter_instantiate);
    RequestManagerRegistry.addMethod("one.vrouter.attachnic", vrouter_attachnic);
    RequestManagerRegistry.addMethod("one.vrouter.detachnic", vrouter_detachnic);
    RequestManagerRegistry.addMethod("one.vrouter.lock", vrouter_lock);
    RequestManagerRegistry.addMethod("one.vrouter.unlock", vrouter_unlock);

    RequestManagerRegistry.addMethod("one.vrouterpool.info",vrouter_pool_info);

    /* MarketPlace related methods */

    xmlrpc_c::method * market_update_pt;
    xmlrpc_c::method * market_delete_pt;
    xmlrpc_c::method * market_chmod_pt;
    xmlrpc_c::method * market_chown_pt;
    xmlrpc_c::method * market_rename_pt;
    xmlrpc_c::method * market_enable_pt;

    if (nebula.is_federation_slave())
    {
        market_update_pt   = new RequestManagerProxy("one.market.update");
        market_delete_pt   = new RequestManagerProxy("one.market.delete");
        market_chmod_pt    = new RequestManagerProxy("one.market.chmod");
        market_chown_pt    = new RequestManagerProxy("one.market.chown");
        market_rename_pt   = new RequestManagerProxy("one.market.rename");
        market_enable_pt   = new RequestManagerProxy("one.market.enable");
    }
    else
    {
        market_update_pt   = new MarketPlaceUpdateTemplate();
        market_delete_pt   = new MarketPlaceDelete();
        market_chmod_pt    = new MarketPlaceChmod();
        market_chown_pt    = new MarketPlaceChown();
        market_rename_pt   = new MarketPlaceRename();
        market_enable_pt   = new MarketPlaceEnable();

        xmlrpc_c::methodPtr market_updatedb(new MarketPlaceUpdateDB());
        xmlrpc_c::methodPtr market_allocatedb(new MarketPlaceAllocateDB());

        RequestManagerRegistry.addMethod("one.market.updatedb",
                market_updatedb);

        RequestManagerRegistry.addMethod("one.market.allocatedb",
                market_allocatedb);
    }

    xmlrpc_c::methodPtr market_allocate(new MarketPlaceAllocate());
    xmlrpc_c::methodPtr market_update(market_update_pt);
    xmlrpc_c::methodPtr market_delete(market_delete_pt);
    xmlrpc_c::methodPtr market_chmod(market_chmod_pt);
    xmlrpc_c::methodPtr market_chown(market_chown_pt);
    xmlrpc_c::methodPtr market_rename(market_rename_pt);
    xmlrpc_c::methodPtr market_enable(market_enable_pt);

    xmlrpc_c::methodPtr market_info(new MarketPlaceInfo());
    xmlrpc_c::methodPtr marketpool_info(new MarketPlacePoolInfo());

    RequestManagerRegistry.addMethod("one.market.allocate", market_allocate);
    RequestManagerRegistry.addMethod("one.market.update", market_update);
    RequestManagerRegistry.addMethod("one.market.delete", market_delete);
    RequestManagerRegistry.addMethod("one.market.chmod", market_chmod);
    RequestManagerRegistry.addMethod("one.market.chown", market_chown);

    RequestManagerRegistry.addMethod("one.market.info", market_info);
    RequestManagerRegistry.addMethod("one.market.rename", market_rename);
    RequestManagerRegistry.addMethod("one.market.enable", market_enable);

    RequestManagerRegistry.addMethod("one.marketpool.info", marketpool_info);

    /* MarketPlaceApp related methods */

    xmlrpc_c::method * marketapp_update_pt;
    xmlrpc_c::method * marketapp_chmod_pt;
    xmlrpc_c::method * marketapp_chown_pt;
    xmlrpc_c::method * marketapp_enable_pt;
    xmlrpc_c::method * marketapp_rename_pt;
    xmlrpc_c::method * marketapp_lock_pt;
    xmlrpc_c::method * marketapp_unlock_pt;

    if (nebula.is_federation_slave())
    {
        marketapp_update_pt   = new RequestManagerProxy("one.marketapp.update");
        marketapp_chmod_pt    = new RequestManagerProxy("one.marketapp.chmod");
        marketapp_chown_pt    = new RequestManagerProxy("one.marketapp.chown");
        marketapp_enable_pt   = new RequestManagerProxy("one.marketapp.enable");
        marketapp_rename_pt   = new RequestManagerProxy("one.marketapp.rename");
        marketapp_lock_pt   = new RequestManagerProxy("one.marketapp.lock");
        marketapp_unlock_pt   = new RequestManagerProxy("one.marketapp.unlock");
    }
    else
    {
        marketapp_update_pt   = new MarketPlaceAppUpdateTemplate();
        marketapp_chmod_pt    = new MarketPlaceAppChmod();
        marketapp_chown_pt    = new MarketPlaceAppChown();
        marketapp_enable_pt   = new MarketPlaceAppEnable();
        marketapp_rename_pt   = new MarketPlaceAppRename();
        marketapp_lock_pt   = new MarketPlaceAppLock();
        marketapp_unlock_pt   = new MarketPlaceAppUnlock();

        xmlrpc_c::methodPtr marketapp_updatedb(new MarketPlaceAppUpdateDB());
        xmlrpc_c::methodPtr marketapp_dropdb(new MarketPlaceAppDropDB());
        xmlrpc_c::methodPtr marketapp_allocatedb(new MarketPlaceAppAllocateDB());

        RequestManagerRegistry.addMethod("one.marketapp.updatedb",
                marketapp_updatedb);

        RequestManagerRegistry.addMethod("one.marketapp.dropdb",
                marketapp_dropdb);

        RequestManagerRegistry.addMethod("one.marketapp.allocatedb",
                marketapp_allocatedb);
    }

    xmlrpc_c::methodPtr marketapp_allocate(new MarketPlaceAppAllocate());
    xmlrpc_c::methodPtr marketapp_update(marketapp_update_pt);
    xmlrpc_c::methodPtr marketapp_delete(new MarketPlaceAppDelete());
    xmlrpc_c::methodPtr marketapp_chmod(marketapp_chmod_pt);
    xmlrpc_c::methodPtr marketapp_chown(marketapp_chown_pt);
    xmlrpc_c::methodPtr marketapp_enable(marketapp_enable_pt);
    xmlrpc_c::methodPtr marketapp_rename(marketapp_rename_pt);
    xmlrpc_c::methodPtr marketapp_lock(marketapp_lock_pt);
    xmlrpc_c::methodPtr marketapp_unlock(marketapp_unlock_pt);

    xmlrpc_c::methodPtr marketapp_info(new MarketPlaceAppInfo());
    xmlrpc_c::methodPtr marketapppool_info(new MarketPlaceAppPoolInfo());

    RequestManagerRegistry.addMethod("one.marketapp.allocate", marketapp_allocate);
    RequestManagerRegistry.addMethod("one.marketapp.update", marketapp_update);
    RequestManagerRegistry.addMethod("one.marketapp.delete", marketapp_delete);
    RequestManagerRegistry.addMethod("one.marketapp.chmod", marketapp_chmod);
    RequestManagerRegistry.addMethod("one.marketapp.chown", marketapp_chown);
    RequestManagerRegistry.addMethod("one.marketapp.enable", marketapp_enable);
    RequestManagerRegistry.addMethod("one.marketapp.lock", marketapp_lock);
    RequestManagerRegistry.addMethod("one.marketapp.unlock", marketapp_unlock);

    RequestManagerRegistry.addMethod("one.marketapp.info", marketapp_info);
    RequestManagerRegistry.addMethod("one.marketapp.rename", marketapp_rename);

    RequestManagerRegistry.addMethod("one.marketapppool.info", marketapppool_info);

    /* Hooks related methods */
    RequestManagerRegistry.addMethod("one.hook.allocate", hook_allocate);
    RequestManagerRegistry.addMethod("one.hook.delete", hook_delete);
    RequestManagerRegistry.addMethod("one.hook.update", hook_update);
    RequestManagerRegistry.addMethod("one.hook.rename", hook_rename);
    RequestManagerRegistry.addMethod("one.hook.info", hook_info);
    RequestManagerRegistry.addMethod("one.hook.lock", hook_lock);
    RequestManagerRegistry.addMethod("one.hook.unlock", hook_unlock);
    RequestManagerRegistry.addMethod("one.hook.retry", hook_retry);
    RequestManagerRegistry.addMethod("one.hookpool.info", hookpool_info);

    /* Hook Log related methods */
    RequestManagerRegistry.addMethod("one.hooklog.info", hooklog_info);

    /* Backup Job related methods */
    RequestManagerRegistry.addMethod("one.backupjob.allocate", backupjob_allocate);
    RequestManagerRegistry.addMethod("one.backupjob.delete", backupjob_delete);
    RequestManagerRegistry.addMethod("one.backupjob.update", backupjob_update);
    RequestManagerRegistry.addMethod("one.backupjob.rename", backupjob_rename);
    RequestManagerRegistry.addMethod("one.backupjob.info", backupjob_info);
    RequestManagerRegistry.addMethod("one.backupjob.chown", backupjob_chown);
    RequestManagerRegistry.addMethod("one.backupjob.chmod", backupjob_chmod);
    RequestManagerRegistry.addMethod("one.backupjob.lock", backupjob_lock);
    RequestManagerRegistry.addMethod("one.backupjob.unlock", backupjob_unlock);
    RequestManagerRegistry.addMethod("one.backupjob.backup", backupjob_backup);
    RequestManagerRegistry.addMethod("one.backupjob.cancel", backupjob_cancel);
    RequestManagerRegistry.addMethod("one.backupjob.retry", backupjob_retry);
    RequestManagerRegistry.addMethod("one.backupjob.priority", backupjob_priority);
    RequestManagerRegistry.addMethod("one.backupjob.schedadd", backupjob_schedadd);
    RequestManagerRegistry.addMethod("one.backupjob.scheddelete", backupjob_scheddelete);
    RequestManagerRegistry.addMethod("one.backupjob.schedupdate", backupjob_schedupdate);
    RequestManagerRegistry.addMethod("one.backupjobpool.info", backupjobpool_info);

    /* System related methods */
    RequestManagerRegistry.addMethod("one.system.version", system_version);
    RequestManagerRegistry.addMethod("one.system.config", system_config);
    RequestManagerRegistry.addMethod("one.system.sql", system_sql);
    RequestManagerRegistry.addMethod("one.system.sqlquery", system_sqlquery);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::finalize()
{
    NebulaLog::log("ReM",Log::INFO,"Stopping XML-RPC server...");

    {
        std::lock_guard<std::mutex> lock(end_lock);
        end = true;
    }

    if (cm)
    {
        cm->terminate();
    }

    shutdown(socket_fd, SHUT_RDWR);

    if (socket_fd != -1)
    {
        close(socket_fd);
    }
}

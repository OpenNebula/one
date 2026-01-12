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

#include "RequestManagerXRPC.h"
#include "RequestManagerProxyXRPC.h"

#include "AclXRPC.h"
#include "BackupJobXRPC.h"
#include "ClusterXRPC.h"
#include "DatastoreXRPC.h"
#include "DocumentXRPC.h"
#include "GroupXRPC.h"
#include "HookXRPC.h"
#include "HostXRPC.h"
#include "ImageXRPC.h"
#include "MarketPlaceXRPC.h"
#include "MarketPlaceAppXRPC.h"
#include "SecurityGroupXRPC.h"
#include "SystemXRPC.h"
#include "TemplateXRPC.h"
#include "UserXRPC.h"
#include "VdcXRPC.h"
#include "VirtualMachineXRPC.h"
#include "VirtualNetworkXRPC.h"
#include "VirtualRouterXRPC.h"
#include "VMGroupXRPC.h"
#include "VNTemplateXRPC.h"
#include "ZoneXRPC.h"

#include "Request.h"
#include "NebulaLog.h"

#include <cerrno>
#include <cstring>
#include <sys/signal.h>
#include <netdb.h>
#include <fcntl.h>
#include <unistd.h>

using namespace std;

RequestManagerXRPC::RequestManagerXRPC(
        const string& _port,
        int _max_conn,
        int _max_conn_backlog,
        int _keepalive_timeout,
        int _keepalive_max_conn,
        int _timeout,
        const string& _xml_log_file,
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
    xmlrpc_limit_set(XMLRPC_XML_SIZE_LIMIT_ID, message_size);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerXRPC::~RequestManagerXRPC()
{
    if (xml_server_thread.joinable())
    {
        xml_server_thread.join();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerXRPC::xml_server_loop()
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

        thread conn_thread([client_fd, this]
        {
            socket_map.insert(this_thread::get_id(), client_fd);

            xmlrpc_c::serverAbyss * as = create_abyss();

            as->runConn(client_fd);

            delete as;

            cm->del();

            socket_map.erase(this_thread::get_id());

            close(client_fd);

            return;
        });

        conn_thread.detach();
    }

    NebulaLog::log("ReM", Log::INFO, "XML-RPC server stopped.");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

xmlrpc_c::serverAbyss * RequestManagerXRPC::create_abyss()
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

int RequestManagerXRPC::setup_socket()
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
        NebulaLog::log("ReM", Log::ERROR, oss);

        return -1;
    }

    socket_fd = socket(result->ai_family, result->ai_socktype, 0);

    if ( socket_fd == -1 )
    {
        ostringstream oss;

        oss << "Cannot open server socket: " << strerror(errno);
        NebulaLog::log("ReM", Log::ERROR, oss);

        freeaddrinfo(result);

        return -1;
    }

    rc = setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int));

    if ( rc == -1 )
    {
        ostringstream oss;

        oss << "Cannot set socket options: " << strerror(errno);
        NebulaLog::log("ReM", Log::ERROR, oss);

        close(socket_fd);

        freeaddrinfo(result);

        return -1;
    }

    fcntl(socket_fd, F_SETFD, FD_CLOEXEC); // Close socket in MADs

    rc = ::bind(socket_fd, result->ai_addr, result->ai_addrlen);

    freeaddrinfo(result);

    if ( rc == -1)
    {
        ostringstream oss;

        oss << "Cannot bind to " << listen_address << ":" << port << " : "
            << strerror(errno);

        NebulaLog::log("ReM", Log::ERROR, oss);

        close(socket_fd);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerXRPC::start()
{
    ostringstream   oss;

    NebulaLog::log("ReM", Log::INFO, "Starting Request Manager (XML-RPC)...");

    int rc = setup_socket();

    if ( rc != 0 )
    {
        return -1;
    }

    register_xml_methods();

    oss << "Starting XML-RPC server, port " << port << " ...";
    NebulaLog::log("ReM", Log::INFO, oss);

    xml_server_thread = thread(&RequestManagerXRPC::xml_server_loop, this);

    NebulaLog::log("ReM", Log::INFO, "Request Manager started");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerXRPC::register_xml_methods()
{
    Nebula& nebula = Nebula::instance();

    // ACL related methods
    xmlrpc_c::method * acl_addrule_pt;
    xmlrpc_c::method * acl_delrule_pt;

    if (nebula.is_federation_slave())
    {
        acl_addrule_pt = new RequestManagerProxyXRPC("one.acl.addrule");
        acl_delrule_pt = new RequestManagerProxyXRPC("one.acl.delrule");
    }
    else
    {
        acl_addrule_pt = new AclAddRuleXRPC();
        acl_delrule_pt = new AclDelRuleXRPC();
    }

    xmlrpc_c::methodPtr acl_addrule(acl_addrule_pt);
    xmlrpc_c::methodPtr acl_delrule(acl_delrule_pt);
    xmlrpc_c::methodPtr acl_info(new AclInfoXRPC());

    RequestManagerRegistry.addMethod("one.acl.addrule", acl_addrule);
    RequestManagerRegistry.addMethod("one.acl.delrule", acl_delrule);
    RequestManagerRegistry.addMethod("one.acl.info",    acl_info);

    // Host related methods
    xmlrpc_c::methodPtr host_allocate(new HostAllocateXRPC());
    xmlrpc_c::methodPtr host_delete(new HostDeleteXRPC());
    xmlrpc_c::methodPtr host_info(new HostInfoXRPC());
    xmlrpc_c::methodPtr host_update(new HostUpdateXRPC());
    xmlrpc_c::methodPtr host_rename(new HostRenameXRPC());
    xmlrpc_c::methodPtr host_status(new HostStatusXRPC());
    xmlrpc_c::methodPtr host_monitoring(new HostMonitoringXRPC());
    xmlrpc_c::methodPtr hostpool_info(new HostPoolInfoXRPC());
    xmlrpc_c::methodPtr host_pool_monitoring(new HostPoolMonitoringXRPC());

    RequestManagerRegistry.addMethod("one.host.allocate", host_allocate);
    RequestManagerRegistry.addMethod("one.host.delete", host_delete);
    RequestManagerRegistry.addMethod("one.host.info", host_info);
    RequestManagerRegistry.addMethod("one.host.update", host_update);
    RequestManagerRegistry.addMethod("one.host.rename", host_rename);
    RequestManagerRegistry.addMethod("one.host.status", host_status);
    RequestManagerRegistry.addMethod("one.host.monitoring", host_monitoring);

    RequestManagerRegistry.addMethod("one.hostpool.info", hostpool_info);
    RequestManagerRegistry.addMethod("one.hostpool.monitoring", host_pool_monitoring);

    // Cluster related methods
    xmlrpc_c::methodPtr cluster_allocate(new ClusterAllocateXRPC());
    xmlrpc_c::methodPtr cluster_delete(new ClusterDeleteXRPC());
    xmlrpc_c::methodPtr cluster_info(new ClusterInfoXRPC());
    xmlrpc_c::methodPtr cluster_update(new ClusterUpdateXRPC());
    xmlrpc_c::methodPtr cluster_rename(new ClusterRenameXRPC());
    xmlrpc_c::methodPtr cluster_addhost(new ClusterAddHostXRPC());
    xmlrpc_c::methodPtr cluster_delhost(new ClusterDelHostXRPC());
    xmlrpc_c::methodPtr cluster_addds(new ClusterAddDatastoreXRPC());
    xmlrpc_c::methodPtr cluster_delds(new ClusterDelDatastoreXRPC());
    xmlrpc_c::methodPtr cluster_addvnet(new ClusterAddVNetXRPC());
    xmlrpc_c::methodPtr cluster_delvnet(new ClusterDelVNetXRPC());
    xmlrpc_c::methodPtr cluster_optimize(new ClusterOptimizeXRPC());
    xmlrpc_c::methodPtr cluster_planexecute(new ClusterPlanExecuteXRPC());
    xmlrpc_c::methodPtr cluster_plandelete(new ClusterPlanDeleteXRPC());
    xmlrpc_c::methodPtr clusterpool_info(new ClusterPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.cluster.allocate", cluster_allocate);
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

    RequestManagerRegistry.addMethod("one.cluster.optimize", cluster_optimize);
    RequestManagerRegistry.addMethod("one.cluster.planexecute", cluster_planexecute);
    RequestManagerRegistry.addMethod("one.cluster.plandelete", cluster_plandelete);

    RequestManagerRegistry.addMethod("one.clusterpool.info", clusterpool_info);

    // VM Template Methods
    xmlrpc_c::methodPtr template_allocate(new TemplateAllocateXRPC());
    xmlrpc_c::methodPtr template_delete(new TemplateDeleteXRPC());
    xmlrpc_c::methodPtr template_info(new TemplateInfoXRPC());
    xmlrpc_c::methodPtr template_update(new TemplateUpdateXRPC());
    xmlrpc_c::methodPtr template_rename(new TemplateRenameXRPC());
    xmlrpc_c::methodPtr template_chmod(new TemplateChmodXRPC());
    xmlrpc_c::methodPtr template_chown(new TemplateChownXRPC());
    xmlrpc_c::methodPtr template_lock(new TemplateLockXRPC());
    xmlrpc_c::methodPtr template_unlock(new TemplateUnlockXRPC());
    xmlrpc_c::methodPtr template_clone(new TemplateCloneXRPC());
    xmlrpc_c::methodPtr template_instantiate(new TemplateInstantiateXRPC());

    xmlrpc_c::methodPtr template_pool_info(new TemplatePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.template.allocate", template_allocate);
    RequestManagerRegistry.addMethod("one.template.delete", template_delete);
    RequestManagerRegistry.addMethod("one.template.info", template_info);
    RequestManagerRegistry.addMethod("one.template.update", template_update);
    RequestManagerRegistry.addMethod("one.template.rename", template_rename);
    RequestManagerRegistry.addMethod("one.template.chmod", template_chmod);
    RequestManagerRegistry.addMethod("one.template.chown", template_chown);
    RequestManagerRegistry.addMethod("one.template.lock", template_lock);
    RequestManagerRegistry.addMethod("one.template.unlock", template_unlock);
    RequestManagerRegistry.addMethod("one.template.clone", template_clone);
    RequestManagerRegistry.addMethod("one.template.instantiate", template_instantiate);

    RequestManagerRegistry.addMethod("one.templatepool.info", template_pool_info);

    // VNTemplate Methods
    xmlrpc_c::methodPtr vntemplate_allocate(new VNTemplateAllocateXRPC());
    xmlrpc_c::methodPtr vntemplate_delete(new VNTemplateDeleteXRPC());
    xmlrpc_c::methodPtr vntemplate_info(new VNTemplateInfoXRPC());
    xmlrpc_c::methodPtr vntemplate_update(new VNTemplateUpdateXRPC());
    xmlrpc_c::methodPtr vntemplate_rename(new VNTemplateRenameXRPC());
    xmlrpc_c::methodPtr vntemplate_chmod(new VNTemplateChmodXRPC());
    xmlrpc_c::methodPtr vntemplate_chown(new VNTemplateChownXRPC());
    xmlrpc_c::methodPtr vntemplate_lock(new VNTemplateLockXRPC());
    xmlrpc_c::methodPtr vntemplate_unlock(new VNTemplateUnlockXRPC());
    xmlrpc_c::methodPtr vntemplate_clone(new VNTemplateCloneXRPC());
    xmlrpc_c::methodPtr vntemplate_instantiate(new VNTemplateInstantiateXRPC());

    xmlrpc_c::methodPtr vntemplate_pool_info(new VNTemplatePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.vntemplate.allocate", vntemplate_allocate);
    RequestManagerRegistry.addMethod("one.vntemplate.delete", vntemplate_delete);
    RequestManagerRegistry.addMethod("one.vntemplate.info", vntemplate_info);
    RequestManagerRegistry.addMethod("one.vntemplate.update", vntemplate_update);
    RequestManagerRegistry.addMethod("one.vntemplate.rename", vntemplate_rename);
    RequestManagerRegistry.addMethod("one.vntemplate.chmod", vntemplate_chmod);
    RequestManagerRegistry.addMethod("one.vntemplate.chown", vntemplate_chown);
    RequestManagerRegistry.addMethod("one.vntemplate.lock", vntemplate_lock);
    RequestManagerRegistry.addMethod("one.vntemplate.unlock", vntemplate_unlock);
    RequestManagerRegistry.addMethod("one.vntemplate.clone", vntemplate_clone);
    RequestManagerRegistry.addMethod("one.vntemplate.instantiate", vntemplate_instantiate);

    RequestManagerRegistry.addMethod("one.vntemplatepool.info", vntemplate_pool_info);

    // VirtualMachine Methods
    xmlrpc_c::methodPtr vm_allocate(new VirtualMachineAllocateXRPC());
    xmlrpc_c::methodPtr vm_info(new VirtualMachineInfoXRPC());
    xmlrpc_c::methodPtr vm_update(new VirtualMachineUpdateXRPC());
    xmlrpc_c::methodPtr vm_rename(new VirtualMachineRenameXRPC());
    xmlrpc_c::methodPtr vm_chmod(new VirtualMachineChmodXRPC());
    xmlrpc_c::methodPtr vm_chown(new VirtualMachineChownXRPC());
    xmlrpc_c::methodPtr vm_lock(new VirtualMachineLockXRPC());
    xmlrpc_c::methodPtr vm_unlock(new VirtualMachineUnlockXRPC());
    xmlrpc_c::methodPtr vm_deploy(new VirtualMachineDeployXRPC());
    xmlrpc_c::methodPtr vm_action(new VirtualMachineActionXRPC());
    xmlrpc_c::methodPtr vm_migrate(new VirtualMachineMigrateXRPC());
    xmlrpc_c::methodPtr vm_dsaveas(new VirtualMachineDiskSaveAsXRPC());
    xmlrpc_c::methodPtr vm_dsnap_create(new VirtualMachineDiskSnapshotCreateXRPC());
    xmlrpc_c::methodPtr vm_dsnap_delete(new VirtualMachineDiskSnapshotDeleteXRPC());
    xmlrpc_c::methodPtr vm_dsnap_revert(new VirtualMachineDiskSnapshotRevertXRPC());
    xmlrpc_c::methodPtr vm_dsnap_rename(new VirtualMachineDiskSnapshotRenameXRPC());
    xmlrpc_c::methodPtr vm_disk_resize(new VirtualMachineDiskResizeXRPC());
    xmlrpc_c::methodPtr vm_attach(new VirtualMachineDiskAttachXRPC());
    xmlrpc_c::methodPtr vm_detach(new VirtualMachineDiskDetachXRPC());
    xmlrpc_c::methodPtr vm_attachnic(new VirtualMachineNicAttachXRPC());
    xmlrpc_c::methodPtr vm_detachnic(new VirtualMachineNicDetachXRPC());
    xmlrpc_c::methodPtr vm_updatenic(new VirtualMachineNicUpdateXRPC());
    xmlrpc_c::methodPtr vm_attachsg(new VirtualMachineSGAttachXRPC());
    xmlrpc_c::methodPtr vm_detachsg(new VirtualMachineSGDetachXRPC());
    xmlrpc_c::methodPtr vm_snap_create(new VirtualMachineSnapshotCreateXRPC());
    xmlrpc_c::methodPtr vm_snap_delete(new VirtualMachineSnapshotDeleteXRPC());
    xmlrpc_c::methodPtr vm_snap_revert(new VirtualMachineSnapshotRevertXRPC());
    xmlrpc_c::methodPtr vm_resize(new VirtualMachineResizeXRPC());
    xmlrpc_c::methodPtr vm_updateconf(new VirtualMachineUpdateConfXRPC());
    xmlrpc_c::methodPtr vm_recover(new VirtualMachineRecoverXRPC());
    xmlrpc_c::methodPtr vm_monitoring(new VirtualMachineMonitoringXRPC());
    xmlrpc_c::methodPtr vm_sched_add(new VirtualMachineSchedAddXRPC());
    xmlrpc_c::methodPtr vm_sched_update(new VirtualMachineSchedUpdateXRPC());
    xmlrpc_c::methodPtr vm_sched_delete(new VirtualMachineSchedDeleteXRPC());
    xmlrpc_c::methodPtr vm_backup(new VirtualMachineBackupXRPC());
    xmlrpc_c::methodPtr vm_backupcancel(new VirtualMachineBackupCancelXRPC());
    xmlrpc_c::methodPtr vm_restore(new VirtualMachineRestoreXRPC());
    xmlrpc_c::methodPtr vm_attachpci(new VirtualMachinePciAttachXRPC());
    xmlrpc_c::methodPtr vm_detachpci(new VirtualMachinePciDetachXRPC());
    xmlrpc_c::methodPtr vm_exec(new VirtualMachineExecXRPC());
    xmlrpc_c::methodPtr vm_exec_retry(new VirtualMachineExecRetryXRPC());
    xmlrpc_c::methodPtr vm_exec_cancel(new VirtualMachineExecCancelXRPC());

    xmlrpc_c::methodPtr vm_pool_info(new VirtualMachinePoolInfoXRPC());
    xmlrpc_c::methodPtr vm_pool_info_extended(new VirtualMachinePoolInfoExtendedXRPC());
    xmlrpc_c::methodPtr vm_pool_info_set(new VirtualMachinePoolInfoSetXRPC());
    xmlrpc_c::methodPtr vm_pool_acct(new VirtualMachinePoolAccountingXRPC());
    xmlrpc_c::methodPtr vm_pool_monitoring(new VirtualMachinePoolMonitoringXRPC());
    xmlrpc_c::methodPtr vm_pool_showback(new VirtualMachinePoolShowbackListXRPC());
    xmlrpc_c::methodPtr vm_pool_calculate_showback(new VirtualMachinePoolShowbackCalculateXRPC());

    RequestManagerRegistry.addMethod("one.vm.allocate", vm_allocate);
    RequestManagerRegistry.addMethod("one.vm.info", vm_info);
    RequestManagerRegistry.addMethod("one.vm.update", vm_update);
    RequestManagerRegistry.addMethod("one.vm.rename", vm_rename);
    RequestManagerRegistry.addMethod("one.vm.chmod", vm_chmod);
    RequestManagerRegistry.addMethod("one.vm.chown", vm_chown);
    RequestManagerRegistry.addMethod("one.vm.lock", vm_lock);
    RequestManagerRegistry.addMethod("one.vm.unlock", vm_unlock);
    RequestManagerRegistry.addMethod("one.vm.deploy", vm_deploy);
    RequestManagerRegistry.addMethod("one.vm.action", vm_action);
    RequestManagerRegistry.addMethod("one.vm.migrate", vm_migrate);
    RequestManagerRegistry.addMethod("one.vm.disksaveas", vm_dsaveas);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotcreate", vm_dsnap_create);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotdelete", vm_dsnap_delete);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotrevert", vm_dsnap_revert);
    RequestManagerRegistry.addMethod("one.vm.disksnapshotrename", vm_dsnap_rename);
    RequestManagerRegistry.addMethod("one.vm.attach", vm_attach);
    RequestManagerRegistry.addMethod("one.vm.detach", vm_detach);
    RequestManagerRegistry.addMethod("one.vm.diskresize", vm_disk_resize);
    RequestManagerRegistry.addMethod("one.vm.attachnic", vm_attachnic);
    RequestManagerRegistry.addMethod("one.vm.detachnic", vm_detachnic);
    RequestManagerRegistry.addMethod("one.vm.updatenic", vm_updatenic);
    RequestManagerRegistry.addMethod("one.vm.attachsg", vm_attachsg);
    RequestManagerRegistry.addMethod("one.vm.detachsg", vm_detachsg);
    RequestManagerRegistry.addMethod("one.vm.snapshotcreate", vm_snap_create);
    RequestManagerRegistry.addMethod("one.vm.snapshotdelete", vm_snap_delete);
    RequestManagerRegistry.addMethod("one.vm.snapshotrevert", vm_snap_revert);
    RequestManagerRegistry.addMethod("one.vm.resize", vm_resize);
    RequestManagerRegistry.addMethod("one.vm.updateconf", vm_updateconf);
    RequestManagerRegistry.addMethod("one.vm.recover", vm_recover);
    RequestManagerRegistry.addMethod("one.vm.monitoring", vm_monitoring);
    RequestManagerRegistry.addMethod("one.vm.schedadd", vm_sched_add);
    RequestManagerRegistry.addMethod("one.vm.schedupdate", vm_sched_update);
    RequestManagerRegistry.addMethod("one.vm.scheddelete", vm_sched_delete);
    RequestManagerRegistry.addMethod("one.vm.backup", vm_backup);
    RequestManagerRegistry.addMethod("one.vm.backupcancel", vm_backupcancel);
    RequestManagerRegistry.addMethod("one.vm.restore", vm_restore);
    RequestManagerRegistry.addMethod("one.vm.attachpci", vm_attachpci);
    RequestManagerRegistry.addMethod("one.vm.detachpci", vm_detachpci);
    RequestManagerRegistry.addMethod("one.vm.exec", vm_exec);
    RequestManagerRegistry.addMethod("one.vm.retryexec", vm_exec_retry);
    RequestManagerRegistry.addMethod("one.vm.cancelexec", vm_exec_cancel);

    RequestManagerRegistry.addMethod("one.vmpool.info", vm_pool_info);
    RequestManagerRegistry.addMethod("one.vmpool.infoextended", vm_pool_info_extended);
    RequestManagerRegistry.addMethod("one.vmpool.infoset", vm_pool_info_set);
    RequestManagerRegistry.addMethod("one.vmpool.accounting", vm_pool_acct);
    RequestManagerRegistry.addMethod("one.vmpool.monitoring", vm_pool_monitoring);
    RequestManagerRegistry.addMethod("one.vmpool.showback", vm_pool_showback);
    RequestManagerRegistry.addMethod("one.vmpool.calculateshowback", vm_pool_calculate_showback);

    // VirtualNetwork Methods
    xmlrpc_c::methodPtr vn_allocate(new VirtualNetworkAllocateXRPC());
    xmlrpc_c::methodPtr vn_delete(new VirtualNetworkDeleteXRPC());
    xmlrpc_c::methodPtr vn_info(new VirtualNetworkInfoXRPC());
    xmlrpc_c::methodPtr vn_update(new VirtualNetworkUpdateXRPC());
    xmlrpc_c::methodPtr vn_rename(new VirtualNetworkRenameXRPC());
    xmlrpc_c::methodPtr vn_chmod(new VirtualNetworkChmodXRPC());
    xmlrpc_c::methodPtr vn_chown(new VirtualNetworkChownXRPC());
    xmlrpc_c::methodPtr vn_lock(new VirtualNetworkLockXRPC());
    xmlrpc_c::methodPtr vn_unlock(new VirtualNetworkUnlockXRPC());
    xmlrpc_c::methodPtr vn_add_ar(new VirtualNetworkAddARXRPC());
    xmlrpc_c::methodPtr vn_rm_ar(new VirtualNetworkRmARXRPC());
    xmlrpc_c::methodPtr vn_update_ar(new VirtualNetworkUpdateARXRPC());
    xmlrpc_c::methodPtr vn_reserve(new VirtualNetworkReserveXRPC());
    xmlrpc_c::methodPtr vn_free_ar(new VirtualNetworkFreeARXRPC());
    xmlrpc_c::methodPtr vn_hold(new VirtualNetworkHoldXRPC());
    xmlrpc_c::methodPtr vn_release(new VirtualNetworkReleaseXRPC());
    xmlrpc_c::methodPtr vn_recover(new VirtualNetworkRecoverXRPC());

    xmlrpc_c::methodPtr vnpool_info(new VirtualNetworkPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.vn.allocate", vn_allocate);
    RequestManagerRegistry.addMethod("one.vn.delete", vn_delete);
    RequestManagerRegistry.addMethod("one.vn.info", vn_info);
    RequestManagerRegistry.addMethod("one.vn.update", vn_update);
    RequestManagerRegistry.addMethod("one.vn.rename", vn_rename);
    RequestManagerRegistry.addMethod("one.vn.chmod", vn_chmod);
    RequestManagerRegistry.addMethod("one.vn.chown", vn_chown);
    RequestManagerRegistry.addMethod("one.vn.lock", vn_lock);
    RequestManagerRegistry.addMethod("one.vn.unlock", vn_unlock);
    RequestManagerRegistry.addMethod("one.vn.add_ar", vn_add_ar);
    RequestManagerRegistry.addMethod("one.vn.rm_ar", vn_rm_ar);
    RequestManagerRegistry.addMethod("one.vn.update_ar", vn_update_ar);
    RequestManagerRegistry.addMethod("one.vn.reserve", vn_reserve);
    RequestManagerRegistry.addMethod("one.vn.free_ar", vn_free_ar);
    RequestManagerRegistry.addMethod("one.vn.hold", vn_hold);
    RequestManagerRegistry.addMethod("one.vn.release", vn_release);
    RequestManagerRegistry.addMethod("one.vn.recover", vn_recover);

    RequestManagerRegistry.addMethod("one.vnpool.info", vnpool_info);

    // Image Methods
    xmlrpc_c::methodPtr image_allocate(new ImageAllocateXRPC());
    xmlrpc_c::methodPtr image_delete(new ImageDeleteXRPC());
    xmlrpc_c::methodPtr image_info(new ImageInfoXRPC());
    xmlrpc_c::methodPtr image_update(new ImageUpdateXRPC());
    xmlrpc_c::methodPtr image_rename(new ImageRenameXRPC());
    xmlrpc_c::methodPtr image_chmod(new ImageChmodXRPC());
    xmlrpc_c::methodPtr image_chown(new ImageChownXRPC());
    xmlrpc_c::methodPtr image_lock(new ImageLockXRPC());
    xmlrpc_c::methodPtr image_unlock(new ImageUnlockXRPC());
    xmlrpc_c::methodPtr image_clone(new ImageCloneXRPC());
    xmlrpc_c::methodPtr image_enable(new ImageEnableXRPC());
    xmlrpc_c::methodPtr image_persistent(new ImagePersistentXRPC());
    xmlrpc_c::methodPtr image_chtype(new ImageChtypeXRPC());
    xmlrpc_c::methodPtr image_snap_delete(new ImageSnapshotDeleteXRPC());
    xmlrpc_c::methodPtr image_snap_revert(new ImageSnapshotRevertXRPC());
    xmlrpc_c::methodPtr image_snap_flatten(new ImageSnapshotFlattenXRPC());
    xmlrpc_c::methodPtr image_restore(new ImageRestoreXRPC());

    xmlrpc_c::methodPtr imagepool_info(new ImagePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.image.allocate", image_allocate);
    RequestManagerRegistry.addMethod("one.image.delete", image_delete);
    RequestManagerRegistry.addMethod("one.image.info", image_info);
    RequestManagerRegistry.addMethod("one.image.update", image_update);
    RequestManagerRegistry.addMethod("one.image.rename", image_rename);
    RequestManagerRegistry.addMethod("one.image.chmod", image_chmod);
    RequestManagerRegistry.addMethod("one.image.chown", image_chown);
    RequestManagerRegistry.addMethod("one.image.lock", image_lock);
    RequestManagerRegistry.addMethod("one.image.unlock", image_unlock);
    RequestManagerRegistry.addMethod("one.image.clone", image_clone);
    RequestManagerRegistry.addMethod("one.image.enable", image_enable);
    RequestManagerRegistry.addMethod("one.image.persistent", image_persistent);
    RequestManagerRegistry.addMethod("one.image.chtype", image_chtype);
    RequestManagerRegistry.addMethod("one.image.snapshotdelete", image_snap_delete);
    RequestManagerRegistry.addMethod("one.image.snapshotrevert", image_snap_revert);
    RequestManagerRegistry.addMethod("one.image.snapshotflatten", image_snap_flatten);
    RequestManagerRegistry.addMethod("one.image.restore", image_restore);

    RequestManagerRegistry.addMethod("one.imagepool.info", imagepool_info);

    // Datastore Methods
    xmlrpc_c::methodPtr datastore_allocate(new DatastoreAllocateXRPC());
    xmlrpc_c::methodPtr datastore_delete(new DatastoreDeleteXRPC());
    xmlrpc_c::methodPtr datastore_info(new DatastoreInfoXRPC());
    xmlrpc_c::methodPtr datastore_update(new DatastoreUpdateXRPC());
    xmlrpc_c::methodPtr datastore_rename(new DatastoreRenameXRPC());
    xmlrpc_c::methodPtr datastore_chmod(new DatastoreChmodXRPC());
    xmlrpc_c::methodPtr datastore_chown(new DatastoreChownXRPC());
    xmlrpc_c::methodPtr datastore_enable(new DatastoreEnableXRPC());

    xmlrpc_c::methodPtr datastorepool_info(new DatastorePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.datastore.allocate", datastore_allocate);
    RequestManagerRegistry.addMethod("one.datastore.delete",  datastore_delete);
    RequestManagerRegistry.addMethod("one.datastore.info",    datastore_info);
    RequestManagerRegistry.addMethod("one.datastore.update",  datastore_update);
    RequestManagerRegistry.addMethod("one.datastore.rename",  datastore_rename);
    RequestManagerRegistry.addMethod("one.datastore.chown",   datastore_chown);
    RequestManagerRegistry.addMethod("one.datastore.chmod",   datastore_chmod);
    RequestManagerRegistry.addMethod("one.datastore.enable",  datastore_enable);

    RequestManagerRegistry.addMethod("one.datastorepool.info", datastorepool_info);

    // Group related methods

    xmlrpc_c::method * group_allocate_pt;
    xmlrpc_c::method * group_update_pt;
    xmlrpc_c::method * group_delete_pt;
    xmlrpc_c::method * group_add_admin_pt;
    xmlrpc_c::method * group_del_admin_pt;

    if (nebula.is_federation_slave())
    {
        group_allocate_pt       = new RequestManagerProxyXRPC("one.group.allocate");
        group_delete_pt         = new RequestManagerProxyXRPC("one.group.delete");
        group_update_pt         = new RequestManagerProxyXRPC("one.group.update");
        group_add_admin_pt      = new RequestManagerProxyXRPC("one.group.addadmin");
        group_del_admin_pt      = new RequestManagerProxyXRPC("one.group.deladmin");
    }
    else
    {
        group_allocate_pt       = new GroupAllocateXRPC();
        group_delete_pt         = new GroupDeleteXRPC();
        group_update_pt         = new GroupUpdateXRPC();
        group_add_admin_pt      = new GroupAddAdminXRPC();
        group_del_admin_pt      = new GroupDelAdminXRPC();
    }

    xmlrpc_c::methodPtr group_allocate(group_allocate_pt);
    xmlrpc_c::methodPtr group_delete(group_delete_pt);
    xmlrpc_c::methodPtr group_update(group_update_pt);
    xmlrpc_c::methodPtr group_add_admin(group_add_admin_pt);
    xmlrpc_c::methodPtr group_del_admin(group_del_admin_pt);

    xmlrpc_c::methodPtr group_info(new GroupInfoXRPC());
    xmlrpc_c::methodPtr group_set_quota(new GroupSetQuotaXRPC());
    xmlrpc_c::methodPtr grouppool_info(new GroupPoolInfoXRPC());
    xmlrpc_c::methodPtr group_get_default_quota(new GroupQuotaInfoXRPC());
    xmlrpc_c::methodPtr group_set_default_quota(new GroupQuotaUpdateXRPC());

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

    // User related methods

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
        user_allocate_pt        = new RequestManagerProxyXRPC("one.user.allocate");
        user_update_pt          = new RequestManagerProxyXRPC("one.user.update");
        user_delete_pt          = new RequestManagerProxyXRPC("one.user.delete");
        user_change_password_pt = new RequestManagerProxyXRPC("one.user.passwd");
        user_chown_pt           = new RequestManagerProxyXRPC("one.user.chgrp");
        user_add_group_pt       = new RequestManagerProxyXRPC("one.user.addgroup");
        user_del_group_pt       = new RequestManagerProxyXRPC("one.user.delgroup");
        user_change_auth_pt     = new RequestManagerProxyXRPC("one.user.chauth");
        user_login_pt           = new RequestManagerProxyXRPC("one.user.login");
        user_enable_pt          = new RequestManagerProxyXRPC("one.user.enable");

        static_cast<RequestManagerProxyXRPC*>(user_allocate_pt)->hide_argument(2);
        static_cast<RequestManagerProxyXRPC*>(user_change_password_pt)->hide_argument(2);
        static_cast<RequestManagerProxyXRPC*>(user_change_auth_pt)->hide_argument(3);
        static_cast<RequestManagerProxyXRPC*>(user_change_auth_pt)->hide_argument(2);
    }
    else
    {
        user_allocate_pt        = new UserAllocateXRPC();
        user_update_pt          = new UserUpdateXRPC();
        user_delete_pt          = new UserDeleteXRPC();
        user_change_password_pt = new UserChangePasswordXRPC();
        user_chown_pt           = new UserChangeGroupXRPC();
        user_add_group_pt       = new UserAddGroupXRPC();
        user_del_group_pt       = new UserDelGroupXRPC();
        user_change_auth_pt     = new UserChangeAuthXRPC();
        user_login_pt           = new UserLoginXRPC();
        user_enable_pt          = new UserEnableXRPC();
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

    xmlrpc_c::methodPtr user_info(new UserInfoXRPC());
    xmlrpc_c::methodPtr user_set_quota(new UserSetQuotaXRPC());
    xmlrpc_c::methodPtr userpool_info(new UserPoolInfoXRPC());
    xmlrpc_c::methodPtr user_get_default_quota(new UserQuotaInfoXRPC());
    xmlrpc_c::methodPtr user_set_default_quota(new UserQuotaUpdateXRPC());

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

    // Generic Document objects related methods

    xmlrpc_c::methodPtr doc_allocate(new DocumentAllocateXRPC());
    xmlrpc_c::methodPtr doc_delete(new DocumentDeleteXRPC());
    xmlrpc_c::methodPtr doc_info(new DocumentInfoXRPC());
    xmlrpc_c::methodPtr doc_update(new DocumentUpdateXRPC());
    xmlrpc_c::methodPtr doc_chown(new DocumentChownXRPC());
    xmlrpc_c::methodPtr doc_chmod(new DocumentChmodXRPC());
    xmlrpc_c::methodPtr doc_clone(new DocumentCloneXRPC());
    xmlrpc_c::methodPtr doc_rename(new DocumentRenameXRPC());
    xmlrpc_c::methodPtr doc_lock(new DocumentLockXRPC());
    xmlrpc_c::methodPtr doc_unlock(new DocumentUnlockXRPC());

    xmlrpc_c::methodPtr docpool_info(new DocumentPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.document.allocate", doc_allocate);
    RequestManagerRegistry.addMethod("one.document.delete",  doc_delete);
    RequestManagerRegistry.addMethod("one.document.info",    doc_info);
    RequestManagerRegistry.addMethod("one.document.update",  doc_update);
    RequestManagerRegistry.addMethod("one.document.chown",   doc_chown);
    RequestManagerRegistry.addMethod("one.document.chmod",   doc_chmod);
    RequestManagerRegistry.addMethod("one.document.clone",   doc_clone);
    RequestManagerRegistry.addMethod("one.document.rename",  doc_rename);
    RequestManagerRegistry.addMethod("one.document.lock",    doc_lock);
    RequestManagerRegistry.addMethod("one.document.unlock",  doc_unlock);

    RequestManagerRegistry.addMethod("one.documentpool.info", docpool_info);

    // Zone related methods

    xmlrpc_c::method * zone_allocate_pt;
    xmlrpc_c::method * zone_update_pt;
    xmlrpc_c::method * zone_delete_pt;
    xmlrpc_c::method * zone_rename_pt;

    if (nebula.is_federation_slave())
    {
        zone_allocate_pt    = new RequestManagerProxyXRPC("one.zone.allocate");
        zone_update_pt      = new RequestManagerProxyXRPC("one.zone.update");
        zone_delete_pt      = new RequestManagerProxyXRPC("one.zone.delete");
        zone_rename_pt      = new RequestManagerProxyXRPC("one.zone.rename");
    }
    else
    {
        zone_allocate_pt    = new ZoneAllocateXRPC();
        zone_update_pt      = new ZoneUpdateXRPC();
        zone_delete_pt      = new ZoneDeleteXRPC();
        zone_rename_pt      = new ZoneRenameXRPC();

        xmlrpc_c::methodPtr zone_updatedb(new ZoneUpdateDBXRPC());

        RequestManagerRegistry.addMethod("one.zone.updatedb", zone_updatedb);
    }

    xmlrpc_c::methodPtr zone_allocate(zone_allocate_pt);
    xmlrpc_c::methodPtr zone_update(zone_update_pt);
    xmlrpc_c::methodPtr zone_delete(zone_delete_pt);
    xmlrpc_c::methodPtr zone_rename(zone_rename_pt);
    xmlrpc_c::methodPtr zone_enable(new ZoneEnableXRPC());
    xmlrpc_c::methodPtr zone_addserver(new ZoneAddServerXRPC());
    xmlrpc_c::methodPtr zone_delserver(new ZoneDelServerXRPC());
    xmlrpc_c::methodPtr zone_resetserver(new ZoneResetServerXRPC());
    xmlrpc_c::methodPtr zone_replicatelog(new ZoneReplicateLogXRPC());
    xmlrpc_c::methodPtr zone_voterequest(new ZoneVoteXRPC());
    xmlrpc_c::methodPtr zone_raftstatus(new ZoneRaftStatusXRPC());
    xmlrpc_c::methodPtr zone_fedreplicatelog(new ZoneReplicateFedLogXRPC());

    xmlrpc_c::methodPtr zone_info(new ZoneInfoXRPC());
    xmlrpc_c::methodPtr zonepool_info(new ZonePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.zone.allocate", zone_allocate);
    RequestManagerRegistry.addMethod("one.zone.update",   zone_update);
    RequestManagerRegistry.addMethod("one.zone.delete",   zone_delete);
    RequestManagerRegistry.addMethod("one.zone.info",     zone_info);
    RequestManagerRegistry.addMethod("one.zone.rename",   zone_rename);
    RequestManagerRegistry.addMethod("one.zone.enable",   zone_enable);
    RequestManagerRegistry.addMethod("one.zone.replicate", zone_replicatelog);
    RequestManagerRegistry.addMethod("one.zone.fedreplicate", zone_fedreplicatelog);
    RequestManagerRegistry.addMethod("one.zone.voterequest", zone_voterequest);
    RequestManagerRegistry.addMethod("one.zone.raftstatus", zone_raftstatus);

    RequestManagerRegistry.addMethod("one.zone.addserver", zone_addserver);
    RequestManagerRegistry.addMethod("one.zone.delserver", zone_delserver);
    RequestManagerRegistry.addMethod("one.zone.resetserver", zone_resetserver);

    RequestManagerRegistry.addMethod("one.zonepool.info", zonepool_info);

    // Security Group objects related methods
    xmlrpc_c::methodPtr secg_allocate(new SecurityGroupAllocateXRPC());
    xmlrpc_c::methodPtr secg_clone(new SecurityGroupCloneXRPC());
    xmlrpc_c::methodPtr secg_chmod(new SecurityGroupChmodXRPC());
    xmlrpc_c::methodPtr secg_chown(new SecurityGroupChownXRPC());
    xmlrpc_c::methodPtr secg_commit(new SecurityGroupCommitXRPC());
    xmlrpc_c::methodPtr secg_delete(new SecurityGroupDeleteXRPC());
    xmlrpc_c::methodPtr secg_info(new SecurityGroupInfoXRPC());
    xmlrpc_c::methodPtr secg_rename(new SecurityGroupRenameXRPC());
    xmlrpc_c::methodPtr secg_update(new SecurityGroupUpdateXRPC());

    xmlrpc_c::methodPtr secgpool_info(new SecurityGroupPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.secgroup.allocate", secg_allocate);
    RequestManagerRegistry.addMethod("one.secgroup.delete",  secg_delete);
    RequestManagerRegistry.addMethod("one.secgroup.info",    secg_info);
    RequestManagerRegistry.addMethod("one.secgroup.update",  secg_update);
    RequestManagerRegistry.addMethod("one.secgroup.chown",   secg_chown);
    RequestManagerRegistry.addMethod("one.secgroup.chmod",   secg_chmod);
    RequestManagerRegistry.addMethod("one.secgroup.clone",   secg_clone);
    RequestManagerRegistry.addMethod("one.secgroup.rename",  secg_rename);
    RequestManagerRegistry.addMethod("one.secgroup.commit",  secg_commit);

    RequestManagerRegistry.addMethod("one.secgrouppool.info", secgpool_info);

    // VM Group objects related methods
    xmlrpc_c::methodPtr vmg_allocate(new VMGroupAllocateXRPC());
    xmlrpc_c::methodPtr vmg_delete(new VMGroupDeleteXRPC());
    xmlrpc_c::methodPtr vmg_info(new VMGroupInfoXRPC());
    xmlrpc_c::methodPtr vmg_chown(new VMGroupChownXRPC());
    xmlrpc_c::methodPtr vmg_chmod(new VMGroupChmodXRPC());
    xmlrpc_c::methodPtr vmg_rename(new VMGroupRenameXRPC());
    xmlrpc_c::methodPtr vmg_update(new VMGroupUpdateXRPC());
    xmlrpc_c::methodPtr vmg_lock(new VMGroupLockXRPC());
    xmlrpc_c::methodPtr vmg_unlock(new VMGroupUnlockXRPC());
    xmlrpc_c::methodPtr vmg_addrole(new VMGroupAddRoleXRPC());
    xmlrpc_c::methodPtr vmg_delrole(new VMGroupDelRoleXRPC());
    xmlrpc_c::methodPtr vmg_updaterole(new VMGroupUpdateRoleXRPC());

    xmlrpc_c::methodPtr vmgpool_info(new VMGroupPoolInfoXRPC());

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

    // Vdc related methods

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
        vdc_allocate_pt     = new RequestManagerProxyXRPC("one.vdc.allocate");
        vdc_update_pt       = new RequestManagerProxyXRPC("one.vdc.update");
        vdc_delete_pt       = new RequestManagerProxyXRPC("one.vdc.delete");
        vdc_rename_pt       = new RequestManagerProxyXRPC("one.vdc.rename");

        vdc_add_group_pt    = new RequestManagerProxyXRPC("one.vdc.addgroup");
        vdc_del_group_pt    = new RequestManagerProxyXRPC("one.vdc.delgroup");
        vdc_add_cluster_pt  = new RequestManagerProxyXRPC("one.vdc.addcluster");
        vdc_del_cluster_pt  = new RequestManagerProxyXRPC("one.vdc.delcluster");
        vdc_add_host_pt     = new RequestManagerProxyXRPC("one.vdc.addhost");
        vdc_del_host_pt     = new RequestManagerProxyXRPC("one.vdc.delhost");
        vdc_add_datastore_pt= new RequestManagerProxyXRPC("one.vdc.adddatastore");
        vdc_del_datastore_pt= new RequestManagerProxyXRPC("one.vdc.deldatastore");
        vdc_add_vnet_pt     = new RequestManagerProxyXRPC("one.vdc.addvnet");
        vdc_del_vnet_pt     = new RequestManagerProxyXRPC("one.vdc.delvnet");
    }
    else
    {
        vdc_allocate_pt     = new VdcAllocateXRPC();
        vdc_update_pt       = new VdcUpdateXRPC();
        vdc_delete_pt       = new VdcDeleteXRPC();
        vdc_rename_pt       = new VdcRenameXRPC();

        vdc_add_group_pt    = new VdcAddGroupXRPC();
        vdc_del_group_pt    = new VdcDelGroupXRPC();
        vdc_add_cluster_pt  = new VdcAddClusterXRPC();
        vdc_del_cluster_pt  = new VdcDelClusterXRPC();
        vdc_add_host_pt     = new VdcAddHostXRPC();
        vdc_del_host_pt     = new VdcDelHostXRPC();
        vdc_add_datastore_pt= new VdcAddDatastoreXRPC();
        vdc_del_datastore_pt= new VdcDelDatastoreXRPC();
        vdc_add_vnet_pt     = new VdcAddVnetXRPC();
        vdc_del_vnet_pt     = new VdcDelVnetXRPC();
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


    xmlrpc_c::methodPtr vdc_info(new VdcInfoXRPC());
    xmlrpc_c::methodPtr vdcpool_info(new VdcPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.vdc.allocate",    vdc_allocate);
    RequestManagerRegistry.addMethod("one.vdc.update",      vdc_update);
    RequestManagerRegistry.addMethod("one.vdc.delete",      vdc_delete);

    RequestManagerRegistry.addMethod("one.vdc.addgroup",    vdc_add_group);
    RequestManagerRegistry.addMethod("one.vdc.delgroup",    vdc_del_group);
    RequestManagerRegistry.addMethod("one.vdc.addcluster",  vdc_add_cluster);
    RequestManagerRegistry.addMethod("one.vdc.delcluster",  vdc_del_cluster);

    RequestManagerRegistry.addMethod("one.vdc.addhost",     vdc_add_host);
    RequestManagerRegistry.addMethod("one.vdc.delhost",     vdc_del_host);
    RequestManagerRegistry.addMethod("one.vdc.adddatastore", vdc_add_datastore);
    RequestManagerRegistry.addMethod("one.vdc.deldatastore", vdc_del_datastore);
    RequestManagerRegistry.addMethod("one.vdc.addvnet",     vdc_add_vnet);
    RequestManagerRegistry.addMethod("one.vdc.delvnet",     vdc_del_vnet);

    RequestManagerRegistry.addMethod("one.vdc.info",        vdc_info);
    RequestManagerRegistry.addMethod("one.vdc.rename",      vdc_rename);

    RequestManagerRegistry.addMethod("one.vdcpool.info",    vdcpool_info);

    // Virtual Router related methods
    xmlrpc_c::methodPtr vrouter_update(new VirtualRouterUpdateXRPC());
    xmlrpc_c::methodPtr vrouter_allocate(new VirtualRouterAllocateXRPC());
    xmlrpc_c::methodPtr vrouter_delete(new VirtualRouterDeleteXRPC());
    xmlrpc_c::methodPtr vrouter_info(new VirtualRouterInfoXRPC());
    xmlrpc_c::methodPtr vrouter_chown(new VirtualRouterChownXRPC());
    xmlrpc_c::methodPtr vrouter_chmod(new VirtualRouterChmodXRPC());
    xmlrpc_c::methodPtr vrouter_rename(new VirtualRouterRenameXRPC());
    xmlrpc_c::methodPtr vrouter_instantiate(new VirtualRouterInstantiateXRPC());
    xmlrpc_c::methodPtr vrouter_attachnic(new VirtualRouterAttachNicXRPC());
    xmlrpc_c::methodPtr vrouter_detachnic(new VirtualRouterDetachNicXRPC());
    xmlrpc_c::methodPtr vrouter_lock(new VirtualRouterLockXRPC());
    xmlrpc_c::methodPtr vrouter_unlock(new VirtualRouterUnlockXRPC());
    xmlrpc_c::methodPtr vrouter_pool_info(new VirtualRouterPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.vrouter.update", vrouter_update);
    RequestManagerRegistry.addMethod("one.vrouter.allocate", vrouter_allocate);
    RequestManagerRegistry.addMethod("one.vrouter.delete", vrouter_delete);
    RequestManagerRegistry.addMethod("one.vrouter.info", vrouter_info);
    RequestManagerRegistry.addMethod("one.vrouter.chown", vrouter_chown);
    RequestManagerRegistry.addMethod("one.vrouter.chmod", vrouter_chmod);
    RequestManagerRegistry.addMethod("one.vrouter.rename", vrouter_rename);
    RequestManagerRegistry.addMethod("one.vrouter.instantiate", vrouter_instantiate);
    RequestManagerRegistry.addMethod("one.vrouter.attachnic", vrouter_attachnic);
    RequestManagerRegistry.addMethod("one.vrouter.detachnic", vrouter_detachnic);
    RequestManagerRegistry.addMethod("one.vrouter.lock", vrouter_lock);
    RequestManagerRegistry.addMethod("one.vrouter.unlock", vrouter_unlock);

    RequestManagerRegistry.addMethod("one.vrouterpool.info", vrouter_pool_info);

    // MarketPlace related methods

    xmlrpc_c::method * market_update_pt;
    xmlrpc_c::method * market_delete_pt;
    xmlrpc_c::method * market_chmod_pt;
    xmlrpc_c::method * market_chown_pt;
    xmlrpc_c::method * market_rename_pt;
    xmlrpc_c::method * market_enable_pt;

    if (nebula.is_federation_slave())
    {
        market_update_pt   = new RequestManagerProxyXRPC("one.market.update");
        market_delete_pt   = new RequestManagerProxyXRPC("one.market.delete");
        market_chmod_pt    = new RequestManagerProxyXRPC("one.market.chmod");
        market_chown_pt    = new RequestManagerProxyXRPC("one.market.chown");
        market_rename_pt   = new RequestManagerProxyXRPC("one.market.rename");
        market_enable_pt   = new RequestManagerProxyXRPC("one.market.enable");
    }
    else
    {
        market_update_pt   = new MarketPlaceUpdateXRPC();
        market_delete_pt   = new MarketPlaceDeleteXRPC();
        market_chmod_pt    = new MarketPlaceChmodXRPC();
        market_chown_pt    = new MarketPlaceChownXRPC();
        market_rename_pt   = new MarketPlaceRenameXRPC();
        market_enable_pt   = new MarketPlaceEnableXRPC();

        xmlrpc_c::methodPtr market_updatedb(new MarketPlaceUpdateDBXRPC());
        xmlrpc_c::methodPtr market_allocatedb(new MarketPlaceAllocateDBXRPC());

        RequestManagerRegistry.addMethod("one.market.updatedb",
                                         market_updatedb);

        RequestManagerRegistry.addMethod("one.market.allocatedb",
                                         market_allocatedb);
    }

    xmlrpc_c::methodPtr market_allocate(new MarketPlaceAllocateXRPC());
    xmlrpc_c::methodPtr market_update(market_update_pt);
    xmlrpc_c::methodPtr market_info(new MarketPlaceInfoXRPC());
    xmlrpc_c::methodPtr market_delete(market_delete_pt);
    xmlrpc_c::methodPtr market_rename(market_rename_pt);
    xmlrpc_c::methodPtr market_chmod(market_chmod_pt);
    xmlrpc_c::methodPtr market_chown(market_chown_pt);
    xmlrpc_c::methodPtr market_enable(market_enable_pt);

    xmlrpc_c::methodPtr marketpool_info(new MarketPlacePoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.market.allocate", market_allocate);
    RequestManagerRegistry.addMethod("one.market.update", market_update);
    RequestManagerRegistry.addMethod("one.market.delete", market_delete);
    RequestManagerRegistry.addMethod("one.market.chmod", market_chmod);
    RequestManagerRegistry.addMethod("one.market.chown", market_chown);

    RequestManagerRegistry.addMethod("one.market.info", market_info);
    RequestManagerRegistry.addMethod("one.market.rename", market_rename);
    RequestManagerRegistry.addMethod("one.market.enable", market_enable);

    RequestManagerRegistry.addMethod("one.marketpool.info", marketpool_info);


    // MarketPlaceApp related methods

    xmlrpc_c::method * marketapp_update_pt;
    xmlrpc_c::method * marketapp_chmod_pt;
    xmlrpc_c::method * marketapp_chown_pt;
    xmlrpc_c::method * marketapp_enable_pt;
    xmlrpc_c::method * marketapp_rename_pt;
    xmlrpc_c::method * marketapp_lock_pt;
    xmlrpc_c::method * marketapp_unlock_pt;

    if (nebula.is_federation_slave())
    {
        marketapp_update_pt = new RequestManagerProxyXRPC("one.marketapp.update");
        marketapp_chmod_pt  = new RequestManagerProxyXRPC("one.marketapp.chmod");
        marketapp_chown_pt  = new RequestManagerProxyXRPC("one.marketapp.chown");
        marketapp_enable_pt = new RequestManagerProxyXRPC("one.marketapp.enable");
        marketapp_rename_pt = new RequestManagerProxyXRPC("one.marketapp.rename");
        marketapp_lock_pt   = new RequestManagerProxyXRPC("one.marketapp.lock");
        marketapp_unlock_pt = new RequestManagerProxyXRPC("one.marketapp.unlock");
    }
    else
    {
        marketapp_update_pt = new MarketPlaceAppUpdateXRPC();
        marketapp_chmod_pt  = new MarketPlaceAppChmodXRPC();
        marketapp_chown_pt  = new MarketPlaceAppChownXRPC();
        marketapp_enable_pt = new MarketPlaceAppEnableXRPC();
        marketapp_rename_pt = new MarketPlaceAppRenameXRPC();
        marketapp_lock_pt   = new MarketPlaceAppLockXRPC();
        marketapp_unlock_pt = new MarketPlaceAppUnlockXRPC();

        xmlrpc_c::methodPtr marketapp_updatedb(new MarketPlaceAppUpdateDBXRPC());
        xmlrpc_c::methodPtr marketapp_dropdb(new MarketPlaceAppDropDBXRPC());
        xmlrpc_c::methodPtr marketapp_allocatedb(new MarketPlaceAppAllocateDBXRPC());

        RequestManagerRegistry.addMethod("one.marketapp.updatedb",
                                         marketapp_updatedb);

        RequestManagerRegistry.addMethod("one.marketapp.dropdb",
                                         marketapp_dropdb);

        RequestManagerRegistry.addMethod("one.marketapp.allocatedb",
                                         marketapp_allocatedb);
    }

    xmlrpc_c::methodPtr marketapp_allocate(new MarketPlaceAppAllocateXRPC());
    xmlrpc_c::methodPtr marketapp_delete(new MarketPlaceAppDeleteXRPC());
    xmlrpc_c::methodPtr marketapp_info(new MarketPlaceAppInfoXRPC());
    xmlrpc_c::methodPtr marketapp_update(marketapp_update_pt);
    xmlrpc_c::methodPtr marketapp_rename(marketapp_rename_pt);
    xmlrpc_c::methodPtr marketapp_chmod(marketapp_chmod_pt);
    xmlrpc_c::methodPtr marketapp_chown(marketapp_chown_pt);
    xmlrpc_c::methodPtr marketapp_enable(marketapp_enable_pt);
    xmlrpc_c::methodPtr marketapp_lock(marketapp_lock_pt);
    xmlrpc_c::methodPtr marketapp_unlock(marketapp_unlock_pt);

    xmlrpc_c::methodPtr marketapppool_info(new MarketPlaceAppPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.marketapp.allocate", marketapp_allocate);
    RequestManagerRegistry.addMethod("one.marketapp.delete", marketapp_delete);
    RequestManagerRegistry.addMethod("one.marketapp.info", marketapp_info);
    RequestManagerRegistry.addMethod("one.marketapp.update", marketapp_update);
    RequestManagerRegistry.addMethod("one.marketapp.rename", marketapp_rename);
    RequestManagerRegistry.addMethod("one.marketapp.chmod", marketapp_chmod);
    RequestManagerRegistry.addMethod("one.marketapp.chown", marketapp_chown);
    RequestManagerRegistry.addMethod("one.marketapp.enable", marketapp_enable);
    RequestManagerRegistry.addMethod("one.marketapp.lock", marketapp_lock);
    RequestManagerRegistry.addMethod("one.marketapp.unlock", marketapp_unlock);

    RequestManagerRegistry.addMethod("one.marketapppool.info", marketapppool_info);

    // Hooks related methods
    xmlrpc_c::methodPtr hook_allocate(new HookAllocateXRPC());
    xmlrpc_c::methodPtr hook_delete(new HookDeleteXRPC());
    xmlrpc_c::methodPtr hook_update(new HookUpdateXRPC());
    xmlrpc_c::methodPtr hook_rename(new HookRenameXRPC());
    xmlrpc_c::methodPtr hook_info(new HookInfoXRPC());
    xmlrpc_c::methodPtr hook_lock(new HookLockXRPC());
    xmlrpc_c::methodPtr hook_unlock(new HookUnlockXRPC());
    xmlrpc_c::methodPtr hook_retry(new HookRetryXRPC());

    xmlrpc_c::methodPtr hookpool_info(new HookPoolInfoXRPC());

    RequestManagerRegistry.addMethod("one.hook.allocate", hook_allocate);
    RequestManagerRegistry.addMethod("one.hook.delete", hook_delete);
    RequestManagerRegistry.addMethod("one.hook.update", hook_update);
    RequestManagerRegistry.addMethod("one.hook.rename", hook_rename);
    RequestManagerRegistry.addMethod("one.hook.info", hook_info);
    RequestManagerRegistry.addMethod("one.hook.lock", hook_lock);
    RequestManagerRegistry.addMethod("one.hook.unlock", hook_unlock);
    RequestManagerRegistry.addMethod("one.hook.retry", hook_retry);

    RequestManagerRegistry.addMethod("one.hookpool.info", hookpool_info);

    // Hook Log related methods
    xmlrpc_c::methodPtr hooklog_info(new HookPoolLogInfoXRPC());

    RequestManagerRegistry.addMethod("one.hooklog.info", hooklog_info);

    // Backup Job related methods
    xmlrpc_c::methodPtr backupjob_allocate(new BackupJobAllocateXRPC());
    xmlrpc_c::methodPtr backupjob_delete(new BackupJobDeleteXRPC());
    xmlrpc_c::methodPtr backupjob_update(new BackupJobUpdateXRPC());
    xmlrpc_c::methodPtr backupjob_rename(new BackupJobRenameXRPC());
    xmlrpc_c::methodPtr backupjob_info(new BackupJobInfoXRPC());
    xmlrpc_c::methodPtr backupjob_chown(new BackupJobChownXRPC());
    xmlrpc_c::methodPtr backupjob_chmod(new BackupJobChmodXRPC());
    xmlrpc_c::methodPtr backupjob_lock(new BackupJobLockXRPC());
    xmlrpc_c::methodPtr backupjob_unlock(new BackupJobUnlockXRPC());
    xmlrpc_c::methodPtr backupjob_backup(new BackupJobBackupXRPC());
    xmlrpc_c::methodPtr backupjob_cancel(new BackupJobCancelXRPC());
    xmlrpc_c::methodPtr backupjob_retry(new BackupJobRetryXRPC());
    xmlrpc_c::methodPtr backupjob_priority(new BackupJobPriorityXRPC());
    xmlrpc_c::methodPtr backupjob_schedadd(new BackupJobSchedAddXRPC());
    xmlrpc_c::methodPtr backupjob_scheddelete(new BackupJobSchedDelXRPC());
    xmlrpc_c::methodPtr backupjob_schedupdate(new BackupJobSchedUpdateXRPC());

    xmlrpc_c::methodPtr backupjobpool_info(new BackupJobPoolInfoXRPC());

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

    // System related methods
    xmlrpc_c::methodPtr system_version(new SystemVersionXRPC());
    xmlrpc_c::methodPtr system_config(new SystemConfigXRPC());
    xmlrpc_c::methodPtr system_sql(new SystemSqlXRPC());
    xmlrpc_c::methodPtr system_sqlquery(new SystemSqlQueryXRPC());

    RequestManagerRegistry.addMethod("one.system.version", system_version);
    RequestManagerRegistry.addMethod("one.system.config", system_config);
    RequestManagerRegistry.addMethod("one.system.sql", system_sql);
    RequestManagerRegistry.addMethod("one.system.sqlquery", system_sqlquery);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerXRPC::finalize()
{
    NebulaLog::log("ReM", Log::INFO, "Stopping XML-RPC server...");

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerXRPC::get_socket()
{
    int socket_id = -1;
    socket_map.try_get(this_thread::get_id(), socket_id);

    return socket_id;
}

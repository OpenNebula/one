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
/*--------------------------------------------------------------------------- */

package goca

import (
	"context"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// RPCCaller is the interface to satisfy in order to be usable by the controller
type RPCCaller interface {
	GetToken() string

	AclCreateRule(ctx context.Context, user, resource, rights, zone string) (*Response, error)
	AclDelRule(ctx context.Context, id int) (*Response, error)
	AclInfo(ctx context.Context) (*Response, error)

	BackupJobAllocate(ctx context.Context, tmpl string) (*Response, error)
	BackupJobDelete(ctx context.Context, id int) (*Response, error)
	BackupJobInfo(ctx context.Context, id int) (*Response, error)
	BackupJobUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	BackupJobRename(ctx context.Context, id int, name string) (*Response, error)
	BackupJobChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	BackupJobChown(ctx context.Context, id, uid, gid int) (*Response, error)
	BackupJobLock(ctx context.Context, id, level int, test bool) (*Response, error)
	BackupJobUnlock(ctx context.Context, id int) (*Response, error)
	BackupJobBackup(ctx context.Context, id int) (*Response, error)
	BackupJobCancel(ctx context.Context, id int) (*Response, error)
	BackupJobRetry(ctx context.Context, id int) (*Response, error)
	BackupJobPriority(ctx context.Context, id, priority int) (*Response, error)
	BackupJobSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error)
	BackupJobSchedDel(ctx context.Context, id, sa_id int) (*Response, error)
	BackupJobSchedUpdate(ctx context.Context, id, sa_id int, tmpl string) (*Response, error)
	BackupJobPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	ClusterAllocate(ctx context.Context, name string) (*Response, error)
	ClusterDelete(ctx context.Context, id int) (*Response, error)
	ClusterInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	ClusterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	ClusterRename(ctx context.Context, id int, name string) (*Response, error)
	ClusterAddHost(ctx context.Context, id, host_id int) (*Response, error)
	ClusterDelHost(ctx context.Context, id, host_id int) (*Response, error)
	ClusterAddDatastore(ctx context.Context, id, ds_id int) (*Response, error)
	ClusterDelDatastore(ctx context.Context, id, ds_id int) (*Response, error)
	ClusterAddVnet(ctx context.Context, id, net_id int) (*Response, error)
	ClusterDelVnet(ctx context.Context, id, net_id int) (*Response, error)
	ClusterOptimize(ctx context.Context, id int) (*Response, error)
	ClusterPlanExecute(ctx context.Context, id int) (*Response, error)
	ClusterPlanDelete(ctx context.Context, id int) (*Response, error)
	ClusterPoolInfo(ctx context.Context) (*Response, error)

	DatastoreAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error)
	DatastoreDelete(ctx context.Context, id int) (*Response, error)
	DatastoreInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	DatastoreUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	DatastoreRename(ctx context.Context, id int, name string) (*Response, error)
	DatastoreChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	DatastoreChown(ctx context.Context, id, uid, gid int) (*Response, error)
	DatastoreEnable(ctx context.Context, id int, enable bool) (*Response, error)
	DatastorePoolInfo(ctx context.Context) (*Response, error)

	DocumentAllocate(ctx context.Context, tmpl string, docType int) (*Response, error)
	DocumentDelete(ctx context.Context, id int) (*Response, error)
	DocumentInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	DocumentUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	DocumentRename(ctx context.Context, id int, name string) (*Response, error)
	DocumentChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	DocumentChown(ctx context.Context, id, uid, gid int) (*Response, error)
	DocumentLock(ctx context.Context, id, level int, test bool) (*Response, error)
	DocumentUnlock(ctx context.Context, id int) (*Response, error)
	DocumentClone(ctx context.Context, id int, name string) (*Response, error)
	DocumentPoolInfo(ctx context.Context, filter, start_id, end_id, docType int) (*Response, error)

	GroupAllocate(ctx context.Context, name string) (*Response, error)
	GroupDelete(ctx context.Context, id int) (*Response, error)
	GroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	GroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	GroupAddAdmin(ctx context.Context, id, user_id int) (*Response, error)
	GroupDelAdmin(ctx context.Context, id, user_id int) (*Response, error)
	GroupQuota(ctx context.Context, id int, quota string) (*Response, error)
	GroupDefaultQuotaInfo(ctx context.Context) (*Response, error)
	GroupDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error)
	GroupPoolInfo(ctx context.Context) (*Response, error)

	HookAllocate(ctx context.Context, tmpl string) (*Response, error)
	HookDelete(ctx context.Context, id int) (*Response, error)
	HookInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	HookUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	HookRename(ctx context.Context, id int, name string) (*Response, error)
	HookLock(ctx context.Context, id, level int, test bool) (*Response, error)
	HookUnlock(ctx context.Context, id int) (*Response, error)
	HookRetry(ctx context.Context, id, exe_id int) (*Response, error)
	HookPoolInfo(ctx context.Context) (*Response, error)
	HookLogInfo(ctx context.Context, start, end, hook_id, rc_hook int) (*Response, error)

	HostAllocate(ctx context.Context, name, im_mad, vm_mad string, cluster int) (*Response, error)
	HostDelete(ctx context.Context, id int) (*Response, error)
	HostInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	HostUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	HostRename(ctx context.Context, id int, name string) (*Response, error)
	HostStatus(ctx context.Context, id, status int) (*Response, error)
	HostMonitoring(ctx context.Context, id int) (*Response, error)
	HostPoolInfo(ctx context.Context) (*Response, error)
	HostPoolMonitoring(ctx context.Context, seconds int) (*Response, error)

	ImageAllocate(ctx context.Context, tmpl string, dsid uint, skip_capacity_check bool) (*Response, error)
	ImageDelete(ctx context.Context, id int, force bool) (*Response, error)
	ImageInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	ImageUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	ImageRename(ctx context.Context, id int, name string) (*Response, error)
	ImageChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	ImageChown(ctx context.Context, id, uid, gid int) (*Response, error)
	ImageLock(ctx context.Context, id, level int, test bool) (*Response, error)
	ImageUnlock(ctx context.Context, id int) (*Response, error)
	ImageClone(ctx context.Context,  id int, name string, dsid int) (*Response, error)
	ImageEnable(ctx context.Context, id int, enable bool) (*Response, error)
	ImagePersistent(ctx context.Context, id int, persistent bool) (*Response, error)
	ImageChtype(ctx context.Context, id int, new_type string) (*Response, error)
	ImageSnapshotDelete(ctx context.Context, id, snap_id int) (*Response, error)
	ImageSnapshotRevert(ctx context.Context, id, snap_id int) (*Response, error)
	ImageSnapshotFlatten(ctx context.Context, id, snap_id int) (*Response, error)
	ImageResize(ctx context.Context, id int, newSize string) (*Response, error)
	ImageRestore(ctx context.Context, id, dsid int, opt_tmpl string) (*Response, error)
	ImagePoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	MarketAllocate(ctx context.Context, tmpl string) (*Response, error)
	MarketDelete(ctx context.Context, id int) (*Response, error)
	MarketInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	MarketUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	MarketRename(ctx context.Context, id int, name string) (*Response, error)
	MarketChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	MarketChown(ctx context.Context, id, uid, gid int) (*Response, error)
	MarketEnable(ctx context.Context, id int, enable bool) (*Response, error)
	MarketPoolInfo(ctx context.Context) (*Response, error)

	MarketAppAllocate(ctx context.Context, tmpl string, market_id int) (*Response, error)
	MarketAppDelete(ctx context.Context, id int) (*Response, error)
	MarketAppInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	MarketAppUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	MarketAppRename(ctx context.Context, id int, name string) (*Response, error)
	MarketAppChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	MarketAppChown(ctx context.Context, id, uid, gid int) (*Response, error)
	MarketAppLock(ctx context.Context, id, level int, test bool) (*Response, error)
	MarketAppUnlock(ctx context.Context, id int) (*Response, error)
	MarketAppEnable(ctx context.Context, id int, enable bool) (*Response, error)
	MarketAppPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	SecGroupAllocate(ctx context.Context, tmpl string) (*Response, error)
	SecGroupDelete(ctx context.Context, id int) (*Response, error)
	SecGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	SecGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	SecGroupRename(ctx context.Context, id int, name string) (*Response, error)
	SecGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	SecGroupChown(ctx context.Context, id, uid, gid int) (*Response, error)
	SecGroupClone(ctx context.Context, id int, name string) (*Response, error)
	SecGroupCommit(ctx context.Context, id int, recovery bool) (*Response, error)
	SecGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	TemplateAllocate(ctx context.Context, tmpl string) (*Response, error)
	TemplateDelete(ctx context.Context, id int, recursive bool) (*Response, error)
	TemplateInfo(ctx context.Context, id int, extended, decrypt bool) (*Response, error)
	TemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	TemplateRename(ctx context.Context, id int, name string) (*Response, error)
	TemplateChmod(ctx context.Context, id int, perm shared.Permissions, recursive bool) (*Response, error)
	TemplateChown(ctx context.Context, id, uid, gid int) (*Response, error)
	TemplateLock(ctx context.Context, id, level int, test bool) (*Response, error)
	TemplateUnlock(ctx context.Context, id int) (*Response, error)
	TemplateClone(ctx context.Context, id int, name string, recursive bool) (*Response, error)
	TemplateInstantiate(ctx context.Context, id int, name string, hold bool, extra_tmpl string, persistent bool) (*Response, error)
	TemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	UserAllocate(ctx context.Context, name, password, driver string, groupIDs []int) (*Response, error)
	UserDelete(ctx context.Context, id int) (*Response, error)
	UserInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	UserUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	UserAddGroup(ctx context.Context, id int, groupID int) (*Response, error)
	UserChangeAuth(ctx context.Context, id int, authDriver, password string) (*Response, error)
	UserChangeGroup(ctx context.Context, id int, groupID int) (*Response, error)
	UserDelGroup(ctx context.Context, id int, groupID int) (*Response, error)
	UserEnable(ctx context.Context, id int, enable bool) (*Response, error)
	UserLogin(ctx context.Context, uname, token string, validTime, effectiveGID int) (*Response, error)
	UserPassword(ctx context.Context, id int, password string) (*Response, error)
	UserQuota(ctx context.Context, id int, quota string) (*Response, error)
	UserDefaultQuotaInfo(ctx context.Context) (*Response, error)
	UserDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error)
	UserPoolInfo(ctx context.Context) (*Response, error)

	VdcAllocate(ctx context.Context, tmpl string) (*Response, error)
	VdcDelete(ctx context.Context, id int) (*Response, error)
	VdcInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VdcUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VdcRename(ctx context.Context, id int, name string) (*Response, error)
	VdcAddGroup(ctx context.Context, id, group int) (*Response, error)
	VdcDelGroup(ctx context.Context, id, group int) (*Response, error)
	VdcAddCluster(ctx context.Context, id, zone, cluster int) (*Response, error)
	VdcDelCluster(ctx context.Context, id, zone, cluster int) (*Response, error)
	VdcAddHost(ctx context.Context, id, zone, host int) (*Response, error)
	VdcDelHost(ctx context.Context, id, zone, host int) (*Response, error)
	VdcAddDatastore(ctx context.Context, id, zone, ds int) (*Response, error)
	VdcDelDatastore(ctx context.Context, id, zone, ds int) (*Response, error)
	VdcAddVnet(ctx context.Context, id, zone, net int) (*Response, error)
	VdcDelVnet(ctx context.Context, id, zone, net int) (*Response, error)
	VdcPoolInfo(ctx context.Context) (*Response, error)

	VMAllocate(ctx context.Context, tmpl string, hold bool) (*Response, error)
	VMInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VMUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VMRename(ctx context.Context, id int, name string) (*Response, error)
	VMChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	VMChown(ctx context.Context, id, uid, gid int) (*Response, error)
	VMLock(ctx context.Context, id, level int, test bool) (*Response, error)
	VMUnlock(ctx context.Context, id int) (*Response, error)
	VMDeploy(ctx context.Context, id, hid int, no_overcommit bool, ds_id int, nic_tmpl string) (*Response, error)
	VMAction(ctx context.Context, action string, id int) (*Response, error)
	VMMigrate(ctx context.Context, id, hid int, live, no_overcommit bool, ds_id, migration_type int) (*Response, error)
	VMDiskSaveAs(ctx context.Context, id, disk_id int, name, image_type string, snap_id int) (*Response, error)
	VMDiskSnapshotCreate(ctx context.Context, id, disk_id int, name string) (*Response, error)
	VMDiskSnapshotDelete(ctx context.Context, id, disk_id, snap_id int) (*Response, error)
	VMDiskSnapshotRevert(ctx context.Context, id, disk_id, snap_id int) (*Response, error)
	VMDiskSnapshotRename(ctx context.Context, id, disk_id, snap_id int, name string) (*Response, error)
	VMDiskAttach(ctx context.Context, id int, tmpl string) (*Response, error)
	VMDiskDetach(ctx context.Context, id, disk_id int) (*Response, error)
	VMDiskResize(ctx context.Context, id, disk_id int, size string) (*Response, error)
	VMNicAttach(ctx context.Context, id int, tmpl string) (*Response, error)
	VMNicDetach(ctx context.Context, id, nic_id int) (*Response, error)
	VMNicUpdate(ctx context.Context, id, nic_id int, tmpl string, uType int) (*Response, error)
	VMSGAttach(ctx context.Context, id, nic_id, sg_id int) (*Response, error)
	VMSGDetach(ctx context.Context, id, nic_id, sg_id int) (*Response, error)
	VMSnapshotCreate(ctx context.Context, id int, name string) (*Response, error)
	VMSnapshotDelete(ctx context.Context, id, snap_id int) (*Response, error)
	VMSnapshotRevert(ctx context.Context, id, snap_id int) (*Response, error)
	VMResize(ctx context.Context, id int, tmpl string, no_overcommit bool) (*Response, error)
	VMUpdateConf(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VMRecover(ctx context.Context, id, operation int) (*Response, error)
	VMMonitoring(ctx context.Context, id int) (*Response, error)
	VMSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error)
	VMSchedUpdate(ctx context.Context, id, sched_id int, tmpl string) (*Response, error)
	VMSchedDelete(ctx context.Context, id, sched_id int) (*Response, error)
	VMBackup(ctx context.Context, id, ds_id int, reset bool) (*Response, error)
	VMBackupCancel(ctx context.Context, id int) (*Response, error)
	VMRestore(ctx context.Context, id, image_id, inc_id, disk_id int) (*Response, error)
	VMPciAttach(ctx context.Context, id int, tmpl string) (*Response, error)
	VMPciDetach(ctx context.Context, id, pci_id int) (*Response, error)
	VMPoolInfo(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error)
	VMPoolInfoExtended(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error)
	VMPoolInfoSet(ctx context.Context, ids string, extended bool) (*Response, error)
	VMPoolMonitoring(ctx context.Context, filter, seconds int) (*Response, error)
	VMPoolAccounting(ctx context.Context, filter, start, end int) (*Response, error)
	VMPoolShowback(ctx context.Context, filter, start_month, start_year, end_month, end_year int) (*Response, error)
	VMPoolShowbackCalculate(ctx context.Context, start_month, start_year, end_month, end_year int) (*Response, error)
	VMExec(ctx context.Context, id int, cmd string, cmd_stdin string) (*Response, error)
	VMExecRetry(ctx context.Context, id int) (*Response, error)
	VMExecCancel(ctx context.Context, id int) (*Response, error)

	VMGroupAllocate(ctx context.Context, tmpl string) (*Response, error)
	VMGroupDelete(ctx context.Context, id int) (*Response, error)
	VMGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VMGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VMGroupRename(ctx context.Context, id int, name string) (*Response, error)
	VMGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	VMGroupChown(ctx context.Context, id, uid, gid int) (*Response, error)
	VMGroupLock(ctx context.Context, id, level int, test bool) (*Response, error)
	VMGroupUnlock(ctx context.Context, id int) (*Response, error)
	VMGroupRoleAdd(ctx context.Context, id int, tmpl string) (*Response, error)
	VMGroupRoleDelete(ctx context.Context, id, role_id int) (*Response, error)
	VMGroupRoleUpdate(ctx context.Context, id, role_id int, tmpl string) (*Response, error)
	VMGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	VNetAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error)
	VNetDelete(ctx context.Context, id int) (*Response, error)
	VNetInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VNetUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VNetRename(ctx context.Context, id int, name string) (*Response, error)
	VNetChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	VNetChown(ctx context.Context, id, uid, gid int) (*Response, error)
	VNetLock(ctx context.Context, id, level int, test bool) (*Response, error)
	VNetUnlock(ctx context.Context, id int) (*Response, error)
	VNetAddAR(ctx context.Context, id int, tmpl string ) (*Response, error)
	VNetRmAR(ctx context.Context, id, ar_id int, force bool) (*Response, error)
	VNetUpdateAR(ctx context.Context, id int, tmpl string) (*Response, error)
	VNetReserve(ctx context.Context, id int, tmpl string) (*Response, error)
	VNetFreeAR(ctx context.Context, id, ar_id int) (*Response, error)
	VNetHold(ctx context.Context, id int, tmpl string) (*Response, error)
	VNetRelease(ctx context.Context, id int, tmpl string) (*Response, error)
	VNetRecover(ctx context.Context, id, operation int) (*Response, error)
	VNetPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	VNTemplateAllocate(ctx context.Context, tmpl string) (*Response, error)
	VNTemplateDelete(ctx context.Context, id int) (*Response, error)
	VNTemplateInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VNTemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VNTemplateRename(ctx context.Context, id int, name string) (*Response, error)
	VNTemplateChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	VNTemplateChown(ctx context.Context, id, uid, gid int) (*Response, error)
	VNTemplateLock(ctx context.Context, id, level int, test bool) (*Response, error)
	VNTemplateUnlock(ctx context.Context, id int) (*Response, error)
	VNTemplateClone(ctx context.Context, id int, name string) (*Response, error)
	VNTemplateInstantiate(ctx context.Context, id int, name, extra_tmpl string) (*Response, error)
	VNTemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	VRouterAllocate(ctx context.Context, tmpl string) (*Response, error)
	VRouterDelete(ctx context.Context, id int) (*Response, error)
	VRouterInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	VRouterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	VRouterRename(ctx context.Context, id int, name string) (*Response, error)
	VRouterChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error)
	VRouterChown(ctx context.Context, id, uid, gid int) (*Response, error)
	VRouterLock(ctx context.Context, id, level int, test bool) (*Response, error)
	VRouterUnlock(ctx context.Context, id int) (*Response, error)
	VRouterInstantiate(ctx context.Context, id, num_vms, template_id int, name string, hold bool, extra_tmpl string) (*Response, error)
	VRouterAttachNic(ctx context.Context, id int, tmpl string) (*Response, error)
	VRouterDetachNic(ctx context.Context, id, nic_id int) (*Response, error)
	VRouterPoolInfo(ctx context.Context, filter, start, end int) (*Response, error)

	ZoneAllocate(ctx context.Context, tmpl string) (*Response, error)
	ZoneDelete(ctx context.Context, id int) (*Response, error)
	ZoneInfo(ctx context.Context, id int, decrypt bool) (*Response, error)
	ZoneUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error)
	ZoneRename(ctx context.Context, id int, name string) (*Response, error)
	ZoneAddServer(ctx context.Context, id int, tmpl string) (*Response, error)
	ZoneDelServer(ctx context.Context, id, server_id int) (*Response, error)
	ZoneResetServer(ctx context.Context, id, server_id int) (*Response, error)
	ZoneEnable(ctx context.Context, id int, enable bool) (*Response, error)
	ZoneRaftStatus(ctx context.Context) (*Response, error)
	ZonePoolInfo(ctx context.Context) (*Response, error)

	SystemVersion(ctx context.Context) (*Response, error)
	SystemConfig(ctx context.Context) (*Response, error)
}

// HTTPCaller is the analogous to RPCCaller but for http endpoints
type HTTPCaller interface {
	HTTPMethod(method string, url string, args ...interface{}) (*Response, error)
}

// Controller is the controller used to make requets on various entities
type Controller struct {
	Client     RPCCaller
	ClientFlow HTTPCaller
}

// entitiesController is a controller for entitites
type entitiesController struct {
	c *Controller
}

// entityController is a controller for an entity
type entityController struct {
	c  *Controller
	ID int
}

// entityControllerName is a controller for an entity
type entityNameController struct {
	c    *Controller
	Name string
}

// subEntityController is a controller for a sub entity
type subEntityController struct {
	c        *Controller
	entityID int
	ID       int
}

// NewController return a new one controller
func NewController(c RPCCaller) *Controller {
	return &Controller{
		Client: c,
	}
}

func NewControllerFlow(c HTTPCaller) *Controller {
	return &Controller{
		ClientFlow: c,
	}
}

func NewGenericController(cone RPCCaller, cflow HTTPCaller) *Controller {
	return &Controller{
		Client:     cone,
		ClientFlow: cflow,
	}
}

// SystemVersion returns the current OpenNebula Version
func (c *Controller) SystemVersion() (string, error) {
	return c.SystemVersionContext(context.Background())
}

// SystemVersionContext returns the current OpenNebula Version
func (c *Controller) SystemVersionContext(ctx context.Context) (string, error) {
	response, err := c.Client.SystemVersion(ctx)
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

// SystemConfig returns the current OpenNebula config
func (c *Controller) SystemConfig() (string, error) {
	return c.SystemConfigContext(context.Background())
}

// SystemConfigContext returns the current OpenNebula config
func (c *Controller) SystemConfigContext(ctx context.Context) (string, error) {
	response, err := c.Client.SystemConfig(ctx)
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

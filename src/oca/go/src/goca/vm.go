/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
	"encoding/xml"
	"errors"
	"fmt"
)

// VMsController is a controller for a pool of VMs
type VMsController entitiesController

// VMController is a controller for VM entities
type VMController entityController

// VMDiskController is a controller for VM entities
type VMDiskController subEntityController

// VMPool represents an OpenNebula Virtual Machine pool
type VMPool struct {
	VMs []VM `xml:"VM"`
}

// VM represents an OpenNebula Virtual Machine
type VM struct {
	ID              uint              `xml:"ID"`
	UID             int               `xml:"UID"`
	GID             int               `xml:"GID"`
	UName           string            `xml:"UNAME"`
	GName           string            `xml:"GNAME"`
	Name            string            `xml:"NAME"`
	Permissions     *Permissions      `xml:"PERMISSIONS"`
	LastPoll        int               `xml:"LAST_POLL"`
	StateRaw        int               `xml:"STATE"`
	LCMStateRaw     int               `xml:"LCM_STATE"`
	PrevStateRaw    int               `xml:"PREV_STATE"`
	PrevLCMStateRaw int               `xml:"PREV_LCM_STATE"`
	ReschedValue    int               `xml:"RESCHED"`
	STime           int               `xml:"STIME"`
	ETime           int               `xml:"ETIME"`
	DeployID        string            `xml:"DEPLOY_ID"`
	MonitoringInfos vmMonitoring      `xml:"MONITORING"`
	Template        vmTemplate        `xml:"TEMPLATE"`
	UserTemplate    *vmUserTemplate   `xml:"USER_TEMPLATE"`
	HistoryRecords  []vmHistoryRecord `xml:"HISTORY_RECORDS>HISTORY"`

	// Not filled with NewUserPool call
	LockInfos *Lock `xml:"LOCK"`
}

type vmMonitoring struct {
	DiskSize     []vmMonitoringDiskSize     `xml:"DISK_SIZE"`
	SnapshotSize []vmMonitoringSnapshotSize `xml:"SNAPSHOT_SIZE"`
	Dynamic      unmatchedTagsSlice         `xml:",any"`
}

type vmMonitoringDiskSize struct {
	ID   int `xml:"ID"`
	Size int `xml:"SIZE"`
}

// History records
type vmHistoryRecord struct {
	OID       int                       `xml:"OID"`
	SEQ       int                       `xml:"SEQ"`
	Hostname  string                    `xml:"HOSTNAME"`
	HID       int                       `xml:"HID"`
	CID       int                       `xml:"CID"`
	DSID      int                       `xml:"DS_ID"`
	Action    int                       `xml:"ACTION"`
	UID       int                       `xml:"UID"`
	GID       int                       `xml:"GID"`
	RequestID string                    `xml:"REQUEST_ID"`
	PSTime    int                       `xml:"PSTIME"`
	PETime    int                       `xml:"PETIME"`
	RSTime    int                       `xml:"RSTIME"`
	RETime    int                       `xml:"RETIME"`
	ESTime    int                       `xml:"ESTIME"`
	EETime    int                       `xml:"EETIME"`
	STime     int                       `xml:"STIME"`
	ETime     int                       `xml:"ETIME"`
	VMMad     string                    `xml:"VM_MAD"`
	TMMad     string                    `xml:"TM_MAD"`
	Snapshots []vmHistoryRecordSnapshot `xml:"SNAPSHOTS"`
}

// VMUserTemplate contain custom attributes
type vmUserTemplate struct {
	Error        string           `xml:"ERROR"`
	SchedMessage string           `xml:"SCHED_MESSAGE"`
	Dynamic      unmatchedTagsMap `xml:",any"`
}

type vmTemplate struct {
	CPU                float64               `xml:"CPU"`
	Memory             int                   `xml:"MEMORY"`
	NICs               []vmNic               `xml:"NIC"`
	NICAliases         []vmNicAlias          `xml:"NIC_ALIAS"`
	Context            *vmContext            `xml:"CONTEXT"`
	Disks              []vmDisk              `xml:"DISK"`
	Graphics           *vmGraphics           `xml:"GRAPHICS"`
	OS                 *vmOS                 `xml:"OS"`
	Snapshots          []VMSnapshot          `xml:"SNAPSHOT"`
	SecurityGroupRules []vmSecurityGroupRule `xml:"SECURITY_GROUP_RULE"`
	Dynamic            unmatchedTagsSlice    `xml:",any"`
}

type vmContext struct {
	Dynamic unmatchedTagsMap `xml:",any"`
}

type vmNic struct {
	ID      int                `xml:"NIC_ID"`
	Network string             `xml:"NETWORK"`
	IP      string             `xml:"IP"`
	MAC     string             `xml:"MAC"`
	PhyDev  string             `xml:"PHYDEV"`
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type vmNicAlias struct {
	ID       int    `xml:"NIC_ID"`    // minOccurs=1
	Parent   string `xml:"PARENT"`    // minOccurs=1
	ParentID string `xml:"PARENT_ID"` // minOccurs=1
}

type vmGraphics struct {
	Listen string `xml:"LISTEN"`
	Port   string `xml:"PORT"`
	Type   string `xml:"TYPE"`
}

type vmDisk struct {
	ID           int                `xml:"DISK_ID"`
	Datastore    string             `xml:"DATASTORE"`
	DiskType     string             `xml:"DISK_TYPE"`
	Image        string             `xml:"IMAGE"`
	Driver       string             `xml:"DRIVER"`
	OriginalSize int                `xml:"ORIGINAL_SIZE"`
	Size         int                `xml:"SIZE"`
	Dynamic      unmatchedTagsSlice `xml:",any"`
}

type vmOS struct {
	Arch string `xml:"ARCH"`
	Boot string `xml:"BOOT"`
}

type vmSecurityGroupRule struct {
	securityGroupRule
	SecurityGroup string `xml:"SECURITY_GROUP_NAME"`
}

// VMState is the state of the Virtual Machine
type VMState int

const (
	// Init state
	Init VMState = 0

	// Pending state
	Pending VMState = 1

	// Hold state
	Hold VMState = 2

	// Active state
	Active VMState = 3

	// Stopped state
	Stopped VMState = 4

	// Suspended state
	Suspended VMState = 5

	// Done state
	Done VMState = 6

	// Deprecated
	// Failed VMState = 7

	// Poweroff state
	Poweroff VMState = 8

	// Undeployed state
	Undeployed VMState = 9

	// Cloning state
	Cloning VMState = 10

	// CloningFailure state
	CloningFailure VMState = 11
)

func (s VMState) isValid() bool {
	if (s >= Init && s <= Done) ||
		(s >= Poweroff && s <= CloningFailure) {
		return true
	}
	return false
}

func (s VMState) String() string {
	switch s {
	case Init:
		return "INIT"
	case Pending:
		return "PENDING"
	case Hold:
		return "HOLD"
	case Active:
		return "ACTIVE"
	case Stopped:
		return "STOPPED"
	case Suspended:
		return "SUSPENDED"
	case Done:
		return "DONE"
	case Poweroff:
		return "POWEROFF"
	case Undeployed:
		return "UNDEPLOYED"
	case Cloning:
		return "CLONING"
	case CloningFailure:
		return "CLONINGFAILURE"
	default:
		return ""
	}
}

// LCMState is the life-cycle manager state of the virtual machine. It is used
// only when the VM's state is active, otherwise it's LcmInit
type LCMState int

const (
	// LcmInit lcm state
	LcmInit LCMState = 0

	// Prolog lcm state
	Prolog LCMState = 1

	// Boot lcm state
	Boot LCMState = 2

	// Running lcm state
	Running LCMState = 3

	// Migrate lcm state
	Migrate LCMState = 4

	// SaveStop lcm state
	SaveStop LCMState = 5

	// SaveSuspend lcm state
	SaveSuspend LCMState = 6

	// SaveMigrate lcm state
	SaveMigrate LCMState = 7

	// PrologMigrate lcm state
	PrologMigrate LCMState = 8

	// PrologResume lcm state
	PrologResume LCMState = 9

	// EpilogStop lcm state
	EpilogStop LCMState = 10

	// Epilog lcm state
	Epilog LCMState = 11

	// Shutdown lcm state
	Shutdown LCMState = 12

	// Deprecated
	// Cancel LCMState  =  13
	// Failure LCMState  =  14

	// CleanupResubmit lcm state
	CleanupResubmit LCMState = 15

	// Unknown lcm state
	Unknown LCMState = 16

	// Hotplug lcm state
	Hotplug LCMState = 17

	// ShutdownPoweroff lcm state
	ShutdownPoweroff LCMState = 18

	// BootUnknown lcm state
	BootUnknown LCMState = 19

	// BootPoweroff lcm state
	BootPoweroff LCMState = 20

	// BootSuspended lcm state
	BootSuspended LCMState = 21

	// BootStopped lcm state
	BootStopped LCMState = 22

	// CleanupDelete lcm state
	CleanupDelete LCMState = 23

	// HotplugSnapshot lcm state
	HotplugSnapshot LCMState = 24

	// HotplugNic lcm state
	HotplugNic LCMState = 25

	// HotplugSaveas lcm state
	HotplugSaveas LCMState = 26

	// HotplugSaveasPoweroff lcm state
	HotplugSaveasPoweroff LCMState = 27

	// HotplugSaveasSuspended lcm state
	HotplugSaveasSuspended LCMState = 28

	// ShutdownUndeploy lcm state
	ShutdownUndeploy LCMState = 29

	// EpilogUndeploy lcm state
	EpilogUndeploy LCMState = 30

	// PrologUndeploy lcm state
	PrologUndeploy LCMState = 31

	// BootUndeploy lcm state
	BootUndeploy LCMState = 32

	// HotplugPrologPoweroff lcm state
	HotplugPrologPoweroff LCMState = 33

	// HotplugEpilogPoweroff lcm state
	HotplugEpilogPoweroff LCMState = 34

	// BootMigrate lcm state
	BootMigrate LCMState = 35

	// BootFailure lcm state
	BootFailure LCMState = 36

	// BootMigrateFailure lcm state
	BootMigrateFailure LCMState = 37

	// PrologMigrateFailure lcm state
	PrologMigrateFailure LCMState = 38

	// PrologFailure lcm state
	PrologFailure LCMState = 39

	// EpilogFailure lcm state
	EpilogFailure LCMState = 40

	// EpilogStopFailure lcm state
	EpilogStopFailure LCMState = 41

	// EpilogUndeployFailure lcm state
	EpilogUndeployFailure LCMState = 42

	// PrologMigratePoweroff lcm state
	PrologMigratePoweroff LCMState = 43

	// PrologMigratePoweroffFailure lcm state
	PrologMigratePoweroffFailure LCMState = 44

	// PrologMigrateSuspend lcm state
	PrologMigrateSuspend LCMState = 45

	// PrologMigrateSuspendFailure lcm state
	PrologMigrateSuspendFailure LCMState = 46

	// BootUndeployFailure lcm state
	BootUndeployFailure LCMState = 47

	// BootStoppedFailure lcm state
	BootStoppedFailure LCMState = 48

	// PrologResumeFailure lcm state
	PrologResumeFailure LCMState = 49

	// PrologUndeployFailure lcm state
	PrologUndeployFailure LCMState = 50

	// DiskSnapshotPoweroff lcm state
	DiskSnapshotPoweroff LCMState = 51

	// DiskSnapshotRevertPoweroff lcm state
	DiskSnapshotRevertPoweroff LCMState = 52

	// DiskSnapshotDeletePoweroff lcm state
	DiskSnapshotDeletePoweroff LCMState = 53

	// DiskSnapshotSuspended lcm state
	DiskSnapshotSuspended LCMState = 54

	// DiskSnapshotRevertSuspended lcm state
	DiskSnapshotRevertSuspended LCMState = 55

	// DiskSnapshotDeleteSuspended lcm state
	DiskSnapshotDeleteSuspended LCMState = 56

	// DiskSnapshot lcm state
	DiskSnapshot LCMState = 57

	// Deprecated
	// DiskSnapshotRevert LCMState  =  58

	// DiskSnapshotDelete lcm state
	DiskSnapshotDelete LCMState = 59

	// PrologMigrateUnknown lcm state
	PrologMigrateUnknown LCMState = 60

	// PrologMigrateUnknownFailure lcm state
	PrologMigrateUnknownFailure LCMState = 61

	// DiskResize lcm state
	DiskResize LCMState = 62

	// DiskResizePoweroff lcm state
	DiskResizePoweroff LCMState = 63

	// DiskResizeUndeployed lcm state
	DiskResizeUndeployed LCMState = 64
)

func (s LCMState) isValid() bool {
	if (s >= LcmInit && s <= Shutdown) ||
		(s >= CleanupResubmit && s <= DiskSnapshot) ||
		(s >= DiskSnapshotDelete && s <= DiskResizeUndeployed) {
		return true
	}
	return false
}

func (s LCMState) String() string {
	switch s {
	case LcmInit:
		return "LCM_INIT"
	case Prolog:
		return "PROLOG"
	case Boot:
		return "BOOT"
	case Running:
		return "RUNNING"
	case Migrate:
		return "MIGRATE"
	case SaveStop:
		return "SAVE_STOP"
	case SaveSuspend:
		return "SAVE_SUSPEND"
	case SaveMigrate:
		return "SAVE_MIGRATE"
	case PrologMigrate:
		return "PROLOG_MIGRATE"
	case PrologResume:
		return "PROLOG_RESUME"
	case EpilogStop:
		return "EPILOG_STOP"
	case Epilog:
		return "EPILOG"
	case Shutdown:
		return "SHUTDOWN"
	case CleanupResubmit:
		return "CLEANUP_RESUBMIT"
	case Unknown:
		return "UNKNOWN"
	case Hotplug:
		return "HOTPLUG"
	case ShutdownPoweroff:
		return "SHUTDOWN_POWEROFF"
	case BootUnknown:
		return "BOOT_UNKNOWN"
	case BootPoweroff:
		return "BOOT_POWEROFF"
	case BootSuspended:
		return "BOOT_SUSPENDED"
	case BootStopped:
		return "BOOT_STOPPED"
	case CleanupDelete:
		return "CLEANUP_DELETE"
	case HotplugSnapshot:
		return "HOTPLUG_SNAPSHOT"
	case HotplugNic:
		return "HOTPLUG_NIC"
	case HotplugSaveas:
		return "HOTPLUG_SAVEAS"
	case HotplugSaveasPoweroff:
		return "HOTPLUG_SAVEAS_POWEROFF"
	case HotplugSaveasSuspended:
		return "HOTPLUG_SAVEAS_SUSPENDED"
	case ShutdownUndeploy:
		return "SHUTDOWN_UNDEPLOY"
	case EpilogUndeploy:
		return "EPILOG_UNDEPLOY"
	case PrologUndeploy:
		return "PROLOG_UNDEPLOY"
	case BootUndeploy:
		return "BOOT_UNDEPLOY"
	case HotplugPrologPoweroff:
		return "HOTPLUG_PROLOG_POWEROFF"
	case HotplugEpilogPoweroff:
		return "HOTPLUG_EPILOG_POWEROFF"
	case BootMigrate:
		return "BOOT_MIGRATE"
	case BootFailure:
		return "BOOT_FAILURE"
	case BootMigrateFailure:
		return "BOOT_MIGRATE_FAILURE"
	case PrologMigrateFailure:
		return "PROLOG_MIGRATE_FAILURE"
	case PrologFailure:
		return "PROLOG_FAILURE"
	case EpilogFailure:
		return "EPILOG_FAILURE"
	case EpilogStopFailure:
		return "EPILOG_STOP_FAILURE"
	case EpilogUndeployFailure:
		return "EPILOG_UNDEPLOY_FAILURE"
	case PrologMigratePoweroff:
		return "PROLOG_MIGRATE_POWEROFF"
	case PrologMigratePoweroffFailure:
		return "PROLOG_MIGRATE_POWEROFF_FAILURE"
	case PrologMigrateSuspend:
		return "PROLOG_MIGRATE_SUSPEND"
	case PrologMigrateSuspendFailure:
		return "PROLOG_MIGRATE_SUSPEND_FAILURE"
	case BootUndeployFailure:
		return "BOOT_UNDEPLOY_FAILURE"
	case BootStoppedFailure:
		return "BOOT_STOPPED_FAILURE"
	case PrologResumeFailure:
		return "PROLOG_RESUME_FAILURE"
	case PrologUndeployFailure:
		return "PROLOG_UNDEPLOY_FAILURE"
	case DiskSnapshotPoweroff:
		return "DISK_SNAPSHOT_POWEROFF"
	case DiskSnapshotRevertPoweroff:
		return "DISK_SNAPSHOT_REVERT_POWEROFF"
	case DiskSnapshotDeletePoweroff:
		return "DISK_SNAPSHOT_DELETE_POWEROFF"
	case DiskSnapshotSuspended:
		return "DISK_SNAPSHOT_SUSPENDED"
	case DiskSnapshotRevertSuspended:
		return "DISK_SNAPSHOT_REVERT_SUSPENDED"
	case DiskSnapshotDeleteSuspended:
		return "DISK_SNAPSHOT_DELETE_SUSPENDED"
	case DiskSnapshot:
		return "DISK_SNAPSHOT"
	case DiskSnapshotDelete:
		return "DISK_SNAPSHOT_DELETE"
	case PrologMigrateUnknown:
		return "PROLOG_MIGRATE_UNKNOWN"
	case PrologMigrateUnknownFailure:
		return "PROLOG_MIGRATE_UNKNOWN_FAILURE"
	case DiskResize:
		return "DISK_RESIZE"
	case DiskResizePoweroff:
		return "DISK_RESIZE_POWEROFF"
	case DiskResizeUndeployed:
		return "DISK_RESIZE_UNDEPLOYED"
	default:
		return ""
	}
}

// VMs returns a new vm pool controller.
func (c *Controller) VMs() *VMsController {
	return &VMsController{c}
}

// VM returns a new vm controller.
func (c *Controller) VM(id uint) *VMController {
	return &VMController{c, id}
}

// Disk returns a new vm disk controller.
func (vc *VMController) Disk(id uint) *VMDiskController {
	return &VMDiskController{vc.c, vc.ID, id}
}

// ByName returns VM ID from name
func (c *VMsController) ByName(name string, args ...int) (uint, error) {
	var id uint

	vmPool, err := c.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(vmPool.VMs); i++ {
		if vmPool.VMs[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = vmPool.VMs[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, err
}

// Info returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) Info(args ...int) (*VMPool, error) {
	var who, start, end, state int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
		state = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
		state = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
		state = -1
	case 4:
		who = args[0]
		start = args[1]
		end = args[2]
		state = args[3]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := vc.c.Client.Call("one.vmpool.info", who, start, end, state)
	if err != nil {
		return nil, err
	}

	vmPool := &VMPool{}
	err = xml.Unmarshal([]byte(response.Body()), vmPool)
	if err != nil {
		return nil, err
	}

	return vmPool, nil
}

// InfoExtended connects to OpenNebula and fetches the whole VM_POOL information
func (vc *VMsController) InfoExtended(filter_flag, start_id, end_id, state int) error {
	response, err := vc.c.Client.Call("one.vmpool.infoextended", filter_flag,
		start_id, end_id, state)
	if err != nil {
		return err
	}
	vmpool := &VMPool{}
	return xml.Unmarshal([]byte(response.Body()), vmpool)
}

// Info connects to OpenNebula and fetches the information of the VM
func (vc *VMController) Info() (*VM, error) {
	response, err := vc.c.Client.Call("one.vm.info", vc.ID)
	if err != nil {
		return nil, err
	}
	vm := &VM{}
	err = xml.Unmarshal([]byte(response.Body()), vm)
	if err != nil {
		return nil, err
	}
	return vm, nil
}

// Monitoring returns all the virtual machine monitoring records
// filter flag:
// -4: Resources belonging to the user's primary group
// -3: Resources belonging to the user
// -2: All resources
// -1: Resources belonging to the user and any of his groups
// >= 0: UID User's Resources
func (vc *VMsController) Monitoring(filter int) (string, error) {
	monitor_data, err := vc.c.Client.Call("one.vmpool.monitoring", filter)

	if err != nil {
		return "", err
	} else {
		return monitor_data.Body(), err
	}
}

// Accounting returns the virtual machine history records
// filter flag:
//   -4: Resources belonging to the user's primary group
//   -3: Resources belonging to the user
//   -2: All resources
//   -1: Resources belonging to the user and any of his groups
//   >= 0: UID User's Resources
// if startTime and/or endTime are -1 it means no limit
func (vc *VMsController) Accounting(filter, startTime, endTime int) error {
	_, err := vc.c.Client.Call("one.vmpool.accounting", filter)
	return err
}

// Showback returns the virtual machine showback records
// filter flag
//   <= -3: Connected user's resources
//   -2: All resources
//   -1: Connected user's and his group's resources
//   >= 0: UID User's Resources
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//   a left boundary.
// firstYear: Can be -1, in which case the time interval won't have a left
//   boundary.
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//   a right boundary.
// lastYear: Can be -1, in which case the time interval won't have a right
//   boundary.
func (vc *VMsController) Showback(filter, firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.Call("one.vmpool.showback", filter, firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// CalculateShowback processes all the history records, and stores the monthly cost for each VM
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//   a left boundary.
// firstYear: Can be -1, in which case the time interval won't have a left
//   boundary.
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//   a right boundary.
// lastYear: Can be -1, in which case the time interval won't have a right
//   boundary.
func (vc *VMsController) CalculateShowback(firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.Call("one.vmpool.calculateshowback", firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// Create allocates a new VM based on the template string provided. It
// returns the image ID
func (vc *VMsController) Create(template string, pending bool) (uint, error) {
	response, err := vc.c.Client.Call("one.vm.allocate", template, pending)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// State returns the VMState and LCMState
func (vm *VM) State() (VMState, LCMState, error) {
	state := VMState(vm.StateRaw)
	if !state.isValid() {
		return -1, -1, fmt.Errorf("VM State: this state value is not currently handled: %d\n", vm.StateRaw)
	}
	lcmState := LCMState(vm.LCMStateRaw)
	if !lcmState.isValid() {
		return state, -1, fmt.Errorf("VM LCMState: this state value is not currently handled: %d\n", vm.LCMStateRaw)
	}
	return state, lcmState, nil
}

// StateString returns the VMState and LCMState as strings
func (vm *VM) StateString() (string, string, error) {
	state := VMState(vm.StateRaw)
	if !state.isValid() {
		return "", "", fmt.Errorf("VM State: this state value is not currently handled: %d\n", vm.StateRaw)
	}
	lcmState := LCMState(vm.LCMStateRaw)
	if !lcmState.isValid() {
		return state.String(), "", fmt.Errorf("VM LCMState: this state value is not currently handled: %d\n", vm.LCMStateRaw)
	}
	return state.String(), lcmState.String(), nil
}

// Action is the generic method to run any action on the VM
func (vc *VMController) Action(action string) error {
	_, err := vc.c.Client.Call("one.vm.action", action, vc.ID)
	return err
}

// Update will modify the VM's template. If appendTemplate is 0, it will
// replace the whole template. If its 1, it will merge.
func (vc *VMController) Update(tpl string, appendTemplate int) error {
	_, err := vc.c.Client.Call("one.vm.update", vc.ID, tpl, appendTemplate)
	return err
}

// UpdateConf updates (appends) a set of supported configuration attributes in
// the VM template
func (vc *VMController) UpdateConf(tpl string) error {
	_, err := vc.c.Client.Call("one.vm.updateconf", vc.ID, tpl)
	return err
}

// Monitoring Returns the virtual machine monitoring records
func (vc *VMController) Monitoring() (string, error) {
	monitor_data, err := vc.c.Client.Call("one.vm.monitoring", vc.ID)

	if err != nil {
		return "", err
	} else {
		return monitor_data.Body(), err
	}
}

// Chown changes the owner/group of a VM. If uid or gid is -1 it will not
// change
func (vc *VMController) Chown(uid, gid int) error {
	_, err := vc.c.Client.Call("one.vm.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a VM. If any perm is -1 it will not
// change
func (vc *VMController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := vc.c.Client.Call("one.vm.chmod", vc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of a VM
func (vc *VMController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vm.rename", vc.ID, newName)
	return err
}

// Delete will remove the VM from OpenNebula
func (vc *VMController) Delete() error {
	_, err := vc.c.Client.Call("one.vm.delete", vc.ID)
	return err
}

// Deploy in the selected hostID and/or dsID. Enforce to return error in case of
// overcommitment. Enforce is automatically enabled for non-oneadmin users.
// Set dsID to -1 to let OpenNebula choose the datastore.
func (vc *VMController) Deploy(hostID uint, enforce bool, dsID int) error {
	_, err := vc.c.Client.Call("one.vm.deploy", vc.ID, int(hostID), enforce, dsID)
	return err
}

// Resize changes the capacity of the virtual machine
func (vc *VMController) Resize(template string, enforce bool) error {
	_, err := vc.c.Client.Call("one.vm.resize", vc.ID, template, enforce)
	return err
}

// Saveas exports a disk to an image. If imageType is empty the default one
// will be used. If snapID is -1 the current image state will be exported
func (vc *VMDiskController) Saveas(imageName, imageType string, snapID int) error {
	_, err := vc.c.Client.Call("one.vm.disksaveas", vc.entityID, vc.ID, imageName, imageType, snapID)
	return err
}

// SnapshotCreate will create a snapshot of the disk image
func (vc *VMDiskController) SnapshotCreate(description string) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotcreate", vc.entityID, vc.ID, description)
	return err
}

// SnapshotDelete will delete a snapshot
func (vc *VMDiskController) SnapshotDelete(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotdelete", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRevert will revert disk state to a previously taken snapshot
func (vc *VMDiskController) SnapshotRevert(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotrevert", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRename renames a snapshot
func (vc *VMDiskController) SnapshotRename(snapID int, newName string) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotrename", vc.entityID, vc.ID, snapID, newName)
	return err
}

// DiskAttach attach a new disk to the virtual machine. diskTemplate is a string containing
// a single DISK vector attribute. Syntax can be the usual attribute=value or
// XML
func (vc *VMController) DiskAttach(diskTemplate string) error {
	_, err := vc.c.Client.Call("one.vm.attach", vc.ID, diskTemplate)
	return err
}

// Detach a disk from a virtual machine
func (vc *VMDiskController) Detach() error {
	_, err := vc.c.Client.Call("one.vm.detach", vc.entityID, vc.ID)
	return err
}

// Resize a disk of a virtual machine
func (vc *VMDiskController) Resize(size string) error {
	_, err := vc.c.Client.Call("one.vm.diskresize", vc.entityID, vc.ID, size)
	return err
}

// SnapshotCreate creates a new virtual machine snapshot. name can be empty
func (vc *VMController) SnapshotCreate(name string) error {
	_, err := vc.c.Client.Call("one.vm.snapshotcreate", vc.ID, name)
	return err
}

// SnapshotDelete deletes a virtual machine snapshot
func (vc *VMController) SnapshotDelete(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.snapshotdelete", vc.ID, snapID)
	return err
}

// SnapshotRevert reverts a virtual machine to a snapshot
func (vc *VMController) SnapshotRevert(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.snapshotrevert", vc.ID, snapID)
	return err
}

// Migrate a VM to a target host and/or to another ds
func (vc *VMController) Migrate(hostID uint, live, enforce bool, dsID uint, migrationType int) error {
	_, err := vc.c.Client.Call("one.vm.migrate", int(hostID), live, enforce, int(dsID), migrationType)
	return err
}

// AttachNic attaches new network interface to the virtual machine
func (vc *VMController) AttachNic(tpl string) error {
	_, err := vc.c.Client.Call("one.vm.attachnic", vc.ID, tpl)
	return err
}

// DetachNic detaches a network interface from the virtual machine
func (vc *VMController) DetachNic(nicID int) error {
	_, err := vc.c.Client.Call("one.vm.detachnic", vc.ID, nicID)
	return err
}

// VM Actions

// TerminateHard action on the VM
func (vc *VMController) TerminateHard() error {
	return vc.Action("terminate-hard")
}

// Terminate action on the VM
func (vc *VMController) Terminate() error {
	return vc.Action("terminate")
}

// UndeployHard action on the VM
func (vc *VMController) UndeployHard() error {
	return vc.Action("undeploy-hard")
}

// Undeploy action on the VM
func (vc *VMController) Undeploy() error {
	return vc.Action("undeploy")
}

// PoweroffHard action on the VM
func (vc *VMController) PoweroffHard() error {
	return vc.Action("poweroff-hard")
}

// Poweroff action on the VM
func (vc *VMController) Poweroff() error {
	return vc.Action("poweroff")
}

// RebootHard action on the VM
func (vc *VMController) RebootHard() error {
	return vc.Action("reboot-hard")
}

// Reboot action on the VM
func (vc *VMController) Reboot() error {
	return vc.Action("reboot")
}

// Hold action on the VM
func (vc *VMController) Hold() error {
	return vc.Action("hold")
}

// Release action on the VM
func (vc *VMController) Release() error {
	return vc.Action("release")
}

// Stop action on the VM
func (vc *VMController) Stop() error {
	return vc.Action("stop")
}

// Suspend action on the VM
func (vc *VMController) Suspend() error {
	return vc.Action("suspend")
}

// Resume action on the VM
func (vc *VMController) Resume() error {
	return vc.Action("resume")
}

// Resched action on the VM
func (vc *VMController) Resched() error {
	return vc.Action("resched")
}

// Unresched action on the VM
func (vc *VMController) Unresched() error {
	return vc.Action("unresched")
}

// End actions

// Recover recovers a stuck VM that is waiting for a driver operation
func (vc *VMController) Recover(op int) error {
	_, err := vc.c.Client.Call("one.vm.recover", vc.ID, op)
	return err
}

// RecoverSuccess forces a success
func (vc *VMController) RecoverSuccess() error {
	return vc.Recover(1)
}

// RecoverFailure forces a success
func (vc *VMController) RecoverFailure() error {
	return vc.Recover(0)
}

// RecoverRetry forces a success
func (vc *VMController) RecoverRetry() error {
	return vc.Recover(2)
}

// RecoverDelete forces a delete
func (vc *VMController) RecoverDelete() error {
	return vc.Recover(3)
}

// RecoverDeleteRecreate forces a delete
func (vc *VMController) RecoverDeleteRecreate() error {
	return vc.Recover(4)
}

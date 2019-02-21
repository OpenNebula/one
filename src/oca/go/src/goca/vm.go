package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

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
	CPU               float64               `xml:"CPU"`
	Memory            int                   `xml:"MEMORY"`
	NIC               []vmNic               `xml:"NIC"`
	NICAlias          []vmNicAlias          `xml:"NIC_ALIAS"`
	Context           *vmContext            `xml:"CONTEXT"`
	Disk              []vmDisk              `xml:"DISK"`
	Graphics          *vmGraphics           `xml:"GRAPHICS"`
	OS                *vmOS                 `xml:"OS"`
	Snapshot          []VMSnapshot          `xml:"SNAPSHOT"`
	SecurityGroupRule []vmSecurityGroupRule `xml:"SECURITY_GROUP_RULE"`
	Dynamic           unmatchedTagsSlice    `xml:",any"`
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
	ParentId string `xml:"PARENT_ID"` // minOccurs=1
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

func (st VMState) isValid() bool {
	if (st >= Init && st <= Done) ||
		(st >= Poweroff && st <= CloningFailure) {
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

func (st LCMState) isValid() bool {
	if (st >= LcmInit && st <= Shutdown) ||
		(st >= CleanupResubmit && st <= DiskSnapshot) ||
		(st >= DiskSnapshotDelete && st <= DiskResizeUndeployed) {
		return true
	}
	return false
}

func (l LCMState) String() string {
	switch l {
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

// NewVMPool returns a new image pool. It accepts the scope of the query.
func NewVMPool(args ...int) (*VMPool, error) {
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

	response, err := client.Call("one.vmpool.info", who, start, end, state)
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

// Monitoring returns all the virtual machine monitoring records
// filter flag:
// -4: Resources belonging to the user's primary group
// -3: Resources belonging to the user
// -2: All resources
// -1: Resources belonging to the user and any of his groups
// >= 0: UID User's Resources
func (vmpool *VMPool) Monitoring(filter int) error {
	_, err := client.Call("one.vmpool.monitoring", filter)
	return err
}

// Accounting returns the virtual machine history records
// filter flag:
//   -4: Resources belonging to the user's primary group
//   -3: Resources belonging to the user
//   -2: All resources
//   -1: Resources belonging to the user and any of his groups
//   >= 0: UID User's Resources
// if startTime and/or endTime are -1 it means no limit
func (vmpool *VMPool) Accounting(filter, startTime, endTime int) error {
	_, err := client.Call("one.vmpool.accounting", filter)
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
func (vmpool *VMPool) Showback(filter, firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := client.Call("one.vmpool.showback", filter, firstMonth, firstYear, lastMonth, lastYear)
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
func (vmpool *VMPool) CalculateShowback(firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := client.Call("one.vmpool.calculateshowback", firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// CreateVM allocates a new VM based on the template string provided. It
// returns the image ID
func CreateVM(template string, pending bool) (uint, error) {
	response, err := client.Call("one.vm.allocate", template, pending)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// NewVM finds an VM by ID returns a new VM object. At this stage no
// connection to OpenNebula is performed.
func NewVM(id uint) *VM {
	return &VM{ID: id}
}

// NewVMFromName finds the VM by name and returns a VM object. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the VM.
func NewVMFromName(name string) (*VM, error) {
	var id uint

	vmPool, err := NewVMPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(vmPool.VMs); i++ {
		if vmPool.VMs[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = vmPool.VMs[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewVM(id), nil
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
func (vm *VM) Action(action string) error {
	_, err := client.Call("one.vm.action", action, vm.ID)
	return err
}

// Info connects to OpenNebula and fetches the information of the VM
func (vm *VM) Info() error {
	response, err := client.Call("one.vm.info", vm.ID)
	if err != nil {
		return err
	}
	*vm = VM{}
	return xml.Unmarshal([]byte(response.Body()), vm)
}

// Update will modify the VM's template. If appendTemplate is 0, it will
// replace the whole template. If its 1, it will merge.
func (vm *VM) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.vm.update", vm.ID, tpl, appendTemplate)
	return err
}

// UpdateConf updates (appends) a set of supported configuration attributes in
// the VM template
func (vm *VM) UpdateConf(tpl string) error {
	_, err := client.Call("one.vm.updateconf", vm.ID, tpl)
	return err
}

// Monitoring Returns the virtual machine monitoring records
func (vm *VM) Monitoring() error {
	_, err := client.Call("one.vm.monitoring", vm.ID)
	return err
}

// Chown changes the owner/group of a VM. If uid or gid is -1 it will not
// change
func (vm *VM) Chown(uid, gid int) error {
	_, err := client.Call("one.vm.chown", vm.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a VM. If any perm is -1 it will not
// change
func (vm *VM) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.vm.chmod", vm.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of a VM
func (vm *VM) Rename(newName string) error {
	_, err := client.Call("one.vm.rename", vm.ID, newName)
	return err
}

// Delete will remove the VM from OpenNebula
func (vm *VM) Delete() error {
	_, err := client.Call("one.vm.delete", vm.ID)
	return err
}

// Deploy in the selected hostID and/or dsID. Enforce to return error in case of
// overcommitment. Enforce is automatically enabled for non-oneadmin users.
// Set dsID to -1 to let OpenNebula choose the datastore.
func (vm *VM) Deploy(hostID uint, enforce bool, dsID int) error {
	_, err := client.Call("one.vm.deploy", vm.ID, int(hostID), enforce, dsID)
	return err
}

// Resize changes the capacity of the virtual machine
func (vm *VM) Resize(template string, enforce bool) error {
	_, err := client.Call("one.vm.resize", vm.ID, template, enforce)
	return err
}

// DiskSaveas exports a disk to an image. If imageType is empty the default one
// will be used. If snapID is -1 the current image state will be exported
func (vm *VM) DiskSaveas(diskID int, imageName, imageType string, snapID int) error {
	_, err := client.Call("one.vm.disksaveas", vm.ID, diskID, imageName, imageType, snapID)
	return err
}

// DiskSnapshotCreate will create a snapshot of the disk image
func (vm *VM) DiskSnapshotCreate(diskID int, description string) error {
	_, err := client.Call("one.vm.disksnapshotcreate", vm.ID, diskID, description)
	return err
}

// DiskSnapshotDelete will delete a snapshot
func (vm *VM) DiskSnapshotDelete(diskID, snapID int) error {
	_, err := client.Call("one.vm.disksnapshotdelete", vm.ID, diskID, snapID)
	return err
}

// DiskSnapshotRevert will revert disk state to a previously taken snapshot
func (vm *VM) DiskSnapshotRevert(diskID, snapID int) error {
	_, err := client.Call("one.vm.disksnapshotrevert", vm.ID, diskID, snapID)
	return err
}

// SnapshotCreate creates a new virtual machine snapshot. name can be empty
func (vm *VM) SnapshotCreate(name string) error {
	_, err := client.Call("one.vm.snapshotcreate", vm.ID, name)
	return err
}

// SnapshotDelete deletes a virtual machine snapshot
func (vm *VM) SnapshotDelete(snapID int) error {
	_, err := client.Call("one.vm.snapshotdelete", vm.ID, snapID)
	return err
}

// SnapshotRevert reverts a virtual machine to a snapshot
func (vm *VM) SnapshotRevert(snapID int) error {
	_, err := client.Call("one.vm.snapshotrevert", vm.ID, snapID)
	return err
}

// DiskSnapshotRename renames a snapshot
func (vm *VM) DiskSnapshotRename(diskID, snapID int, newName string) error {
	_, err := client.Call("one.vm.disksnapshotrename", vm.ID, diskID, snapID, newName)
	return err
}

// Attach a new disk to the virtual machine. diskTemplate is a string containing
// a single DISK vector attribute. Syntax can be the usual attribute=value or
// XML
func (vm *VM) Attach(diskTemplate string) error {
	_, err := client.Call("one.vm.attach", vm.ID, diskTemplate)
	return err
}

// Detach a disk from a virtual machine
func (vm *VM) Detach(diskID int) error {
	_, err := client.Call("one.vm.detach", vm.ID, diskID)
	return err
}

// DiskResize a disk of a virtual machine
func (vm *VM) DiskResize(diskID int, size string) error {
	_, err := client.Call("one.vm.diskresize", vm.ID, diskID, size)
	return err
}

// Migrate a VM to a target host and/or to another ds
func (vm *VM) Migrate(hostID uint, live, enforce bool, dsID uint, migrationType int) error {
	_, err := client.Call("one.vm.migrate", int(hostID), live, enforce, int(dsID), migrationType)
	return err
}

// AttachNic attaches new network interface to the virtual machine
func (vm *VM) AttachNic(tpl string) error {
	_, err := client.Call("one.vm.attachnic", vm.ID, tpl)
	return err
}

// DetachNic detaches a network interface from the virtual machine
func (vm *VM) DetachNic(nicID string) error {
	_, err := client.Call("one.vm.detachnic", vm.ID, nicID)
	return err
}

// VM Actions

// TerminateHard action on the VM
func (vm *VM) TerminateHard() error {
	return vm.Action("terminate-hard")
}

// Terminate action on the VM
func (vm *VM) Terminate() error {
	return vm.Action("terminate")
}

// UndeployHard action on the VM
func (vm *VM) UndeployHard() error {
	return vm.Action("undeploy-hard")
}

// Undeploy action on the VM
func (vm *VM) Undeploy() error {
	return vm.Action("undeploy")
}

// PoweroffHard action on the VM
func (vm *VM) PoweroffHard() error {
	return vm.Action("poweroff-hard")
}

// Poweroff action on the VM
func (vm *VM) Poweroff() error {
	return vm.Action("poweroff")
}

// RebootHard action on the VM
func (vm *VM) RebootHard() error {
	return vm.Action("reboot-hard")
}

// Reboot action on the VM
func (vm *VM) Reboot() error {
	return vm.Action("reboot")
}

// Hold action on the VM
func (vm *VM) Hold() error {
	return vm.Action("hold")
}

// Release action on the VM
func (vm *VM) Release() error {
	return vm.Action("release")
}

// Stop action on the VM
func (vm *VM) Stop() error {
	return vm.Action("stop")
}

// Suspend action on the VM
func (vm *VM) Suspend() error {
	return vm.Action("suspend")
}

// Resume action on the VM
func (vm *VM) Resume() error {
	return vm.Action("resume")
}

// Resched action on the VM
func (vm *VM) Resched() error {
	return vm.Action("resched")
}

// Unresched action on the VM
func (vm *VM) Unresched() error {
	return vm.Action("unresched")
}

// End actions

// Recover recovers a stuck VM that is waiting for a driver operation
func (vm *VM) Recover(op int) error {
	_, err := client.Call("one.vm.recover", vm.ID, op)
	return err
}

// RecoverSuccess forces a success
func (vm *VM) RecoverSuccess() error {
	return vm.Recover(1)
}

// RecoverFailure forces a success
func (vm *VM) RecoverFailure() error {
	return vm.Recover(0)
}

// RecoverRetry forces a success
func (vm *VM) RecoverRetry() error {
	return vm.Recover(2)
}

// RecoverDelete forces a delete
func (vm *VM) RecoverDelete() error {
	return vm.Recover(3)
}

// RecoverDeleteRecreate forces a delete
func (vm *VM) RecoverDeleteRecreate() error {
	return vm.Recover(4)
}

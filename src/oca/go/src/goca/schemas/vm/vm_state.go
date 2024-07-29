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
/*--------------------------------------------------------------------------- */

package vm

import "fmt"

// State is the state of the Virtual Machine
type State int

const (
	// Init state
	Init State = 0

	// Pending state
	Pending State = 1

	// Hold state
	Hold State = 2

	// Active state
	Active State = 3

	// Stopped state
	Stopped State = 4

	// Suspended state
	Suspended State = 5

	// Done state
	Done State = 6

	// Deprecated
	// Failed State = 7

	// Poweroff state
	Poweroff State = 8

	// Undeployed state
	Undeployed State = 9

	// Cloning state
	Cloning State = 10

	// CloningFailure state
	CloningFailure State = 11
)

func (s State) isValid() bool {
	if (s >= Init && s <= Done) ||
		(s >= Poweroff && s <= CloningFailure) {
		return true
	}
	return false
}

func (s State) String() string {
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

	// HotplugNicPoweroff lcm state
	HotplugNicPoweroff LCMState = 65

	// HotplugResize lcm state
	HotplugResize LCMState = 66

	// HotplugSaveasUndeployed lcm state
	HotplugSaveasUndeployed LCMState = 67

	// HotplugSaveasStopped lcm state
	HotplugSaveasStopped LCMState = 68

	// Backup lcm state
	Backup LCMState = 69

	// BackupPoweroff lcm state
	BackupPoweroff LCMState = 70

	// PrologRestore lcm state
	Restore LCMState = 71
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
	case HotplugNicPoweroff:
		return "HOTPLUG_NIC_POWEROFF"
	case HotplugResize:
		return "HOTPLUG_RESIZE"
	case HotplugSaveasUndeployed:
		return "HOTPLUG_SAVEAS_UNDEPLOYED"
	case HotplugSaveasStopped:
		return "HOTPLUG_SAVEAS_STOPPED"
	case Backup:
		return "BACKUP"
	case BackupPoweroff:
		return "BACKUP_POWEROFF"
	case Restore:
		return "RESTORE"
	default:
		return ""
	}
}

// State returns the State and LCMState
func (vm *VM) State() (State, LCMState, error) {
	state := State(vm.StateRaw)
	if !state.isValid() {
		return -1, -1, fmt.Errorf("VM State: this state value is not currently handled: %d\n", vm.StateRaw)
	}
	lcmState := LCMState(vm.LCMStateRaw)
	if !lcmState.isValid() {
		return state, -1, fmt.Errorf("VM LCMState: this state value is not currently handled: %d\n", vm.LCMStateRaw)
	}
	return state, lcmState, nil
}

// StateString returns the State and LCMState as strings
func (vm *VM) StateString() (string, string, error) {
	state := State(vm.StateRaw)
	if !state.isValid() {
		return "", "", fmt.Errorf("VM State: this state value is not currently handled: %d\n", vm.StateRaw)
	}
	lcmState := LCMState(vm.LCMStateRaw)
	if !lcmState.isValid() {
		return state.String(), "", fmt.Errorf("VM LCMState: this state value is not currently handled: %d\n", vm.LCMStateRaw)
	}
	return state.String(), lcmState.String(), nil
}

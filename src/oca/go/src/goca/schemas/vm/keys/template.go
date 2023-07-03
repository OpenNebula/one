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
/*--------------------------------------------------------------------------- */
package keys

// Available template parts and keys are listed here: https://docs.opennebula.io/5.8/operation/references/template.html
// Some specific part are not defined: vCenter, Public Cloud, Hypervisor, User Inputs

// Template is a type used to enumerate VM generic keys
type Template string

const (
	Name        Template = "NAME"
	VRouter     Template = "VROUTER"
	Description Template = "DESCRIPTION"
)

// Capacity define keys for showback values
type Capacity string

const (
	CPU    Capacity = "CPU"
	Memory Capacity = "MEMORY"
	VCPU   Capacity = "VCPU"
)

// Showback define keys for showback values
type Showback string

const (
	MemCost  Showback = "MEMORY_COST"
	CPUCost  Showback = "CPU_COST"
	DiskCost Showback = "DISK_COST"
)

// OS define keys for OS and boot values of the VM
type OS string

const (
	OSVec string = "OS"

	Arch       OS = "ARCH"
	Machine    OS = "MACHINE"
	Kernel     OS = "KERNEL"
	KernelDS   OS = "KERNEL_DS"
	Initrd     OS = "INITRD"
	InitrdDS   OS = "INITRD_DS"
	Root       OS = "ROOT"
	KernelCmd  OS = "KERNEL_CMD"
	Bootloader OS = "BOOTLOADER"
	Boot       OS = "BOOT"
)

// CPUModel define keys for the VM CPU model
type CPUModel string

const (
	CPUModelVec string = "CPU_MODEL"

	Model CPUModel = "MODEL"
)

// Feature define keys for the VM features
type Feature string

const (
	FeaturesVec string = "FEATURES"

	PAE              Feature = "PAE"
	ACPI             Feature = "ACPI"
	APIC             Feature = "APIC"
	LocalTime        Feature = "LOCAL_TIME"
	HyperV           Feature = "HYPERV"
	GuestAgent       Feature = "GUEST_AGENT"
	VirtIOScsiQueues Feature = "VIRTIO_SCSI_QUEUES"
	IOThreads        Feature = "IOTHREADS"
)

// IOGraphics define keys for the VM IO graphics
type IOGraphics string

// IOGraphics define keys for the VM IO input
type IOInput string

const (
	//IOinput
	IOInputVec string = "INPUT"

	InputType IOInput = "TYPE" // Values: mouse or tablet
	Bus       IOInput = "BUS"  // Values: usb or ps2

	// IOGraphics
	IOGraphicsVec string = "GRAPHICS"

	GraphicType    IOGraphics = "TYPE" // Values: vnc, sdl, spice
	Listen         IOGraphics = "LISTEN"
	Port           IOGraphics = "PORT"
	Passwd         IOGraphics = "PASSWD"
	Keymap         IOGraphics = "KEYMAP"
	RandomPassword IOGraphics = "RANDOM_PASSWD"
)

// Context is here to help the user to keep track of XML tags defined in VM context
type Context string

// ContextB64 is the same that Context with base64 encoded values
type ContextB64 string

const (
	ContextVec string = "CONTEXT"

	DNS          Context = "DNS"
	DNSHostName  Context = "DNS_HOSTNAME"
	EC2PubKey    Context = "EC2_PUBLIC_KEY"
	Files        Context = "FILES"
	FilesDS      Context = "FILES_DS"
	GatewayIface Context = "GATEWAY_IFACE"
	NetworkCtx   Context = "NETWORK"
	InitScripts  Context = "INIT_SCRIPTS"
	SSHPubKey    Context = "SSH_PUBLIC_KEY"
	TargetCtx    Context = "TARGET"
	Token        Context = "TOKEN"
	Username     Context = "USERNAME"
	Variable     Context = "VARIABLE"
	SecureTTY    Context = "SECURETTY"
	SetHostname  Context = "SET_HOSTNAME"

	// Base64 values
	PasswordB64    ContextB64 = "PASSWORD_BASE64"
	StartScriptB64 ContextB64 = "START_SCRIPT_BASE64"
	CryptedPassB64 ContextB64 = "CRYPTED_PASSWORD_BASE64"
)

// Placement define keys for VM placement
type Placement string

const (
	SchedRequirements   Placement = "SCHED_REQUIREMENTS"
	SchedRank           Placement = "SCHED_RANK"
	SchedDSRequirements Placement = "SCHED_DS_REQUIREMENTS"
	SchedDSRank         Placement = "SCHED_DS_RANK"
	UserPriority        Placement = "USER_PRIORITY"
)

// SchedAction define keys for scheduled action
type SchedAction string

const (
	SchedActionVec string = "SCHED_ACTION"

	Time     SchedAction = "TIME"
	Repeat   SchedAction = "REPEAT"
	Days     SchedAction = "DAYS"
	Action   SchedAction = "ACTION"
	EndType  SchedAction = "END_TYPE"
	EndValue SchedAction = "END_VALUE"
	ActionID SchedAction = "ID"
	ParentID SchedAction = "PARENT_ID"
)

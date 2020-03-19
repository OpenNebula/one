package opennebula

import (
	"errors"
	"fmt"
	"io/ioutil"
	"strconv"
	"time"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
	vm_schemas "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	shared_schemas "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"

	"github.com/docker/machine/libmachine/drivers"
	"github.com/docker/machine/libmachine/log"
	"github.com/docker/machine/libmachine/mcnflag"
	"github.com/docker/machine/libmachine/ssh"
	"github.com/docker/machine/libmachine/state"
)

type Driver struct {
	*drivers.BaseDriver
	TemplateName   string
	TemplateID     string
	NetworkName    string
	NetworkOwner   string
	NetworkID      string
	ImageName      string
	ImageOwner     string
	ImageID        string
	CPU            string
	VCPU           string
	Memory         string
	DiskSize       string
	ImageDevPrefix string
	B2DSize        string
	User           string
	Password       string
	Xmlrpcurl      string
	Config         goca.OneConfig
	DisableVNC     bool
	StartRetries   string
	MachineId      int
}

const (
	defaultTimeout      = 1 * time.Second
	defaultSSHUser      = "docker"
	defaultCPU          = "1"
	defaultVCPU         = "1"
	defaultMemory       = "1024"
	defaultStartRetries = "600"
	// This is the contextualization script that will be executed by OpenNebula
	contextScript = `#!/bin/sh

if [ -f /etc/boot2docker ]; then
	USERNAME=docker
	USER_HOME=/home/docker
else
	USERNAME=$DOCKER_SSH_USER
	GROUPNAME=$DOCKER_SSH_USER

	if ! getent group $GROUPNAME; then
		groupadd $GROUPNAME
	fi

	if ! getent passwd $USERNAME; then
		USER_HOME=/var/lib/$DOCKER_SSH_USER
		useradd -m -d $USER_HOME -g $USERNAME $GROUPNAME
	else
		USER_HOME=$(getent passwd $USERNAME | cut -d: -f 6)
	fi

	# Write sudoers
	if [ ! -f /etc/sudoers.d/$USERNAME ]; then
		echo -n "Defaults:$USERNAME " >> /etc/sudoers.d/$USERNAME
		echo '!requiretty' >> /etc/sudoers.d/$USERNAME
		echo "$USERNAME ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers.d/$USERNAME
	fi
fi

# Add DOCKER_SSH_PUBLIC_KEY

AUTH_DIR="${USER_HOME}/.ssh"
AUTH_FILE="${AUTH_DIR}/authorized_keys"

mkdir -m0700 -p $AUTH_DIR

echo "$DOCKER_SSH_PUBLIC_KEY" >> $AUTH_FILE

chown "${USERNAME}": ${AUTH_DIR} ${AUTH_FILE}
chmod 600 $AUTH_FILE`
)

func NewDriver(hostName, storePath string) *Driver {
	return &Driver{
		BaseDriver: &drivers.BaseDriver{
			SSHUser:     defaultSSHUser,
			MachineName: hostName,
			StorePath:   storePath,
		},
	}
}

func (d *Driver) buildConfig() {
	d.Config = goca.NewConfig(d.User, d.Password, d.Xmlrpcurl)
}

func (d *Driver) getController() *goca.Controller {
	d.buildConfig()
	client := goca.NewDefaultClient(d.Config)

	return goca.NewController(client)
}

// GetCreateFlags registers the flags this driver adds to
// "docker hosts create"
func (d *Driver) GetCreateFlags() []mcnflag.Flag {
	return []mcnflag.Flag{
		mcnflag.StringFlag{
			Name:   "opennebula-cpu",
			Usage:  fmt.Sprintf("CPU value for the VM. Default: %d", defaultCPU),
			EnvVar: "ONE_CPU",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-vcpu",
			Usage:  fmt.Sprintf("VCPUs for the VM. Default: %d", defaultVCPU),
			EnvVar: "ONE_VCPU",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-memory",
			Usage:  fmt.Sprintf("Size of memory for VM in MB. Default: %d", defaultMemory),
			EnvVar: "ONE_MEMORY",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-template-name",
			Usage:  "Template to use",
			EnvVar: "ONE_TEMPLATE_NAME",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-template-id",
			Usage:  "Template ID to use",
			EnvVar: "ONE_TEMPLATE_ID",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-network-name",
			Usage:  "Network to connect the machine to",
			EnvVar: "ONE_NETWORK_NAME",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-network-id",
			Usage:  "Network ID to connect the machine to",
			EnvVar: "ONE_NETWORK_ID",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-network-owner",
			Usage:  "User ID of the Network to connect the machine to",
			EnvVar: "ONE_NETWORK_OWNER",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-image-name",
			Usage:  "Image to use as the OS",
			EnvVar: "ONE_IMAGE_NAME",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-image-id",
			Usage:  "Image ID to use as the OS",
			EnvVar: "ONE_IMAGE_ID",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-image-owner",
			Usage:  "Owner of the image to use as the OS",
			EnvVar: "ONE_IMAGE_OWNER",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-dev-prefix",
			Usage:  "Dev prefix to use for the images: 'vd', 'sd', 'hd', etc..",
			EnvVar: "ONE_IMAGE_DEV_PREFIX",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-disk-resize",
			Usage:  "Size of disk for VM in MB",
			EnvVar: "ONE_DISK_SIZE",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-b2d-size",
			Usage:  "Size of the Volatile disk in MB (only for b2d)",
			EnvVar: "ONE_B2D_DATA_SIZE",
			Value:  "",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-ssh-user",
			Usage:  "Set the name of the SSH user",
			EnvVar: "ONE_SSH_USER",
			Value:  defaultSSHUser,
		},
		mcnflag.BoolFlag{
			Name:   "opennebula-disable-vnc",
			Usage:  "VNC is enabled by default. Disable it with this flag",
			EnvVar: "ONE_DISABLE_VNC",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-user",
			Usage:  "Set the user for authentication",
			EnvVar: "ONE_USER",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-password",
			Usage:  "Set the password for authentication",
			EnvVar: "ONE_PASSWORD",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-xmlrpcurl",
			Usage:  "Set the url for one xmlrpc server",
			EnvVar: "ONE_XMLRPC",
		},
		mcnflag.StringFlag{
			Name:   "opennebula-start-retries",
			Usage:  "Set the number of retries until de vm is running",
			EnvVar: "ONE_START_RETRIES",
			Value:  defaultStartRetries,
		},
	}
}

func (d *Driver) SetConfigFromFlags(flags drivers.DriverOptions) error {
	d.SetSwarmConfigFromFlags(flags)

	// Authentication
	d.User = flags.String("opennebula-user")
	d.Password = flags.String("opennebula-password")
	d.Xmlrpcurl = flags.String("opennebula-xmlrpcurl")

	// Capacity
	d.CPU = flags.String("opennebula-cpu")
	d.VCPU = flags.String("opennebula-vcpu")
	d.Memory = flags.String("opennebula-memory")

	// Template
	d.TemplateName = flags.String("opennebula-template-name")
	d.TemplateID = flags.String("opennebula-template-id")

	// Network
	d.NetworkName = flags.String("opennebula-network-name")
	d.NetworkID = flags.String("opennebula-network-id")
	d.NetworkOwner = flags.String("opennebula-network-owner")

	// Storage
	d.ImageID = flags.String("opennebula-image-id")
	d.ImageName = flags.String("opennebula-image-name")
	d.ImageOwner = flags.String("opennebula-image-owner")

	d.ImageDevPrefix = flags.String("opennebula-dev-prefix")
	d.DiskSize = flags.String("opennebula-disk-resize")
	d.B2DSize = flags.String("opennebula-b2d-size")

	// Provision
	d.SSHUser = flags.String("opennebula-ssh-user")

	// VNC
	d.DisableVNC = flags.Bool("opennebula-disable-vnc")

	// CONFIG
	d.StartRetries = flags.String("opennebula-start-retries")

	// Either TemplateName or TemplateID
	if d.TemplateName != "" && d.TemplateID != "" {
		return errors.New("specify only one of: --opennebula-template-name or --opennebula-template-id, not both")
	}

	// Either NetworkName or NetworkID
	if d.NetworkName != "" && d.NetworkID != "" {
		return errors.New("specify only one of: --opennebula-network-name or --opennebula-network-id, not both")
	}

	// Either ImageName or ImageID
	if d.ImageName != "" && d.ImageID != "" {
		return errors.New("specify only one of: --opennebula-image-name or --opennebula-image-id, not both")
	}

	// Required and incompatible options for Template
	if d.TemplateName != "" || d.TemplateID != "" {
		// Template has been specified:

		// ImageName and ImageID are incompatible
		if d.ImageName != "" || d.ImageID != "" {
			return errors.New("options --opennebula-image-* are incompatible with --opennebula-template-*")
		}

		// ImageDevPrefix is incompatible
		if d.ImageDevPrefix != "" {
			return errors.New("option: --opennebula-dev-prefix is incompatible with --opennebula-template-*")
		}
		// DiskSize is incompatible
		if d.DiskSize != "" {
			return errors.New("option: --opennebula-disk-resize is incompatible with --opennebula-template-*")
		}
		// B2DSize is incompatible
		if d.B2DSize != "" {
			return errors.New("option: --opennebula-disk-resize is incompatible with --opennebula-template-*")
		}
		// DisableVNC is incompatible
		if d.DisableVNC {
			return errors.New("option: --opennebula-disable-vnc is incompatible with --opennebula-template-*")
		}
	} else {
		//Template has NOT been specified:

		// ImageName or ImageID is required
		if d.ImageName == "" && d.ImageID == "" {
			return errors.New("specify a image to use as the OS with --opennebula-image-name or --opennebula-image-id")
		}

		// NetworkName or NetworkID is required
		if d.NetworkName == "" && d.NetworkID == "" {
			return errors.New("specify a network to connect to with --opennebula-network-name or --opennebula-network-id")
		}

		// Assign default capacity values
		if d.CPU == "" {
			d.CPU = defaultCPU
		}

		if d.VCPU == "" {
			d.VCPU = defaultVCPU
		}

		if d.Memory == "" {
			d.Memory = defaultMemory
		}
	}

	return nil
}

func (d *Driver) DriverName() string {
	return "opennebula"
}

func (d *Driver) GetSSHHostname() (string, error) {
	return d.GetIP()
}

func (d *Driver) GetSSHUsername() string {
	return d.SSHUser
}

func (d *Driver) PreCreateCheck() error {
	return nil
}

func (d *Driver) Create() error {
	var err error

	var instanceID = -1

	// build config and set the xmlrpc client
	controller := d.getController()

	log.Infof("Creating SSH key..")
	if err := ssh.GenerateSSHKey(d.GetSSHKeyPath()); err != nil {
		return err
	}

	pubKey, err := ioutil.ReadFile(d.publicSSHKeyPath())
	if err != nil {
		return err
	}

	// Create template
	template := vm_schemas.NewTemplate()

	if d.TemplateName != "" || d.TemplateID != "" {
		// Template has been specified
	} else {
		// Template has NOT been specified
		template.Add(keys.Name, d.MachineName)

		// OS Boot
		template.AddOS(keys.Boot, "disk0")

		// OS Disk
		disk := template.AddDisk()

		if d.ImageID != "" {
			disk.Add(shared.ImageID, d.ImageID)
		} else {
			disk.Add(shared.Image, d.ImageName)
			if d.ImageOwner != "" {
				disk.Add(shared.ImageUname, d.ImageOwner)
			}
		}

		if d.DiskSize != "" {
			disk.Add(shared.Size, d.DiskSize)
		}

		if d.ImageDevPrefix != "" {
			disk.Add(shared.DevPrefix, d.ImageDevPrefix)
		}

		// Add a volatile disk for b2d
		if d.B2DSize != "" {
			vdisk := template.AddDisk()
			vdisk.Add(shared.Size, d.B2DSize)
			vdisk.Add("TYPE", "fs")
			vdisk.Add("FORMAT", "raw")
		}

		// VNC
		if !d.DisableVNC {
			template.AddIOGraphic(keys.Listen, "0.0.0.0")
			template.AddIOGraphic(keys.GraphicType, "vnc")
		}
	}

	// Capacity
	if d.CPU != "" {
		cpu, _ := strconv.ParseFloat(d.CPU, 64)
		template.CPU(cpu)
	}

	if d.Memory != "" {
		memory, _ := strconv.Atoi(d.Memory)
		template.Memory(memory)
	}

	if d.VCPU != "" {
		vcpu, _ := strconv.Atoi(d.VCPU)
		template.VCPU(vcpu)
	}

	// Network
	if d.NetworkName != "" || d.NetworkID != "" {
		nic := template.AddNIC()

		if d.NetworkName != "" {
			nic.Add(shared.Network, d.NetworkName)
			if d.NetworkOwner != "" {
				nic.Add(shared.NetworkUName, d.NetworkOwner)
			}
		}

		if d.NetworkID != "" {
			nic.Add(shared.NetworkID, d.NetworkID)
		}
	}

	// Context
	template.AddCtx(keys.NetworkCtx, "YES")
	template.AddCtx(keys.SSHPubKey, "$USER[SSH_PUBLIC_KEY]")
	template.AddCtx("DOCKER_SSH_USER", d.SSHUser)
	template.AddCtx("DOCKER_SSH_PUBLIC_KEY", string(pubKey))
	template.AddB64Ctx(keys.StartScriptB64, contextScript)

	// Instantiate
	log.Infof("Starting	 VM..")

	// Template has been specified
	if d.TemplateName != "" || d.TemplateID != "" {
		var templateID int

		if d.TemplateName != "" {
			templateID, err = controller.Templates().ByName(d.TemplateName)
			if err != nil {
				return err
			}
		} else {
			templateID, err = strconv.Atoi(d.TemplateID)
			if err != nil {
				return err
			}
		}

		vmtemplate := controller.Template(templateID)

		instanceID, err = vmtemplate.Instantiate(d.MachineName, false, template.String(), false)

	} else {
		instanceID, err = controller.VMs().Create(template.String(), false)
	}

	if err != nil {
		return err
	}

	d.MachineId = instanceID

	if d.IPAddress, err = d.GetIP(); err != nil {
		return err
	}

	return d.Start()
}

func (d *Driver) GetURL() (string, error) {
	ip, err := d.GetIP()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("tcp://%s:2376", ip), nil
}

func (d *Driver) GetIP() (string, error) {
	controller := d.getController()

	vm, err := controller.VM(d.MachineId).Info(false)
	if err != nil {
		return "", err
	}

	if len(vm.Template.GetNICs()) > 0 {
		ip, err := vm.Template.GetNICs()[0].Get(shared_schemas.IP)

		if err == nil && ip != "" {
			d.IPAddress = ip
		}
	}

	if d.IPAddress == "" {
		return "", fmt.Errorf("IP address is not set")
	}

	return d.IPAddress, nil
}

func (d *Driver) GetState() (state.State, error) {
	controller := d.getController()

	vm, err := controller.VM(d.MachineId).Info(false)
	if err != nil {
		return state.None, err
	}

	vmState, lcmState, err := vm.StateString()
	if err != nil {
		return state.None, err
	}

	switch vmState {
	case "INIT", "PENDING", "HOLD", "CLONING":
		return state.Starting, nil
	case "ACTIVE":
		switch lcmState {
		case "RUNNING",

			// migration is considered running
			"MIGRATE",
			"SAVE_MIGRATE",
			"PROLOG_MIGRATE",
			"BOOT_MIGRATE",

			// recover --recreate is also considered running
			"CLEANUP_RESUBMIT",

			// operation on the VMs
			"HOTPLUG",
			"HOTPLUG_SNAPSHOT",
			"HOTPLUG_NIC",
			"HOTPLUG_SAVEAS",
			"DISK_SNAPSHOT",
			"DISK_SNAPSHOT_DELETE":

			return state.Running, nil

		case "LCM_INIT",
			"PROLOG",
			"BOOT",
			"PROLOG_RESUME",
			"BOOT_UNKNOWN",
			"BOOT_POWEROFF",
			"BOOT_SUSPENDED",
			"BOOT_STOPPED",
			"PROLOG_UNDEPLOY",
			"BOOT_UNDEPLOY",
			"PROLOG_MIGRATE_UNKNOWN":

			return state.Starting, nil

		case "HOTPLUG_SAVEAS_POWEROFF",
			"HOTPLUG_SAVEAS_SUSPENDED",
			"HOTPLUG_PROLOG_POWEROFF",
			"HOTPLUG_EPILOG_POWEROFF",
			"PROLOG_MIGRATE_POWEROFF",
			"PROLOG_MIGRATE_SUSPEND",
			"DISK_SNAPSHOT_POWEROFF",
			"DISK_SNAPSHOT_REVERT_POWEROFF",
			"DISK_SNAPSHOT_DELETE_POWEROFF",
			"DISK_SNAPSHOT_SUSPENDED",
			"DISK_SNAPSHOT_REVERT_SUSPENDED",
			"DISK_SNAPSHOT_DELETE_SUSPENDED":

			return state.Stopped, nil

		case "SAVE_SUSPEND",
			"SAVE_STOP",
			"EPILOG_STOP",
			"EPILOG",
			"SHUTDOWN",
			"SHUTDOWN_POWEROFF",
			"SHUTDOWN_UNDEPLOY",
			"EPILOG_UNDEPLOY":
			return state.Stopping, nil

		case "UNKNOWN",
			"CLEANUP_DELETE",
			"BOOT_FAILURE",
			"BOOT_MIGRATE_FAILURE",
			"PROLOG_MIGRATE_FAILURE",
			"PROLOG_FAILURE",
			"EPILOG_FAILURE",
			"EPILOG_STOP_FAILURE",
			"EPILOG_UNDEPLOY_FAILURE",
			"PROLOG_MIGRATE_POWEROFF_FAILURE",
			"PROLOG_MIGRATE_SUSPEND_FAILURE",
			"BOOT_UNDEPLOY_FAILURE",
			"BOOT_STOPPED_FAILURE",
			"PROLOG_RESUME_FAILURE",
			"PROLOG_UNDEPLOY_FAILURE",
			"PROLOG_MIGRATE_UNKNOWN_FAILURE":

			return state.Error, nil

		}

	case "POWEROFF", "UNDEPLOYED":
		return state.Stopped, nil
	case "STOPPED", "SUSPENDED":
		return state.Saved, nil
	case "DONE", "FAILED", "CLONING_FAILURE":
		return state.Error, nil
	}

	return state.Error, nil
}

func (d *Driver) Start() error {
	controller := d.getController()

	var err error

	vm := controller.VM(d.MachineId)
	vm.Resume()

	s := state.None
	retries, _ := strconv.Atoi(d.StartRetries)
	for retry := 0; retry < retries && s != state.Running; retry++ {
		s, err = d.GetState()
		if err != nil {
			return err
		}

		switch s {
		case state.Error:
			return errors.New("VM in error state")
		default:
			time.Sleep(2 * time.Second)
		}
	}

	if d.IPAddress == "" {
		if d.IPAddress, err = d.GetIP(); err != nil {
			return err
		}
	}

	log.Infof("Waiting for SSH..")

	// Wait for SSH over NAT to be available before returning to user
	return drivers.WaitForSSH(d)
}

func (d *Driver) Stop() error {
	controller := d.getController()

	vm := controller.VM(d.MachineId)
	err := vm.Poweroff()
	if err != nil {
		return err
	}

	return nil
}

func (d *Driver) Remove() error {
	controller := d.getController()

	vm := controller.VM(d.MachineId)
	err := vm.TerminateHard()
	if err != nil {
		return err
	}

	return nil
}

func (d *Driver) Restart() error {
	controller := d.getController()

	vm := controller.VM(d.MachineId)
	err := vm.Reboot()
	if err != nil {
		return err
	}

	return nil
}

func (d *Driver) Kill() error {
	controller := d.getController()

	vm := controller.VM(d.MachineId)
	err := vm.PoweroffHard()
	if err != nil {
		return err
	}

	return nil
}

func (d *Driver) publicSSHKeyPath() string {
	return d.GetSSHKeyPath() + ".pub"
}

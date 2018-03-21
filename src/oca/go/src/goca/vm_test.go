package goca

import (
	"testing"

	. "gopkg.in/check.v1"
)

// Hook up gocheck into the "go test" runner.
func Test(t *testing.T) { TestingT(t) }

type VMSuite struct {
	templateID uint
	vmID       uint
}

var _ = Suite(&VMSuite{})

func (s *VMSuite) SetUpSuite(c *C) {
	// Create template
	tpl := NewTemplateBuilder()

	tpl.AddValue("NAME", GenName("VMSuite-template"))
	tpl.AddValue("CPU", 1)
	tpl.AddValue("MEMORY", "64")

	templateID, err := CreateTemplate(tpl.String())
	c.Assert(err, IsNil)

	s.templateID = templateID
}

func (s *VMSuite) SetUpTest(c *C) {
	template := NewTemplate(s.templateID)

	vmID, err := template.Instantiate("", true, "")
	c.Assert(err, IsNil)
	s.vmID = vmID
}

func (s *VMSuite) TearDownTest(c *C) {
	vm := NewVM(s.vmID)

	err := vm.TerminateHard()
	if err != nil {
		err = vm.RecoverDelete()
	}
	c.Assert(err, IsNil)
}

func (s *VMSuite) TearDownSuite(c *C) {
	template := NewTemplate(s.templateID)
	template.Delete()
}

////////////////////////////////////////////////////////////////////////////////

func VMExpectState(c *C, vm *VM, state, lcmState string) func() bool {
	return func() bool {
		vm.Info()

		s, l, err := vm.StateString()
		if err != nil {
			return false
		}

		if lcmState != "" && l == lcmState {
			return true
		}

		if state != "" && s == state {
			return true
		}

		c.Logf("VM: %d. Expecting: %s/%s, Got: %s/%s", vm.ID, state, lcmState, s, l)

		return false
	}
}

////////////////////////////////////////////////////////////////////////////////

func (s *VMSuite) TestVMDeploy(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestVMHoldRelease(c *C) {
	vm := NewVM(s.vmID)
	c.Assert(WaitResource(VMExpectState(c, vm, "HOLD", "")), Equals, true)

	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "PENDING", "")), Equals, true)
}

func (s *VMSuite) TestVMUpdate(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Update("A=B", 1)
	c.Assert(err, IsNil)

	err = vm.Info()
	c.Assert(err, IsNil)

	val, ok := vm.XPath("/VM/USER_TEMPLATE/A")
	c.Assert(ok, Equals, true)
	c.Assert(val, Equals, "B")
}

// TODO: Hosts
// func (s *VMSuite) TestVMMigrate(c *C) {
// }
// func (s *VMSuite) TestVMLiveMigrate(c *C) {
// }

func (s *VMSuite) TestVMTerminate(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Terminate()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestVMTerminateHard(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	vm.TerminateHard()
	c.Assert(WaitResource(VMExpectState(c, vm, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestVMStop(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Stop()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "STOPPED", "")), Equals, true)
}

func (s *VMSuite) TestVMSuspend(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Suspend()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "SUSPENDED", "")), Equals, true)
}

func (s *VMSuite) TestVMResume(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Suspend()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "SUSPENDED", "")), Equals, true)

	err = vm.Resume()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestVMResize(c *C) {
	vm := NewVM(s.vmID)
	err := vm.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "POWEROFF", "")), Equals, true)

	err = vm.Resize("CPU=2.5\nMEMORY=512", false)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "POWEROFF", "")), Equals, true)

	err = vm.Resume()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, vm, "ACTIVE", "RUNNING")), Equals, true)

	err = vm.Info()
	c.Assert(err, IsNil)

	cpu, ok := vm.XPath("/VM/TEMPLATE/CPU")
	c.Assert(ok, Equals, true)
	c.Assert(cpu, Equals, "2.5")

	memory, ok := vm.XPath("/VM/TEMPLATE/MEMORY")
	c.Assert(ok, Equals, true)
	c.Assert(memory, Equals, "512")
}

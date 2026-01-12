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
	"fmt"
	"testing"

	hk "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
)

// Helper to create a Hook
func createHook(t *testing.T) (*hk.Hook, int) {

	tpl := hk.NewTemplate()
	tpl.Add(keys.Name, "hook-goca")
	tpl.Add(keys.Type, "api")
	tpl.Add(keys.Command, "/usr/bin/ls -l")
	tpl.AddPair("CALL", "one.zone.raftstatus")

	id, err := testCtrl.Hooks().Create(tpl.String())
	if err != nil {
		t.Fatal(err)
	}

	// Get Hook by ID
	hook, err := testCtrl.Hook(id).Info(false)
	if err != nil {
		t.Error(err)
	}

	return hook, id
}

func TestHook(t *testing.T) {
	var err error

	hook, idOrig := createHook(t)

	idParse := hook.ID
	if idParse != idOrig {
		t.Errorf("Hook ID does not match")
	}

	// Get hook by Name
	name := hook.Name

	id, err := testCtrl.Hooks().ByName(name)
	if err != nil {
		t.Fatal(err)
	}

	hookC := testCtrl.Hook(id)
	hook, err = hookC.Info(false)
	if err != nil {
		t.Error(err)
	}

	idParse = hook.ID
	if idParse != idOrig {
		t.Errorf("Hook ID does not match")
	}

	// Check execution records
	currentExecs := len(hook.Log.ExecutionRecords)

	// Trigger the hook
	checkLogExecution := func() error {
		testCtrl.Zones().ServerRaftStatus()

		hook, err = hookC.Info(false)
		if len(hook.Log.ExecutionRecords) <= currentExecs {
			return fmt.Errorf("Hook have not been triggered")
		}
		return nil
	}

	err = retryWithExponentialBackoff(checkLogExecution, 1000, 5, 2000, 3000)
	if err != nil {
		t.Errorf("Hook have not been triggered: %s", err)

		return
	}

	// Check retry functionality
	currentExecs = len(hook.Log.ExecutionRecords)

	hookC.Retry(hook.Log.ExecutionRecords[0].ExecId)

	err = retryWithExponentialBackoff(checkLogExecution, 1000, 5, 2000, 3000)
	if err != nil {
		t.Errorf("Hook execution has not been retried: %s", err)
	}

	// Check if any of the new executions is a retry
	isRetry := false
	for _, exec := range hook.Log.ExecutionRecords {
		if exec.Retry == "yes" {
			isRetry = true
			break
		}
	}
	if !isRetry {
		t.Errorf("Hook execution has not been retried")
	}

	// Update
	err = hookC.Update("CALL=one.host.allocate", parameters.Merge)
	if err != nil {
		t.Errorf("Hook update failed: %s", err)
	}

	hook, err = hookC.Info(false)
	call, _ := hook.Template.GetStr("CALL")
	if call != "one.host.allocate" {
		t.Errorf("Hook update failed")
	}

	// Rename
	err = hookC.Rename("hook-host-allocate")
	if err != nil {
		t.Errorf("Hook rename failed: %s", err)
	}

	hook, err = hookC.Info(false)
	if hook.Name != "hook-host-allocate" {
		t.Errorf("Hook rename failed")
	}

	// Lock
	err = hookC.Lock(shared.LockUse)
	if err != nil {
		t.Errorf("Hook lock failed: %s", err)
	}

	err = hookC.Unlock()
	if err != nil {
		t.Errorf("Hook unlock failed: %s", err)
	}

	// Check hook log
	logC := testCtrl.HookLog()
	log, err := logC.Info(-1,-1, -1, 0)
	if err != nil {
		t.Errorf("Hook lock failed: %s", err)
	} else if len(log.ExecutionRecords) == 0 {
		t.Errorf("Hook log empty")
	}

	// Delete hook
	err = hookC.Delete()
	if err != nil {
		t.Error(err)
	}
}

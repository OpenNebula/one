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
	"time"

	hk "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook/keys"
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

	time.Sleep(time.Second)

	//triger the hook
	testCtrl.Zones().ServerRaftStatus()

	checkLogExecution := func() error {
		hook, err = hookC.Info(false)
		if len(hook.Log.ExecutionRecords) <= currentExecs {
			return fmt.Errorf("Hook have not been triggered")
		}
		return nil
	}

	err = retryWithExponentialBackoff(checkLogExecution, 1000, 5, 2000, 3000)
	if err != nil {
		t.Errorf("Hook have not been triggered: %s", err)
	}

	// Check retry functionality
	currentExecs = len(hook.Log.ExecutionRecords)

	hookC.Retry(hook.Log.ExecutionRecords[0].ExecId)

	err = retryWithExponentialBackoff(checkLogExecution, 1000, 5, 2000, 3000)
	if err != nil {
		t.Errorf("Hook execution has not been retried: %s", err)
	}

	if hook.Log.ExecutionRecords[len(hook.Log.ExecutionRecords)-1].Retry != "yes" {
		t.Errorf("Hook execution has not been retried")
	}

	// Delete hook
	err = hookC.Delete()
	if err != nil {
		t.Error(err)
	}
}

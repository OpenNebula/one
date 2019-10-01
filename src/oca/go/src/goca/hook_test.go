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
	"testing"
	"time"

	hk "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook"
)

var call = "one.zone.info"

var HkTpl = `
NAME = hook-goca
TYPE = api
COMMAND = "/usr/bin/ls -l"
CALL = "` + call + `"
`

// Helper to create a Hook Network
func createHook(t *testing.T) (*hk.Hook, int) {
	id, err := testCtrl.Hooks().Create(HkTpl)
	if err != nil {
		t.Fatal(err)
	}

	// Get Hook Network by ID
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

	//triger the hook
	testCtrl.Zone(0).Info(false)

	time.Sleep(2 * time.Second)

	hook, err = hookC.Info(false)

	if (len(hook.Log.ExecutionRecords) <= currentExecs) {
		t.Errorf("Hook have not been triggered")
	}

	// Check retry functionality
	currentExecs = len(hook.Log.ExecutionRecords)

	hookC.Retry(hook.Log.ExecutionRecords[0].ExecId)

	time.Sleep(2 * time.Second)

	hook, err = hookC.Info(false)

	if (len(hook.Log.ExecutionRecords) <= currentExecs) {
		t.Errorf("Hook execution have not been retried")
	}

	if (hook.Log.ExecutionRecords[len(hook.Log.ExecutionRecords) -1].Retry != "yes") {
		t.Errorf("Hook execution have not been retried")
	}

	// Delete template
	err = hookC.Delete()
	if err != nil {
		t.Error(err)
	}
}

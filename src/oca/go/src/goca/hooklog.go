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

package goca

import (
	"context"
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook"
)

// HookLogController is a controller for retrieve hook execution log information
type HookLogController entitiesController

// HookLog returns a Hook log.
func (c *Controller) HookLog() *HookLogController {
	return &HookLogController{c}
}

// Info retrieves information for the hook from ID
// * minTs: Min timestamp to filter for.
// * maxTs: Max timestamp to filter for
// * hookId: Hook ID to filer for.
// * rc: return code of the hook execution to filer for. (-1 error, 0 all, 1 success)
func (hc *HookLogController) Info(minTs, maxTs, hookId, hook_rc int) (*hook.HookLog, error) {
	return hc.InfoContext(context.Background(), minTs, maxTs, hookId, hook_rc)
}

// InfoContext retrieves information for the hook from ID
// * ctx: context for cancelation
// * minTs: Min timestamp to filter for.
// * maxTs: Max timestamp to filter for
// * hookId: Hook ID to filer for.
// * rc: return code of the hook execution to filer for. (-1 error, 0 all, 1 success)
func (hc *HookLogController) InfoContext(ctx context.Context, minTs, maxTs, hookId, hook_rc int) (*hook.HookLog, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.hooklog.info", minTs, maxTs, hookId, hook_rc)
	if err != nil {
		return nil, err
	}

	hookLog := &hook.HookLog{}
	err = xml.Unmarshal([]byte(response.Body()), hookLog)
	if err != nil {
		return nil, err
	}

	return hookLog, nil
}

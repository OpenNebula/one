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

package goca

import (
	"context"
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/hook"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// HooksController is a controller for create a hook or a pool of hooks
type HooksController entitiesController

// HookController is a controller for hook entities
type HookController entityController

// Hooks returns a Hooks controller.
func (c *Controller) Hooks() *HooksController {
	return &HooksController{c}
}

// Hook return an hook controller with an ID.
func (c *Controller) Hook(id int) *HookController {
	return &HookController{c, id}
}

// ByName finds a Hook ID from name
func (c *HooksController) ByName(name string) (int, error) {
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext finds a Hook ID from name
func (c *HooksController) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	hookPool, err := c.InfoContext(ctx)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(hookPool.Hooks); i++ {
		if hookPool.Hooks[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = hookPool.Hooks[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}
	return id, nil
}

// Info returns a hook pool. A connection to OpenNebula is
// performed
func (hc *HooksController) Info(args ...int) (*hook.Pool, error) {
	return hc.InfoContext(context.Background(), args...)
}

// InfoContext returns a hook pool. A connection to OpenNebula is
// performed
func (hc *HooksController) InfoContext(ctx context.Context, args ...int) (*hook.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := hc.c.Client.CallContext(ctx, "one.hookpool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	hookPool := &hook.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), &hookPool)
	if err != nil {
		return nil, err
	}
	return hookPool, nil
}

// Info retrieves information for the hook from ID
func (hc *HookController) Info(decrypt bool) (*hook.Hook, error) {
	return hc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the hook from ID
func (hc *HookController) InfoContext(ctx context.Context, decrypt bool) (*hook.Hook, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.hook.info", hc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	hook := &hook.Hook{}
	err = xml.Unmarshal([]byte(response.Body()), hook)
	if err != nil {
		return nil, err
	}
	return hook, nil
}

// Create allocates a new hook. It returns the new hook ID.
// * name: name of the hook
// * template: hook template.
func (hc *HooksController) Create(template string) (int, error) {
	return hc.CreateContext(context.Background(), template)
}

// Create allocates a new hook. It returns the new hook ID.
// * ctx: context for cancelation
// * name: name of the hook
// * template: hook template.
func (hc *HooksController) CreateContext(ctx context.Context, template string) (int, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.hook.allocate", template)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given hook from the pool
func (hc *HookController) Delete() error {
	return hc.DeleteContext(context.Background())
}

// DeleteContext deletes the given hook from the pool
func (hc *HookController) DeleteContext(ctx context.Context) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.delete", hc.ID)
	return err
}

// Update replaces the hook content.
// * tpl: The new hook contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (hc *HookController) Update(tpl string, uType parameters.UpdateType) error {
	return hc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext replaces the hook content.
//   - ctx: context for cancelation
//   - tpl: The new hook contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (hc *HookController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.update", hc.ID, tpl, uType)
	return err
}

// Rename renames a hook.
// * newName: The new name.
func (hc *HookController) Rename(newName string) error {
	return hc.RenameContext(context.Background(), newName)
}

// RenameContext renames a hook.
// * ctx: context for cancelation
// * newName: The new name.
func (hc *HookController) RenameContext(ctx context.Context, newName string) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.rename", hc.ID, newName)
	return err
}

// Lock locks the hook following lock level. See levels in locks.go.
func (hc *HookController) Lock(level shared.LockLevel) error {
	return hc.LockContext(context.Background(), level)
}

// LockContext locks the hook following lock level. See levels in locks.go.
func (hc *HookController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.lock", hc.ID, level)
	return err
}

// Unlock unlocks the hook.
func (hc *HookController) Unlock() error {
	return hc.UnlockContext(context.Background())
}

// UnlockContext unlocks the hook.
func (hc *HookController) UnlockContext(ctx context.Context) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.unlock", hc.ID)
	return err
}

// Retry retry a hook execution
func (hc *HookController) Retry(exec_id int) error {
	return hc.RetryContext(context.Background(), exec_id)
}

// RetryContext retry a hook execution
func (hc *HookController) RetryContext(ctx context.Context, exec_id int) error {
	_, err := hc.c.Client.CallContext(ctx, "one.hook.retry", hc.ID, exec_id)
	return err
}

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

import "context"

// RPCCaller is the interface to satisfy in order to be usable by the controller
type RPCCaller interface {
	CallContext(ctx context.Context, method string, args ...interface{}) (*Response, error)
}

// HTTPCaller is the analogous to RPCCaller but for http endpoints
type HTTPCaller interface {
	HTTPMethod(method string, url string, args ...interface{}) (*Response, error)
}

// Controller is the controller used to make requets on various entities
type Controller struct {
	Client     RPCCaller
	ClientFlow HTTPCaller
}

// entitiesController is a controller for entitites
type entitiesController struct {
	c *Controller
}

// entityController is a controller for an entity
type entityController struct {
	c  *Controller
	ID int
}

// entityControllerName is a controller for an entity
type entityNameController struct {
	c    *Controller
	Name string
}

// subEntityController is a controller for a sub entity
type subEntityController struct {
	c        *Controller
	entityID int
	ID       int
}

// NewController return a new one controller
func NewController(c RPCCaller) *Controller {
	return &Controller{
		Client: c,
	}
}

func NewControllerFlow(c HTTPCaller) *Controller {
	return &Controller{
		ClientFlow: c,
	}
}

func NewGenericController(cone RPCCaller, cflow HTTPCaller) *Controller {
	return &Controller{
		Client:     cone,
		ClientFlow: cflow,
	}
}

// SystemVersion returns the current OpenNebula Version
func (c *Controller) SystemVersion() (string, error) {
	return c.SystemVersionContext(context.Background())
}

// SystemVersionContext returns the current OpenNebula Version
func (c *Controller) SystemVersionContext(ctx context.Context) (string, error) {
	response, err := c.Client.CallContext(ctx, "one.system.version")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

// SystemConfig returns the current OpenNebula config
func (c *Controller) SystemConfig() (string, error) {
	return c.SystemConfigContext(context.Background())
}

// SystemConfigContext returns the current OpenNebula config
func (c *Controller) SystemConfigContext(ctx context.Context) (string, error) {
	response, err := c.Client.CallContext(ctx, "one.system.config")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

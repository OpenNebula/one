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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/host"
)

// HostsController is a controller for create an host or a pool of hosts
type HostsController entitiesController

// HostController is a controller for host entities
type HostController entityController

// Hosts returns a hosts controller.
func (c *Controller) Hosts() *HostsController {
	return &HostsController{c}
}

// Host return an host controller with an ID.
func (c *Controller) Host(id int) *HostController {
	return &HostController{c, id}
}

// ByName finds a Host ID from name
func (c *HostsController) ByName(name string) (int, error) {
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext finds a Host ID from name
func (c *HostsController) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	hostPool, err := c.InfoContext(ctx)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(hostPool.Hosts); i++ {
		if hostPool.Hosts[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = hostPool.Hosts[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}
	return id, nil
}

// Info returns a host pool. A connection to OpenNebula is
// performed
func (hc *HostsController) Info() (*host.Pool, error) {
	return hc.InfoContext(context.Background())
}

// InfoContext returns a host pool. A connection to OpenNebula is
// performed
func (hc *HostsController) InfoContext(ctx context.Context) (*host.Pool, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.hostpool.info")
	if err != nil {
		return nil, err
	}

	hostPool := &host.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), &hostPool)
	if err != nil {
		return nil, err
	}
	return hostPool, nil
}

// Info retrieves information for the host from ID
func (hc *HostController) Info(decrypt bool) (*host.Host, error) {
	return hc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the host from ID
func (hc *HostController) InfoContext(ctx context.Context, decrypt bool) (*host.Host, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.host.info", hc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	host := &host.Host{}
	err = xml.Unmarshal([]byte(response.Body()), host)
	if err != nil {
		return nil, err
	}
	return host, nil
}

// Create allocates a new host. It returns the new host ID.
// * name: name of the host
// * im: information driver for the host
// * vm: virtualization driver for the host
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (hc *HostsController) Create(name, im, vm string, clusterID int) (int, error) {
	return hc.CreateContext(context.Background(), name, im, vm, clusterID)
}

// Create allocates a new host. It returns the new host ID.
// * ctx: context for cancelation
// * name: name of the host
// * im: information driver for the host
// * vm: virtualization driver for the host
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (hc *HostsController) CreateContext(ctx context.Context, name, im, vm string, clusterID int) (int, error) {
	response, err := hc.c.Client.CallContext(ctx, "one.host.allocate", name, im, vm, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Monitoring Returns the Hosts monitoring records
// num: Retrieve monitor records in the last num seconds.
// 0 just the last record, -1 all records
func (hc *HostsController) Monitoring(num int) (*host.PoolMonitoring, error) {
	return hc.MonitoringContext(context.Background(), num)
}

// MonitoringContext Returns the Hosts monitoring records
// ctx: context for cancelation
// num: Retrieve monitor records in the last num seconds.
// 0 just the last record, -1 all records
func (hc *HostsController) MonitoringContext(ctx context.Context, num int) (*host.PoolMonitoring, error) {
	monitorData, err := hc.c.Client.CallContext(ctx, "one.hostpool.monitoring", num)
	if err != nil {
		return nil, err
	}

	hostsMon := &host.PoolMonitoring{}
	err = xml.Unmarshal([]byte(monitorData.Body()), &hostsMon)
	if err != nil {
		return nil, err
	}

	return hostsMon, nil
}

// Delete deletes the given host from the pool
func (hc *HostController) Delete() error {
	return hc.DeleteContext(context.Background())
}

// DeleteContext deletes the given host from the pool
func (hc *HostController) DeleteContext(ctx context.Context) error {
	_, err := hc.c.Client.CallContext(ctx, "one.host.delete", hc.ID)
	return err
}

// Status sets the status of the host
// * status: 0: ENABLED, 1: DISABLED, 2: OFFLINE
func (hc *HostController) Status(status int) error {
	return hc.StatusContext(context.Background(), status)
}

// StatusContext sets the status of the host
// * ctx: context for cancelation
// * status: 0: ENABLED, 1: DISABLED, 2: OFFLINE
func (hc *HostController) StatusContext(ctx context.Context, status int) error {
	_, err := hc.c.Client.CallContext(ctx, "one.host.status", hc.ID, status)
	return err
}

// Update adds host content.
//   - tpl: The new host contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (hc *HostController) Update(tpl string, uType parameters.UpdateType) error {
	return hc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds host content.
//   - ctx: context for cancelation
//   - tpl: The new host contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (hc *HostController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := hc.c.Client.CallContext(ctx, "one.host.update", hc.ID, tpl, uType)
	return err
}

// Rename renames a host.
// * newName: The new name.
func (hc *HostController) Rename(newName string) error {
	return hc.RenameContext(context.Background(), newName)
}

// RenameContext renames a host.
// * ctx: context for cancelation
// * newName: The new name.
func (hc *HostController) RenameContext(ctx context.Context, newName string) error {
	_, err := hc.c.Client.CallContext(ctx, "one.host.rename", hc.ID, newName)
	return err
}

// Monitoring returns the host monitoring records.
func (hc *HostController) Monitoring() (*host.Monitoring, error) {
	return hc.MonitoringContext(context.Background())
}

// MonitoringContext returns the host monitoring records.
func (hc *HostController) MonitoringContext(ctx context.Context) (*host.Monitoring, error) {
	monitorData, err := hc.c.Client.CallContext(ctx, "one.host.monitoring", hc.ID)
	if err != nil {
		return nil, err
	}

	hostMon := &host.Monitoring{}
	err = xml.Unmarshal([]byte(monitorData.Body()), &hostMon)
	if err != nil {
		return nil, err
	}

	return hostMon, nil
}

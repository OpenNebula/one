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

// Since version 5.8 of OpenNebula

import (
	"encoding/xml"
	"errors"
)

// VNTemplatesController is a controller for a pool of VNTemplate
type VNTemplatesController entitiesController

// VNTemplateController is a controller for VNTemplate entities
type VNTemplateController entityController

// VNTemplatePool represents an OpenNebula Virtual Network TemplatePool
type VNTemplatePool struct {
	VNTemplates []VNTemplate `xml:"VNTEMPLATE"`
}

// VNTemplate represents an OpenNebula Virtual Network Template
type VNTemplate struct {
	ID          uint               `xml:"ID"`
	UID         int                `xml:"UID"`
	GID         int                `xml:"GID"`
	UName       string             `xml:"UNAME"`
	GName       string             `xml:"GNAME"`
	Name        string             `xml:"NAME"`
	LockInfos   *Lock              `xml:"LOCK"`
	Permissions Permissions        `xml:"PERMISSIONS"`
	RegTime     string             `xml:"REGTIME"`
	Template    vnTemplateTemplate `xml:"TEMPLATE"`
}

type vnTemplateTemplate struct {
	VNMad   string             `xml:"VN_MAD"`
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// VNTemplates returns a VNTemplates controller.
func (c *Controller) VNTemplates() *VNTemplatesController {
	return &VNTemplatesController{c}
}

// VNTemplate return an VNTemplate controller.
func (c *Controller) VNTemplate(id uint) *VNTemplateController {
	return &VNTemplateController{c, id}
}

// ByName returns a VNTemplate id from name
func (c *VNTemplatesController) ByName(name string) (uint, error) {
	var id uint

	vnTemplatePool, err := c.Info()
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(vnTemplatePool.VNTemplates); i++ {
		if vnTemplatePool.VNTemplates[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = vnTemplatePool.VNTemplates[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a vntemplate pool. A connection to OpenNebula is
// performed.
func (vc *VNTemplatesController) Info(args ...int) (*VNTemplatePool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := vc.c.Client.Call("one.vntemplatepool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vnTemplatePool := &VNTemplatePool{}
	err = xml.Unmarshal([]byte(response.Body()), vnTemplatePool)
	if err != nil {
		return nil, err
	}

	return vnTemplatePool, nil

}

// Info connects to OpenNebula and fetches the information of the VNTemplate
func (vc *VNTemplateController) Info() (*VNTemplate, error) {
	response, err := vc.c.Client.Call("one.vntemplate.info", vc.ID)
	if err != nil {
		return nil, err
	}
	vntemplate := &VNTemplate{}
	err = xml.Unmarshal([]byte(response.Body()), vntemplate)
	if err != nil {
		return nil, err
	}

	return vntemplate, nil
}

// Create allocates a new vntemplate. It returns the new vntemplate ID.
func (vc *VNTemplateController) Create(vntemplate string) (uint, error) {
	response, err := vc.c.Client.Call("one.vntemplate.allocate", vntemplate)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Update will modify the vntemplate. If appendTemplate is 0, it will
// replace the whole vntemplate. If its 1, it will merge.
func (vc *VNTemplateController) Update(tpl string, appendTemplate int) error {
	_, err := vc.c.Client.Call("one.vntemplate.update", vc.ID, tpl, appendTemplate)
	return err
}

// Chown changes the owner/group of a vntemplate. If uid or gid is -1 it will not
// change
func (vc *VNTemplateController) Chown(uid, gid int) error {
	_, err := vc.c.Client.Call("one.vntemplate.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a vntemplate. If any perm is -1 it will not
// change
func (vc *VNTemplateController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := vc.c.Client.Call("one.vntemplate.chmod", vc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of vntemplate
func (vc *VNTemplateController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vntemplate.rename", vc.ID, newName)
	return err
}

// Delete will remove the vntemplate from OpenNebula.
func (vc *VNTemplateController) Delete() error {
	_, err := vc.c.Client.Call("one.vntemplate.delete", vc.ID)
	return err
}

// Instantiate will instantiate the template
func (vc *VNTemplateController) Instantiate(name string, extra string) (uint, error) {
	response, err := vc.c.Client.Call("one.vntemplate.instantiate", vc.ID, name, extra)

	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone an existing vntemplate.
func (vc *VNTemplateController) Clone(name string) error {
	_, err := vc.c.Client.Call("one.vntemplate.clone", vc.ID, name)
	return err
}

//Lock an existing vntemplate
func (vc *VNTemplateController) Lock(level uint) error {
	_, err := vc.c.Client.Call("one.vntemplate.lock", vc.ID, level)
	return err
}

//Unlock an existing vntemplate
func (vc *VNTemplateController) Unlock() error {
	_, err := vc.c.Client.Call("one.vntemplate.unlock", vc.ID)
	return err
}

// Lock actions

// LockUse locks USE actions for the vntemplate
func (vc *VNTemplateController) LockUse() error {
	return vc.Lock(1)
}

// LockManage locks MANAGE actions for the vntemplate
func (vc *VNTemplateController) LockManage() error {
	return vc.Lock(2)
}

// LockAdmin locks ADMIN actions for the vntemplate
func (vc *VNTemplateController) LockAdmin() error {
	return vc.Lock(3)
}

// LockAll locks all actions for the vntemplate
func (vc *VNTemplateController) LockAll() error {
	return vc.Lock(4)
}

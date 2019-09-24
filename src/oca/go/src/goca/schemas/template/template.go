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

package template

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Template pool
type Pool struct {
	Templates []Template `xml:"VMTEMPLATE"`
}

// Template represents an OpenNebula Template
type Template struct {
	ID          int                 `xml:"ID"`
	UID         int                 `xml:"UID"`
	GID         int                 `xml:"GID"`
	UName       string              `xml:"UNAME"`
	GName       string              `xml:"GNAME"`
	Name        string              `xml:"NAME"`
	LockInfos   *shared.Lock        `xml:"LOCK"`
	Permissions *shared.Permissions `xml:"PERMISSIONS"`
	RegTime     int                 `xml:"REGTIME"`
	Template    TemplateTpl         `xml:"TEMPLATE"`
}

// Template represent the template part of the OpenNebula Template
type TemplateTpl struct {
	CPU        float64                `xml:"CPU"`
	Memory     int                    `xml:"MEMORY"`
	Context    *Context               `xml:"CONTEXT"`
	Disk       []Disk                 `xml:"DISK"`
	NIC        []NIC                  `xml:"NIC"`
	Graphics   *Graphics              `xml:"GRAPHICS"`
	NICDefault *NicDefault            `xml:"NIC_DEFAULT"`
	OS         *OS                    `xml:"OS"`
	UserInputs UserInputs             `xml:"USER_INPUTS"`
	Dynamic    dyn.UnmatchedTagsSlice `xml:",any"`
}

type Context struct {
	Dynamic dyn.UnmatchedTagsMap `xml:",any"`
}

type Disk struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type NIC struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type Graphics struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type UserInputs struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type NicDefault struct {
	Model string `xml:"MODEL"`
}

type OS struct {
	Arch string `xml:"ARCH"`
	Boot string `xml:"BOOT"`
}

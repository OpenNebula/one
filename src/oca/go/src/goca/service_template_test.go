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
	"testing"

	srv_tmpl "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service_template"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

func createServiceTemplate(t *testing.T) (*srv_tmpl.ServiceTemplate, int) {
	_, vmtmpl_id := createTemplate(t)

	tmpl := srv_tmpl.ServiceTemplate{
		Template: srv_tmpl.Template {
			Body: srv_tmpl.Body {
				Name: "NewTemplateTest",
				Deployment: "straight",
				Roles: []srv_tmpl.Role {
					{
						Name: "master",
						Cardinality: 1,
						VMTemplate: vmtmpl_id,
						MinVMs: 1,
					},
				},
			},
		},
	}

	err := testCtrl.STemplates().Create(&tmpl)
	if err != nil {
		t.Fatal(err)
	}

	return &tmpl, tmpl.ID
}

func TestServiceTemplate(t *testing.T) {
	tmpl, tmpl_id := createServiceTemplate(t)

	// Check information returned by Create() is correct
	tmpl, err := testCtrl.STemplate(tmpl.ID).Info()
	if tmpl.ID != tmpl_id {
		t.Fatal("Template ID does not match.")
	}

	tmpl_ctrl := testCtrl.STemplate(tmpl.ID)

	// Test Chgrp
	if tmpl.GID != 0 || tmpl.GName != "oneadmin" {
		t.Errorf("Unexpected service group.")
	}
	tmpl_ctrl.Chgrp(1)
	tmpl, err = tmpl_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if tmpl.GID != 1 || tmpl.GName != "users" {
		t.Errorf("Unexpected service template group after Chgrp().")
	}

	// Test Chown
	if tmpl.GID != 1 || tmpl.UID != 0 {
		t.Errorf("Unexpected owner.")
	}
	tmpl_ctrl.Chown(1, 0)
	tmpl, err = tmpl_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if tmpl.GID != 0 || tmpl.UID != 1  {
		t.Errorf("Unexpected service template owner after Chown().")
	}

	// Tests Chmod
	tmpl_ctrl.Chmod(shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1})
	tmpl, err = tmpl_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if tmpl.Permissions.Octet() != 777 {
		t.Errorf("Unexpected service template permissions.")
	}

	// Test Rename
	tmpl_ctrl.Rename("renamed")
	tmpl, err = tmpl_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if tmpl.Name != "renamed" {
		t.Errorf("Unexpected name after rename action.")
	}

	// Test Update
	tmpl_update := srv_tmpl.ServiceTemplate{
		Template: srv_tmpl.Template {
			Body: srv_tmpl.Body {
				Roles: []srv_tmpl.Role {
					{
						Name: "masterRenamed",
					},
				},
			},
		},
	}
	err = tmpl_ctrl.Update(&tmpl_update, true)
	if err != nil {
		t.Fatal(err)
	}
	tmpl, err = tmpl_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if tmpl.Template.Body.Roles[0].Name != "masterRenamed" {
		t.Errorf("Unexpected role name after update action.")
	}

	// Check the Service is correctly deleted
	err = tmpl_ctrl.Delete()
	if err != nil {
		t.Errorf("Failure deleting the service template.")
	}
}

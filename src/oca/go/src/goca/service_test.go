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

	sv "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
	srv_tmpl "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service_template"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

func createService(t *testing.T) (*sv.Service, int) {
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

	service, _ := testCtrl.STemplate(tmpl.ID).Instantiate("")
	if err != nil {
		t.Fatal(err)
	}

	return service, service.ID
}

func TestService(t *testing.T) {
	service, service_id := createService(t)

	// Check information returned by Create() is correct
	service, err := testCtrl.Service(service.ID).Info()
	if service.ID != service_id {
		t.Errorf("Service ID does not match.")
	}

	service_ctrl := testCtrl.Service(service.ID)

	// Test Chgrp
	if service.GID != 0 || service.GName != "oneadmin" {
		t.Errorf("Unexpected service group.")
	}
	service_ctrl.Chgrp(1)
	service, err = service_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if service.GID != 1 || service.GName != "users" {
		t.Errorf("Unexpected service group after Chgrp().")
	}

	// Test Chown
	if service.GID != 1 || service.UID != 0 {
		t.Errorf("Unexpected owner.")
	}
	service_ctrl.Chown(1, 0)
	service, err = service_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if service.GID != 0 || service.UID != 1  {
		t.Errorf("Unexpected service owner after Chown().")
	}

	// Tests Chmod
	service_ctrl.Chmod(shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1})
	service, err = service_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if service.Permissions.Octet() != 777 {
		t.Errorf("Unexpected service permissions.")
	}

	// Test Rename
	service_ctrl.Rename("renamed")
	service, err = service_ctrl.Info()
	if err != nil {
		t.Fatal(err)
	}
	if service.Name != "renamed" {
		t.Errorf("Unexpected name after rename action.")
	}

	// Check the Service is correctly deleted
	err = service_ctrl.Delete()
	if err != nil {
		err = service_ctrl.Recover(true)
		if err != nil {
			t.Errorf(err.Error())
		}
	}
}

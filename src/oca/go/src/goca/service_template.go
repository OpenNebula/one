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
	"fmt"
	"strconv"
	"encoding/json"
	"errors"

	srv_tmpl "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service_template"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

var endpointFTemplate string

func init() {
	endpointFTemplate = "service_template"
}

// STemplateController interacts with oneflow service. Uses REST Client.
type STemplateController entityController

// STemplatesController interacts with oneflow services. Uses REST Client.
type STemplatesController entitiesController

// STemplate Controller constructor
func (c *Controller) STemplate(id int) *STemplateController {
	return &STemplateController{c, id}
}

// STemplates Controller constructor
func (c *Controller) STemplates() *STemplatesController {
	return &STemplatesController{c}
}

// OpenNebula Actions

// Get the service template pool
func (stc *STemplatesController) Info() (*srv_tmpl.Pool, error) {
	response, err := stc.c.ClientFlow.HTTPMethod("GET", endpointFTemplate)
	if err != nil {
		return nil, err
	}
	if !response.status {
		return nil, errors.New(response.body)
	}

	stemplatepool := &srv_tmpl.Pool{}
	pool_str, err := json.Marshal(response.BodyMap()["DOCUMENT_POOL"])
	err = json.Unmarshal([]byte(pool_str), stemplatepool)
	if err != nil {
		return nil, err
	}

	return stemplatepool, err
}

// Get the service template identified by <id>
func (tc *STemplateController) Info() (*srv_tmpl.ServiceTemplate, error) {
	url := urlTemplate(tc.ID)
	response, err := tc.c.ClientFlow.HTTPMethod("GET", url)
	if err != nil {
		return nil, err
	}
	if !response.status {
		return nil, errors.New(response.body)
	}

	stemplate := &srv_tmpl.ServiceTemplate{}
	stemplate_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	err = json.Unmarshal(stemplate_str, stemplate)
	if err != nil {
		return nil, err
	}

	return stemplate, nil
}

// Allocate a service template
// st will be filled with the new ServiceTemplate information
func (tc *STemplatesController) Create(st *srv_tmpl.ServiceTemplate) error {
	body :=  make(map[string]interface{})

	// Get Template.Body as map
	tmpl_byte, err := json.Marshal(st.Template.Body)
	if err != nil {
		return err
	}
    json.Unmarshal(tmpl_byte, &body)

	// Get response
	response, err := tc.c.ClientFlow.HTTPMethod("POST", endpointFTemplate, body)
	if err != nil {
		return err
	}
	if !response.status {
		return errors.New(response.body)
	}

	// Update current ServiceTemplate with new values
	stemplate_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	if err != nil {
		return err
	}
	err = json.Unmarshal(stemplate_str, st)
	if err != nil {
		return err
	}

	return nil
}

// Delete the service resource identified by <id>
func (tc *STemplateController) Delete() error {
	url := urlTemplate(tc.ID)

	return tc.c.boolResponse("DELETE", url, nil)
}

// Instantiate the service_template resource identified by <id>
func (tc *STemplateController) Instantiate(extra_tmpl string) (*service.Service, error) {
	url := urlTemplateAction(tc.ID)
	action := make(map[string]interface{})
	args   := make(map[string]interface{})
	params := make(map[string]interface{})

	if extra_tmpl != "" {
		err := json.Unmarshal([]byte(extra_tmpl), &args)
		if err != nil {
			return nil, err
		}

		params["merge_template"] = args
	}

	// Create request
	action["action"] = map[string]interface{}{
		"perform": "instantiate",
		"params": params,
	}

	//Get response
	response, err := tc.c.ClientFlow.HTTPMethod("POST", url, action)
	if err != nil {
		return nil, err
	}
	if !response.status {
		return nil, errors.New(response.body)
	}

	//Build Service from response
	service := &service.Service{}
	service_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(service_str, service)
	if err != nil {
		return nil, err
	}

	return service, nil
}

// Update service template
func (tc *STemplateController) Update(st *srv_tmpl.ServiceTemplate, append bool) error {
	tmpl_byte, err := json.Marshal(st.Template.Body)
	if err != nil {
		return err
	}

	action := make(map[string]interface{})
	action["action"] = map[string]interface{}{
		"perform": "update",
		"params": map[string]interface{}{
			"append": append,
			"template_json": string(tmpl_byte),
		},
	}

	return tc.action(action)
}

// Rename service template
func (tc *STemplateController) Rename(new_name string) error {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "rename",
		"params": map[string]interface{}{
			"name": new_name,
		},
	}

	return tc.action(action)
}

// Clone a service template
func (tc *STemplateController) Clone(clone_name string, recursive bool) (*srv_tmpl.ServiceTemplate, error) {
	url := urlTemplateAction(tc.ID)
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "clone",
		"params": map[string]interface{}{
			"name": clone_name,
			"recursive": recursive,
		},
	}

	//Get response
	response, err := tc.c.ClientFlow.HTTPMethod("POST", url, action)
	if err != nil {
		return nil, err
	}
	if !response.status {
		return nil, errors.New(response.body)
	}

	//Build Service from response
	stemplate := &srv_tmpl.ServiceTemplate{}
	stemplate_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(stemplate_str, stemplate)
	if err != nil {
		return nil, err
	}

	return stemplate, nil
}

// Permissions operations

// Chgrp template
func (tc *STemplateController) Chgrp(gid int) error {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
		},
	}

	return tc.action(action)
}

// Chown template
func (tc *STemplateController) Chown(uid, gid int) error {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chown",
		"params": map[string]interface{}{
			"group_id": gid,
			"owner_id":  uid,
		},
	}

	return tc.action(action)
}

// Chmod template
func (tc *STemplateController) Chmod(perm shared.Permissions) error {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chmod",
		"params": map[string]interface{}{
			"octet": strconv.Itoa(perm.Octet()),
		},
	}

	return tc.action(action)
}

// Helpers
// Action handler for service_templates identified by <id>
func (tc *STemplateController) action(action map[string]interface{}) error {
	url := urlTemplateAction(tc.ID)

	return tc.c.boolResponse("POST", url, action)
}

func urlTemplateAction(id int) string {
	return fmt.Sprintf("%s/action", urlTemplate(id))
}

func urlTemplate(id int) string {
	return fmt.Sprintf("%s/%s", endpointFTemplate, strconv.Itoa(id))
}

func documentJSON(response *Response) map[string]interface{} {
	responseJSON := response.BodyMap()

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

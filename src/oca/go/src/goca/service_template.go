package goca

import (
	"fmt"
	"strconv"
	"encoding/json"

	srv_tmpl "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service_template"
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

	stemplate := &srv_tmpl.ServiceTemplate{}
	stemplate_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	err = json.Unmarshal([]byte(stemplate_str), stemplate)
	if err != nil {
		return nil, err
	}

	return stemplate, nil
}

// Create service template
func (tc *STemplatesController) Create(st *srv_tmpl.ServiceTemplate) (bool, error) {
	body :=  make(map[string]interface{})

	tmpl_byte, err := json.Marshal(st.Template.Body)
	if err != nil {
		return false, err
	}

    json.Unmarshal(tmpl_byte, &body)

	_, err = tc.c.ClientFlow.HTTPMethod("POST", endpointFTemplate, body)
	if err != nil {
		return false, err
	}

	return true, nil
}

// Delete the service resource identified by <id>
func (tc *STemplateController) Delete() (bool, string) {
	url := urlTemplate(tc.ID)

	return tc.c.boolResponse("DELETE", url, nil)
}

// Update service template
//func (tc *STemplateController) Update(st *service.Template) (bool, string) {
//	url := urlTemplate(tc.ID)
//	body := tc.Map(st)
//
//	return tc.c.boolResponse("PUT", url, body)
//}

// Instantiate the service_template resource identified by <id>
func (tc *STemplateController) Instantiate(extra_tmpl string) (bool, string) {
	action := make(map[string]interface{})
	args   := make(map[string]interface{})

	json.Unmarshal([]byte(extra_tmpl), &args)
	action["action"] = map[string]interface{}{
		"perform": "instantiate",
		"params": map[string]interface{}{
			"merge_template": args,
		},
	}

	return tc.action(action)
}

// Permissions operations

// Chgrp template
func (tc *STemplateController) Chgrp(gid int) (bool, string) {
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
func (tc *STemplateController) Chown(uid, gid int) (bool, string) {
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
func (tc *STemplateController) Chmod(perm shared.Permissions) (bool, string) {
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
func (tc *STemplateController) action(action map[string]interface{}) (bool, string) {
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

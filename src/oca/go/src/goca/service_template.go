package goca

import (
	"fmt"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
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

// NewTemplate constructor
func NewTemplate(docJSON map[string]interface{}) *service.Template {
	var template service.Template

	template.JSON = docJSON

	body := docJSON["TEMPLATE"].(map[string]interface{})["BODY"].(map[string]interface{})

	id, err := strconv.Atoi(docJSON["ID"].(string))

	if err == nil {
		template.ID = id
	}

	template.Name = body["name"].(string)
	template.Deployment = body["deployment"].(string)

	ready, err := strconv.ParseBool(body["ready_status_gate"].(string))

	if err == nil {
		template.ReadyStatusGate = ready
	}

	template.Roles = body["roles"].([]map[string]interface{})

	return &template
}

// Map Template to map
func (tc *STemplateController) Map(st *service.Template) map[string]interface{} {
	body := map[string]interface{}{
		"name":              st.Name,
		"roles":             st.Roles,
		"ready_status_gate": st.ReadyStatusGate,
	}

	if st.Deployment != "" {
		body["deployment"] = st.Deployment
	}

	return body
}

// OpenNebula Actions

// Create service template
func (tc *STemplateController) Create(st *service.Template) (*service.Template, error) {
	body := tc.Map(st)

	response, e := tc.c.ClientREST.HTTPMethod("POST", endpointFTemplate, body)

	if e != nil {
		return &service.Template{}, e
	}

	return NewTemplate(documentJSON(response)), nil
}

// Delete the SERVICE resource identified by <id>
func (tc *STemplateController) Delete() (bool, string) {
	url := urlTemplate(tc.ID)

	return tc.c.boolResponse("DELETE", url, nil)
}

// Update service template
func (tc *STemplateController) Update(st *service.Template) (bool, string) {
	url := urlTemplate(tc.ID)
	body := tc.Map(st)

	return tc.c.boolResponse("PUT", url, body)
}

// Show the service template
func (tc *STemplateController) Show() (*service.Template, error) {
	url := urlTemplate(tc.ID)

	response, e := tc.c.ClientREST.HTTPMethod("GET", url)

	if e != nil {
		return &service.Template{}, e
	}

	return NewTemplate(documentJSON(response)), nil
}

// List service templates
func (tsc *STemplatesController) List() (*[]*service.Template, error) {
	var templates []*service.Template

	response, e := tsc.c.ClientREST.HTTPMethod("GET", endpointFTemplate)

	if e != nil {
		templates = append(templates, &service.Template{})
		return &templates, e
	}

	documents := response.BodyMap()["DOCUMENT_POOL"].(map[string]interface{})

	for _, v := range documents {
		template := NewTemplate(v.(map[string]interface{}))
		templates = append(templates, template)
	}

	return &templates, e
}

// Instantiate the service_template resource identified by <id>
func (tc *STemplateController) Instantiate() (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "instantiate",
	}

	return tc.Action(action)
}

// Action handler for service_templates identified by <id>
func (tc *STemplateController) Action(action map[string]interface{}) (bool, string) {
	url := urlTemplateAction(tc.ID)

	return tc.c.boolResponse("POST", url, action)
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

	return tc.Action(action)
}

// Chown template
func (tc *STemplateController) Chown(uid, gid int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
			"user_id":  uid,
		},
	}

	return tc.Action(action)
}

// Chmod template
func (tc *STemplateController) Chmod(owner, group, other int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"owner": owner,
			"group": group,
			"other": other,
		},
	}

	return tc.Action(action)
}

// Helpers

func urlTemplateAction(id int) string {
	return fmt.Sprintf("%s/action", urlTemplate(id))
}

func urlTemplate(id int) string {
	return fmt.Sprintf("%s/%s", endpointFTemplate, strconv.Itoa(id))
}

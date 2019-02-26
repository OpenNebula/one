package goca

import (
	"encoding/xml"
	"errors"
)

// TemplatePool represents an OpenNebula TemplatePool
type TemplatePool struct {
	Templates []Template `xml:"VMTEMPLATE"`
}

// Template represents an OpenNebula Template
type Template struct {
	ID          uint             `xml:"ID"`
	UID         int              `xml:"UID"`
	GID         int              `xml:"GID"`
	UName       string           `xml:"UNAME"`
	GName       string           `xml:"GNAME"`
	Name        string           `xml:"NAME"`
	LockInfos   *Lock            `xml:"LOCK"`
	Permissions *Permissions     `xml:"PERMISSIONS"`
	RegTime     int              `xml:"REGTIME"`
	Template    templateTemplate `xml:"TEMPLATE"`
}

// templateTemplate represent the template part of the OpenNebula Template
type templateTemplate struct {
	CPU        float64             `xml:"CPU"`
	Memory     int                 `xml:"MEMORY"`
	Context    *templateContext    `xml:"CONTEXT"`
	Disk       []templateDisk      `xml:"DISK"`
	Graphics   *templateGraphics   `xml:"GRAPHICS"`
	NICDefault *templateNicDefault `xml:"NIC_DEFAULT"`
	OS         *templateOS         `xml:"OS"`
	UserInputs templateUserInputs  `xml:"USER_INPUTS"`
	Dynamic    unmatchedTagsSlice  `xml:",any"`
}

type templateContext struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type templateDisk struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type templateGraphics struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type templateUserInputs struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type templateNicDefault struct {
	Model string `xml:"MODEL"`
}

type templateOS struct {
	Arch string `xml:"ARCH"`
	Boot string `xml:"BOOT"`
}

// NewTemplatePool returns a template pool. A connection to OpenNebula is
// performed.
func NewTemplatePool(args ...int) (*TemplatePool, error) {
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

	response, err := client.Call("one.templatepool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	templatePool := &TemplatePool{}
	err = xml.Unmarshal([]byte(response.Body()), templatePool)
	if err != nil {
		return nil, err
	}

	return templatePool, nil
}

// NewTemplate finds a template object by ID. No connection to OpenNebula.
func NewTemplate(id uint) *Template {
	return &Template{ID: id}
}

// NewTemplateFromName finds a template object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the template.
func NewTemplateFromName(name string) (*Template, error) {
	var id uint

	templatePool, err := NewTemplatePool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(templatePool.Templates); i++ {
		if templatePool.Templates[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = templatePool.Templates[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewTemplate(id), nil
}

// CreateTemplate allocates a new template. It returns the new template ID.
func CreateTemplate(template string) (uint, error) {
	response, err := client.Call("one.template.allocate", template)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Info connects to OpenNebula and fetches the information of the Template
func (template *Template) Info() error {
	response, err := client.Call("one.template.info", template.ID)
	if err != nil {
		return err
	}
	*template = Template{}
	return xml.Unmarshal([]byte(response.Body()), template)
}

// Update will modify the template. If appendTemplate is 0, it will
// replace the whole template. If its 1, it will merge.
func (template *Template) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.template.update", template.ID, tpl, appendTemplate)
	return err
}

// Chown changes the owner/group of a template. If uid or gid is -1 it will not
// change
func (template *Template) Chown(uid, gid int) error {
	_, err := client.Call("one.template.chown", template.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a template. If any perm is -1 it will not
// change
func (template *Template) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.template.chmod", template.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of template
func (template *Template) Rename(newName string) error {
	_, err := client.Call("one.template.rename", template.ID, newName)
	return err
}

// Delete will remove the template from OpenNebula.
func (template *Template) Delete() error {
	_, err := client.Call("one.template.delete", template.ID)
	return err
}

// Instantiate will instantiate the template
func (template *Template) Instantiate(name string, pending bool, extra string) (uint, error) {
	response, err := client.Call("one.template.instantiate", template.ID, name, pending, extra)

	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone an existing template. If recursive is true it will clone the template
// plus any image defined in DISK. The new IMAGE_ID is set into each DISK.
func (template *Template) Clone(name string, recursive bool) error {
	_, err := client.Call("one.template.clone", template.ID, name, recursive)
	return err
}

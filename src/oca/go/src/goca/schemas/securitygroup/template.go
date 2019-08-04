package securitygroup

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup/keys"
)

// Template represent the template part of the OpenNebula SecurityGroup
type Template struct {
	dyn.Template
}

// NewTemplate returns a security group template
func NewTemplate() *Template {
	return &Template{}
}

// AddAR allow to add a security group rule to the template
func (t *Template) AddRule() *Rule {
	rule := NewRule()
	t.Elements = append(t.Elements, rule)
	return rule
}

// GetRules allow to retrieve security group rules from template
func (t *Template) GetRules() []Rule {

	vecs := t.GetVectors(string(keys.RuleVec))

	rules := make([]Rule, len(vecs))
	for i, v := range vecs {
		rules[i] = Rule{*v}
	}

	return rules
}

// Get return the string value of a template security group key
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for a security group template key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a security group Template key, value pair
func (t *Template) Add(key keys.Template, value string) {
	t.AddPair(string(key), value)
}

package goca

import "encoding/xml"

// ACLPool represents an OpenNebula ACL list pool
type ACLPool struct {
	ID       uint   `xml:"ID"`
	User     int    `xml:"USER"`
	Resource int    `xml:"RESOURCE"`
	Rights   int    `xml:"RIGHTS"`
	Zone     int    `xml:"ZONE"`
	String   string `xml:"STRING"`
}

// NewACLPool returns an acl pool. A connection to OpenNebula is
// performed.
func NewACLPool() (*ACLPool, error) {
	response, err := client.Call("one.acl.info")
	if err != nil {
		return nil, err
	}

	aclPool := &ACLPool{}
	err = xml.Unmarshal([]byte(response.Body()), aclPool)
	if err != nil {
		return nil, err
	}

	return aclPool, nil
}

// CreateACLRule adds a new ACL rule.
// * user: User component of the new rule. A string containing a hex number.
// * resource: Resource component of the new rule. A string containing a hex number.
// * rights: Rights component of the new rule. A string containing a hex number.
func CreateACLRule(user, resource, rights string) (uint, error) {
	response, err := client.Call("one.acl.addrule", user, resource, rights)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// DeleteACLRule deletes an ACL rule.
func DeleteACLRule(aclID uint) error {
	_, err := client.Call("one.acl.delrule", int(aclID))
	return err
}

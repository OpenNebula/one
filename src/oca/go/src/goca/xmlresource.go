package goca

import (
	"bytes"
	"errors"
	"strconv"

	"gopkg.in/xmlpath.v2"
)

const (
	// PoolWhoPrimaryGroup resources belonging to the user’s primary group.
	PoolWhoPrimaryGroup = -4

	// PoolWhoMine to list resources that belong to the user that performs the
	// query.
	PoolWhoMine = -3

	// PoolWhoAll to list all the resources seen by the user that performs the
	// query.
	PoolWhoAll = -2

	// PoolWhoGroup to list all the resources that belong to the group that performs
	// the query.
	PoolWhoGroup = -1
)

// XMLResource contains an XML body field. All the resources in OpenNebula are
// of this kind.
type XMLResource struct {
	body string
}

// XMLIter is used to iterate over XML xpaths in an object.
type XMLIter struct {
	iter *xmlpath.Iter
}

// XMLNode represent an XML node.
type XMLNode struct {
	node *xmlpath.Node
}

// Body accesses the body of an XMLResource
func (r *XMLResource) Body() string {
	return r.body
}

// XPath returns the string pointed at by xpath, for an XMLResource
func (r *XMLResource) XPath(xpath string) (string, bool) {
	path := xmlpath.MustCompile(xpath)
	b := bytes.NewBufferString(r.Body())

	root, _ := xmlpath.Parse(b)

	return path.String(root)
}

// XPathIter returns an XMLIter object pointed at by the xpath
func (r *XMLResource) XPathIter(xpath string) *XMLIter {
	path := xmlpath.MustCompile(xpath)
	b := bytes.NewBufferString(string(r.Body()))

	root, _ := xmlpath.Parse(b)

	return &XMLIter{iter: path.Iter(root)}
}

// GetIDFromName finds the a resource by ID by looking at an xpath contained
// in that resource
func (r *XMLResource) GetIDFromName(name string, xpath string) (uint, error) {
	var id int
	var match = false

	iter := r.XPathIter(xpath)
	for iter.Next() {
		node := iter.Node()

		n, _ := node.XPath("NAME")
		if n == name {
			if match {
				return 0, errors.New("multiple resources with that name")
			}

			idString, _ := node.XPath("ID")
			id, _ = strconv.Atoi(idString)
			match = true
		}
	}

	if !match {
		return 0, errors.New("resource not found")
	}

	return uint(id), nil
}

// Next moves on to the next resource
func (i *XMLIter) Next() bool {
	return i.iter.Next()
}

// Node returns the XMLNode
func (i *XMLIter) Node() *XMLNode {
	return &XMLNode{node: i.iter.Node()}
}

// XPath returns an XMLNode pointed at by xpath
func (n *XMLNode) XPath(xpath string) (string, bool) {
	path := xmlpath.MustCompile(xpath)
	return path.String(n.node)
}

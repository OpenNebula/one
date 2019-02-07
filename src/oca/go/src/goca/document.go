package goca

import (
	"encoding/xml"
	"errors"
)

// DocumentPool represents an OpenNebula DocumentPool
type DocumentPool struct {
	Documents []Document `xml:"DOCUMENT"`
}

// Document represents an OpenNebula Document
type Document struct {
	ID          uint             `xml:"ID"`
	UID         int              `xml:"UID"`
	GID         int              `xml:"GID"`
	UName       string           `xml:"UNAME"`
	GName       string           `xml:"GNAME"`
	Name        string           `xml:"NAME"`
	Type        string           `xml:"TYPE"`
	Permissions *Permissions     `xml:"PERMISSIONS"`
	LockInfos   *Lock            `xml:"LOCK"`
	Template    documentTemplate `xml:"TEMPLATE"`
}

type documentTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// NewDocumentPool returns a document pool. A connection to OpenNebula is
// performed.
func NewDocumentPool(documentType int, args ...int) (*DocumentPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := client.Call("one.documentpool.info", who, start, end, documentType)
	if err != nil {
		return nil, err
	}

	documentPool := &DocumentPool{}
	err = xml.Unmarshal([]byte(response.Body()), documentPool)
	if err != nil {
		return nil, err
	}

	return documentPool, nil
}

// NewDocument finds a document object by ID. No connection to OpenNebula.
func NewDocument(id uint) *Document {
	return &Document{ID: id}
}

// NewDocumentFromName finds a document object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the document.
func NewDocumentFromName(name string, documentType int) (*Document, error) {
	var id uint

	documentPool, err := NewDocumentPool(documentType)
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(documentPool.Documents); i++ {
		if documentPool.Documents[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = documentPool.Documents[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewDocument(id), nil
}

// CreateDocument allocates a new document. It returns the new document ID.
func CreateDocument(tpl string, documentType int) (uint, error) {
	response, err := client.Call("one.document.allocate", tpl, documentType)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone clones an existing document.
// * newName: Name for the new document.
func (document *Document) Clone(newName string) error {
	_, err := client.Call("one.document.clone", document.ID, newName)
	return err
}

// Delete deletes the given document from the pool.
func (document *Document) Delete() error {
	_, err := client.Call("one.document.delete", document.ID)
	return err
}

// Update replaces the document template contents.
// * tpl: The new document template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (document *Document) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.document.update", document.ID, tpl, appendTemplate)
	return err
}

// Chmod changes the permission bits of a document.
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (document *Document) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.document.chmod", document.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a document.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (document *Document) Chown(userID, groupID int) error {
	_, err := client.Call("one.document.chown", document.ID, userID, groupID)
	return err
}

// Rename renames a document.
// * newName: The new name.
func (document *Document) Rename(newName string) error {
	_, err := client.Call("one.document.rename", document.ID, newName)
	return err
}

// Lock locks the document at the api level. The lock automatically expires after 2 minutes.
// * applicationName: String to identify the application requesting the lock.
func (document *Document) Lock(applicationName string) error {
	_, err := client.Call("one.document.lock", document.ID, applicationName)
	return err
}

// Unlock unlocks the document at the api level.
// * applicationName: String to identify the application requesting the lock.
func (document *Document) Unlock(applicationName string) error {
	_, err := client.Call("one.document.unlock", document.ID, applicationName)
	return err
}

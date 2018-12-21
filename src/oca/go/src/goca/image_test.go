package goca

import (
    "testing"
    "strings"
)

var imageTpl = `
NAME = "test-image"
SIZE = 1
TYPE = "DATABLOCK"
DEV_PREFIX = "sd"
DRIVER = "qcow2"
PERSISTENT = "YES"
TM_MAD = "ssh"
`

func ImageExpectState(image *Image, state string) func() bool {
	return func() bool {
		image.Info()

		s, err := image.StateString()
		if err != nil {
			return false
		}

		if state != "" && s == state {
			return true
		}

		return false
	}
}

// Helper to create a Image
func createImage(t *testing.T) *Image {
    // Datastore ID 1 means default for image
	id, err := CreateImage(imageTpl, 1)
	if err != nil {
		t.Error(err)
	}

	// Get Image by ID
	image := NewImage(id)

	err = image.Info()
	if err != nil {
		t.Error(err)
	}

	return image
}

func TestImage(t *testing.T) {
	image := createImage(t)

	idParse, err := GetID(t, image, "IMAGE")
	if err != nil {
		t.Error(err)
	}

	if idParse != image.ID {
		t.Errorf("Image ID does not match")
	}

	// Get image by Name
	name, ok := image.XPath("/IMAGE/NAME")
	if !ok {
		t.Errorf("Could not get name")
	}

	image, err = NewImageFromName(name)
	if err != nil {
		t.Fatal(err)
	}

	err = image.Info()
	if err != nil {
		t.Error(err)
	}

	idParse, err = GetID(t, image, "IMAGE")

	if idParse != image.ID {
		t.Errorf("Image ID does not match")
	}


    // Wait image is ready
    wait := WaitResource(ImageExpectState(image, "READY"))
    if wait == false {
        t.Error("Image not READY")
    }

    // Change Owner to user call
    err = image.Chown(-1, -1)
	if err != nil {
		t.Error(err)
	}

    err = image.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Image Owner Name
	uname, ok := image.XPath("/IMAGE/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Image owner group Name
	gname, ok := image.XPath("/IMAGE/GNAME")
	if !ok {
		t.Errorf("Could not get group name")
	}

    // Compare with caller username
    caller := strings.Split(client.token, ":")[0]
    if caller != uname {
        t.Error("Caller user and image owner user mismatch")
    }

    group, err := GetUserGroup(t, caller)
	if err != nil {
        t.Error("Cannot retreive caller group")
	}

    // Compare with caller group
    if group != gname {
        t.Error("Caller group and image owner group mismatch")
    }

    // Change Owner to oneadmin call
    err = image.Chown(1, 1)
	if err != nil {
		t.Error(err)
	}

    err = image.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Image Owner Name
	uname, ok = image.XPath("/IMAGE/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Image Owner Name
	gname, ok = image.XPath("/IMAGE/GNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

    if "serveradmin" != uname {
		t.Error("Image owner is not oneadmin")
	}

    // Compare with caller group
    if "users" != gname {
        t.Error("Image owner group is not oneadmin")
    }

	// Delete template
	err = image.Delete()
	if err != nil {
		t.Error(err)
	}
}

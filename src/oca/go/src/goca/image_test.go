package goca

import (
    "testing"
    "strings"
)

var imageTpl = `
NAME = "test-image"
SIZE = 1
TYPE = "DATABLOCK"
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
func createImage(t *testing.T) (*Image, uint) {
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

	return image, id
}

func TestImage(t *testing.T) {
	var err error

	image, idOrig := createImage(t)

	idParse := image.ID
	if idParse != idOrig {
		t.Errorf("Image ID does not match")
	}

	// Get image by Name
	name := image.Name

	image, err = NewImageFromName(name)
	if err != nil {
		t.Fatal(err)
	}

	err = image.Info()
	if err != nil {
		t.Error(err)
	}

	idParse = image.ID
	if idParse != idOrig {
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
	uname := image.UName

	// Get Image owner group Name
	gname := image.GName

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
	uname = image.UName

	// Get Image owner group Name
	gname = image.GName

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

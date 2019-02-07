package goca

import (
	"crypto/md5"
	"fmt"
	"strconv"
	"testing"
	"time"
)

// Appends a random string to a name
func GenName(name string) string {
	t := strconv.FormatInt(time.Now().UnixNano(), 10)

	d := []byte(t)
	h := fmt.Sprintf("%x", md5.Sum(d))[:6]
	return name + "-" + h
}

func WaitResource(f func() bool) bool {
	for i := 0; i < 20; i++ {
		if f() {
			return true
		}
		time.Sleep(2 * time.Second)
	}
	return false
}

// Get User Main Group name
func GetUserGroup(t *testing.T, user string) (string, error){
    u, err := NewUserFromName(user)
	if err != nil {
        t.Error("Cannot retreive caller user ID")
	}

    // Get User Info
    err = u.Info()
	if err != nil {
        t.Error("Cannot retreive caller user Info")
	}

    return u.GName, nil

}

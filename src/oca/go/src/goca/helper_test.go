/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/*--------------------------------------------------------------------------- */

package goca

import (
	"crypto/md5"
	"fmt"
	"strconv"
	"testing"
	"time"
)

var testClient = NewDefaultClient(NewConfig("", "", ""))
var testClientFlow = NewDefaultFlowClient(NewFlowConfig("", "", ""))
var testCtrl = NewGenericController(testClient, testClientFlow)

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
func GetUserGroup(t *testing.T, user string) (string, error) {
	uid, err := testCtrl.Users().ByName(user)
	if err != nil {
        t.Error("Cannot retreive caller user ID")
	}

    // Get User Info
    u, err := testCtrl.User(uid).Info(false)
	if err != nil {
        t.Error("Cannot retreive caller user Info")
	}

    return u.GName, nil

}

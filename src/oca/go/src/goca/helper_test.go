/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
	"math"
	"strconv"
	"time"
)

var (
	testClient, _  = NewClientFromConfig(NewConfig("", "", ""))
	testClientFlow = NewDefaultFlowClient(NewFlowConfig("", "", ""))
	testCtrl       = NewGenericController(testClient, testClientFlow)
)

// Appends a random string to a name
func GenName(name string) string {
	t := strconv.FormatInt(time.Now().UnixNano(), 10)

	d := []byte(t)
	h := fmt.Sprintf("%x", md5.Sum(d))[:6]
	return name + "-" + h
}

func WaitResource(f func() bool) bool {
	for i := 0; i < 40; i++ {
		if f() {
			return true
		}
		time.Sleep(time.Second)
	}
	return false
}

// Get User Main Group name
func GetUserGroup(user string) (string, error) {
	uid, err := testCtrl.Users().ByName(user)
	if err != nil {
		return "", err
	}

	// Get User Info
	u, err := testCtrl.User(uid).Info(false)
	if err != nil {
		return "", err
	}

	return u.GName, nil

}

// Retries function with exponential backoff until maxRetries are reached
// * fn: function to retry until returns nil as error
// * delayMs: base delay time in milliseconds
// * maxRetries: maximum number of retries
// * initDelayMs: The initial delay time in milliseconds (before the first function call)
// * maxDelayMs: The maximum number of milliseconds between retries
func retryWithExponentialBackoff(fn func() error, delayMs int, maxRetries int, initDelayMs int, maxDelayMs int) error {

	start := time.Now()
	time.Sleep(time.Duration(initDelayMs) * time.Millisecond)

	delay := float64(delayMs)
	maxDelay := float64(maxDelayMs)

	for retries := 0; retries <= maxRetries; retries++ {
		err := fn()
		if err == nil {
			return nil
		}
		time.Sleep(time.Duration(delay) * time.Millisecond)
		delay *= math.Pow(2, float64(retries))
		if delay > maxDelay {
			delay = maxDelay
		}
	}
	totalTime := time.Since(start)

	return fmt.Errorf("retry limit reached (%d) after (%f) seconds", maxRetries, totalTime.Seconds())
}

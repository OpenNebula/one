/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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
	"errors"
	"fmt"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	param "github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
)

// VMFilter groups filtering criterias for VMs
type VMFilter struct {
	Who     int
	StartID int
	EndID   int
	State   int

	// Pair is optional. Format: "KEY=VALUE"
	Pair string
}

// NewVMFilterDefault return a VM filter configured by default
func NewVMFilterDefault() *VMFilter {
	return &VMFilter{
		Who:     param.PoolWhoAll,
		StartID: -1,
		EndID:   -1,
		State:   -1,
	}
}

// NewVMFilter return a VM filter
func NewVMFilter(who, start, end, state int) *VMFilter {

	filter := &VMFilter{
		Who:     who,
		StartID: start,
		EndID:   end,
		State:   state,
	}

	return filter
}

// SetPair set the optional argument pair to the filter
func (f *VMFilter) SetPair(key string, value interface{}) error {

	pair, err := dyn.MakePair(key, value)
	if err != nil {
		return err
	}

	// don't work with String method defined on Pair
	f.Pair = fmt.Sprintf("%s=%s", pair.Key(), pair.Value)

	return nil
}

func (f *VMFilter) toArgs() []interface{} {
	if len(f.Pair) > 0 {
		return []interface{}{f.Who, f.StartID, f.EndID, f.State, f.Pair}
	}
	return []interface{}{f.Who, f.StartID, f.EndID, f.State}

}

func handleArgs(args []int) ([]interface{}, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = parameters.PoolWhoAll
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 2:
		return nil, errors.New("Info method: wrong number of arguments, provide the end of the range ID")
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Info method: too many arguments")
	}

	return []interface{}{who, start, end}, nil
}

func handleVMArgs(args []int) ([]interface{}, error) {

	if len(args) > 4 {
		return nil, errors.New("Info method: too many arguments")
	}

	var min int
	if len(args) <= 3 {
		min = len(args)
	} else {
		min = 3
	}

	vmArgs, err := handleArgs(args[:min])
	if err != nil {
		return nil, err
	}

	state := -1
	if len(args) == 4 {
		state = args[3]
	}
	vmArgs = append(vmArgs, state)

	return vmArgs, nil
}

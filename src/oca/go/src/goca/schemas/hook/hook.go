/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

package hook

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// Pool represents an OpenNebula Host pool
type Pool struct {
	Hooks []Hook `xml:"HOOK"`
}

// Host represents an OpenNebula Host
type Hook struct {
	ID          int                `xml:"ID"`
	Name        string             `xml:"NAME"`
	Type        string             `xml:"TYPE"`
	Template    Template           `xml:"TEMPLATE"`
	Log         HookLog            `xml:"HOOKLOG"`
}

type Template struct {
	// Example of reservation: https://github.com/OpenNebula/addon-storpool/blob/ba9dd3462b369440cf618c4396c266f02e50f36f/misc/reserved.sh
	Arguments      string   `xml:"ARGUMENTS"`
	ArgumentsSTDIN string   `xml:"ARGUMENTS_STDIN"`
	Command        string   `xml:"COMMAND"`
	Remote         string   `xml:"REMOTE"`
	Dynamic        dyn.UnmatchedTagsSlice `xml:",any"`
}

type HookLog struct {
	ExecutionRecords []ExecutionRecord  `xml:"HOOK_EXECUTION_RECORD"`
}

type ExecutionRecord struct {
	Id         int             `xml:"HOOK_ID"`
	ExecId     int             `xml:"EXECUTION_ID"`
	Timestamp  int             `xml:"TIMESTAMP"`
	Arguments  string          `xml:"ARGUMENTS"`
	HookLog    ExecutionResult `xml:"EXECUTION_RESULT"`
	RemoteHost string          `xml:"REMOTE_HOST"`
	Retry      string          `xml:"RETRY"`
}

type ExecutionResult struct {
	Command string `xml:"COMMAND"`
	Stdout  string `xml:"STDOUT"`
	Stderr  string `xml:"STDERR"`
	Code    string `xml:"CODE"`
}

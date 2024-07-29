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

package hook

import "encoding/xml"

// Pool represents an OpenNebula Hook pool
type Pool struct {
	XMLName xml.Name `xml:"HOOK_POOL"`
	Hooks   []Hook   `xml:"HOOK"`
}

// Hook represents an OpenNebula Hook
type Hook struct {
	XMLName  xml.Name `xml:"HOOK"`
	ID       int      `xml:"ID"`
	Name     string   `xml:"NAME"`
	Type     string   `xml:"TYPE"`
	Template Template `xml:"TEMPLATE"`
	Log      HookLog  `xml:"HOOKLOG"`
}

type HookLog struct {
	ExecutionRecords []ExecutionRecord `xml:"HOOK_EXECUTION_RECORD"`
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

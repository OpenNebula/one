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

// GitCommit is the git commit that was compiled. This will be filled in by the
// compiler.
var GitCommit string

// Version is the main version number that is being run at the moment.
const Version = "0.1.0"

// VersionPrerelease is the pre-release marker for the version. If this is ""
// (empty string) then it means that it is a final release. Otherwise, this is a
// pre-release such as "dev" (in development)
var VersionPrerelease = ""

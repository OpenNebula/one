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

package parameters

// UpdateType is a parameter to update methods indicating how to replace the template
type UpdateType int

const (
	// Replace to replace the whole template
	Replace UpdateType = 0

	// Merge to merge new template with existing one
	Merge UpdateType = 1
)

// WhoPool is a parameter to pool info methods allowing to so some filtering
//type WhoPool int

const (
	// PoolWhoPrimaryGroup resources belonging to the user’s primary group.
	PoolWhoPrimaryGroup = -4

	// PoolWhoMine to list resources that belong to the user that performs the
	// query.
	PoolWhoMine = -3

	// PoolWhoAll to list all the resources seen by the user that performs the
	// query.
	PoolWhoAll = -2

	// PoolWhoGroup to list all the resources that belong to the group that performs
	// the query.
	PoolWhoGroup = -1
)

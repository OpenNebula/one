/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

package keys

// Address Range template part

// AddressRange is here to help the user to keep track of XML tags defined in AddressRange
type AddressRange string

const (
	ARVec        string       = "AR"
	ARID         AddressRange = "AR_ID"
	IP           AddressRange = "IP"
	Size         AddressRange = "SIZE"
	Type         AddressRange = "TYPE"
	Mac          AddressRange = "MAC"
	GlobalPrefix AddressRange = "GLOBAL_PREFIX"
	UlaPrefix    AddressRange = "ULA_PREFIX"
	PrefixLength AddressRange = "PREFIX_LENGTH"
)

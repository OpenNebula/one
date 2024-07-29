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

package keys

// Template is a type used to enumerate marketplace keys of Http kind
type Template string

const (
	Name          Template = "NAME"
	OriginID      Template = "ORIGIN_ID"
	Type          Template = "TYPE"
	Size          Template = "SIZE"
	MarketPlaceID Template = "MARKETPLACE_ID"
	MarketPlace   Template = "MARKETPLACES"
	Description   Template = "DESCRIPTION"
	Publisher     Template = "PUBLISHER"
	Version       Template = "VERSION"
	VMTemplate64  Template = "VMTEMPLATE64"
	AppTemplate64 Template = "APPTEMPLATE64"
)

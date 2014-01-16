/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
/* -------------------------------------------------------------------------- */

#include "GroupQuotas.h"

/* ************************************************************************** */
/* GroupQuotas :: Database Access Functions                                   */
/* ************************************************************************** */

const char * GroupQuotas::db_table = "group_quotas";

const char * GroupQuotas::db_names = "group_oid, body";

const char * GroupQuotas::db_oid_column = "group_oid";

const char * GroupQuotas::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS group_quotas ("
    "group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT)";

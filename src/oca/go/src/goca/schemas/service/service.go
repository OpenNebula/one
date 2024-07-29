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

package service

import (
    "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Service pool
type Pool struct {
    Services	[]Service `json:"DOCUMENT,omitempty"`
}

// Service represents an OpenNebula Service
type Service struct {
    ID          int                 `json:"ID,string"`
    UID         int                 `json:"UID,string"`
    GID         int                 `json:"GID,string"`
    UName       string              `json:"UNAME"`
    GName       string              `json:"GNAME"`
    Name        string              `json:"NAME"`
    Permissions *shared.Permissions `json:"PERMISSIONS"`
    Template struct {
        Body struct	{
            Deployment      string                   `json:"deployment,omitempty"`
            Description     string                   `json:"description,omitempty"`
            Roles           []Role                   `json:"roles,omitempty"`
            Networks        map[string]string        `json:"networks,omitempty"`
            CustomAttrs     map[string]string        `json:"custom_attrs,omitempty"`
            CustomAttrsVals map[string]string        `json:"custom_attrs_values,omitempty"`
            ReadyGate       bool                     `json:"ready_status_gate,omitempty"`
            NetworksVals    []map[string]interface{} `json:"networks_values,omitempty"`
            StateRaw        int                      `json:"state,omitempty"`
        }`json:"BODY,omitempty"`
    } `json:"TEMPLATE,omitempty"`
}

type Role struct {
    Name                string             `json:"name,omitempty"`
    Cardinality         int                `json:"cardinality"`
    VMTemplate          int                `json:"vm_template,omitempty"`
    ShutdownAction      string             `json:"shutdown_action,omitempty"`
    Parents             []string           `json:"parents,omitempty"`
    VMTemplateContents  string             `json:"vm_template_contents,omitempty"`
    MinVMs              int                `json:"min_vms,omitempty"`
    MaxVMS              int                `json:"max_vms,omitempty"`
    Cooldown            int                `json:"cooldown,omitempty"`
    ElasticityPolicies  []ElasticityPolicy `json:"elasticity_policies,omitempty"`
    ScheduledPolicies   []ScheduledPolicy  `json:"scheduled_policies,omitempty"`
    StateRaw            int                `json:"state,omitempty"`
    Nodes               []Node             `json:"nodes,omitempty"`
}

type Node struct {
    DeployID int `json:"deploy_id,omitempty"`
    VMInfo struct {
        VM struct {
            ID  int      `json:"ID,string,omitempty"`
            UID int      `json:"UID,string,omitempty"`
            GID int      `json:"GID,string,omitempty"`
            UName string `json:"UNAME,omitempty"`
            GName string `json:"GNAME,omitempty"`
            Name  string `json:"NAME,omitempty"`
        }`json:"VM,omitempty"`
    } `json:"vm_info,omitempty"`
}

type ElasticityPolicy struct {
    Type          string `json:"type,omitempty"`
    Adjust        int    `json:"adjust,omitempty"`
    MinAdjustStep int    `json:"min_adjust_step,omitempty"`
    Expression    string `json:"expression,omitempty"`
    Period_number int    `json:"period_number,omitempty"`
    Period        int    `json:"period,omitempty"`
    Cooldown      int    `json:"cooldown,omitempty"`
}

type ScheduledPolicy struct {
    Type          string `json:"type,omitempty"`
    Adjust        int    `json:"adjust,omitempty"`
    MinAdjustStep int    `json:"min_adjust_step,omitempty"`
    StartTime     string `json:"start_time,omitempty"`
    Recurrence    string `json:"recurrence,omitempty"`
}

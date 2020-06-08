package service_template

import (
    "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
    srv "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
)

// Pool represents an OpenNebula Service pool
type Pool struct {
    ServiceTemplates []ServiceTemplate `json:"DOCUMENT,omitempty"`
}

// Service Template schema
type ServiceTemplate struct {
    ID          int                 `json:"ID,string"`
    UID         int                 `json:"UID,string"`
    GID         int                 `json:"GID,string"`
    UName       string              `json:"UNAME"`
    GName       string              `json:"GNAME"`
    Name        string              `json:"NAME"`
    Permissions *shared.Permissions `json:"PERMISSIONS"`
    Template    Template            `json:"TEMPLATE,omitempty"`
}

type Template struct {
    Body Body `json:"BODY,omitempty"`
}

type Body struct	{
    Name            string                   `json:"name,omitempty"`
    Deployment      string                   `json:"deployment,omitempty"`
    Description     string                   `json:"description,omitempty"`
    Roles           []Role                   `json:"roles,omitempty"`
    Networks        map[string]string        `json:"networks,omitempty"`
    CustomAttrs     map[string]string        `json:"custom_attrs,omitempty"`
    ReadyGate       bool                     `json:"ready_status_gate,omitempty"`
}

type Role struct {
    Name                string                 `json:"name,omitempty"`
    Cardinality         int                    `json:"cardinality,omitempty"`
    VMTemplate          int                    `json:"vm_template"`
    ShutdownAction      string                 `json:"shutdown_action,omitempty"`
    Parents             []string               `json:"parents,omitempty"`
    VMTemplateContents  string                 `json:"vm_template_contents,omitempty"`
    MinVMs              int                    `json:"min_vms,omitempty"`
    MaxVMS              int                    `json:"max_vms,omitempty"`
    Cooldown            int                    `json:"cooldown,omitempty"`
    ElasticityPolicies  []srv.ElasticityPolicy `json:"elasticity_policies,omitempty"`
    ScheduledPolicies   []srv.ScheduledPolicy  `json:"scheduled_policies,omitempty"`
}

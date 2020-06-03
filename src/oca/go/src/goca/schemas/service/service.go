package service

// Pool represents an OpenNebula Service pool
type Pool struct {
	Services	[]Service `json:"DOCUMENT,omitempty"`
}

// Service represents an OpenNebula Service
type Service struct {
	ID       int    `json:"ID,string,omitempty"`
	UID	     int    `json:"UID,string,omitempty"`
	GID	     int    `json:"GID,string,omitempty"`
	UName    string `json:"UNAME,omitempty"`
	GName    string `json:"GNAME,omitempty"`
    Name     string `json:"NAME,omitempty"`
	Template struct {
		Body struct	{
			Deployment  string `json:"deployment,omitempty"`
			Description string `json:"description,omitempty"`
            Roles		[]Role `json:"roles,omitempty"`
            ReadyGate   bool   `json:"ready_status_gate,omitempty"`
            StateRaw    int    `json:"state,omitempty"`
		}`json:"BODY,omitempty"`
	} `json:"TEMPLATE,omitempty"`
}

type Role struct {
    Name                string   `json:"name,omitempty"`
    Cardinality         int      `json:"cardinality,omitempty"`
    VMTemplate          int      `json:"vm_template,omitempty"`
    Parents             []string `json:"parents,omitempty"`
    //ElasticityPolicies           `json:"elasticity_policies,omitempty"`
    //ScheduledPolicies            `json:"scheduled_policies,omitempty"`
    StateRaw            int      `json:"state,omitempty"`
    Cooldown            int      `json:"cooldown,omitempty"`
    Nodes               []Node   `json:"nodes,omitempty"`
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

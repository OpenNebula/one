package role

type Role struct {
	Name        string
	Cardinality int
	VMTemplate  int
	Parents     []string
	MinVMs      int
	MaxVMs      int
	Cooldown    int
	// PolElasticity []Elasticity
	// PolScheduled  []SCheduled
}

type Action struct {
	Perform string
	actionparams
}

type actionparams struct {
	Period int
	Number int
}

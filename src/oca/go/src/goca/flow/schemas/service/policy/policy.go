package policy

type Policy struct {
	Type          string
	Adjust        int
	MinAdjustStep int
}

type Scheduled struct {
	Policy
	Recurrence string
	StartTime  int
}

type Elasticity struct {
	Policy
	Expression   string
	PeriodNumber int
	Period       int
	Cooldown     int
}

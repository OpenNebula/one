package goca

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

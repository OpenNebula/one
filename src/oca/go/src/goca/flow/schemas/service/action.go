package service

type Action int

const (
	Shutdown Action = 0
	Recover  Action = 1
	Chown    Action = 2
	Chgrp    Action = 3
	Chmod    Action = 4
)

// Map action to hash
func (s Action) String() string {
	switch s {
	case Shutdown:
		return "shutdown"
	case Recover:
		return "recover"
	case Chown:
		return "chown"
	case Chgrp:
		return "chgrp"
	case Chmod:
		return "chmod"
	default:
		return ""
	}
}

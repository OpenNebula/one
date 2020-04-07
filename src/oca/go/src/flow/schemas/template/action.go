type Action int

const (
	Shutdown Action = iota
	Recover Action
	Chown Action
	Chgrp Action
	Chmod Action
)

func (s State) String() string {
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
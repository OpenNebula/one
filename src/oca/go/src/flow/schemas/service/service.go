package service

type Service struct {
	Name            string
	Deployment      string
	ShutdownAction  string
	ReadyStatusGate bool
	Roles           []Role
}

// type Action struct {
// 	Perform string
// }

// type Chmod struct {
// 	Action
// 	Params chmodparams
// }

// type Chgrp struct {
// 	Action
// 	Params chgrpparams
// }

// type Chown struct {
// 	Action
// 	Params chownparams
// }

// type chmodparams struct {
// 	group_id int
// }

// type chgrpparams struct {
// 	group_id int
// }

// type chownparams struct {
// 	group_id int
// 	user_id  int
// }

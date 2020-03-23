// {
//   :type => :object,
//   :properties => {
//     'name' => {
//       :type => :string,
//       :required => true
//     },
//     'deployment' => {
//       :type => :string,
//       :enum => %w{none straight},
//       :default => 'none'
//     },
//     'shutdown_action' => {
//       :type => :string,
//       :enum => %w{shutdown shutdown-hard},
//       :required => false
//     },
//     'roles' => {
//       :type => :array,
//       :items => ROLE_SCHEMA,
//       :required => true
//     },
//     'custom_attrs' => {
//       :type => :object,
//       :properties => {
//       },
//       :required => false
//     },
//     'ready_status_gate' => {
//       :type => :boolean,
//       :required => false
//     }
//   }
// }

package service

type Service struct {
	Name            string
	Deployment      string
	ShutdownAction  string
	ReadyStatusGate bool
	Roles           []Role
}

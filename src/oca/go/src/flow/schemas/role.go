// {
//   :type => :object,
//   :properties => {
//     'name' => {
//       :type => :string,
//       :required => true
//     },
//     'cardinality' => {
//       :type => :integer,
//       :default => 1,
//       :minimum => 0
//     },
//     'vm_template' => {
//       :type => :integer,
//       :required => true
//     },
//     'vm_template_contents' => {
//       :type => :string,
//       :required => false
//     },
//     'parents' => {
//       :type => :array,
//       :items => {
//         :type => :string
//       }
//     },
//     'shutdown_action' => {
//       :type => :string,
//       :enum => ['shutdown', 'shutdown-hard']},
//       :required => false
//     },
//     'min_vms' => {
//       :type => :integer,
//       :required => false,
//       :minimum => 0
//     },
//     'max_vms' => {
//       :type => :integer,
//       :required => false,
//       :minimum => 0
//     },
//     'cooldown' => {
//       :type => :integer,
//       :required => false,
//       :minimum => 0
//     },
//     'elasticity_policies' => {
//       :type => :array,
//       :items => {
//         :type => :object,
//         :properties => {
//           'type' => {
//             :type => :string,
//             :enum => ['CHANGE', 'CARDINALITY', 'PERCENTAGE_CHANGE'],
//             :required => true
//           },
//           'adjust' => {
//             :type => :integer,
//             :required => true
//           },
//           'min_adjust_step' => {
//             :type => :integer,
//             :required => false,
//             :minimum => 1
//           },
//           'period_number' => {
//             :type => :integer,
//             :required => false,
//             :minimum => 0
//           },
//           'period' => {
//             :type => :integer,
//             :required => false,
//             :minimum => 0
//           },
//           'expression' => {
//             :type => :string,
//             :required => true
//           },
//           'cooldown' => {
//             :type => :integer,
//             :required => false,
//             :minimum => 0
//           }
//         }
//       }
//     },
//     'scheduled_policies' => {
//       :type => :array,
//       :items => {
//         :type => :object,
//         :properties => {
//           'type' => {
//             :type => :string,
//             :enum => ['CHANGE', 'CARDINALITY', 'PERCENTAGE_CHANGE'],
//             :required => true
//           },
//           'adjust' => {
//             :type => :integer,
//             :required => true
//           },
//           'min_adjust_step' => {
//             :type => :integer,
//             :required => false,
//             :minimum => 1
//           },
//           'start_time' => {
//             :type => :string,
//             :required => false
//           },
//           'recurrence' => {
//             :type => :string,
//             :required => false
//           }
//         }
//       }
//     }
//   }
// }

package role

type Role struct {
}

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

package role

type Role struct {
	Name            		string
	Cardinality     		int
	VMTemplate  				int
	Parents 						[]string
	MinVMs 							int
	MaxVMs 							int
	Cooldown 						int
	PolElasticity 			[]Elasticity
	PolScheduled 				[]SCheduled
}


# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

# Module containing commnon functions for Exporter and Restorer classes
module Commons

    private

    def create_tmp_folder(base_path)
        prefix = 'onevmdump'

        # Create temporal folder
        rc = @cmd.run('mktemp', '-d', '-p', base_path, "#{prefix}.XXX")

        unless rc[2].success?
            raise "Error creating temporal directory: #{rc[1]}"
        end

        # Return STDOUT
        rc[0].strip
    end

    def check_state(vm)
        state = vm.state_str
        lcm   = vm.lcm_state_str

        msg = "Invalid state: #{state}"
        raise msg unless self.class::VALID_STATES.include?(state)

        msg = "Invalid LCM state: #{lcm}"
        raise msg unless self.class::VALID_LCM_STATES.include?(lcm)
    end

    def running?
        @vm.lcm_state_str == 'RUNNING' || @vm.lcm_state_str == 'BACKUP'
    end

end

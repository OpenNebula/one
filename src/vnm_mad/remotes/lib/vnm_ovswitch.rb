# -*- mode: ruby -*-
# -------------------------------------------------------------------------- #
# Copyright 2006-2021, OpenNebula Project, OpenNebula Systems                #
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
# --------------------------------------------------------------------------#

# OVS VLAN configuration validation module
module VNMOvSwitch

  # Validate that the VLAN configuration does not have conflicting tag and trunks.
  # Tags and trunks should be integers or arrays of integers.
  #
  # @param vlan_config [Hash] with :tag and :trunks
  # @raise [StandardError] if tag is present and included in trunks
  def self.validate_vlan_config(vlan_config)
    tag = vlan_config[:tag]
    trunks = vlan_config[:trunks]

    # Only validate if both tag and trunks are present
    if !tag.nil? && !trunks.nil?
      # Normalize tag to integer
      tag_int = tag.to_i

      # Normalize trunks to an array of integers
      trunks_array = case trunks
                     when Array
                       trunks.map(&:to_i)
                     when String
                       trunks.split(',').map(&:strip).map(&:to_i)
                     else
                       []
                     end

      # Check if tag is included in trunks
      if trunks_array.include?(tag_int)
        raise "Conflicting VLAN configuration: tag #{tag_int} is also listed" \
              " in trunks #{trunks_array}. This configuration is ambiguous."
      end
    end
  end

end

# Example integration in the OVS network creation/update flow:
# In the method that builds the OVS port configuration, call:
#   VNMOvSwitch.validate_vlan_config(tag: vlan_id, trunks: trunk_ids)

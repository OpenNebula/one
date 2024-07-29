#!/usr/bin/env ruby

# -------------------------------------------------------------------------- */
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */

#
# Simple command to parse an URLs more elements (refer by keywords or params)
#

require 'uri'
require 'cgi'
require 'pp'

url = ARGV.shift

u = URI.parse(url)

SPECIAL_KEYS = {
    "PROTOCOL" => u.scheme,
    "USER"     => u.user,
    "PASSWORD" => u.password,
    "HOST"     => u.host,
    "PORT"     => u.port,
    "SOURCE"   => u.path
}

PARAMS = CGI.parse(u.query)

values = ""
ARGV.each do |key|
    key = key.to_s
    if key.downcase.start_with?("param_")
        param = key.gsub(/^param_/i,"")
        value = PARAMS[param]
        value = [value].flatten.first || ""
        values << value
    else
        value = SPECIAL_KEYS[key] || ""
        values << value
    end
    values << "\0"
end

puts values

exit 0

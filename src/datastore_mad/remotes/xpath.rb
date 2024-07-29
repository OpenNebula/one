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
# Simple command to parse an XML document (b64 encoded) and return one or more
# elements (refer by xpath)
#
require 'base64'
require 'rexml/document'
require 'getoptlong'
require 'pp'

opts = opts = GetoptLong.new(
    [ '--stdin',   '-s', GetoptLong::NO_ARGUMENT ],
    [ '--subtree', '-t', GetoptLong::NO_ARGUMENT ],
    [ '--base64',  '-b', GetoptLong::REQUIRED_ARGUMENT ]
)

source = :stdin
tmp64  = ""
subtree = false

begin
    opts.each do |opt, arg|
        case opt
            when '--stdin'
                source = :stdin
            when '--subtree'
                subtree = true
            when '--base64'
                source = :b64
                tmp64  = arg
        end
    end
rescue Exception => e
    exit(-1)
end

values = ""

case source
when :stdin
    tmp = STDIN.read
when :b64
    tmp = Base64::decode64(tmp64)
end

xml = REXML::Document.new(tmp).root

ARGV.each do |xpath|
    if xpath.match(/^%m%/)
        xpath = xpath[3..-1]
        ar = xml.elements.to_a(xpath).map {|t| t.text }
        values << ar.join(' ')
    else
        element = xml.elements[xpath.dup]
        if !element.nil?
            if subtree
                values << ( element.to_s || '' )
            else
                values << ( element.text || '' )
            end
        end
    end
    values << "\0"
end

puts values

exit 0

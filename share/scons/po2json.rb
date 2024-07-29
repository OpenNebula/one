#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

if RUBY_VERSION >= "1.9"
    Encoding.default_external = Encoding::UTF_8
    Encoding.default_internal = Encoding::UTF_8
end

if !ARGV[0]
    puts "Usage ./po2json.rb <file.po> > <output.js>"
    exit 1
end

po_file = File.open(ARGV[0])

lang = File.basename(ARGV[0]).split('.')[0]
datatable_lang = lang.split("_")[0]

puts "lang=\"#{lang}\""
puts "datatable_lang=\"#{datatable_lang}_datatable.txt\""
puts "locale={"

msgid = nil
tr_lines = []
po_file.each do |line|
    if msgid
        msgstr = line.sub("msgstr ", "").chomp
        tr_lines << "    #{msgid}:#{msgstr}"
        msgid = nil
        next
    end

    if line.include?("msgid")
        msgid = line.sub("msgid ", "").chomp

        if msgid.length == 0 || msgid.slice(0,1) == '#'
            msgid = nil
        end
    end

end

tr_lines[0..-2].each do |line|
    puts line+','
end
# last line must not have an ending , for IE7 JS compatibility
puts tr_lines[-1]

puts "}"

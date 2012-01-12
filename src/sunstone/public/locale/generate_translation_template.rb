#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

tr_strings = `grep -h -o -R -e 'tr("[[:print:]]*")' ../js/* | cut -d'"' -f 2 | sort -u`

puts "//Translated by"
puts 'lang="en_US"'
puts 'datatable_lang=""'
puts "locale={"

tr_strings.each_line do | line |
    puts "    \"#{line.chomp}\":\"\","
end

puts "};"

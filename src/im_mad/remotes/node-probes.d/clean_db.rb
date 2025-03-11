#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
require 'fileutils'

begin
    FILE_PATTERN  = '*.db'
    DB_DIR_PATH   = '/var/tmp/one_db/'
    OLD_THRESHOLD = 6 * 7 * 24 * 60 * 60 # 6 weeks in seconds

    threshold = Time.now - OLD_THRESHOLD

    Dir.glob(File.join(DB_DIR_PATH, FILE_PATTERN)).each do |file|
        if File.file?(file) && File.mtime(file) < threshold
          File.delete(file)
        end
    end

rescue StandardError
end

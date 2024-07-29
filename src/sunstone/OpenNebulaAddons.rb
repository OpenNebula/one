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

require 'rubygems'
require 'json'

ADDONS_LOCATION = SUNSTONE_LOCATION + "/public/app/addons/dist"
MAIN_DIST_PATH  = SUNSTONE_LOCATION + "/public/dist/main-dist.js"
MAIN_PATH       = VAR_LOCATION + "/sunstone/main.js"

class OpenNebulaAddons
    def initialize(logger)
        @logger = logger

        main      = File.new(MAIN_PATH, "w")
        main_dist = File.new(MAIN_DIST_PATH, "r")

        files = Dir["#{ADDONS_LOCATION}/*"].select{ |f| File.file? f }

        lines = main_dist.gets

        while lines != nil
            main << lines

            if lines.include? "// start-addon-section //"
                load_start_section(files, main)
            end

            if lines.include? "'addons/start'"
                load_list_start(files, main)
            end

            lines = main_dist.gets
        end

        main_dist.close
        main.close
    end

    private

    def load_start_section(files, tmp)
        files.each do |file|
            add = File.new(file, "r")

            add.each do |line|
                tmp << line if !line.include? "// list-start //"
            end

            add.close
        end
    end

    def load_list_start(files, tmp)
        files.each do |file|
            add  = File.new(file, "r")

            line = add.gets

            while line != nil
                if line.include? "// list-start //"
                    line = add.gets
                    while line != nil
                        tmp << line
                        line = add.gets
                    end
                end
                line = add.gets
            end

            add.close
        end
    end
end
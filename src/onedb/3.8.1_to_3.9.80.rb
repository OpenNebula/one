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

require 'set'
require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.9.80"
    end

    def one_version
        "OpenNebula 3.9.80"
    end

    def up

        ########################################################################
        # Add Cloning Image ID collection to Images
        ########################################################################

        counters = {}
        counters[:image] = {}

        # Init image counters
        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            if counters[:image][row[:oid]].nil?
                counters[:image][row[:oid]] = {
                    :clones => Set.new
                }
            end

            doc = Document.new(row[:body])

            doc.root.each_element("CLONING_ID") do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    counters[:image][img_id] = {
                        :clones => Set.new
                    }
                end

                counters[:image][img_id][:clones].add(row[:oid])
            end
        end

        ########################################################################
        # Image
        #
        # IMAGE/CLONING_OPS
        # IMAGE/CLONES/ID
        ########################################################################

        @db.run "CREATE TABLE image_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db[:image_pool].each do |row|
            doc = Document.new(row[:body])

            oid = row[:oid]

            n_cloning_ops = counters[:image][oid][:clones].size

            # Rewrite number of clones
            doc.root.each_element("CLONING_OPS") { |e|
                if e.text != n_cloning_ops.to_s
                    warn("Image #{oid} CLONING_OPS has #{e.text} \tis\t#{n_cloning_ops}")
                    e.text = n_cloning_ops
                end
            }

            # re-do list of Images cloning this one
            clones_new_elem = doc.root.add_element("CLONES")

            counters[:image][oid][:clones].each do |id|
                clones_new_elem.add_element("ID").text = id.to_s
            end

            row[:body] = doc.to_s

            # commit
            @db[:image_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")

        ########################################################################
        #
        # Banner for the new /var/lib/one/vms directory
        #
        ########################################################################

        puts
        puts "ATTENTION: manual intervention required".red
        puts <<-END.gsub(/^ {8}/, '')
        Virtual Machine deployment files have been moved from /var/lib/one to
        /var/lib/one/vms. You need to move these files manually:

            $ mv /var/lib/one/[0-9]* /var/lib/one/vms

        END

        return true
    end
end

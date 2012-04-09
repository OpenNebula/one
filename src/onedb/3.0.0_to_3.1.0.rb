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

require 'digest/sha1'
require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.1.0"
    end

    def one_version
        "OpenNebula 3.1.0"
    end

    def up
        ########################################################################
        # Update table definitions
        ########################################################################

        puts "    > Users need to have an authentication driver defined.\n"<<
             "      If you have AUTH_MAD uncommented in oned.conf, enter the driver name,\n"<<
             "      or press enter to use the default value.\n\n"
        print "      Driver name (x509, ssh, ldap): "
        auth_driver = gets.chomp

        [   [:group_pool,   "group"],
            [:host_pool,    "host"],
            [:image_pool,   "image"],
            [:network_pool, "network"],
            [:template_pool,"template"],
            [:user_pool,    "user"],
            [:vm_pool,      "vm"]
        ].each { |pair|
            # Check that all objects have names shorter that 128
            check_names(pair[0], pair[1])

            # Change the name column to 128 chars. In SQLite, ALTER COLUMN is
            # not supported, but since the char limit is ignored,
            # VARCHAR(128) and VARCHAR(256) are the same type
            if ( self.class == BackEndMySQL )
                @db.run "ALTER TABLE #{pair[0]} CHANGE name name VARCHAR(128);"
            end
        }

        ########################################################################
        # Add new attributes to images
        ########################################################################

        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            fstype = ""
            doc.root.each_element("TEMPLATE/FSTYPE") { |e|
                fstype = e.text
            }

            fstype_elem      = doc.root.add_element("FSTYPE")
            fstype_elem.text = fstype

            path = ""
            doc.root.each_element("TEMPLATE/PATH") { |e|
                path = e.text
            }

            path_elem       = doc.root.add_element("PATH")
            path_elem.text  = path

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :public     => row[:public])
        end

        @db.run "DROP TABLE old_image_pool;"

        ########################################################################
        # Add new attributes to users
        ########################################################################

        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_user_pool") do |row|
            doc = Document.new(row[:body])

            # TODO: Try to guess if the password contains a DN and set the
            # driver to 'x509', or assume ssh if the password is not hex
            auth_elem      = doc.root.add_element("AUTH_DRIVER")

            pass = ""
            doc.root.each_element("PASSWORD") { |e|
                pass = e.text
            }

            if ( auth_driver.empty? || pass =~ /^(\d|[a-fA-F]){40}$/ )
                auth_elem.text = "core"
            else
                auth_elem.text = auth_driver
            end

            doc.root.add_element("TEMPLATE")

            @db[:user_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s)
        end

        @db.run "DROP TABLE old_user_pool;"

        ########################################################################
        # Create new serveradmin user
        ########################################################################

        username        = "serveradmin"
        found           = false
        oneadmin_row    = nil
        user_oid        = nil

        @db.fetch("SELECT * FROM user_pool WHERE name='#{username}'") do |row|
            found = true
        end

        if ( found )
            puts "    > Trying to create user '#{username}' "<<
                "for Sunstone and public servers operation;\n"<<
                "      but a user with that name already exists. "<<
                "You will need to create manually a new user, visit\n"<<
                "      http://opennebula.org/documentation:rel3.2:upgrade"
        else
            @db.fetch("SELECT * FROM user_pool WHERE oid=0") do |row|
                oneadmin_row = row
            end

            @db.fetch("SELECT last_oid FROM pool_control WHERE tablename='user_pool'") do |row|
                user_oid = (row[:last_oid].to_i + 1)
            end

            doc = Document.new(oneadmin_row[:body])

            doc.root.each_element("ID") { |e|
                e.text = (user_oid).to_s
            }

            doc.root.each_element("GID") { |e|
                e.text = "0"
            }

            doc.root.each_element("NAME") { |e|
                e.text = username
            }

            doc.root.each_element("AUTH_DRIVER") { |e|
                e.text = "server_cipher"
            }

            pass = Digest::SHA1.hexdigest( rand(10000).to_s )

            doc.root.each_element("PASSWORD") { |e|
                e.text = Digest::SHA1.hexdigest( pass )
            }

            # Insert new user
            @db[:user_pool].insert(
                :oid        => user_oid,
                :name       => username,
                :body       => doc.root.to_s)

            # Update last oid in pool_control
            @db.run("UPDATE pool_control SET last_oid=#{user_oid} WHERE tablename='user_pool';")

            # Insert new user ID in oneadmin group

            @db.fetch("SELECT body FROM group_pool WHERE oid=0") do |row|
                doc = Document.new(row[:body])
            end

            doc.root.each_element("USERS"){ |e|
                new_elem = e.add_element("ID")
                new_elem.text = user_oid
            }

            @db.run("UPDATE group_pool SET body='#{doc.root.to_s}' WHERE oid=0;")

            # Create new config files

            new_auth = "#{username}:#{pass}\n"

            begin
                dir = "#{VAR_LOCATION}/.one"
                if ( !File.directory?(dir) )
                    Dir.mkdir(dir, 0700)
                end

                ["sunstone_auth", "occi_auth", "ec2_auth"].each { |name|
                    File.open("#{dir}/#{name}", 'w', 0600) {|f|
                        f.write(new_auth)
                    }
                }
            rescue
                puts "Error trying to create new configuration files in #{dir}"
                return false
            end

            puts "    > New user '#{username}' created "<<
                "for Sunstone and public servers operation.\n"<<
                "      You have three new authentication files in #{dir}.\n"<<
                "      For more information, visit\n"<<
                "      http://opennebula.org/documentation:rel3.2:upgrade"
        end

        return true
    end

    def check_names(table, elem)
        @db.run "CREATE TABLE migrator_tmp (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT);"

        @db.fetch("SELECT * FROM #{table}") do |row|
            if ( row[:name].length > 128 )
                # Element name is bigger than 128 chars
                new_name = "#{elem}-#{row[:oid]}-#{row[:name][0..99]}"

                doc = Document.new(row[:body])

                doc.root.each_element("NAME") { |e|
                    e.text = new_name
                }

                @db[:migrator_tmp].insert(
                    :oid        => row[:oid],
                    :name       => new_name,
                    :body       => doc.root.to_s)

                puts "    > #{elem} ##{row[:oid]} had a name bigger than 128 chars and has been renamed to #{new_name[0..10]}..."
            end
        end

        @db.fetch("SELECT * FROM migrator_tmp") do |row|
            @db[table].filter(:oid => row[:oid]).update(
                :name => row[:name],
                :body => row[:body])
        end

        @db.run "DROP TABLE migrator_tmp"
    end
end

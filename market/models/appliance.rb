# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

require 'uri'
require 'net/http'

class Appliance
    COLLECTION_NAME = 'appliances'

    # Appliances will be created by default in this catalog
    #   This catalog is accesible for all the users even anonymous ones.
    PUBLIC_CATALOG = 'community'

    FILE_SCHEMA = {
        :type => :object,
        :properties => {
            'type' => {
                :type => :string,
                :enum => ['OS'],
                :default => 'OS'
            },
            'hypervisor' => {
                :type => :string,
                :enum => %w{VMWARE XEN KVM},
                :default => 'all'
            },
            'format' => {
                :type => :string,
                :enum => %w{raw vmdk qcow2 vdi},
                :default => 'raw'
            },
            'size' => {
                :type => :string,
                :required => true
            },
            'compression' => {
                :type => :string,
                :enum => %w{bz2 gzip},
                :default => 'none'
            },
            'os-id' => {
                :type => :string,
                :default => ''
            },
            'os-release' => {
                :type => :string,
                :default => ''
            },
            'os-arch' => {
                :type => :string,
                :default => 'x86_64'
            },
            'url' => {
                :type => :string,
                :format => :uri,
                :required => true
            },
            'md5' => {
                :type => :string
            },
            'sha1' => {
                :type => :string
            }
        }
    }

    SCHEMA = {
        :type => :object,
        :properties => {
            'name' => {
                :type => :string,
                :required => true
            },
            'catalog' => {
                :type => :null,
                :default => PUBLIC_CATALOG
            },
            'logo' => {
                :type => :null,
                :format => :uri,
                :default => "/img/logos/default.png"
            },
            'tags' => {
                :type => :array,
                :items => {
                    :type => :string
                },
                :default => []
            },
            'description' => {
                :type => :string,
                :required => true
            },
            'short_description' => {
                :type => :string,
                :required => true
            },
            'version' => {
                :type => :string,
                :default => '1.0'
            },
            'opennebula_version' => {
                :type => :string,
                :default => 'all'
            },
            'opennebula_template' => {
                :type => :string
            },
            'files' => {
                :type => :array,
                :items => FILE_SCHEMA,
                :required => true
            },
            'visits' => {
                :type => :null,
                :default => 0
            },
            'downloads' => {
                :type => :null,
                :default => 0
            }
        }
    }

    ADMIN_SCHEMA = {
        :extends => SCHEMA,
        :properties => {
            'catalog' => {
                :type => :string
            },
            'logo' => {
                :type => :string
            }
        }
    }

    # TBD ADMIN_SCHEMA_MERGED

    # Create a new appliance in the database
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [Hash] hash the values to be inserted in the DB
    # @return [OrderedHash]
    def self.create(session, hash)
        # Only admin users can define the catalog
        validator = Validator::Validator.new(
            :default_values => true,
            :delete_extra_properties => false
        )

        validator.validate!(hash, session.schema(:appliance))

        hash['publisher'] = session.publisher

        # Remove for OpenNebula 3.6
        checksum = Hash.new
        checksum['md5'] = hash['files'][0]['md5'] if hash['files'][0]['md5']
        checksum['sha1'] = hash['files'][0]['sha1'] if hash['files'][0]['sha1']
        hash['files'][0]['checksum'] = checksum

#        if hash['files'][0]['url']
#            uri = URI.parse(hash['files'][0]['url'])
#
#            begin
#                response = nil
#                Net::HTTP.start(uri.host,uri.port) do |http|
#                    response = http.head(uri.path)
#                end
#
#                hash['files'][0]['size'] = response.content_length
#            rescue
#                raise "The URL is not valid"
#            end
#        end
#
        app_collection.insert(hash)
    end

    # Show  metadata of a given appliance.
    #   The role of the user will be used to filter the appliance
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [String] app_id id of the appliance
    # @return [OrderedHash] contains the metadata of the appliance
    def self.show(session, app_id)
        filter = generate_filter(session, app_id)
        fields = exclude_fields(session)

        app = app_collection.find_one(filter, :fields => fields)

        if app != nil
            app_collection.update(filter, "$inc" => { 'visits' => 1 })

            if app['publisher'] == session.publisher
                # if the session user is the owner, retrieve all the metadata
                app = app_collection.find_one(filter)
            end
        end

        app
    end

    # Update the metadata of a given appliance.
    #   The role of the user will be used to filter the appliance
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [String] app_id id of the appliance
    # @param [String] hash metadata to be updated
    # @return [OrderedHash] contains the metadata of the appliance
    def self.update(session, app_id, hash)
        validator = Validator::Validator.new(
            :default_values => false,
            :delete_extra_properties => true
        )

        validator.validate!(hash, session.schema(:appliance))

        filter = generate_filter(session, app_id)

        # Only owners or admin can update appliances
        if !session.admin?
            filter['publisher'] = session.publisher
        end

        app = app_collection.find_one(filter)
        if app.nil?
            return nil
        end

        # Remove for OpenNebula 3.6
        checksum = Hash.new
        checksum['md5'] = hash['files'][0]['md5'] if hash['files'][0]['md5']
        checksum['sha1'] = hash['files'][0]['sha1'] if hash['files'][0]['sha1']
        hash['files'][0]['checksum'] = checksum

#        if hash['files'][0]['url']
#            uri = URI.parse(hash['files'][0]['url'])
#
#            begin
#                response = nil
#                Net::HTTP.start(uri.host,uri.port) do |http|
#                    response = http.head(uri.path)
#                end
#
#                hash['files'][0]['size'] = response.content_length
#            rescue
#                raise "The URL is not valid"
#            end
#        end
#
        doc = app.deep_merge(hash)

        app_collection.update(filter, doc)
    end

    # Delete a given appliance.
    #   The role of the user will be used to filter the appliance
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [String] app_id id of the appliance
    # @return [OrderedHash] contains the metadata of the appliance
    def self.delete(session, app_id)
        filter = generate_filter(session, app_id)

        # Only owners or admin can delete appliances
        if !session.admin?
            filter['publisher'] = session.publisher
        end

        app = app_collection.remove(filter)
    end

    # Get the link to download a file
    #   The role of the user will be used to filter the appliance
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [Hash] hash the value to be inserted in the DB
    # @param [Integer] file_id the fiel file that will be downloaded, default value: 0
    # @return [String] url of the file
    def self.file_url(session, id, file_id=0)
        filter = generate_filter(session, id)

        app = app_collection.find_one(filter)

        app_collection.update(filter, "$inc" => { 'downloads' => 1 })

        app['files'][file_id]['url']
    end

    # List  metadata of all the appliances
    #   The role of the user will be used to filter the appliance list
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @return [Array] an array of OrderedHashes
    def self.list(session)
        filter = generate_filter(session, nil)
        fields = exclude_fields(session)

        apps = app_collection.find(filter, :fields => fields).to_a

        apps
    end

    private

    # @return [Collection] the appliances collection
    def self.app_collection
        DB[COLLECTION_NAME]
    end

    # Generate a Hash containing the filter to be applied to the query
    #
    # @params [Session] session an instance of Session containing the user permisions
    # @param [String] app_id id of the appliance
    # @return [Hash] a hash containing the contraints
    def self.generate_filter(session, app_id)
        filter = Hash.new

        if session.allowed_catalogs
            filter["catalog"] = {
                "$in" => session.allowed_catalogs
            }
        end

        if app_id
            filter["_id"] = BSON::ObjectId(app_id)
        end

        filter
    end

    # Generate a Hash containing the fields to be excluded, a key with value
    #   0 will be excluded.
    #
    # @params [Session] session an instance of Session containing the user permisions
    # @return [Hash] a hash of fields
    def self.exclude_fields(session)
        if session.admin?
            nil
        else
            {
                "files.url" => 0,
                'visits'    => 0
            }
        end
    end
end

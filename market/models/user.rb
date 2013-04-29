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

require 'bcrypt'

class User
    COLLECTION_NAME = 'users'

    # User will be created by default in this role
    USER_ROLE  = 'user'
    ADMIN_ROLE = 'admin'

    SCHEMA = {
        :type => :object,
        :properties => {
            'organization' => {
                :type => :string,
                :required => true
            },
            'first_name' => {
                :type => :string,
                :required => true
            },
            'last_name' => {
                :type => :string,
                :required => true
            },
            'username' => {
                :type => :string,
                :required => true
            },
            'password' => {
                :type => :string,
                :required => true
            },
            'website' => {
                :type => :string,
                :format => :uri
            },
            'email' => {
                :type => :string,
                :required => true
            },
            'role' => {
                :type => :null,
                :default => USER_ROLE
            },
            'status' => {
                :type => :null,
                :default => 'disabled'
            }
        }
    }

    ADMIN_SCHEMA = {
        :extends => SCHEMA,
        :properties => {
            'role' => {
                :type => :string
            },
            'status' => {
                :type => :string
            }
        }
    }

    # TBD ADMIN_SCHEMA_MERGED

    def self.create(session, hash)
        validator = Validator::Validator.new(
            :default_values => true,
            :delete_extra_properties => false
        )

        validator.validate!(hash, session.schema(:user))

        hash['password'] = generate_password(hash['password'])

        user_collection.insert(hash, {:safe => true})
    end

    def self.show(session, user_id)
        fields = exclude_fields(session)
        filter = generate_filter(session, user_id)

        user_collection.find_one(filter, :fields => fields)
    end

    def self.list(session)
        fields = exclude_fields(session)

        user_collection.find(nil, :fields => fields).to_a
    end

    # Delete a given user.
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [String] user id
    # @return [OrderedHash] contains the metadata of the appliance
    def self.delete(session, user_id)
        filter = generate_filter(session, user_id)

        user = user_collection.remove(filter)
    end

    def self.enable(session, user_id)
        filter = generate_filter(session, user_id)

        user_collection.update(filter, {'$set' => {'status' => 'enabled'}})
    end

    # Update the metadata of a given user.
    #
    # @param [Session] session an instance of Session containing the user permisions
    # @param [String] user_id id of the user
    # @param [String] hash metadata to be updated
    # @return [OrderedHash] contains the metadata of the userliance
    def self.update(session, user_id, hash)
        validator = Validator::Validator.new(
            :default_values => false,
            :delete_extra_properties => true
        )

        filter = generate_filter(session, user_id)

        user = user_collection.find_one(filter)
        if user.nil?
            return nil
        end

        if !hash['password']
            hash['password'] = user['password']
        else
            hash['password'] = generate_password(hash['password'])
        end

        validator.validate!(hash, session.schema(:user))

        doc = user.deep_merge(hash)

        user_collection.update(filter, doc)
    end

    def self.bootstrap(user_config_hash)
        if user_collection.count == 0
            user_collection.create_index('username', :unique => true)
            user_collection.create_index('organization', :unique => true)

            default_params = {
                'role'     => 'admin',
                'status'   => 'enabled'
            }

            user_hash = user_config_hash.merge(default_params)

            user_hash['password'] = generate_password(user_hash.delete('password'))

            user_collection.insert(user_hash)
        end
    end

    #
    def self.retrieve(username, password)
        user = user_collection.find_one(
            "username" => username,
            "status" => "enabled"
            )

        if user && check_password(user, password)
            return user
        else
            return nil
        end
    end

    private

    # Generate a Hash containing the filter to be applied to the query
    #
    # @params [Session] session an instance of Session containing the user permisions
    # @param [String] user_id id of the user
    # @return [Hash] a hash containing the contraints
    def self.generate_filter(session, user_id)
        filter = Hash.new

        if user_id
            filter["_id"] = BSON::ObjectId(user_id)
        end

        filter
    end

    # Generate a Hash containing the fields to be excluded, a key with value
    #   0 will be excluded.
    #
    # @params [Session] session an instance of Session containing the user permisions
    # @return [Hash] a hash of fields
    def self.exclude_fields(session)
        {
            'password' => 0
        }
    end

    def self.user_collection
        DB[COLLECTION_NAME]
    end

    # Generate a password to be stored in the DB
    # @param [String] password
    # @return [String]
    def self.generate_password(password)
        BCrypt::Password.create(password)
    end

    # Check if the password provided match the user password
    # @param [User] user info from the DB
    # @param [String] password provided by the user
    # @return [true, false]
    def self.check_password(user, password)
        bcrypt_pass = BCrypt::Password.new(user['password'])

        return (bcrypt_pass == password)
    end
end
# ---------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

$: << ".."

require 'ldap_auth'

options={
    :host => 'ubuntu-test',
    :base => 'dc=localdomain'
}

describe LdapAuth do
    before(:all) do
        @ldap=LdapAuth.new(options)
    end

    it 'should find user dn' do
        name=@ldap.find_user('user01')
        name.should=='cn=user01,dc=localdomain'

        name=@ldap.find_user('user02')
        name.should=='cn=user02,dc=localdomain'

        name=@ldap.find_user('user03')
        name.should==nil

        name=@ldap.find_user('cn=user01,dc=localdomain')
        name.should=='cn=user01,dc=localdomain'
    end

    it 'should tell if a user is in a group' do
        group='cn=cloud,ou=groups,dc=localdomain'

        result=@ldap.is_in_group?('cn=user01,dc=localdomain', group)
        result.should==true

        result=@ldap.is_in_group?('cn=user02,dc=localdomain', group)
        result.should==false
    end

    it 'should authenticate user' do
        result=@ldap.authenticate('cn=user01,dc=localdomain', 'password01')
        result.should==true

        result=@ldap.authenticate('cn=user02,dc=localdomain', 'password02')
        result.should==true

        result=@ldap.authenticate('cn=user01,dc=localdomain', 'password02')
        result.should==false

        result=@ldap.authenticate('user01,dc=localdomain', 'password01')
        result.should==false
    end

end


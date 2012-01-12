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

$: << '../'
$: << '../../../../sunstone/models'
$: << '../../../../oca/ruby'

require 'rubygems'
require 'data_mapper'

module OZones

    describe "Library using OZones" do
        before(:all) do
            # Create the DB, with sqlite
            db_url = "sqlite://" +  File.expand_path(".") + "/ozones-test.db"

            #DataMapper::Logger.new($stdout, :debug)
            DataMapper.setup(:default, db_url)

            require 'OZones'

            DataMapper.finalize
            DataMapper.auto_upgrade!
            
            @zoneA = OZones::Zones.create(
                     :name     =>    "zoneA",
                     :onename  =>    "oneadminA",
                     :onepass  =>    "onepassA",
                     :endpoint =>    "http://zonea.zoneadomain.za:2633/RPC2"
                    )
                    
            @zoneB = OZones::Zones.create(
                     :name     =>    "zoneB",
                     :onename  =>    "oneadminB",
                     :onepass  =>    "onepassB",
                     :endpoint =>    "http://zoneb.zoneadomain.za:2634/RPC2",
                     :sunsendpoint =>"http://zoneb.zoneadomain.za:9869"
                    )
                    
            @vdca = OZones::Vdc.create(
                     :name          => "vdca",
                     :vdcadminname  => "vdcadminA"
                    )

            @vdcb1 = OZones::Vdc.create(
                     :name          => "vdcb",
                     :vdcadminname  => "vdcadminB",
                     :hosts         => "1,4,5"
                    )
            
            @vdcb2 = OZones::Vdc.create(
                     :name          => "vdcc",
                     :vdcadminname  => "vdcadminC",
                     :hosts         => "1,7"
                    )
            
            @zoneA.vdcs << @vdca
            @zoneB.vdcs << @vdcb1
            @zoneB.vdcs << @vdcb2
            
            @zoneA.save
            @zoneB.save
        end
                
        it "should be able to write an Apache htaccess to proxy petitions to vdcs" do
            pr = OZones::ProxyRules.new("apache",File.dirname(__FILE__) + "/htaccess")
            pr.update
            
            generated = IO.read("spec/htaccess")
            golden    = IO.read("htaccess.golden")
            
            generated.should eql(golden)
        end
    end
end




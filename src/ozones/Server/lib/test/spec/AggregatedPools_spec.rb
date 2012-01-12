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
$: << 'helpers'
$: << '../../../../sunstone/models'

require 'rubygems'
require 'data_mapper'

module OZones

    describe "Aggregated Pools" do
        before(:all) do
            # Create the DB, with sqlite
            db_url = "sqlite://" +  File.expand_path(".") + "/ozones-test.db"
            
            @fixtures_path = File.expand_path(".") + "/fixtures"

            #DataMapper::Logger.new($stdout, :debug)
            DataMapper.setup(:default, db_url)

            require 'OZones'

            DataMapper.finalize
            DataMapper.auto_upgrade!
            
            # Create Zones
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
                     :endpoint =>    "http://zoneb.zoneadomain.za:2634/RPC2"
                    )
               
            # Create VDCs        
            @vdca = OZones::Vdc.create(
                     :name     =>    "vdca",
                     :vdcadminname  => "vdcadminB"
                    )

            @vdcb1 = OZones::Vdc.create(
                     :name     =>    "vdcb",
                     :vdcadminname  => "vdcadminB",
                     :hosts         => "1"
                    )
            
            @vdcb2 = OZones::Vdc.create(
                     :name     =>    "vdcc",
                     :vdcadminname  => "vdcadminB",
                     :hosts         => "7,9,29"
                    )
            
            @zoneA.vdcs << @vdca
            @zoneB.vdcs << @vdcb1
            @zoneB.vdcs << @vdcb2
            
            @zoneA.save
            @zoneB.save
        end
                
        it "should be able to retrieve an aggregated host pool" do
            ahp      = AggregatedHosts.new
            ahp_json = ahp.to_json 
            
            golden = File.read(@fixtures_path+"/json/aggregatedhosts.json")
            golden_hash = JSON.parse(golden)
            
            ahp_hash    = JSON.parse(ahp_json)
            
            result = ahp_hash === golden_hash
            result.should eql(true)
            
        end
        
        it "should be able to retrieve an aggregated vm pool" do
            avmp      = AggregatedVirtualMachines.new
            avmp_json = avmp.to_json
            
            golden = File.read(@fixtures_path+"/json/aggregatedvms.json")
            golden_hash = JSON.parse(golden)
            
            ahmp_hash   = JSON.parse(avmp_json)
            
            result = ahmp_hash === golden_hash
            result.should eql(true)              
        end
        
        it "should be able to retrieve an aggregated image pool" do
            aip       = AggregatedImages.new
            aip_json  = aip.to_json
            
            golden = File.read(@fixtures_path+"/json/aggregatedimages.json")
            golden_hash = JSON.parse(golden)
            
            ahip_hash   = JSON.parse(aip_json)
            
            result = ahip_hash === golden_hash
            result.should eql(true)                             
        end  
        
        it "should be able to retrieve an aggregated network pool" do
            avnp       = AggregatedVirtualNetworks.new
            avnp_json  = avnp.to_json
            
            golden = File.read(@fixtures_path+"/json/aggregatedvns.json")
            golden_hash = JSON.parse(golden)
            
            ahnp_hash   = JSON.parse(avnp_json) 
            
            result = ahnp_hash === golden_hash
            result.should eql(true)                
        end  
        
        it "should be able to retrieve an aggregated user pool" do
            aup        = AggregatedUsers.new
            aup_json   = aup.to_json
            
            golden = File.read(@fixtures_path+"/json/aggregatedusers.json")
            golden_hash = JSON.parse(golden)
            
            ahup_hash   = JSON.parse(aup_json) 
            
            result = ahup_hash === golden_hash
            result.should eql(true)                 
        end 
        
        it "should be able to retrieve an aggregated template pool" do
            atp        = AggregatedTemplates.new
            atp_json   = atp.to_json
            
            golden = File.read(@fixtures_path+"/json/aggregatedtemplates.json")
            golden_hash = JSON.parse(golden)
            
            ahtp_hash   = JSON.parse(atp_json) 
            
            result = ahtp_hash === golden_hash
            result.should eql(true)                  
        end       
    end
end
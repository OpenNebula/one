$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "VirtualNetwork using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            client = MockClient.new()
            @vnet_pool = VirtualNetworkPool.new(client)
        end
        
        #it "should get nil, trying to get a hash, if the info method was not called before" do
        #    vnet_hash = @vnet_pool.to_hash
        #    vnet_hash.nil?.should eql(true)
        #end
        
        it "should update the VNET_POOL info" do
            rc = @vnet_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the VNET_POOL elements and get info from them" do
            rc = @vnet_pool.each{ |vn|
                vn.class.to_s.should eql("OpenNebula::VirtualNetwork")
                if vn.id == 4
                    vn.name.should eql('Red LAN')
                    vn['UID'].should eql('0')
                    vn['USERNAME'].should eql('oneadmin')
                    vn['TYPE'].should eql('0')
                    vn['BRIDGE'].should eql('vbr0')
                    vn['TOTAL_LEASES'].should eql('0')
                elsif vn.id == 5
                    vn.name.should eql('Public')
                    vn['UID'].should eql('0')
                    vn['USERNAME'].should eql('oneadmin')
                    vn['TYPE'].should eql('0')
                    vn['BRIDGE'].should eql('vbr0')
                    vn['TOTAL_LEASES'].should eql('1')
                end
            }
        end
    end
    
    describe "VirtualNetwork using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            client = MockClient.new()
            @vnet_pool = VirtualNetworkPool.new(client)
        end

        #it "should get nil, trying to get a hash, if the info method was not called before" do
        #    vnet_hash = @vnet_pool.to_hash
        #    vnet_hash.nil?.should eql(true)
        #end
        
        it "should update the VNET_POOL info" do
            rc = @vnet_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the VNET_POOL elements and get info from them" do
            rc = @vnet_pool.each{ |vn|
                vn.class.to_s.should eql("OpenNebula::VirtualNetwork")
                if vn.id == 4
                    vn.name.should eql('Red LAN')
                    vn['UID'].should eql('0')
                    vn['USERNAME'].should eql('oneadmin')
                    vn['TYPE'].should eql('0')
                    vn['BRIDGE'].should eql('vbr0')
                    vn['TOTAL_LEASES'].should eql('0')
                elsif vn.id == 5
                    vn.name.should eql('Public')
                    vn['UID'].should eql('0')
                    vn['USERNAME'].should eql('oneadmin')
                    vn['TYPE'].should eql('0')
                    vn['BRIDGE'].should eql('vbr0')
                    vn['TOTAL_LEASES'].should eql('1')
                end
            }
        end
    end
end

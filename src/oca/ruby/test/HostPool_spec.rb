$: << '../'

require 'OpenNebula'
require 'MockClient'

module OpenNebula

    describe "Host using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            client = MockClient.new()
            @host_pool = HostPool.new(client)
        end
        
        it "should update the HOST_POOL info" do
            rc = @host_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the HOST_POOL elements and get info from them" do
            rc = @host_pool.each{ |host|
                host.class.to_s.should eql("OpenNebula::Host")
                if host.id == 0
                    host.name.should eql('dummyhost')
                elsif host.id == 1
                    host.name.should eql('thost')
                end
            }
        end
        
        it "should get a hash representation of the HOST_POOL" do
            host_hash = @host_pool.to_hash
            host_hash['HOST_POOL']['HOST'][0]['ID'].should eql('0')
            host_hash['HOST_POOL']['HOST'][0]['NAME'].should eql('dummyhost')
            host_hash['HOST_POOL']['HOST'][0]['STATE'].should eql('2')
            host_hash['HOST_POOL']['HOST'][0]['IM_MAD'].should eql('im_dummy')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['MEM_USAGE'].should eql('1572864')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['CPU_USAGE'].should eql('300')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['FREE_MEM'].should eql('16777216')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['RUNNING_VMS'].should eql('3')
            host_hash['HOST_POOL']['HOST'][1]['ID'].should eql('1')
            host_hash['HOST_POOL']['HOST'][1]['NAME'].should eql('thost')
            host_hash['HOST_POOL']['HOST'][1]['STATE'].should eql('2')
            host_hash['HOST_POOL']['HOST'][1]['IM_MAD'].should eql('im_dummy')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['MEM_USAGE'].should eql('0')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['CPU_USAGE'].should eql('0')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['FREE_MEM'].should eql('16777216')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['RUNNING_VMS'].should eql('0')
        end
    end
    
    describe "Host using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            client = MockClient.new()
            @host_pool = HostPool.new(client)
        end
        
        it "should update the HOST_POOL info" do
            rc = @host_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the HOST_POOL elements and get info from them" do
            rc = @host_pool.each{ |host|
                host.class.to_s.should eql("OpenNebula::Host")
                if host.id == 0
                    host.name.should eql('dummyhost')
                elsif host.id == 1
                    host.name.should eql('thost')
                end
            }
        end
        
        it "should get a hash representation of the HOST_POOL" do
            host_hash = @host_pool.to_hash
            host_hash['HOST_POOL']['HOST'][0]['ID'].should eql('0')
            host_hash['HOST_POOL']['HOST'][0]['NAME'].should eql('dummyhost')
            host_hash['HOST_POOL']['HOST'][0]['STATE'].should eql('2')
            host_hash['HOST_POOL']['HOST'][0]['IM_MAD'].should eql('im_dummy')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['MEM_USAGE'].should eql('1572864')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['CPU_USAGE'].should eql('300')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['FREE_MEM'].should eql('16777216')
            host_hash['HOST_POOL']['HOST'][0]['HOST_SHARE']['RUNNING_VMS'].should eql('3')
            host_hash['HOST_POOL']['HOST'][1]['ID'].should eql('1')
            host_hash['HOST_POOL']['HOST'][1]['NAME'].should eql('thost')
            host_hash['HOST_POOL']['HOST'][1]['STATE'].should eql('2')
            host_hash['HOST_POOL']['HOST'][1]['IM_MAD'].should eql('im_dummy')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['MEM_USAGE'].should eql('0')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['CPU_USAGE'].should eql('0')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['FREE_MEM'].should eql('16777216')
            host_hash['HOST_POOL']['HOST'][1]['HOST_SHARE']['RUNNING_VMS'].should eql('0')
        end
    end
end
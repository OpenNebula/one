$: << '../' \
   << './'

require 'opennebula'
require 'helpers/MockClient'

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
                    host['STATE'].should eql('2')
                    host['IM_MAD'].should eql('im_dummy')
                    host['HOST_SHARE/MEM_USAGE'].should eql('1572864')
                    host['HOST_SHARE/CPU_USAGE'].should eql('300')
                    host['HOST_SHARE/FREE_MEM'].should eql('16777216')
                    host['HOST_SHARE/RUNNING_VMS'].should eql('3')
                elsif host.id == 1
                    host.name.should eql('thost')
                    host['STATE'].should eql('2')
                    host['IM_MAD'].should eql('im_dummy')
                    host['HOST_SHARE/MEM_USAGE'].should eql('0')
                    host['HOST_SHARE/CPU_USAGE'].should eql('0')
                    host['HOST_SHARE/FREE_MEM'].should eql('16777216')
                    host['HOST_SHARE/RUNNING_VMS'].should eql('0')
                end
            }
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
                    host['STATE'].should eql('2')
                    host['IM_MAD'].should eql('im_dummy')
                    host['HOST_SHARE/MEM_USAGE'].should eql('1572864')
                    host['HOST_SHARE/CPU_USAGE'].should eql('300')
                    host['HOST_SHARE/FREE_MEM'].should eql('16777216')
                    host['HOST_SHARE/RUNNING_VMS'].should eql('3')
                elsif host.id == 1
                    host.name.should eql('thost')
                    host['STATE'].should eql('2')
                    host['IM_MAD'].should eql('im_dummy')
                    host['HOST_SHARE/MEM_USAGE'].should eql('0')
                    host['HOST_SHARE/CPU_USAGE'].should eql('0')
                    host['HOST_SHARE/FREE_MEM'].should eql('16777216')
                    host['HOST_SHARE/RUNNING_VMS'].should eql('0')
                end
            }
        end
    end
end

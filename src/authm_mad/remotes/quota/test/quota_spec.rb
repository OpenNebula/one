$: << '.'

require 'helper/test_helper'

describe "Quota testing" do
    before(:all) do
        @mock_client = MockClient.new

        @quota = Quota.new
        @quota.set_client(@mock_client)
        @quota.rm_and_set_testdb

        @uid1 = 0
        @quota1 = {
            :CPU     => 2.4,
            :MEMORY  => 1024,
            :NUM_VMS => 4,
            :STORAGE => 10000
        }

        @uid2 = 1
        @quota2 = {
            :CPU     => 1.2,
            :MEMORY  => 512,
            :NUM_VMS => 2,
            :STORAGE => 5000
        }

        # Generate VM ACL request
        vm_template = <<-EOT
        <TEMPLATE>
            <CPU>2</CPU>
            <MEMORY>128</MEMORY>
        </TEMPLATE>
        EOT

        vm_base64 = Base64::encode64(vm_template)
        @acl_vm_create  = "VM:#{vm_base64}:CREATE:0:1:1"

        # Generate IMAGE ACL request
        image_template = <<-EOT
        <TEMPLATE>
            <PATH>/etc/hosts</PATH>
        </TEMPLATE>
        EOT

        image_base64 = Base64::encode64(image_template)
        @acl_image_create = "IMAGE:#{image_base64}:CREATE:0:1:1"

        # Generate TEMPLATE ACL request
        temp_template = <<-EOT
        <TEMPLATE>
            <CPU>2</CPU>
            <MEMORY>128</MEMORY>
        </TEMPLATE>
        EOT

        temp_base64 = Base64::encode64(temp_template)
        @acl_template_instantiate = "TEMPLATE:#{temp_base64}:INSTANTIATE:0:1:1"
    end

    it "should check default quotas" do
        quota1 = @quota.get_quota(@uid1)
        quota1[:UID].should eql(0)
        quota1[:NUM_VMS].should eql(nil)
        quota1[:CPU].should eql(nil)
        quota1[:MEMORY].should eql(nil)
        quota1[:STORAGE].should eql(nil)
    end

    it "should check default usage cache" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(nil)
        usage1cache[:CPU].should eql(nil)
        usage1cache[:MEMORY].should eql(nil)
        usage1cache[:STORAGE].should eql(nil)
    end

    it "should check default cache (force)" do
        usage1force = @quota.get_usage(@uid1, nil, true)
        usage1force[:UID].should eql(0)
        usage1force[:NUM_VMS].should eql(0)
        usage1force[:CPU].should eql(0)
        usage1force[:MEMORY].should eql(0)
        usage1force[:STORAGE].should eql(0)
    end

    it "should authorize the user because there is no quota defined" do
        @quota.authorize(@uid1, @acl_vm_create).should eql(false)
        @quota.authorize(@uid1, @acl_image_create).should eql(false)
        @quota.authorize(@uid1, @acl_template_instantiate).should eql(false)
    end

    it "should add a new VM" do
        values = {
            :CPU => 2,
            :MEMORY => 128,
            :UID => 2,
            :GID => 4,
        }

        @mock_client.add_vm(0, values)
    end

    it "should check the usage cache is not updated" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(0)
        usage1cache[:CPU].should eql(0.0)
        usage1cache[:MEMORY].should eql(0)
        usage1cache[:STORAGE].should eql(0)
    end

    it "should check the cache (force)" do
        usage1force = @quota.get_usage(@uid1, nil, true)
        usage1force[:UID].should eql(0)
        usage1force[:NUM_VMS].should eql(1)
        usage1force[:CPU].should eql(2.0)
        usage1force[:MEMORY].should eql(128)
        usage1force[:STORAGE].should eql(0)
    end

    it "should check the usage cache is updated and contains the last usage" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1)
        usage1cache[:CPU].should eql(2.0)
        usage1cache[:MEMORY].should eql(128)
        usage1cache[:STORAGE].should eql(0)
    end

    it "should add a new Image" do
        values = {
            :UID => 2,
            :GID => 4,
            :SIZE => 1000
        }

        @mock_client.add_image(0, values)
    end

    it "should check the usage cache is not updated" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1)
        usage1cache[:CPU].should eql(2.0)
        usage1cache[:MEMORY].should eql(128)
        usage1cache[:STORAGE].should eql(0)
    end

    it "should check the cache (force)" do
        usage1force = @quota.get_usage(@uid1, nil, true)
        usage1force[:UID].should eql(0)
        usage1force[:NUM_VMS].should eql(1)
        usage1force[:CPU].should eql(2.0)
        usage1force[:MEMORY].should eql(128)
        usage1force[:STORAGE].should eql(1000)
    end

    it "should check the usage cache is updated and contains the last usage" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1)
        usage1cache[:CPU].should eql(2.0)
        usage1cache[:MEMORY].should eql(128)
        usage1cache[:STORAGE].should eql(1000)
    end

    it "should add a second VM" do
        values = {
            :CPU => 2,
            :MEMORY => 128,
            :UID => 2,
            :GID => 4,
        }

        @mock_client.add_vm(1, values)
    end

    it "should check the usage cache is not updated" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1)
        usage1cache[:CPU].should eql(2.0)
        usage1cache[:MEMORY].should eql(128)
        usage1cache[:STORAGE].should eql(1000)
    end

    it "should check the cache (force)" do
        usage1force = @quota.get_usage(@uid1, nil, true)
        usage1force[:UID].should eql(0)
        usage1force[:NUM_VMS].should eql(1*2)
        usage1force[:CPU].should eql(2.0*2)
        usage1force[:MEMORY].should eql(128*2)
        usage1force[:STORAGE].should eql(1000)
    end

    it "should check the usage cache is updated and contains the last usage" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1*2)
        usage1cache[:CPU].should eql(2.0*2)
        usage1cache[:MEMORY].should eql(128*2)
        usage1cache[:STORAGE].should eql(1000)
    end

    it "should add a second Image" do
        values = {
            :UID => 2,
            :GID => 4,
            :SIZE => 1000
        }

        @mock_client.add_image(1, values)
    end

    it "should check the usage cache is not updated" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1*2)
        usage1cache[:CPU].should eql(2.0*2)
        usage1cache[:MEMORY].should eql(128*2)
        usage1cache[:STORAGE].should eql(1000)
    end

    it "should check the cache (force)" do
        usage1force = @quota.get_usage(@uid1, nil, true)
        usage1force[:UID].should eql(0)
        usage1force[:NUM_VMS].should eql(1*2)
        usage1force[:CPU].should eql(2.0*2)
        usage1force[:MEMORY].should eql(128*2)
        usage1force[:STORAGE].should eql(1000*2)
    end

    it "should check the usage cache is updated and contains the last usage" do
        usage1cache = @quota.get_usage(@uid1)
        usage1cache[:UID].should eql(0)
        usage1cache[:NUM_VMS].should eql(1*2)
        usage1cache[:CPU].should eql(2.0*2)
        usage1cache[:MEMORY].should eql(128*2)
        usage1cache[:STORAGE].should eql(1000*2)
    end

    it "should add a new quota and check it" do
        @quota.set_quota(@uid1, @quota1)

        quota = @quota.get_quota(@uid1)
        @quota1.each{ |key,value|
            quota[key].should eql(value)
        }
    end

    it "should not authorize the user because the vm quota is spent" do
        err_msg = "CPU quota exceeded (Quota: 2.4, Used: 4.0, Requested: 2.0)"
        @quota.authorize(@uid1, @acl_vm_create).should eql(err_msg)
        @quota.authorize(@uid1, @acl_template_instantiate).should eql(err_msg)

        @quota.authorize(@uid1, @acl_image_create).should eql(false)
    end

    it "should add a new quota for another user and check it" do
        @quota.set_quota(@uid2, @quota2)

        quota = @quota.get_quota(@uid2)
        @quota2.each{ |key,value|
            quota[key].should eql(value)
        }
    end

    it "should list all the defined quotas" do
        quotas = @quota.get_quota
        quotas.each { |quota|
            if quota[:UID] == @uid1
                @quota1.each{ |key,value|
                    quota[key].should eql(value)
                }
            elsif quota[:UID] == @uid2
                @quota2.each{ |key,value|
                    quota[key].should eql(value)
                }
            end
        }

    end

    it "should update the first user quota and check it" do
        new_quota = Hash.new
        @quota1.each { |key,value|
            new_quota[key] = value*3
        }

        @quota.set_quota(@uid1, new_quota)

        quota = @quota.get_quota(@uid1)
        new_quota.each{ |key,value|
            quota[key] == value
        }
    end

    it "should authorize the user because the quota is not spent" do
        @quota.authorize(@uid1, @acl_vm_create).should eql(false)
        @quota.authorize(@uid1, @acl_image_create).should eql(false)
        @quota.authorize(@uid1, @acl_template_instantiate).should eql(false)
    end

    it "should update the first user quota and check it" do
        new_quota = {
            :STORAGE => 0
        }

        @quota.set_quota(@uid1, new_quota)

        quota = @quota.get_quota(@uid1)

        quota[:STORAGE].should eql(new_quota[:STORAGE])
    end

    it "should not authorize the user because the image quota is spent" do
        @quota.authorize(@uid1, @acl_vm_create).should eql(false)
        @quota.authorize(@uid1, @acl_template_instantiate).should eql(false)

        err_msg = "STORAGE quota exceeded (Quota: 0, Used: 2000, Requested: 271)"
        @quota.authorize(@uid1, @acl_image_create).should eql(err_msg)
    end

    it "should delete the quota and check it" do
        @quota.delete_quota(@uid1)

        quota1 = @quota.get_quota(@uid1)
        quota1[:UID].should eql(0)
        quota1[:NUM_VMS].should eql(nil)
        quota1[:CPU].should eql(nil)
        quota1[:MEMORY].should eql(nil)
        quota1[:STORAGE].should eql(nil)
    end

    it "should authorize the user because the quota was deleted" do
        @quota.authorize(@uid1, @acl_vm_create).should eql(false)
        @quota.authorize(@uid1, @acl_image_create).should eql(false)
        @quota.authorize(@uid1, @acl_template_instantiate).should eql(false)
    end
end
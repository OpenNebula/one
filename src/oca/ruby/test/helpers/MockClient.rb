class MockClient

    def call(action, *args)
        xmlrpc_action = "one."+action

        case xmlrpc_action
            when "one.vn.info"
                return File.read("fixtures/vnet.xml")
            when "one.vn.allocate"
                return 3
            when "one.vn.delete"
                return nil
            when "one.vm.info"
                return File.read("fixtures/vm.xml")
            when "one.vm.allocate"
                return 6
            when "one.vm.delete"
                return nil
            when "one.vm.action"
                return nil
            when "one.vm.deploy"
                return nil
            when "one.vm.migrate"
                return nil
            when "one.host.info"
                return File.read("fixtures/host.xml")
            when "one.host.allocate"
                return 7
            when "one.host.delete"
                return nil
            when "one.host.enable"
                return nil
            when "one.user.allocate"
                return 3
            when "one.user.info"
                return File.read("fixtures/user.xml")
            when "one.user.delete"
                return nil
            when "one.vnpool.info"
                return File.read("fixtures/vnetpool.xml")
            when "one.vmpool.info"
                return File.read("fixtures/vmpool.xml")
            when "one.hostpool.info"
                return File.read("fixtures/hostpool.xml")
            when "one.userpool.info"
                return File.read("fixtures/userpool.xml")
        end
    end
end
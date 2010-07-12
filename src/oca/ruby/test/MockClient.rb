class MockClient

    def call(action, *args)
        xmlrpc_action = "one."+action

        case xmlrpc_action
            when "one.vn.info"
                return File.read("xml_test/vnet.xml")
            when "one.vn.allocate"
                return 3
            when "one.vn.delete"
                return nil
            when "one.vm.info"
                return File.read("xml_test/vm.xml")
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
                return File.read("xml_test/host.xml")
            when "one.host.allocate"
                return 7
            when "one.host.delete"
                return nil
            when "one.host.enable"
                return nil
            when "one.user.allocate"
                return 3
            when "one.user.info"
                return File.read("xml_test/user.xml")
            when "one.user.delete"
                return nil
            when "one.cluster.allocate"
                return 5
            when "one.cluster.info"
                return File.read("xml_test/cluster.xml")
            when "one.cluster.delete"
                return nil
            when "one.cluster.addhost"
                return nil
            when "one.cluster.removehost"
                return nil
            when "one.vnpool.info"
                return File.read("xml_test/vnetpool.xml")
            when "one.vmpool.info"
                return File.read("xml_test/vmpool.xml")
            when "one.hostpool.info"
                return File.read("xml_test/hostpool.xml")
            when "one.userpool.info"
                return File.read("xml_test/userpool.xml")
            when "one.clusterpool.info"
                return File.read("xml_test/clusterpool.xml")
        end
    end
end
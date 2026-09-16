require_relative 'shared/spec_helper'

RSpec.describe 'ODS OpenNebula resource adapters' do
    let(:client) { instance_double(OpenNebula::Client) }

    ADAPTERS = [
        [ODS::OneHelper::Cluster, OpenNebula::Cluster, 'CLUSTER', 'Cluster'],
        [ODS::OneHelper::Datastore, OpenNebula::Datastore, 'DATASTORE', 'Datastore'],
        [ODS::OneHelper::Host, OpenNebula::Host, 'HOST', 'Host'],
        [ODS::OneHelper::Image, OpenNebula::Image, 'IMAGE', 'Image'],
        [ODS::OneHelper::Template, OpenNebula::Template, 'VMTEMPLATE', 'Template'],
        [ODS::OneHelper::VirtualMachine, OpenNebula::VirtualMachine, 'VM', 'VM'],
        [ODS::OneHelper::VirtualNetwork, OpenNebula::VirtualNetwork, 'VNET', 'Network'],
        [ODS::OneHelper::VRouter, OpenNebula::VirtualRouter, 'VROUTER', 'VRouter']
    ].freeze

    ADAPTERS.each do |helper, resource_class, body_key, label|
        context label do
            let(:resource) do
                double(
                    label.downcase,
                    :info => nil,
                    :to_hash => { body_key => { 'NAME' => 'demo', 'ID' => 7 } },
                    :name => 'demo'
                )
            end

            before do
                allow(resource_class).to receive(:new_with_id).and_return(resource)
            end

            it 'retrieves current information and rejects nil IDs' do
                expect(helper.get(client, 7)).to equal(resource)
                expect(resource_class).to have_received(:new_with_id).with(7, client)
                expect(resource).to have_received(:info)
                expect(helper.get(client, nil).message).to match(/ID cannot be nil/)
            end

            it 'propagates refresh failures from get' do
                allow(resource).to receive(:info).and_return(OpenNebula::Error.new('API failed'))
                expect(helper.get(client, 7).message).to eq('API failed')
            end

            it 'returns symbolized bodies and reports missing payloads' do
                expect(helper.body(client, 7)).to include(:name => 'demo', :id => 7)
                allow(resource).to receive(:to_hash).and_return({})
                expect(helper.body(client, 7).message).to include('Cannot retrieve')
            end

            it 'checks name existence and propagates search errors' do
                allow(helper).to receive(:find).and_return(resource, nil, OpenNebula::Error.new('pool'))
                expect(helper.exists?(client, 'demo')).to be(true)
                expect(helper.exists?(client, 'missing')).to be(false)
                expect(helper.exists?(client, 'error').message).to eq('pool')
            end
        end
    end

    FINDERS = [
        [ODS::OneHelper::Cluster, OpenNebula::ClusterPool],
        [ODS::OneHelper::Datastore, OpenNebula::DatastorePool],
        [ODS::OneHelper::Host, OpenNebula::HostPool],
        [ODS::OneHelper::Image, OpenNebula::ImagePool],
        [ODS::OneHelper::Template, OpenNebula::TemplatePool],
        [ODS::OneHelper::VirtualMachine, OpenNebula::VirtualMachinePool],
        [ODS::OneHelper::VirtualNetwork, OpenNebula::VirtualNetworkPool],
        [ODS::OneHelper::VRouter, OpenNebula::VirtualRouterPool]
    ].freeze

    FINDERS.each do |helper, pool_class|
        it "finds, misses and propagates pool failures for #{pool_class.name.split('::').last}" do
            resource = double('pool resource', :name => 'demo', :info => nil)
            pool = [resource]
            pool.define_singleton_method(:info) { nil }
            allow(pool_class).to receive(:new).and_return(pool)

            expect(helper.find(client, 'demo')).to equal(resource)
            expect(helper.find(client, 'missing')).to be_nil

            allow(pool).to receive(:info).and_return(OpenNebula::Error.new('pool failed'))
            expect(helper.find(client, 'demo').message).to eq('pool failed')
        end
    end

    ID_FINDERS = [
        [ODS::OneHelper::Cluster, OpenNebula::ClusterPool],
        [ODS::OneHelper::Datastore, OpenNebula::DatastorePool],
        [ODS::OneHelper::Host, OpenNebula::HostPool],
        [ODS::OneHelper::Image, OpenNebula::ImagePool],
        [ODS::OneHelper::VirtualMachine, OpenNebula::VirtualMachinePool],
        [ODS::OneHelper::VirtualNetwork, OpenNebula::VirtualNetworkPool]
    ].freeze

    ID_FINDERS.each do |helper, pool_class|
        it "checks IDs and dependency failures for #{pool_class.name.split('::').last}" do
            resource = double('pool resource', :id => 7)
            pool = [resource]
            pool.define_singleton_method(:info) { nil }
            allow(pool_class).to receive(:new).and_return(pool)

            expect(helper.exists_id?(client, '7')).to be(true)
            expect(helper.exists_id?(client, 8)).to be(false)

            allow(pool).to receive(:info).and_return(OpenNebula::Error.new('pool failed'))
            expect(helper.exists_id?(client, 7).message).to eq('pool failed')
        end
    end

    describe ODS::OneHelper::Cluster do
        let(:cluster) do
            double(
                'cluster', :allocate => nil, :update => nil, :info => nil,
                :delete => nil,
                :to_hash => {
                    'CLUSTER' => {
                        'HOSTS' => { 'ID' => [1, 2] },
                        'DATASTORES' => { 'ID' => 3 },
                        'VNETS' => {}
                    }
                }
            )
        end

        before do
            allow(OpenNebula::Cluster).to receive(:new).and_return(cluster)
            allow(described_class).to receive(:get).and_return(cluster)
        end

        it 'creates, updates and refreshes a named cluster' do
            expect(described_class.create(
                       client, :name => 'demo', :template => { :A => 1 },
                :extra_template => { :B => 2 }
                   )).to equal(cluster)
            expect(cluster).to have_received(:allocate).with('demo')
            expect(cluster).to have_received(:update).with("A = \"1\"\nB = \"2\"", true)
            expect(described_class.create(client,
                                          :name => '').message).to include('cannot be empty')
        end

        it 'lists only non-empty associated object groups' do
            expect(described_class.associated_objects(client, 7)).to eq(
                'host' => [1, 2], 'datastore' => [3]
            )
        end

        it 'deletes immediately or waits and propagates API failures' do
            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)

            expect(described_class.delete(client, 7)).to be(true)
            expect(described_class.delete(client, 7, :wait => true)).to eq(:deleted)
            allow(cluster).to receive(:delete).and_return(OpenNebula::Error.new('delete failed'))
            expect(described_class.delete(client, 7).message).to eq('delete failed')
        end
    end

    describe ODS::OneHelper::Datastore do
        let(:datastore) do
            double(
                'datastore', :allocate => nil, :info => nil, :delete => nil,
                :to_hash => { 'DATASTORE' => { 'IMAGES' => { 'ID' => [3, 4] } } }
            )
        end

        before do
            allow(OpenNebula::Datastore).to receive(:new).and_return(datastore)
            allow(described_class).to receive(:get).and_return(datastore)
        end

        it 'creates, associates and deletes datastores with optional waiting' do
            expect(described_class.create(
                       client, :name => 'images', :template => { :DS_MAD => 'fs' },
                :cluster_id => 4
                   )).to equal(datastore)
            expect(datastore).to have_received(:allocate).with(
                "DS_MAD = \"fs\"\nname = \"images\"", 4
            )
            expect(described_class.associated_objects(client, 7)).to eq([3, 4])

            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)
            expect(described_class.delete(client, 7)).to be(true)
            expect(described_class.delete(client, 7, :wait => true)).to eq(:deleted)
        end

        it 'recognizes image datastores and resolves explicit or cluster candidates' do
            image_ds = double('image datastore', :[] => 0, :name => 'images')
            allow(OpenNebula::Datastore::DATASTORE_TYPES).to receive(:[]).and_return('IMAGE')
            expect(described_class.image?(image_ds)).to be(true)

            cluster = double('cluster', :datastore_ids => [10], :id => 1, :name => 'cluster')
            allow(described_class).to receive(:get).and_return(image_ds)
            expect(described_class.resolve_image_ds(client, cluster)).to equal(image_ds)
        end

        it 'returns a descriptive error when no cluster datastore stores images' do
            ds = double('datastore', :[] => 1, :name => 'system')
            cluster = double('cluster', :datastore_ids => [10], :id => 1, :name => 'cluster')
            allow(OpenNebula::Datastore::DATASTORE_TYPES).to receive(:[]).and_return('SYSTEM')
            allow(described_class).to receive(:get).and_return(ds)

            expect(described_class.resolve_image_ds(client, cluster).message)
                .to include('has no image datastores')
        end

        it 'rejects an explicitly selected non-image datastore' do
            system_ds = double('system datastore', :[] => 1, :name => 'system')
            cluster = double('cluster')
            allow(OpenNebula::Datastore::DATASTORE_TYPES).to receive(:[]).and_return('SYSTEM')
            allow(described_class).to receive(:get).and_return(system_ds)

            expect(described_class.resolve_image_ds(client, cluster, 10).message)
                .to include('is not an IMAGE datastore')
        end
    end

    describe ODS::OneHelper::Host do
        let(:host) do
            double('host', :allocate => nil, :update => nil, :info => nil,
                           :forceupdate => nil, :disable => nil)
        end

        before do
            allow(OpenNebula::Host).to receive(:new).and_return(host)
            allow(OpenNebula::Host).to receive(:new_with_id).and_return(host)
        end

        it 'extracts MADs without mutating the caller template' do
            template = { :im_mad => 'dummy', :vmm_mad => 'firecracker', :LABEL => 'edge' }
            expect(described_class.create(
                       client, :name => 'host', :template => template, :cluster_id => 4
                   )).to equal(host)
            expect(host).to have_received(:allocate).with('host', 'dummy', 'firecracker', 4)
            expect(host).to have_received(:update).with('LABEL = "edge"', true)
            expect(template).to include(:im_mad => 'dummy', :vmm_mad => 'firecracker')
        end

        it 'forces monitoring and disables hosts while propagating OCA failures' do
            expect(described_class.force_update(client, 7)).to be(true)
            expect(described_class.disable(client, 7)).to be(true)
            allow(host).to receive(:disable).and_return(OpenNebula::Error.new('disable failed'))
            expect(described_class.disable(client, 7).message).to eq('disable failed')
        end

        it 'lists VMs and supports waited deletion' do
            allow(host).to receive(:to_hash).and_return(
                'HOST' => { 'VMS' => { 'ID' => [2, 3] } }
            )
            allow(described_class).to receive(:get).and_return(host)
            allow(host).to receive(:delete).and_return(nil)
            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)

            expect(described_class.associated_objects(client, 7)).to eq([2, 3])
            expect(described_class.delete(client, 7, :wait => true)).to eq(:deleted)
        end
    end

    describe ODS::OneHelper::Image do
        let(:image) do
            double('image', :allocate => nil, :info => nil, :update => nil, :delete => nil)
        end

        before do
            allow(OpenNebula::Image).to receive(:new).and_return(image)
            allow(OpenNebula::Image).to receive(:new_with_id).and_return(image)
        end

        it 'allocates images with capacity policy and validates required inputs' do
            expect(described_class.create(
                       client, { :NAME => 'disk' }, 10, :no_check_capacity => true
                   )).to equal(image)
            expect(image).to have_received(:allocate).with('NAME = "disk"', 10, true)
            expect(described_class.create(client, {}, 10).message).to include('cannot be empty')
            expect(described_class.create(client, { :NAME => 'disk' }, nil).message)
                .to include('Datastore ID')
        end

        it 'updates and deletes by ID with append/force options' do
            expect(described_class.update(client, 7, { :A => 1 }, :append => true)).to equal(image)
            expect(image).to have_received(:update).with('A = "1"', true)
            expect(described_class.delete(client, 7, :force => true)).to be(true)
            expect(image).to have_received(:delete).with(true)
        end

        it 'returns names and finds by attributes and Marketplace paths' do
            allow(image).to receive(:name).and_return('disk')
            expect(described_class.name(client, 7)).to eq('disk')

            pool_image = double(
                'pool image', :id => 7, :name => 'disk', :info => nil
            )
            allow(pool_image).to receive(:[]).with('TEMPLATE/UUID').and_return('uuid')
            allow(pool_image).to receive(:[]).with('DATASTORE_ID').and_return('10')
            allow(pool_image).to receive(:[]).with('PATH').and_return(
                '/var/lib/one/appliance/appliance-uuid/disk'
            )
            pool = [pool_image]
            pool.define_singleton_method(:info) { nil }
            allow(OpenNebula::ImagePool).to receive(:new).and_return(pool)

            expect(described_class.find_by_attr(
                       client, 'UUID', 'uuid', :ds_id => 10
                   )).to equal(pool_image)
            expect(described_class.find_by_marketplace_uuid(
                       client, 'appliance-uuid', 10
                   )).to equal(pool_image)
        end

        it 'validates Marketplace lookup inputs and waited deletion' do
            expect(described_class.find_by_marketplace_uuid(client, '', 10).message)
                .to include('UUID cannot be empty')
            expect(described_class.find_by_marketplace_uuid(client, 'uuid', nil).message)
                .to include('Datastore ID')
            allow(described_class).to receive(:get).and_return(image)
            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)

            expect(described_class.delete(client, 7, :wait => true)).to eq(:deleted)
        end
    end

    describe ODS::OneHelper::Template do
        let(:template) do
            double(
                'template', :id => 4, :name => 'demo', :allocate => nil,
                :info => nil, :update => nil, :delete => nil
            )
        end

        before do
            allow(OpenNebula::Template).to receive(:new).and_return(template)
            allow(OpenNebula::Template).to receive(:new_with_id).and_return(template)
        end

        it 'creates, names, updates and deletes templates' do
            expect(described_class.create(client, :NAME => 'demo')).to equal(template)
            expect(template).to have_received(:allocate).with('NAME = "demo"')
            allow(described_class).to receive(:get).and_return(template)
            expect(described_class.name(client, 4)).to eq('demo')
            expect(described_class.update(
                       client, 4, { :CPU => 2 }, :append => true
                   )).to equal(template)
            expect(template).to have_received(:update).with('CPU = "2"', true)
            expect(described_class.delete(client, 4, :recursive => true)).to be(true)
            expect(template).to have_received(:delete).with(true)
        end

        it 'finds templates by attribute, image and Marketplace lineage' do
            allow(template).to receive(:[]).with('TEMPLATE/UUID').and_return('uuid')
            allow(template).to receive(:[]).with('TEMPLATE/DISK/IMAGE_ID').and_return('9')
            allow(template).to receive(:to_hash).and_return(
                'VMTEMPLATE' => { 'TEMPLATE' => { 'DISK' => { 'IMAGE_ID' => 9 } } }
            )
            pool = [template]
            pool.define_singleton_method(:info) { nil }
            allow(OpenNebula::TemplatePool).to receive(:new).and_return(pool)

            expect(described_class.find_by_attr(
                       client, 'UUID', 'uuid', :image_id => 9
                   )).to equal(template)
            expect(described_class.find_by_image(client, 9)).to equal(template)

            image = double('image', :id => 9)
            allow(ODS::OneHelper::Image).to receive(:find_by_marketplace_uuid)
                .and_return(image)
            expect(described_class.find_by_marketplace_uuid(client, 'uuid', 10))
                .to equal(template)
        end

        it 'reports missing Marketplace image and template relationships' do
            allow(ODS::OneHelper::Image).to receive(:find_by_marketplace_uuid)
                .and_return(nil)
            expect(described_class.find_by_marketplace_uuid(client, 'uuid', 10).message)
                .to include('Cannot find marketplace appliance image')

            image = double('image', :id => 9)
            allow(ODS::OneHelper::Image).to receive(:find_by_marketplace_uuid)
                .and_return(image)
            allow(described_class).to receive(:find_by_image).and_return(nil)
            expect(described_class.find_by_marketplace_uuid(client, 'uuid', 10).message)
                .to include('Cannot find marketplace appliance template')
        end

        it 'returns nil for absent delete-by-name and delegates recursive deletion' do
            allow(described_class).to receive(:find).and_return(nil, template)
            allow(described_class).to receive(:delete).and_return(true)

            expect(described_class.delete_by_name(client, 'missing')).to be_nil
            expect(described_class.delete_by_name(client, 'demo', :recursive => true)).to be(true)
            expect(described_class).to have_received(:delete).with(client, 4, :recursive => true)
        end
    end

    describe ODS::OneHelper::VirtualMachine do
        let(:vm) do
            double(
                'vm', :id => 7, :name => 'worker', :allocate => nil,
                :exec => nil, :info => nil, :terminate => nil
            )
        end

        before do
            allow(OpenNebula::VirtualMachine).to receive(:new).and_return(vm)
            allow(OpenNebula::VirtualMachine).to receive(:new_with_id).and_return(vm)
        end

        it 'creates, names and deletes VMs with wait semantics' do
            expect(described_class.create(
                       client, { :NAME => 'worker' }, :hold => true
                   )).to equal(vm)
            expect(vm).to have_received(:allocate).with('NAME = "worker"', true)
            allow(described_class).to receive(:get).and_return(vm)
            expect(described_class.name(client, 7)).to eq('worker')
            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)
            expect(described_class.delete(
                       client, 7, :force => true, :wait => true
                   )).to eq(:deleted)
            expect(ODS::OneHelper::Resource).to have_received(:wait_until_deleted)
                .with(vm, :state => 6)
        end

        it 'decodes successful guest-agent command results' do
            payload = {
                'COMMAND' => 'date', 'STATUS' => 'DONE', 'RETURN_CODE' => '0',
                'STDOUT' => Base64.strict_encode64("ok\n"), 'STDERR' => ''
            }
            allow(vm).to receive(:to_hash).and_return(
                'VM' => {
                    'TEMPLATE' => { 'QEMU_GA_EXEC' => payload }
                }
            )

            expect(described_class.exec(client, 7, 'date')).to eq(
                :status => 'DONE', :return_code => 0, :stdout => 'ok', :stderr => ''
            )
        end

        it 'returns execution, guest and timeout failures as action errors' do
            allow(vm).to receive(:exec).and_return(OpenNebula::Error.new('guest unavailable'))
            expect(described_class.exec(client, 7, 'date').message).to include('guest unavailable')

            allow(vm).to receive(:exec).and_return(nil)
            allow(Timeout).to receive(:timeout).and_raise(Timeout::Error)
            expect(described_class.exec(client, 7, 'date').message).to include('Timeout waiting')
        end

        it 'maps non-zero, error and cancelled guest results to useful failures' do
            failures = [
                ['DONE', '3', '', 'bad output', 'bad output'],
                ['ERROR', '1', 'guest error', '', 'guest error'],
                ['CANCELLED', '1', '', '', 'Command cancelled on VM 7']
            ]

            failures.each do |status, code, stderr, stdout, message|
                allow(vm).to receive(:to_hash).and_return(
                    'VM' => {
                        'TEMPLATE' => {
                            'QEMU_GA_EXEC' => {
                                'COMMAND' => 'date',
                                'STATUS' => status,
                                'RETURN_CODE' => code,
                                'STDOUT' => Base64.strict_encode64(stdout),
                                'STDERR' => Base64.strict_encode64(stderr)
                            }
                        }
                    }
                )
                expect(described_class.exec(client, 7, 'date').message).to include(message)
            end
        end
    end

    describe ODS::OneHelper::VirtualNetwork do
        let(:vnet) do
            double(
                'vnet', :id => 7, :allocate => nil, :delete => nil,
                :add_ar => nil, :rm_ar => nil, :info => nil,
                :to_hash => { 'VNET' => { 'AR_POOL' => { 'AR' => { 'AR_ID' => 1 } } } }
            )
        end

        before do
            allow(described_class).to receive(:get).and_return(vnet)
            allow(ODS::OneHelper::Resource).to receive(:wait_until_ready).and_return(vnet)
            allow(OpenNebula::VirtualNetwork).to receive(:new).and_return(vnet)
            allow(OpenNebula::VirtualNetwork).to receive(:new_with_id).and_return(vnet)
        end

        it 'creates, names and deletes networks without mutating input templates' do
            template = { :VN_MAD => 'dummy' }
            expect(described_class.create(
                       client, nil, :name => 'service', :template => template, :cluster_id => 4
                   )).to equal(vnet)
            expect(vnet).to have_received(:allocate).with(
                "VN_MAD = \"dummy\"\nname = \"service\"", 4
            )
            expect(template).to eq(:VN_MAD => 'dummy')

            allow(vnet).to receive(:to_hash).and_return('VNET' => { 'NAME' => 'service' })
            expect(described_class.name(client, 7)).to eq('service')
            allow(ODS::OneHelper::Resource).to receive(:wait_until_deleted).and_return(:deleted)
            expect(described_class.delete(client, 7, :wait => true)).to eq(:deleted)
        end

        it 'adds and removes address ranges without waiting when requested' do
            expect(described_class.add_ar(
                       client, 7, { :AR => { :IP => '10.0.0.1' } }, :wait => false
                   )).to be(true)
            expect(vnet).to have_received(:add_ar).with(
                "AR = [\nIP = \"10.0.0.1\"\n]"
            )
            expect(described_class.remove_ar(client, 7, '3')).to be(true)
            expect(vnet).to have_received(:rm_ar).with(3)
        end

        it 'collects unique VM lease associations from scalar and array shapes' do
            allow(described_class).to receive(:body).and_return(
                :USED_LEASES => 2,
                :AR_POOL => {
                    :AR => [
                        { :LEASES => { :LEASE => { :VM => 1 } } },
                        { :LEASES => { :LEASE => [{ :VM => 1 }, { :VM => 2 }] } }
                    ]
                }
            )

            expect(described_class.associated_objects(client, 7)).to eq([1, 2])
        end

        it 'waits for a newly allocated address range without sleeping in real time' do
            allow(described_class).to receive(:sleep)
            allow(vnet).to receive(:to_hash).and_return(
                { 'VNET' => { 'AR_POOL' => { 'AR' => { 'AR_ID' => 1 } } } },
                { 'VNET' => { 'AR_POOL' => { 'AR' => [
                    { 'AR_ID' => 1 }, { 'AR_ID' => 2 }
                ] } } }
            )

            expect(described_class.add_ar(client, 7, { :AR => { :IP => '10.0.0.2' } }))
                .to eq(2)
        end

        it 'converts address-range wait timeouts into action errors' do
            allow(Timeout).to receive(:timeout).and_raise(Timeout::Error)
            result = described_class.send(:wait_until_ar_added, vnet, [1], :timeout => 1)

            expect(result.message).to include('within 1 seconds')
        end
    end

    describe ODS::OneHelper::VRouter do
        let(:vrouter) do
            double(
                'vrouter', :name => 'gateway', :allocate => nil,
                :info => nil, :delete => nil
            )
        end

        before do
            allow(OpenNebula::VirtualRouter).to receive(:new).and_return(vrouter)
            allow(OpenNebula::VirtualRouter).to receive(:new_with_id).and_return(vrouter)
        end

        it 'creates, names and deletes virtual routers' do
            expect(described_class.create(client, :NAME => 'gateway')).to equal(vrouter)
            expect(vrouter).to have_received(:allocate).with('NAME = "gateway"')
            allow(described_class).to receive(:get).and_return(vrouter)
            expect(described_class.name(client, 7)).to eq('gateway')
            expect(described_class.delete(client, 7)).to be(true)
            expect(vrouter).to have_received(:delete)
        end

        it 'returns the first public endpoint and reports missing endpoint data' do
            allow(described_class).to receive(:get).and_return(vrouter)
            allow(vrouter).to receive(:to_hash).and_return(
                'VROUTER' => { 'TEMPLATE' => { 'NIC' => [{ 'VROUTER_IP' => '198.51.100.1' }] } }
            )
            expect(described_class.public_endpoint(client, 7)).to eq('198.51.100.1')

            allow(vrouter).to receive(:to_hash).and_return({})
            expect(described_class.public_endpoint(client,
                                                   7).message).to include('Endpoint not found')
        end
    end
end

RSpec.describe ODS::OneHelper::Marketplace do
    let(:client) { instance_double(OpenNebula::Client) }
    let(:app) do
        double(
            'marketplace app', :name => 'appliance', :info => nil,
            :export => { :image => [10], :vmtemplate => [20] }, :delete => nil,
            :to_hash => { 'MARKETPLACEAPP' => { 'NAME' => 'appliance' } }
        )
    end

    before do
        allow(described_class).to receive(:find).and_return(app)
        allow(app).to receive(:extend)
    end

    it 'exports an appliance and validates export-level image/template errors' do
        expect(described_class.import(client, 'copy', 'uuid', 100)).to equal(app)
        expect(app).to have_received(:export).with(:name => 'copy', :dsid => 100)

        image_error = OpenNebula::Error.new('image export failed')
        allow(app).to receive(:export).and_return(:image => [10, image_error])
        expect(described_class.import(client, 'copy', 'uuid', 100)).to equal(image_error)
    end

    it 'rejects missing IDs, datastore and absent appliances' do
        expect(described_class.import(client, 'copy', '',
                                      100).message).to include('cannot be empty')
        expect(described_class.import(client, 'copy', 'uuid',
                                      nil).message).to include('Datastore ID')
        allow(described_class).to receive(:find).and_return(nil)
        expect(described_class.import(client, 'copy', 'uuid', 100).message).to include('not found')
    end

    it 'gets bodies and names while reporting absent payloads' do
        expect(described_class.get(client, 'uuid')).to equal(app)
        expect(described_class.body(client, 'uuid')).to include(:name => 'appliance')
        expect(described_class.name(client, 'uuid')).to eq('appliance')
        allow(app).to receive(:to_hash).and_return({})
        expect(described_class.body(client, 'uuid').message).to include('Cannot retrieve')
    end

    it 'deletes existing appliances and propagates OCA errors' do
        expect(described_class.delete(client, 'uuid')).to be(true)
        allow(app).to receive(:delete).and_return(OpenNebula::Error.new('delete failed'))
        expect(described_class.delete(client, 'uuid').message).to eq('delete failed')
        expect(described_class.delete(client, nil).message).to include('cannot be nil')
    end

    it 'finds import IDs and derives existence from the Marketplace pool' do
        allow(described_class).to receive(:find).and_call_original
        allow(app).to receive(:[]).with('TEMPLATE/IMPORT_ID').and_return('uuid')
        pool = [app]
        pool.define_singleton_method(:info) { nil }
        allow(OpenNebula::MarketPlaceAppPool).to receive(:new).and_return(pool)

        expect(described_class.find(client, 'uuid')).to equal(app)
        expect(described_class.find(client, 'missing')).to be_nil
        expect(described_class.exists?(client, 'uuid')).to be(true)
        expect(described_class.exists?(client, 'missing')).to be(false)

        allow(pool).to receive(:info).and_return(OpenNebula::Error.new('pool failed'))
        expect(described_class.exists?(client, 'uuid').message).to eq('pool failed')
    end
end

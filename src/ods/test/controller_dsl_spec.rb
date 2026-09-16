require_relative 'shared/spec_helper'

RSpec.describe 'ODS controller route DSLs' do
    Route = Struct.new(:verb, :path, :options, :block, :keyword_init => true)

    # Minimal Sinatra-like route registry used by controller DSL specs.
    class RouteApp

        attr_reader :routes, :helpers_modules

        def initialize
            @routes = []
            @helpers_modules = []
        end

        def helpers(mod)
            @helpers_modules << mod
        end

        [:get, :post, :patch, :delete].each do |verb|
            define_method(verb) do |path, **options, &block|
                @routes << Route.new(
                    :verb => verb, :path => path, :options => options, :block => block
                )
            end
        end

    end

    # Request context double used by registered controller handlers.
    class RouteContext

        attr_accessor :params, :request, :checked_body, :checked_params
        attr_reader :status_value, :body_value, :errors, :log_page_request

        def initialize
            @params = {}
            @request = double_request
            @errors = []
            @client = :client
            @cloud_auth = :auth
            @username = 'alice'
        end

        def check_body(_request, _schema)
            checked_body || { :value => 1 }
        end

        def check_params(_params, _schema)
            checked_params || { :id => 1 }
        end

        def process_response(value, *_options)
            value.to_json
        end

        def internal_error(message, code, *_context)
            @errors << [message, code]
            :error
        end

        def general_error(error)
            internal_error(error.message, 500)
        end

        def one_error_to_http(errno)
            ODS::ResponseHelper::VALIDATION_EC if errno
        end

        def status(value)
            @status_value = value
        end

        def body(value)
            @body_value = value
        end

        def include_sensitive?(_document)
            false
        end

        def get_logs_page(path, page, per_page, all_logs)
            @log_page_request = [path, page, per_page, all_logs]
            { :meta => { :page => page }, :events => [] }
        end

        private

        def double_request
            Struct.new(:body).new(StringIO.new('{}'))
        end

    end

    describe ODS::GenericController do
        let(:params_schema) do
            Class.new(Dry::Validation::Contract) do
                params { optional(:id).filled(:integer) }
            end
        end
        let(:body_schema) do
            Class.new(Dry::Validation::Contract) do
                params { required(:value).filled(:integer) }
            end
        end
        let(:controller) do
            schema = body_schema
            param_contract = params_schema

            Module.new do
                extend ODS::GenericController

                const_set(:BASE_PATH, '/things')
                const_set(:BodySchema, schema)
                const_set(:ParamsSchema, param_contract)
                const_set(:Helpers, Module.new)
            end
        end
        let(:app) { RouteApp.new }

        it 'registers helpers and GET/POST/PATCH/DELETE endpoints with normalized options' do
            controller.get('show', :params_schema => :ParamsSchema) {|args| args }
            controller.post('create', :schema => :BodySchema, :status => 201) {|body| body }
            controller.patch('update', :response => false) { :updated }
            controller.delete('remove') { :deleted }

            controller.register_routes(app)

            expected_routes = [
                [:get, '/things/show'],
                [:post, '/things/create'],
                [:patch, '/things/update'],
                [:delete, '/things/remove']
            ]

            expect(app.helpers_modules).to eq([controller.const_get(:Helpers)])
            expect(app.routes.map {|route| [route.verb, route.path] }).to eq(expected_routes)
            expect(app.routes).to all(have_attributes(:options => {}))
        end

        it 'executes GET validation and serializes successful values' do
            controller.get('show', :params_schema => :ParamsSchema) do |args|
                { :received => args[:id] }
            end
            controller.register_routes(app)
            context = RouteContext.new
            context.checked_params = { :id => 7 }

            context.instance_exec(&app.routes.first.block)

            expect(context.status_value).to eq(200)
            expect(JSON.parse(context.body_value)).to eq('received' => 7)
        end

        it 'executes POST/PATCH/DELETE status and response policies' do
            controller.post('create', :schema => :BodySchema, :status => 202) {|input| input }
            controller.patch('update', :response => false) { :updated }
            controller.delete('remove', :response => true) { :deleted }
            controller.register_routes(app)
            contexts = app.routes.map do |route|
                RouteContext.new.tap {|context| context.instance_exec(&route.block) }
            end

            expect(contexts.map(&:status_value)).to eq([202, 200, 204])
            expect(contexts[0].body_value).to eq({ :value => 1 }.to_json)
            expect(contexts[1].body_value).to be_nil
            expect(contexts[2].body_value).to eq(:deleted.to_json)
        end

        it 'rejects ambiguous body and parameter schemas at declaration time' do
            expect do
                controller.post(
                    'x', :schema => body_schema, :params_schema => params_schema
                ) { nil }
            end.to raise_error(ArgumentError, /either schema or params_schema/)
            expect do
                controller.patch(
                    'x', :schema => body_schema, :params_schema => params_schema
                ) { nil }
            end.to raise_error(ArgumentError, /either schema or params_schema/)
            expect do
                controller.delete(
                    'x', :schema => body_schema, :params_schema => params_schema
                ) { nil }
            end.to raise_error(ArgumentError, /either schema or params_schema/)
        end

        it 'maps OpenNebula results and raised exceptions through error helpers' do
            controller.get { OpenNebula::Error.new('dependency down', OpenNebula::Error::EACTION) }
            controller.get('boom') { raise 'unexpected' }
            controller.register_routes(app)

            error_context = RouteContext.new
            exception_context = RouteContext.new
            error_context.singleton_class.send(:define_method, :execute, &app.routes[0].block)
            exception_context.singleton_class.send(:define_method, :execute, &app.routes[1].block)
            error_context.execute
            exception_context.execute

            expect(error_context.errors.first.first).to eq('dependency down')
            expect(exception_context.errors).to include(['unexpected', 500])
        end
    end

    describe ODS::DocumentController do
        let(:document) do
            double(
                'document', :name => 'demo', :delete => nil,
                :chmod_octet => nil, :chown => nil
            )
        end
        let(:resource_class) do
            current = document
            Class.new do
                define_singleton_method(:new_from_id) do |_client, _id, raw: false|
                    _ = raw
                    current
                end
            end
        end
        let(:pool_class) do
            resource = resource_class
            Class.new do
                const_set(:DOCUMENT_CLASS, resource)

                def initialize(**_options); end
            end
        end
        let(:controller) do
            resource = resource_class
            pool = pool_class
            Module.new do
                extend ODS::DocumentController

                const_set(:BASE_PATH, '/documents')
                const_set(:ODS_CLASS, resource)
                const_set(:ODS_POOL, pool)
                const_set(:Helpers, Module.new)
            end
        end
        let(:app) { RouteApp.new }

        before do
            allow(document).to receive(:to_json).and_return('{"name":"demo"}')
        end

        it 'registers show, attribute, action, create, update, delete and ownership routes' do
            controller.list
            controller.show
            controller.attribute(:name)
            controller.post('action') { nil }
            controller.create { document }
            controller.update
            controller.delete
            controller.chmod
            controller.chown
            controller.chgrp
            controller.logs
            controller.register_routes(app)

            expect(app.helpers_modules).to eq([controller.const_get(:Helpers)])
            expect(app.routes.map(&:path)).to include(
                '/documents', '/documents/:id', '/documents/:id/name',
                '/documents/:id/action',
                '/documents', '/documents/:id/chmod', '/documents/:id/chown',
                '/documents/:id/chgrp', '/documents/:id/logs'
            )
            expect(app.routes.count {|route| route.path == '/documents/:id' }).to eq(3)
        end

        it 'loads and serializes a document show response' do
            controller.show
            controller.register_routes(app)
            context = RouteContext.new
            context.params = { :id => '7' }

            context.instance_exec(&app.routes.first.block)

            expect(context.status_value).to eq(200)
            expect(context.body_value).to eq('{"name":"demo"}')
        end

        it 'lists filtered documents with per-document serialization policy' do
            second = double('second document')
            allow(second).to receive(:to_json).and_return('{"name":"second"}')
            pool = double('pool', :info => nil, :ids => [1, 2])
            allow(pool_class).to receive(:new).and_return(pool)
            allow(resource_class).to receive(:new_from_id).and_return(document, second)
            included_document = document
            controller.list(:raw => true) {|item| item.equal?(included_document) }
            controller.register_routes(app)
            context = RouteContext.new

            context.instance_exec(&app.routes.first.block)

            expect(context.status_value).to eq(200)
            expect(context.body_value).to eq('[{"name":"demo"}]')
            expect(resource_class).to have_received(:new_from_id)
                .with(:client, 1, :raw => true)
            expect(resource_class).to have_received(:new_from_id)
                .with(:client, 2, :raw => true)
        end

        it 'paginates existing logs and reports missing log files' do
            controller.logs
            controller.register_routes(app)
            route = app.routes.first
            context = RouteContext.new
            context.params = { :id => '7', :page => '2', :per_page => '5', :all => 'true' }
            allow(File).to receive(:exist?).and_return(true)

            context.singleton_class.send(:define_method, :execute, &route.block)
            context.execute

            path = File.join(LOG_LOCATION, APP_NAME, '7.log')
            expect(context.log_page_request).to eq([path, 2, 5, true])
            expect(context.status_value).to eq(200)

            missing = RouteContext.new
            missing.params = { :id => '8' }
            allow(File).to receive(:exist?).and_return(false)
            missing.singleton_class.send(:define_method, :execute, &route.block)
            missing.execute
            expect(missing.errors).to include(['Log file not found', 404])
        end

        it 'returns transformed attributes and action responses' do
            controller.attribute(:name) {|_doc, value| value.upcase }
            controller.post('action', :response => true, :status => 202) do |doc|
                { :name => doc.name }
            end
            controller.register_routes(app)
            contexts = app.routes.map do |route|
                RouteContext.new.tap do |context|
                    context.params = { :id => '7' }
                    context.instance_exec(&route.block)
                end
            end

            expect(contexts[0].body_value).to eq('DEMO'.to_json)
            expect(contexts[1].status_value).to eq(202)
            expect(contexts[1].body_value).to eq({ :name => 'demo' }.to_json)
        end

        it 'validates chmod/chown/chgrp request schemas' do
            expect(ODS::DocumentController::ChmodSchema.new.call(:octet => '640')).to be_success
            expect(ODS::DocumentController::ChmodSchema.new.call(:octet => 640)).to be_failure
            expect(ODS::DocumentController::ChownSchema.new.call(
                       :owner_id => 1, :group_id => 2
                   )).to be_success
            expect(ODS::DocumentController::ChgrpSchema.new.call(:group_id => nil)).to be_failure
        end

        it 'rejects ambiguous schemas for document actions and deletes' do
            schema = Class.new(Dry::Validation::Contract)
            expect do
                controller.post('x', :schema => schema, :params_schema => schema) { nil }
            end.to raise_error(ArgumentError, /either schema or params_schema/)
            expect do
                controller.delete('x', :schema => schema, :params_schema => schema) { nil }
            end.to raise_error(ArgumentError, /either schema or params_schema/)
        end
    end

    describe 'controller registration modules' do
        it 'registers application helpers, auth, errors and JSON defaults' do
            app = double('app')
            allow(app).to receive(:helpers)
            allow(app).to receive(:register)
            allow(app).to receive(:before)

            ODS::AppRoutes.registered(app)

            expect(app).to have_received(:helpers).with(ODS::RequestHelper)
            expect(app).to have_received(:helpers).with(ODS::ResponseHelper)
            expect(app).to have_received(:helpers).with(ODS::LogsHelper)
            expect(app).to have_received(:register).with(ODS::AuthController)
            expect(app).to have_received(:register).with(ODS::ErrorController)
            expect(app).to have_received(:before)
        end

        it 'registers generic error and not-found handlers' do
            app = double('app')
            allow(app).to receive(:error)
            allow(app).to receive(:not_found)

            ODS::ErrorController.registered(app)

            expect(app).to have_received(:error).with(500)
            expect(app).to have_received(:not_found)
        end
    end
end

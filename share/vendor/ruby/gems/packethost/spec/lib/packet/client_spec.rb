require 'spec_helper'

RSpec.describe Packet::Client do
  SUPPORTED_HTTP_METHODS = [:get, :post, :patch, :delete, :head].freeze

  subject { Packet::Client.new }
  let(:faraday) { double(Faraday::Connection) }
  let(:not_found_response) { OpenStruct.new(success?: false, status: 404, body: { errors: ['not found'] }) }
  let(:error_response) { OpenStruct.new(success?: false, status: 500, body: { errors: ['internal server error'] }) }
  before { allow(Faraday).to receive(:new).and_return(faraday) }
  before { SUPPORTED_HTTP_METHODS.each { |method| allow(faraday).to receive(method) { response } } }

  describe 'HTTP' do
    SUPPORTED_HTTP_METHODS.each do |method|
      describe "##{method}" do
        context 'when successful' do
          let(:response) { OpenStruct.new(success?: true, body: 'return') }

          it 'delegtes to the Faraday connection' do
            subject.send(method)
            expect(faraday).to have_received(method)
          end

          it 'returns the response' do
            expect(subject.send(method)).to be(response)
          end
        end

        context 'when not found' do
          let(:response) { not_found_response }
          it { expect { subject.send(method) }.to raise_error(Packet::NotFound) }
        end

        context 'an error has occurred' do
          let(:response) { error_response }
          it { expect { subject.send(method) }.to raise_error(Packet::Error) }
        end
      end
    end
  end

  describe 'Projects' do
    describe '#list_projects' do
      let(:count) { rand(1..100) }
      let(:response) { OpenStruct.new(success?: true, body: { 'projects' => Array.new(count) { |i| { name: "Project ##{i}" } } }) }
      it { expect(subject.list_projects).to be_an(Array) }
      it { expect(subject.list_projects).to all(be_a(Packet::Project)) }
      it { expect(subject.list_projects.size).to be(count) }
    end

    describe '#get_project' do
      context 'when found' do
        let(:id) { SecureRandom.uuid }
        let(:response) { OpenStruct.new(success?: true, body: { id: id }) }
        it { expect(subject.get_project(id)).to be_a(Packet::Project) }
        it { expect(subject.get_project(id).id).to eq(id) }

        context 'when including nested devices' do
          let(:device_id) { SecureRandom.uuid }
          let(:response) { OpenStruct.new(success?: true, body: { id: id, devices: [{ id: device_id }] }) }

          it { expect(subject.get_project(id, include: 'devices').devices).to all(be_a(Packet::Device)) }
          it { expect(subject.get_project(id, include: 'devices').devices.count).to be(1) }
        end
      end

      context 'when not found' do
        let(:response) { not_found_response }
        it { expect { subject.get_project('some other ID') }.to raise_error(Packet::Error) }
      end
    end

    describe '#create_project' do
      let(:id) { SecureRandom.uuid }
      let(:project) { Packet::Project.new(name: 'Test Project') }
      let(:response) { OpenStruct.new(success?: true, body: { id: id }) }

      it 'calls POST /projects' do
        expect(subject).to receive(:post).once.with(
          'projects',
          hash_including('name' => 'Test Project')
        ).and_return(response)
        subject.create_project(project)
      end

      context 'when successful' do
        it { expect(subject.create_project(project)).to be(response) }
        it { expect { subject.create_project(project) }.to change { project.id }.from(nil).to(id) }
      end

      context 'when unsuccessful' do
        before { allow(subject).to receive(:post).and_raise(Packet::Error) }

        it { expect { subject.create_project(project) }.to raise_error(Packet::Error) }
      end
    end

    describe '#update_project' do
      let(:project) { Packet::Project.new(id: SecureRandom.uuid, name: 'Test Project') }
      let(:response) { OpenStruct.new(success?: true, body: { id: project.id, name: 'New Name' }) }
      before { project.name = 'New Name' }

      it 'calls PATCH /projects/:id' do
        expect(subject).to receive(:patch).once.with(
          "projects/#{project.id}",
          hash_including('name' => 'New Name')
        ).and_return(response)
        subject.update_project(project)
      end

      context 'when successful' do
        it { expect(subject.update_project(project)).to be(response) }
      end

      context 'when unsuccessful' do
        before { allow(subject).to receive(:patch).and_raise(Packet::Error) }

        it { expect { subject.update_project(project) }.to raise_error(Packet::Error) }
      end
    end

    describe '#delete_project' do
      let(:project) { Packet::Project.new(id: SecureRandom.uuid) }

      it 'calls DELETE /projects/:id' do
        expect(subject).to receive(:delete).once.with("projects/#{project.id}")
        subject.delete_project(project)
      end

      context 'when successful' do
        let(:response) { OpenStruct.new(success?: true) }
        it { expect(subject.delete_project(project)).to be(response) }
      end

      context 'when unsuccessful' do
        let(:response) { error_response }
        it { expect { subject.delete_project(project) }.to raise_error(Packet::Error) }
      end
    end
  end

  describe 'Devices' do
    describe '#list_devices'
    describe '#get_device'
    describe '#create_device'
    describe '#delete_device'
    describe '#update_device'
    describe '#reboot_device'
    describe '#rescue_device'
    describe '#power_on_device'
    describe '#power_off_device'
  end
end

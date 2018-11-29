module Packet
  class Client
    module SshKeys
      def list_ssh_keys(*args)
        get('ssh-keys', *args).body['ssh_keys'].map { |p| Packet::SshKey.new(p, self) }
      end

      def get_ssh_key(id, *args)
        Packet::SshKey.new(get("ssh-keys/#{id}", *args).body, self)
      end

      def create_ssh_key(ssh_key)
        post('ssh-keys', ssh_key.to_hash).tap do |response|
          ssh_key.update_attributes(response.body)
        end
      end

      def update_ssh_key(ssh_key)
        patch("ssh-keys/#{ssh_key.id}", ssh_key.to_hash).tap do |response|
          ssh_key.update_attributes(response.body)
        end
      end

      def delete_ssh_key(ssh_key_or_id)
        id = if ssh_key_or_id.is_a?(Packet::SshKey)
               ssh_key_or_id.id
             else
               ssh_key_or_id
             end
        delete("ssh-keys/#{id}")
      end
    end
  end
end

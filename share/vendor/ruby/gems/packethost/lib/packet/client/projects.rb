module Packet
  class Client
    module Projects
      def list_projects(*args)
        get('projects', *args).body['projects'].map { |p| Packet::Project.new(p, self) }
      end

      def get_project(id, *args)
        Packet::Project.new(get("projects/#{id}", *args).body, self)
      end

      def create_project(project)
        post('projects', project.to_hash).tap do |response|
          project.update_attributes(response.body)
        end
      end

      def update_project(project)
        patch("projects/#{project.id}", project.to_hash).tap do |response|
          project.update_attributes(response.body)
        end
      end

      def delete_project(project_or_id)
        id = if project_or_id.is_a?(Packet::Project)
               project_or_id.id
             else
               project_or_id
             end
        delete("projects/#{id}")
      end
    end
  end
end

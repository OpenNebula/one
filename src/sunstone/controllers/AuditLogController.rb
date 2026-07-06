# Sunstone controller for audit log

class AuditLogController < ApplicationController
    # GET /audit_log
    def index
        filters = {}
        filters[:uid] = params[:user_id].to_i if params[:user_id]
        filters[:start_time] = params[:start_time].to_i if params[:start_time]
        filters[:end_time] = params[:end_time].to_i if params[:end_time]
        filters[:object_type] = params[:object_type] if params[:object_type]
        filters[:object_id] = params[:object_id].to_i if params[:object_id]
        filters[:request] = params[:request] if params[:request]
        filters[:result] = params[:result] if params[:result]

        @logs = OpenNebula::AuditLogPool.new(@client).get_all(filters)

        respond_to do |format|
            format.html # index.html.erb
            format.json { render json: @logs }
        end
    end

    # GET /audit_log/:id
    def show
        @log = OpenNebula::AuditLog.new(@client, params[:id])
        @log.info

        respond_to do |format|
            format.html # show.html.erb
            format.json { render json: @log.to_json }
        end
    end
end

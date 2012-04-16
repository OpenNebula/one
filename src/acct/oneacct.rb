# --------------------------------------------------------------------------
# Copyright 2002-2012, C12G Labs S.L.
#
# This file is part of OpenNebula addons.
#
# OpenNebula addons are free software: you can redistribute it
# and/or modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation, either version 3 of
# the License, or the hope That it will be useful, but (at your
# option) any later version.
#
# OpenNebula addons are distributed in WITHOUT ANY WARRANTY;
# without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more
# details.
#
# You should have received a copy of the GNU General Public License
# along with OpenNebula addons. If not, see
# <http://www.gnu.org/licenses/>
# --------------------------------------------------------------------------



require 'acct/watch_helper'

class AcctClient
    def initialize(filters={})
        @filters=filters
        @deltas=[]
        @users={}
    end

    def account(time_start=nil, time_end=nil, user_id=nil)
        @filters[:start]=time_start if time_start
        @filters[:end]=time_end if time_end
        @filters[:user]=user_id if user_id

        get_users_consumption

        @users
    end

private

    def get_users_consumption
        # Get all the deltas that match the filters
        @deltas=calculate_deltas.map {|q| q.values }

        @users=slices_by_user

        user_slices_and_deltas_to_vms
    end

    def slices_by_user
        # Get all VM slices that match the filters
        query=get_vm_slices(@filters)

        # This hash will hold the users with the resources consumed
        users={}

        query.each do |reg|
            vm=reg.vm
            uid=vm.uid.to_i

            # Create a new user register if it still does not exist
            user=users[uid]||={
                :vm_slices => [],
            }

            user[:vm_slices] << reg.values
        end

        users
    end

    def user_slices_and_deltas_to_vms
        @users.each do |user, data|
            # Get the VM ids array for this user
            vms=data[:vm_slices].map {|vm| vm[:id] }.sort.uniq

            data[:vms]={}

            vms.each do |vm|
                # Get the slices array for this VM
                slices=data[:vm_slices].select {|slice| slice[:id]==vm }

                data[:vms][vm]={
                    :slices => [],
                    :time => 0,
                }

                # Get the deltas sum for this VM
                vm_delta=@deltas.find {|d| d[:vm_id]==vm }

                data[:vms][vm][:network]=vm_delta
                data[:vms][vm][:vmid]=vm

                # Calculate the time consumed by the VM
                slices.each do |slice|
                    data[:vms][vm][:slices] << slice

                    time=calculate_time(slice,
                        @filters[:start], @filters[:end])
                    data[:vms][vm][:time]+=time
                end
            end

            # Delete redundant slices data
            data.delete(:vm_slices)
        end
    end

    def get_vm_slices(filters={})
        vms=WatchHelper::Register

        query=vms.join(:vms, :id => :vm_id)
        query=query.filter({:vms__uid => filters[:user]}) if filters[:user]
        query=query.filter(
            {:retime => 0} | (:retime > filters[:start])) if filters[:start]
        query=query.filter(:rstime <= filters[:end]) if filters[:end]

        query
    end

    def get_deltas(filters={})
        if filters[:data]
            query=filters[:data]
        else
            query=WatchHelper::VmDelta
        end

        query=query.filter( :ptimestamp >= filters[:start] ) if filters[:start]
        query=query.filter( :ptimestamp <= filters[:end] ) if filters[:end]
        query=query.filter( { :vm_id => filters[:vmid] } ) if filters[:vmid]

        query
    end

    def calculate_deltas
        query=WatchHelper::VmDelta.select(
            :ptimestamp, :vm_id,
            'sum(net_tx) AS net_tx'.lit, 'sum(net_rx) AS net_rx'.lit)

        query=query.group(:vm_id)

        new_filters=@filters.merge(:data => query)

        get_deltas(new_filters)
    end

    def calculate_time(slice, period_start, period_end)
        ts=slice[:rstime].to_i
        te=slice[:retime].to_i

        pstart=period_start.to_i
        pend=period_end.to_i

        pend=Time.now.to_i if pend==0

        ts=pstart if ts<pstart
        if te>pend or te==0
            te=pend
        end

        te-ts
    end
end

if $0 == __FILE__

    require 'json'

    acct=AcctClient.new(
        :start => 1319476322,
        :end => 1319637455
    )

    a=acct.account()

    puts JSON.pretty_generate(a)

end


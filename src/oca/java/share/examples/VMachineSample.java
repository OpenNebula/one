/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.vm.VirtualMachine;
import org.opennebula.client.vm.VirtualMachinePool;

public class VMachineSample{

    public static void main(String[] args)
    {
        // Let's try some of the OpenNebula Cloud API functionality for VMs.

        // First of all, a Client object has to be created.
        // Here the client will try to connect to OpenNebula using the default
        // options: the auth. file will be assumed to be at $ONE_AUTH, and the
        // endpoint will be set to the environment variable $ONE_XMLRPC.
        Client oneClient;

        try
        {
            oneClient = new Client();

            // We will try to create a new virtual machine. The first thing we
            // need is an OpenNebula virtual machine template.

            // This VM template is a valid one, but it will probably fail to run
            // if we try to deploy it; the path for the image is unlikely to
            // exist.
            String vmTemplate =
                  "NAME     = vm_from_java    CPU = 0.1    MEMORY = 64\n"
                + "#DISK     = [\n"
                + "#\tsource   = \"/home/user/vmachines/ttylinux/ttylinux.img\",\n"
                + "#\ttarget   = \"hda\",\n"
                + "#\treadonly = \"no\" ]\n"
                + "# NIC     = [ NETWORK = \"Non existing network\" ]\n"
                + "FEATURES = [ acpi=\"no\" ]";

            // You can try to uncomment the NIC line, in that case OpenNebula
            // won't be able to insert this machine in the database.

            System.out.println("Virtual Machine Template:\n" + vmTemplate);
            System.out.println();

            System.out.print("Trying to allocate the virtual machine... ");
            OneResponse rc = VirtualMachine.allocate(oneClient, vmTemplate);

            if( rc.isError() )
            {
                System.out.println( "failed!");
                throw new Exception( rc.getErrorMessage() );
            }

            // The response message is the new VM's ID
            int newVMID = Integer.parseInt(rc.getMessage());
            System.out.println("ok, ID " + newVMID + ".");

            // We can create a representation for the new VM, using the returned
            // VM-ID
            VirtualMachine vm = new VirtualMachine(newVMID, oneClient);

            // Let's hold the VM, so the scheduler won't try to deploy it
            System.out.print("Trying to hold the new VM... ");
            rc = vm.hold();

            if(rc.isError())
            {
                System.out.println("failed!");
                throw new Exception( rc.getErrorMessage() );
            }
            else
                System.out.println("ok.");

            // And now we can request its information.
            rc = vm.info();

            if(rc.isError())
                throw new Exception( rc.getErrorMessage() );

            System.out.println();
            System.out.println(
                    "This is the information OpenNebula stores for the new VM:");
            System.out.println(rc.getMessage() + "\n");

            // This VirtualMachine object has some helpers, so we can access its
            // attributes easily (remember to load the data first using the info
            // method).
            System.out.println("The new VM " +
                    vm.getName() + " has status: " + vm.status());

            // And we can also use xpath expressions
            System.out.println("The path of the disk is");
            System.out.println( "\t" + vm.xpath("template/disk/source") );

            // Let's delete the VirtualMachine object.
            vm = null;

            // The reference is lost, but we can ask OpenNebula about the VM
            // again. This time however, we are going to use the VM pool
            VirtualMachinePool vmPool = new VirtualMachinePool(oneClient);
            // Remember that we have to ask the pool to retrieve the information
            // from OpenNebula
            rc = vmPool.info();

            if(rc.isError())
                throw new Exception( rc.getErrorMessage() );

            System.out.println(
                    "\nThese are all the Virtual Machines in the pool:");
            for ( VirtualMachine vmachine : vmPool )
            {
                System.out.println("\tID : " + vmachine.getId() +
                                   ", Name : " + vmachine.getName() );

                // Check if we have found the VM we are looking for
                if ( vmachine.getId().equals( ""+newVMID ) )
                {
                    vm = vmachine;
                }
            }

            // We have also some useful helpers for the actions you can perform
            // on a virtual machine, like suspend:
            rc = vm.suspend();
            System.out.println("\nTrying to suspend the VM " + vm.getId() +
                                " (should fail)...");

            // This is all the information you can get from the OneResponse:
            System.out.println("\tOpenNebula response");
            System.out.println("\t  Error:  " + rc.isError());
            System.out.println("\t  Msg:    " + rc.getMessage());
            System.out.println("\t  ErrMsg: " + rc.getErrorMessage());

            rc = vm.terminate();
            System.out.println("\nTrying to terminate the VM " +
                                vm.getId() + "...");

            System.out.println("\tOpenNebula response");
            System.out.println("\t  Error:  " + rc.isError());
            System.out.println("\t  Msg:    " + rc.getMessage());
            System.out.println("\t  ErrMsg: " + rc.getErrorMessage());


        }
        catch (Exception e)
        {
            System.out.println(e.getMessage());
        }


    }

    public static void printVMachinePool (VirtualMachinePool vmPool)
    {
        System.out.println("--------------------------------------------");
        System.out.println("Number of VMs: " + vmPool.getLength());
        System.out.println("User ID\t\tName\t\tEnabled");

        // You can use the for-each loops with the OpenNebula pools
        for( VirtualMachine vm : vmPool )
        {
            String id   = vm.getId();
            String name = vm.getName();
            String enab = vm.xpath("enabled");

            System.out.println(id+"\t\t"+name+"\t\t"+enab);
        }

        System.out.println("--------------------------------------------");
    }
}

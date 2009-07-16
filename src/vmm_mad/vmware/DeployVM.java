/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */


import com.vmware.vim.*;
import com.vmware.apputils.*;
import com.vmware.apputils.vim.*;

import java.util.*;
import java.io.*;

import java.lang.*;

import java.rmi.RemoteException;


/*
 * Used to register a VM preloaded 
 */

public class DeployVM 
{
    String[] args;
    String   hostName;
    
    // Helpers from VI samples
    private static  ServiceContent content;    
    static  AppUtil cb = null;
    private static  VimPortType service;  
    
    private String  datacenterName  = "";
    private String  datastoreName   = "";
    private String  vmName          = "";
    private String  vmDiskName      = "";
    private String  vid             = "";


    ParseXML        pXML;
    
    // VM configuration objects
    VirtualMachineConfigSpec              vmConfigSpec;
    VirtualMachineConfigInfo              vmConfigInfo; 
    ManagedObjectReference                virtualMachine;
    
    com.vmware.vim.ManagedObjectReference hostMor; 
    
    public boolean registerVirtualMachine() throws Exception 
    {    
       boolean registered = false;

       ManagedObjectReference host = null;

       ManagedObjectReference dcmor 
          = cb.getServiceUtil().getDecendentMoRef(null, "Datacenter", getDataCenterName());
          
       com.vmware.vim.ManagedObjectReference vmFolderMor 
          = (com.vmware.vim.ManagedObjectReference)
             cb.getServiceUtil().getDynamicProperty(dcmor,"vmFolder");
    
       // Default Host
       com.vmware.vim.ManagedObjectReference hostFolderMor 
          = (com.vmware.vim.ManagedObjectReference)
             cb.getServiceUtil().getDynamicProperty(dcmor,"hostFolder");
             
       ArrayList hostList = (ArrayList)cb.getServiceUtil().getDecendentMoRefs(
            hostFolderMor,"HostSystem");  
            
       if(hostList.size() < 1) 
       {
          System.out.println("No host found in datacenter to"
                            +" register the Virtual Machine");
          return registered;
       }
       else 
       {
          boolean hostFound = false; 
          for(int i=0; i<hostList.size(); i++) 
          {

             com.vmware.vim.ManagedObjectReference [] datastores 
                = (com.vmware.vim.ManagedObjectReference [])
                   cb.getServiceUtil().getDynamicProperty(hostMor,"datastore");
       
             for(int j=0; j<datastores.length; j++) 
             {
                com.vmware.vim.DatastoreSummary datastoreSummary 
                   = (com.vmware.vim.DatastoreSummary)
                         cb.getServiceUtil().getDynamicProperty(datastores[j],"summary");

                if(datastoreSummary.getName().equalsIgnoreCase(getDataStoreName())) 
                {
                   com.vmware.vim.DatastoreInfo datastoreInfo 
                      = (com.vmware.vim.DatastoreInfo)
                         cb.getServiceUtil().getDynamicProperty(datastores[j],"info");

                   host      = hostMor;
                   hostFound = true;
                   i = hostList.size()+1;
                   j = datastores.length+1;
                }
             }
          }
          if(hostFound) 
          {
    
             String vmxPath = "[" + getDataStoreName() + "]one-"+getID()+"/one-"+getID()+".vmx";
             // Resource Pool
             ManagedObjectReference resourcePool 
                = cb.getServiceUtil().getFirstDecendentMoRef(null, "ResourcePool");
             // Registering The Virtual machine
             ManagedObjectReference taskmor 
                = cb.getConnection().getService().registerVM_Task(
                   vmFolderMor,vmxPath,getVmName(),false,resourcePool,host);

             String result = cb.getServiceUtil().waitForTask(taskmor);
             if (result.equalsIgnoreCase("Sucess")) // sic
             {
                registered = true;
             }
             else 
             {
                System.out.println("Exception registering the VM");
                registered = false;
             }
             return registered;
          }
          else 
          {
             System.out.println("No host in datacenter got the"
                               +" specified datastore and free space");
             return registered;
          }
       }
    }
    
    /**
     * Gets the name of the VM
     * @returns name of the VM
     */   
    private String getVmName()
    {
        return vmName;
    }
    
    /**
     * Gets the name of the VMX file and folder
     * @returns name of the VMX file and folder
     */   
    private String getDiskName()
    {
        return vmDiskName;
    }


    /**
     * Gets the name of the datacenter
     * @returns name of the datacenter
     */   
    private String getDataCenterName()
    {
        return datacenterName;
    }
    
    /**
     * Gets the name of the datastore
     * @returns name of the datastore
     */    
    private String getDataStoreName()
    {
        return datastoreName;
    }

    /**
     * Gets the vid
     * @returns vid
     */
    private String getID()
    {   
        return vid;
    }

    public boolean shapeVM() throws Exception 
    {
         
         virtualMachine 
            = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);
            
         vmConfigInfo 
            = (VirtualMachineConfigInfo)cb.getServiceUtil().getDynamicProperty(
                 virtualMachine,"config");
         
         vmConfigSpec = new VirtualMachineConfigSpec();
         

         
         vmConfigSpec.setMemoryMB((long)Integer.parseInt(pXML.getMemory()));

         vmConfigSpec.setNumCPUs(Integer.parseInt(pXML.getCPU()));

         // DISKs
         // TODO finish disk support
         // addDisks();
         
         // Network
         
         configureNetwork();
         
       
         // TODO CD for contextualization  
          
       
         /* if(deviceType.equalsIgnoreCase("cd")) {
            System.out.println("Reconfiguring The Virtual Machine For CD Update "  
                              + cb.get_option("vmname"));                          
            VirtualDeviceConfigSpec cdSpec = getCDDeviceConfigSpec();
            if(cdSpec != null) {
               VirtualDeviceConfigSpec [] cdSpecArray = {cdSpec};                     
               vmConfigSpec.setDeviceChange(cdSpecArray);
            }*/ 

         ManagedObjectReference tmor 
            = cb.getConnection().getService().reconfigVM_Task(
                virtualMachine, vmConfigSpec);
        
        String result = cb.getServiceUtil().waitForTask(tmor);
            
        if(!result.equalsIgnoreCase("sucess")) 
        {
            return false;
         }
         
         return true;
 
      }
      
      
     
     void configureNetwork()
     {
         String[][] nics                  = pXML.getNet();
         int        nics_toRemove_counter = 0; 
         if(nics.length==1 && nics[0].equals(""))
         {
             return;
         }
         
         // First, let's find out the number of NICs to be removed    
         VirtualDevice [] test = vmConfigInfo.getHardware().getDevice();
         
         VirtualDeviceConfigSpec [] nicSpecArray_toRemove = new VirtualDeviceConfigSpec[test.length];   
         
         // Let's remove existing NICs
         for(int i=0;i<test.length;i++)
         {
             VirtualDeviceConfigSpec nicSpec = new VirtualDeviceConfigSpec(); 
             VirtualEthernetCard nic;
             
             nicSpec.setOperation(VirtualDeviceConfigSpecOperation.remove);            
             
             try
             {
                nic             = (VirtualEthernetCard)test[i];
             }
             catch(Exception e)
             {
                 continue;
             }
             
             nicSpec.setDevice(nic);
             nicSpecArray_toRemove[nics_toRemove_counter++] = nicSpec;
         }
         
        

         VirtualDeviceConfigSpec [] nicSpecArray = new VirtualDeviceConfigSpec[nics_toRemove_counter+   
                                                                               nics.length];

         // Let's add specified NICs
         for(int i=nics_toRemove_counter;i<(nics.length+nics_toRemove_counter);i++)
         {
             VirtualDeviceConfigSpec nicSpec = new VirtualDeviceConfigSpec();
             String networkName = nics[i-nics_toRemove_counter][1]; 
             
             nicSpec.setOperation(VirtualDeviceConfigSpecOperation.add);
             VirtualEthernetCard nic =  new VirtualPCNet32();
             VirtualEthernetCardNetworkBackingInfo nicBacking 
                = new VirtualEthernetCardNetworkBackingInfo();
             nicBacking.setDeviceName(networkName);
             nic.setAddressType("manual");
             nic.setMacAddress(nics[i-nics_toRemove_counter][0]);
             nic.setBacking(nicBacking);
             nic.setKey(4);
             nicSpec.setDevice(nic);
             nicSpecArray[i] = nicSpec; 
         }

         for(int i=0;i<nics_toRemove_counter;i++)
         {
            nicSpecArray[i] = nicSpecArray_toRemove[i];
         }
         
         vmConfigSpec.setDeviceChange(nicSpecArray);
    }
      
    public boolean connect()
    {
        try
        {
            cb = AppUtil.initialize("DeployVM", null, args);
            cb.connect();
     
            // Get reference to host
            hostMor = cb.getServiceUtil().getDecendentMoRef(null,"HostSystem",
                                                               hostName);
                                                            
            com.vmware.apputils.vim.ServiceConnection sc = cb.getConnection();
            content = sc.getServiceContent();
            service = sc.getService();
            
            return true;
        }
        catch(Exception e)
        {
            return false;
        }

    }

    public void disconnect()
    {
        try
        {
            cb.disConnect();
        }
        catch(Exception e){}
    }
       
    DeployVM(String[] arguments, String _hostName, String _vid, ParseXML _pXML, String _datastore, String _datacenter) throws Exception
    {  
        args = new String[arguments.length+2];

        for(int i=0;i<arguments.length;i++)
        {
            args[i] = arguments[i];
        }
        
        args[arguments.length]      = "--url";
        args[arguments.length + 1 ] = "https://" + _hostName + ":443/sdk";

        datastoreName  = _datastore;
        datacenterName = _datacenter;
        
        vmName     = _pXML.getName() + "-" + _vid;
        vmDiskName = _pXML.getName();
        pXML       = _pXML;
        vid        = _vid;
        hostName = _hostName;
    }
    
    DeployVM(String[] arguments, String _hostName, String _vmName, String _vid, String _datastore, String _datacenter) throws Exception
    {  

        args = new String[arguments.length+2];
        
        for(int i=0;i<arguments.length;i++)
        {
            args[i] = arguments[i];
        }
        
        args[arguments.length]      = "--url";
        args[arguments.length + 1 ] = "https://" + _hostName + ":443/sdk";
        
        datastoreName  = _datastore;
        datacenterName = _datacenter;
        
        vmName     = _vmName;
        vmDiskName = _vmName.substring(0,_vmName.lastIndexOf("-"));
        vid        = _vid;

        hostName = _hostName;
    }
    
/*
     void addDisks()
     {
         String[] disks = pXML.getDisk();
         
         if(disks.length==1 && disks[0].equals(""))
         {
             return;
         }
         
         VirtualDeviceConfigSpec [] vdiskSpecArray = new VirtualDeviceConfigSpec[disks.length];
         
         for(int i=0;i<disks.length;i++)
         {
         
             VirtualDeviceConfigSpec diskSpec = new VirtualDeviceConfigSpec();      
                                   
             
             VirtualDisk disk =  new VirtualDisk();
             VirtualDiskFlatVer2BackingInfo diskfileBacking 
                = new VirtualDiskFlatVer2BackingInfo();    
        
             
             int ckey       = 0;
             int unitNumber = 0;
             
             VirtualDevice [] test = vmConfigInfo.getHardware().getDevice();
             for(int k=0;k<test.length;k++)
             {
                if(test[k].getDeviceInfo().getLabel().equalsIgnoreCase(
                   "SCSI Controller 0"))
                {
                   ckey = test[k].getKey();                                
                }
             }     
             
             unitNumber = test.length + 1;                
             String fileName = "["+datastoreName+"] "+ getVmName()
                             + "/"+ disks[i];
             
             diskfileBacking.setFileName(fileName);
             // TODO make this configurable
             diskfileBacking.setDiskMode("persistent");          
             
             disk.setControllerKey(ckey);
             disk.setUnitNumber(unitNumber);
             
             // TODO does this work
             disk.setBacking(diskfileBacking);
             //int size = 1024 * (Integer.parseInt(cb.get_option("disksize")));
             disk.setCapacityInKB(8388608);
             disk.setKey(-1);
             
             diskSpec.setOperation(VirtualDeviceConfigSpecOperation.add);           
             diskSpec.setFileOperation(VirtualDeviceConfigSpecFileOperation.create);           
             diskSpec.setDevice(disk);
             
             vdiskSpecArray[i]=diskSpec;         
         }
         
         vmConfigSpec.setDeviceChange(vdiskSpecArray);           
     }*/
}

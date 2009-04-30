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
 * Used to enforce an operaton over a VM
 */

public class OperationsOverVM 
{    
    // Helpers from VI samples
    private static  AppUtil cb = null;
    
    ManagedObjectReference  virtualMachine;
    
    private String  datacenterName  = "";
    private String  datastoreName   = "";
    
    private boolean getTaskInfo(ManagedObjectReference taskmor) throws Exception
    {
       DynamicProperty[]  scsiArry = getDynamicProperties(taskmor,"info");
       TaskInfo tinfo      = ((TaskInfo)(scsiArry[0]).getVal());
       String res          = cb.getServiceUtil().waitForTask(taskmor);
       
       if(res.equalsIgnoreCase("sucess")) 
       {
          return true;
       }
       else 
       {
          return false;
       }
    }
    
    private DynamicProperty[] getDynamicProperties
                     (ManagedObjectReference mobjRef,String pName )throws Exception
    {

       ObjectContent[] objContent = 
            cb.getServiceUtil().getObjectProperties(null, mobjRef,
               new String[] { pName });
       ObjectContent contentObj = objContent[0];
       DynamicProperty[] objArr = contentObj.getPropSet();
       return objArr;
    }
    
    public boolean powerOn(String vmName) throws Exception
    {
        ManagedObjectReference taskmor = null;   
        
        ManagedObjectReference  virtualMachine 
           = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);
             
        taskmor        = cb.getConnection().getService().powerOnVM_Task(virtualMachine, null);

        boolean result = getTaskInfo(taskmor);
        
        return result;
    }
    
    public boolean powerOff(String vmName)
    {    
        try
        { 
            ManagedObjectReference taskmor = null;   
            
            ManagedObjectReference  virtualMachine 
               = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);
            
            taskmor = cb.getConnection().getService().powerOffVM_Task(virtualMachine);
            
            boolean result = getTaskInfo(taskmor);
            
            return result;
        }
        catch(Exception e)
        {
            System.out.println("Error powering off VirtualMachine [" + vmName + "]. Reason:" + e.getMessage());
            return false;
        }
    }
    
    public boolean save(String vmName, String checkpointName)
    {   
        // first, create the checkpoint
        
        if(!createCheckpoint(vmName,checkpointName))
        {
            return false;
        }
        
        try
        { 
            ManagedObjectReference taskmor = null;   
            
            ManagedObjectReference  virtualMachine 
               = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);
            
            taskmor = cb.getConnection().getService().suspendVM_Task(virtualMachine);
            
            boolean result = getTaskInfo(taskmor);
            
            return result;
        }
        catch(Exception e)
        {
            System.out.println("Error suspending VirtualMachine [" + vmName + "]. Reason:" + e.getMessage());
            return false;
        }
    } 
    
    public boolean createCheckpoint(String vmName, String checkpointName)
    {
        try
        {
            ManagedObjectReference  virtualMachine 
               = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);  
            ManagedObjectReference taskMor 
               = cb.getConnection().getService().createSnapshot_Task(
                                               virtualMachine, checkpointName,
                                               "This checkpoint corresponds to filename = " + 
                                               checkpointName, false, false);
            String res = cb.getServiceUtil().waitForTask(taskMor);
        
            if(res.equalsIgnoreCase("sucess"))  // sic
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        catch(Exception e)
        {
            System.out.println("Error checkpointing VirtualMachine [" + vmName + "]. Reason:" + e.getMessage());
            return false;
        }
    }
    
    public boolean restoreCheckpoint(String vmName, String checkpointName)
    {
       
        try
        {
             ManagedObjectReference snapmor = null;
            
             ManagedObjectReference  virtualMachine 
                = cb.getServiceUtil().getDecendentMoRef(null, "VirtualMachine", vmName);
             
             ObjectContent[] snaps = cb.getServiceUtil().getObjectProperties(
                null, virtualMachine, new String[] { "snapshot" } );
            
             VirtualMachineSnapshotInfo snapInfo = null;
             
             if (snaps != null && snaps.length > 0) 
             {
                 ObjectContent snapobj     = snaps[0];
                 DynamicProperty[] snapary = snapobj.getPropSet();
                 if (snapary != null && snapary.length > 0) 
                 {
                    snapInfo = ((VirtualMachineSnapshotInfo)(snapary[0]).getVal());
                 }
             } 
             else 
             {
                 throw new Exception("No Snapshots found for VirtualMachine : " + vmName);
             }
             
             VirtualMachineSnapshotTree[] snapTree = snapInfo.getRootSnapshotList();
             
             if (snapTree == null) 
             {
                throw new Exception("No Snapshots Tree found for VirtualMachine : " + vmName);
             }
             
             snapmor = traverseSnapshotInTree(snapTree, checkpointName);
             
             if (snapmor == null) 
             {
                throw new Exception("No Snapshot named " + checkpointName + 
                                    " found for VirtualMachine : " + vmName);
             }
             
            ManagedObjectReference taskMor 
                   = cb.getConnection().getService().revertToSnapshot_Task(snapmor,null);      
            String res = cb.getServiceUtil().waitForTask(taskMor);
                
            if(!res.equalsIgnoreCase("sucess"))  // sic
            {
               throw new Exception("Unknown problem while creating the snapshot.");
            }
            
            return true;                      
         }
         catch(Exception e)
         {
             System.out.println("Error checkpointing VirtualMachine [" + vmName + "]. Reason:" + e.getMessage());
             return false;
         }
    }
    
    private ManagedObjectReference traverseSnapshotInTree(
                                         VirtualMachineSnapshotTree[] snapTree,  
                                         String checkpointName) 
    {
         ManagedObjectReference snapmor = null;      
         if (snapTree == null) 
         {
             return snapmor;
         }
         
         for (int i = 0; i < snapTree.length && snapmor == null; i++)
         {
             VirtualMachineSnapshotTree node = snapTree[i];
             if ( checkpointName != null && node.getName().equals(checkpointName) ) 
             {
                 snapmor = node.getSnapshot();
             } 
             else 
             {
                 VirtualMachineSnapshotTree[] childTree = node.getChildSnapshotList();
                 snapmor = traverseSnapshotInTree(childTree, checkpointName);
             }
         }

         return snapmor;
      }


    OperationsOverVM(String[] args, String hostName) throws Exception
    {
        String[] argsWithHost = new String[args.length+2];

         for(int i=0;i<args.length;i++)
         {
             argsWithHost[i] = args[i];
         }

         argsWithHost[args.length]      = "--url";
         argsWithHost[arguments.length + 1 ] = "https://" + hostName + ":443/sdk";


         cb = AppUtil.initialize("DeployVM", null, argsWithHost);
         cb.connect();
        
        // TODO get this dynamically
        datastoreName  = "datastore1";
        datacenterName = "ha-datacenter";                                    
    }

}
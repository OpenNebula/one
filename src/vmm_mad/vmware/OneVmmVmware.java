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



import java.io.*;

import com.vmware.vim.*;
import com.vmware.apputils.*;
import com.vmware.apputils.vim.*;

class OneVmmVmware extends Thread 
{
    private String[]     arguments;
    OperationsOverVM     oVM;

    // Helpers from VI samples
    static  AppUtil cb = null;
    
    public static void main(String[] args) 
    {
        // first, make redirection
        
        PrintStream stdout = System.out;                                       
        PrintStream stderr = System.err;
      
        System.setOut(stderr);
        System.setErr(stdout);
        OneVmmVmware omv = new OneVmmVmware(args);
        omv.loop();
    }

    // Constructor
    OneVmmVmware(String[] args) 
    {
        arguments = args;
    }

    protected void finalize() throws Throwable
    {	
		cb.disConnect();
    }
    

    // Main loop, threaded
    void loop() 
    {
        String  str     = null;
        String  action  = null;
        String  vid_str = null;
		String  hostName;
		String  fileName;
        boolean fin     = false;
        
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

        while (!fin) 
	    {
            // Read a line a parse it
            try
            {
                str = in.readLine();
            }
            catch (IOException e)
            {
                String message = e.getMessage().replace('\n', ' ');

                synchronized (System.err)
                {
                    System.err.println(action + " FAILURE " + vid_str + " " + message);
                }
            }

            String str_split[] = str.split(" ", 5);
            
            action    = str_split[0].toUpperCase();

            // Perform the action
            if (action.equals("INIT"))
            {
                init();
            }
            else if (action.equals("FINALIZE"))
            {
                finalize_mad();
                fin = true;
            } 
            else 
            {
                if (action.equals("DEPLOY"))
                {                           
                    if (str_split.length != 4)
                    {   
                       System.out.println("FAILURE Wrong number of arguments for DEPLOY action. Number args = [" +
                                              str_split.length + "].");
                       synchronized (System.err)
                       {
                           System.err.println(action + " FAILURE " + vid_str); 
                           continue;
                       }      
                    }
                    else
                    {
                        vid_str        = str_split[1];
                        hostName       = str_split[2];  
                        fileName       = str_split[3];
                                          
                        try
                        {    
                            // let's read the XML file and extract needed info
                            ParseXML pXML = new ParseXML(fileName);

                            // First, register the VM
                            DeployVM dVM = new DeployVM(arguments, hostName, vid_str, pXML);

                            if(!dVM.registerVirtualMachine())
                            {
                                // We will skip this error, it may be pre-registered
                            }

                            // Now, proceed with the reconfiguration
                            
                            if(!dVM.shapeVM())
                            {
                                throw new Exception("Error reconfiguring VM (" + pXML.getName() + ").");
                            }

                            try
                            {
                                oVM = new OperationsOverVM(arguments,hostName);
                            }
                            catch(Exception e)
                            {
                                synchronized (System.err)
                                {
                                    System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                       hostName +". Reason: " + e.getMessage());
                                }
                                continue;
                            }
                            
                            if(!oVM.powerOn(pXML.getName() + "-" + vid_str))
                            {
                                throw new Exception("Error powering on VM(" + pXML.getName() + ").");
                            }
                            
                            synchronized (System.err)
                            {
                                 System.err.println("DEPLOY SUCCESS " + vid_str + " " + pXML.getName() + "-" + vid_str);
                            }
                            
                            continue;
                         
                         }
                         catch(Exception e)
                         {
                             System.out.println("Failed deploying VM " + vid_str + " into " + hostName + 
                                                ".Reason:" + e.getMessage());
                             // TODO make DEBUG option
                             // e.printStackTrace(); 
                        
                             synchronized (System.err)
                             {
                                 System.err.println("DEPLOY FAILURE " + vid_str + " Failed deploying VM in host " + 
                                                    hostName + ". Please check the VM log.");
                             }
                         } // catch
           		    } // else if (str_split.length != 4)
                 } // if (action.equals("DEPLOY"))
                 
                 if (action.equals("SHUTDOWN"))
                 {                           
                     if (str_split.length < 3 )
                     {  
                        System.out.println("FAILURE Wrong number of arguments for SHUTDOWN action. Number args = [" +
                                           str_split.length + "].");
                        synchronized (System.err)
                        {

                            System.err.println(action + " FAILURE " + vid_str); 
                            continue;
                        }
                     }
                     else
                     {
                         
                         vid_str        = str_split[1];
                         hostName       = str_split[2];  
                         String vmName  = str_split[3];
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    hostName +". Reason: " + e.getMessage());
                             }
                             continue;
                         }
                         
                         if(!oVM.powerOff(vmName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println("SHUTDOWN FAILURE " + vid_str + " Failed shutdown VM in host " + 
                                                    hostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println("SHUTDOWN SUCCESS " + vid_str);                             
                             }
                         }
                      }
                      
                      continue;
                 } // if (action.equals("SHUTDOWN"))
                 
                 if (action.equals("SHUTDOWN") || action.equals("CANCEL"))
                 {                           
                     if (str_split.length < 3 )
                     {  
                         System.out.println("FAILURE Wrong number of arguments for " + action + 
                                           " action. Number args = [" +
                                           str_split.length + "].");
                                           
                        synchronized (System.err)
                        {
                            System.err.println(action + " FAILURE " + vid_str); 
                            continue;
                        }
                     }
                     else
                     {
                         
                         vid_str        = str_split[1];
                         hostName       = str_split[2];  
                         String vmName  = str_split[3];
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    hostName +". Reason: " + e.getMessage());
                             }
                             continue;
                         }
                         
                         if(!oVM.powerOff(vmName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed shutdown VM in host " + 
                                                    hostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " SUCCESS " + vid_str);                             
                             }
                         }
                      }
                      
                      continue;
                 } // if (action.equals("SHUTDOWN or CANCEL"))
                 
                 if (action.equals("SAVE"))
                 {                           
                     if (str_split.length < 4)
                     {  
                        System.out.println("FAILURE Wrong number of arguments for SAVE action. Number args = [" +
                                           str_split.length + "].");
                                           
                        synchronized (System.err)
                        {
                            System.err.println(action + " FAILURE " + vid_str); 
                            continue;
                        }
                     }
                     else
                     {              
                         vid_str               = str_split[1];
                         hostName              = str_split[2];  
                         String vmName         = str_split[3];
                         String checkpointName = str_split[4];
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    hostName +". Reason: " + e.getMessage());
                             }
                             continue;
                         }
                         
                         if(!oVM.save(vmName,checkpointName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed suspending VM in host " + 
                                                    hostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " SUCCESS " + vid_str);                             
                             }
                         }
                         
                         continue;
                      }
                 } // if (action.equals("SAVE"))
                 
                 if (action.equals("CHECKPOINT"))
                 {       
                     if (str_split.length < 4)
                     {  
                        System.out.println("FAILURE Wrong number of arguments for CHECKPOINT action. Number args = [" +
                                           str_split.length + "].");
                        synchronized (System.err)
                        {
                            System.err.println(action + " FAILURE " + vid_str); 
                            continue;
                        }
                     }
                     else 
                     {              
                         vid_str               = str_split[1];
                         hostName              = str_split[2];  
                         String vmName         = str_split[3];
                         String checkpointName = str_split[4];
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    hostName +". Reason: " + e.getMessage());
                             }
                             continue;
                         }
                         
                         if(!oVM.createCheckpoint(vmName,checkpointName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed suspending VM in host " + 
                                                    hostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " SUCCESS " + vid_str);                             
                             }
                         }
                         
                         continue;
                      }
                 } // if (action.equals("CHECKPOINT"))
                 
                 if (action.equals("RESTORE"))
                 {       
                     if (str_split.length < 4)
                     {  
                        System.out.println("FAILURE Wrong number of arguments for RESTORE " + 
                                           "action. Number args = [" + str_split.length + "].");
                        synchronized (System.err)
                        {
                            System.err.println(action + " FAILURE " + vid_str); 
                            continue;
                        }
                     }
                     else 
                     {              
                         vid_str               = str_split[1];
                         hostName              = str_split[2];  
                         String checkpointName = str_split[3];
                         
                         boolean result;
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    hostName +". Reason: " + e.getMessage());
                                 continue;
                             }
                         }
                         
                         if(!oVM.restoreCheckpoint("one-"+vid_str,checkpointName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed restoring VM in host " + 
                                                    hostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " SUCCESS " + vid_str);                             
                             }
                         }
                         
                         continue;
                     }
                 } // if (action.equals("RESTORE"))
                 
                 if (action.equals("MIGRATE"))
                 {      
                     if (str_split.length < 4)
                     {
                         System.out.println("FAILURE Wrong number of arguments for MIGTRATE " + 
                                            "action. Number args = [" + str_split.length + "].");
                         synchronized (System.err)
                         {
                             System.err.println(action + " FAILURE " + vid_str); 
                             continue;
                         }
                     }
                     else
                     {
                         vid_str               = str_split[1];
                         String sourceHostName = str_split[2];  
                         String vmName         = str_split[3];
                         String destHostName   = str_split[4];
                         
                         // First, create the checkpoint
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,sourceHostName);
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                    sourceHostName +". Reason: " + e.getMessage());
                             }
                             continue;
                         }
                         
                         // First, checkpoint the running virtual machine
                         
                         String checkpointName = "one-migrate-" + vid_str;
                         
                         if(!oVM.save(vmName,checkpointName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed saving VM in host " + 
                                                    sourceHostName);
                                 continue;
                             }
                         }
                         
                         // Now, we stop it
                         
                         if(!oVM.powerOff(vmName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed shutdown VM in host " + 
                                                    sourceHostName);
                             }
                         }
                         
                         // Now, register machine in new host
                         
                         DeployVM dVM;
                         try
                         {
                             oVM = new OperationsOverVM(arguments,destHostName);
                             dVM = new DeployVM(arguments, destHostName, vmName);
                             
                             if(!dVM.registerVirtualMachine())
                             {
                                 // We will skip this error, it may be pre-registered
                             }

                             // Power it On

                             if(!oVM.powerOn(vmName))
                             {
                                 throw new Exception();
                             }
                         }
                         catch(Exception e)
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed registering VM ["
                                                    + vmName + "] in host " + destHostName);
                             }
                             continue;
                         }
                         
                         
                         // Restore the virtual machine checkpoint
                         
                         if(!oVM.restoreCheckpoint(vmName,checkpointName))
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " FAILURE " + vid_str + " Failed restoring VM [" + 
                                                    vmName + "] in host " +  destHostName);
                             }
                         }
                         else
                         {
                             synchronized (System.err)
                             {
                                 System.err.println(action + " SUCCESS " + vid_str);                             
                             }
                         }
                         
                         continue;
                     }                
                 } // if (action.equals("MIGRATE"))           
             } //  else if (action.equals("FINALIZE"))
        } // while(!fin)
    } // loop

    void init() 
    {
        // Nothing to do here
        synchronized(System.err)
        {
            System.err.println("INIT SUCCESS");
        }
    }

    void finalize_mad() 
    {
        // Nothing to do here
        synchronized(System.err)
        {
            System.err.println("FINALIZE SUCCESS");
        }
    }
}


/*
# -------------------------------------------------------------------------#
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                          #
# Licensed under the Apache License, Version 2.0 (the "License"); you may  #
# not use this file except in compliance with the License. You may obtain  #
# a copy of the License at                                                 #
#                                                                          #
# http://www.apache.org/licenses/LICENSE-2.0                               #
#                                                                          #
# Unless required by applicable law or agreed to in writing, software      #
# distributed under the License is distributed on an "AS IS" BASIS,        #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. #
# See the License for the specific language governing permissions and      #
# limitations under the License.                                           #
#--------------------------------------------------------------------------#
*/

import java.io.*;
import java.util.*;
import java.text.*;

import com.vmware.vim.*;
import com.vmware.apputils.*;
import com.vmware.apputils.vim.*;

/************************************
 * Manages VMware VMs               *
 * through the VI API               *
 ************************************/
class OneVmmVmware extends Thread 
{
    private String[]     arguments;
    OperationsOverVM     oVM;
    DeployVM             dVM;

    boolean              debug;
    
    PrintStream          stdout;
    PrintStream          stderr;

    public static void main(String[] args) 
    { 
        boolean debug_flag;
                
        if (System.getProperty("debug").equals("1"))
        {
            debug_flag=true;
        }
        else
        {
            debug_flag=false;
        }

        OneVmmVmware omv = new OneVmmVmware(args, debug_flag);
        omv.loop();
    }

    // Constructor
    OneVmmVmware(String[] args, boolean _debug) 
    {
        debug     = _debug;
        arguments = args;
        
        // Get out and err descriptors
        stdout    = System.out;
        stderr    = System.err;
        
        // No VMware library output to standard out 
        // or err. This will be activated when needed
        disable_standard_output();
        disable_standard_error();
    }

    // Main loop
    void loop() 
    {
        String  str     = null;
        String  action  = null;
        String  vid_str = null;
		String  hostName;
		String  fileName;
        boolean end     = false;
        
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

        while (!end) 
	    {
            action   = null;
            vid_str  = null;
            hostName = null;
            fileName = null;
	        
            // Read a line and parse it
            try
            {
                str = in.readLine();
            }
            catch (IOException e)
            {
                String message = e.getMessage().replace('\n', ' ');

                send_message(action + " FAILURE " + vid_str + " " + message);
                send_error  (action + " FAILURE " + vid_str + 
                             " Action malformed. Reason: " + message);
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
                end = true;
            } 
            else 
            {
                if (action.equals("DEPLOY"))
                {                           
                    if (str_split.length != 5)
                    {   
                       send_message(action + " FAILURE " + vid_str);     
                       send_error("FAILURE Wrong number of arguments for DEPLOY action. Number args = [" +
                                              str_split.length + "].");
                       continue;
                    }
                    else
                    {
                        vid_str        = str_split[1];
                        hostName       = str_split[2];  
                        fileName       = str_split[3];
                                          
                        try
                        {   
                            fileName = fileName.replace("/images", "");

                            // let's read the XML file and extract needed info
                            ParseXML pXML = new ParseXML(fileName);

                            // First, register the VM
                            dVM = new DeployVM(arguments, 
                                                        hostName, 
                                                        vid_str, 
                                                        pXML,
                                                        System.getProperty("datastore"),
                                                        System.getProperty("datacenter"));

                            if(!dVM.connect())
                            {
                                throw new Exception("DeployVM: Failed connection to host " + hostName);
                            }

                            if(!dVM.registerVirtualMachine())
                            {
                                // We will skip this error, it may be pre-registered
                            }

                            // Now, proceed with the reconfiguration
                            
                            if(!dVM.shapeVM())
                            {
                                // Will try and deregister VM
                                try
                                {
                                    oVM = new OperationsOverVM(arguments,hostName);
                                    String vmName = pXML.getName() + "-" + vid_str;
                                    oVM.deregisterVM(vmName);
                                }
                                catch(Exception e){}

                                throw new Exception("Error reconfiguring VM (" + pXML.getName() + ").");
                            }

                            dVM.disconnect();

                            try
                            {
                                oVM = new OperationsOverVM(arguments,hostName);
                                
                                if(!oVM.connect())
                                { 
                                    throw new Exception("Failed connection to host " + hostName);
                                }

                            }
                            catch(Exception e)
                            {
                                oVM.disconnect();
                                send_message(action + " FAILURE " + vid_str + " " + e.getMessage());
                                if (!debug)
                                    send_error  (action + " FAILURE " + vid_str + " " + e.getMessage());
                                continue;
                            }
                            
                            if(!oVM.powerOn(pXML.getName() + "-" + vid_str))
                            {
                                // Will try and deregister VM
                                try
                                {
                                    String vmName = pXML.getName() + "-" + vid_str;
                                    oVM.deregisterVM(vmName);
                                }
                                catch(Exception e)
                                {
                                    oVM.disconnect();
                                }
                                throw new Exception("Error powering on VM(" + pXML.getName() + ").");
                            }
                            
                            send_message("DEPLOY SUCCESS " + vid_str + " " + pXML.getName() + "-" + vid_str);
                            oVM.disconnect();
                            
                            continue;
                         
                         }
                         catch(Exception e)
                         {
                             send_message("DEPLOY FAILURE " + vid_str + " Failed deploying VM in host " + 
                                                hostName + ".");
                             
                             if(debug)
                             {
                                 send_error("Failed deploying VM " + vid_str + " into " + hostName +
                                             ".Reason: "+ e.getMessage() +
                                             "\n---- Debug stack trace ----");
                                 enable_standard_error();
                                 e.printStackTrace();
                                 disable_standard_error();
                                 send_error("---------------------------");
                             }
                             else
                             {   // If debug activated, this will be replicated in send_message
                                 send_error("Failed deploying VM " + vid_str + " into " + hostName + 
                                                  ".Reason:" + e.getMessage());
                             }
                         } // catch
           		    } // else if (str_split.length != 4)
                 } // if (action.equals("DEPLOY"))
                 
                 if (action.equals("SHUTDOWN") || action.equals("CANCEL"))
                 {                           
                     if (str_split.length < 3 )
                     {  
                         send_message(action + " FAILURE " + vid_str);
                         send_error("FAILURE Wrong number of arguments for " + action + 
                                           " action. Number args = [" +
                                           str_split.length + "].");
                     }
                     else
                     {
                         
                         vid_str        = str_split[1];
                         hostName       = str_split[2];  
                         String vmName  = str_split[3];
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);
                             if(!oVM.connect())
                             { 
                                 throw new Exception("Failed connection to host " + hostName);
                             }
                         }
                         catch(Exception e)
                         {
                             send_message(action + " FAILURE " + vid_str + " " + e.getMessage());
                             if(!debug)
                                 send_error(action + " FAILURE " + vid_str + " " + e.getMessage());
                             oVM.disconnect();
                             continue;
                         }
                         
                         if(!oVM.powerOff(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed shutdown VM in host " + 
                                                    hostName);
                             oVM.disconnect();
                             continue;
                         }

                         if(!oVM.deregisterVM(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed deregistering of " +vmName
                                                    + " in host " + hostName +".");
                             oVM.disconnect();
                             continue;
                         }
                         else
                         {
                             send_message(action + " SUCCESS " + vid_str);                             
                         }
                      }
                      oVM.disconnect();                     
                      continue;
                 } // if (action.equals("SHUTDOWN or CANCEL"))
                 
                 if (action.equals("SAVE"))
                 {                           
                     if (str_split.length < 5)
                     {  
                        send_message(action + " FAILURE " + vid_str); 
                        send_error("FAILURE Wrong number of arguments for SAVE action. Number args = [" +
                                           str_split.length + "].");
                        continue;                   
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
                             if(!oVM.connect())
                             { 
                                 throw new Exception("Failed connection to host " + hostName);
                             }
                         }
                         catch(Exception e)
                         {
                             send_message(action + " FAILURE " + vid_str + " " + e.getMessage());
                             if(!debug)
                                send_error(action + " FAILURE " + vid_str + " " + e.getMessage());
                             oVM.disconnect();
                             continue;
                         }
                         
                         if(!oVM.save(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed suspending VM in host " + 
                                                    hostName);
                             oVM.disconnect();
                             continue;
                         }

                         if(!oVM.deregisterVM(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed deregistering of " +vmName
                                                    + " in host " + hostName +".");
                             oVM.disconnect();
                             continue;
                         }
                         else
                         {
                             send_message(action + " SUCCESS " + vid_str);                             
                         }
                         oVM.disconnect();                        
                         continue;
                      }
                 } // if (action.equals("SAVE"))
                 
                 if (action.equals("CHECKPOINT"))
                 {       
                     if (str_split.length < 4)
                     {  
                        send_message(action + " FAILURE " + vid_str);  
                        send_error("FAILURE Wrong number of arguments for CHECKPOINT action. Number args = [" +
                                           str_split.length + "].");
                        continue;
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
                             if(!oVM.connect())
                             { 
                                 throw new Exception("Failed connection to host " + hostName);
                             }
                         }
                         catch(Exception e)
                         {
                             send_message(action + " FAILURE " + vid_str + " " + e.getMessage());
                             oVM.disconnect();
                             continue;
                         }
                         
                         if(!oVM.createCheckpoint(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed suspending VM in host " + 
                                                    hostName);
                             oVM.disconnect();
                             continue;
                         }
                         else
                         {
                             send_message(action + " SUCCESS " + vid_str);                             
                         }
                         oVM.disconnect();                         
                         continue;
                      }
                 } // if (action.equals("CHECKPOINT"))
                 
                 if (action.equals("RESTORE"))
                 {       
                     if (str_split.length < 4)
                     {  
                        send_message(action + " FAILURE " + vid_str); 
                        send_error("FAILURE Wrong number of arguments for RESTORE " + 
                                           "action. Number args = [" + str_split.length + "].");
                        continue;
                     }
                     else 
                     {              
                         vid_str               = str_split[1];
                         hostName              = str_split[2];  
                         String vmName         = str_split[3];
                         boolean result;
                         
                         try
                         {
                             oVM = new OperationsOverVM(arguments,hostName);

                             dVM = new DeployVM(arguments, 
                                                hostName, 
                                                vmName,
                                                vid_str,
                                                System.getProperty("datastore"),
                                                System.getProperty("datacenter"));
                             if(!oVM.connect())
                             { 
                                 throw new Exception("Failed connection to host " + hostName);
                             }
  
                             if(!dVM.connect())
                             { 
                                 throw new Exception("Failed connection to host " + hostName);
                             }
                             if(!dVM.registerVirtualMachine())
                             {
                                 // We will skip this error, it may be pre-registered
                             }
                         }
                         catch(Exception e)
                         {
                             send_message(action + " FAILURE " + vid_str + " " + e.getMessage());
                             if(!debug)
                                send_error(action + " FAILURE " + vid_str + " " + e.getMessage());
                             oVM.disconnect();
                             dVM.disconnect();
                             continue;
                         }
                         
                         if(!oVM.restoreCheckpoint(vmName))
                         {
                             send_message(action + " FAILURE " + vid_str + " Failed restoring VM in host " + 
                                                    hostName);
                             oVM.disconnect();
                             dVM.disconnect();
                             continue;
                         }
                         else
                         {
                             try
                             {
                                 if(!oVM.powerOn(vmName))
                                 {
                                      send_message(action + " FAILURE " + vid_str + " Failed restoring VM in host " + 
                                                        hostName);
                                 }
                                 else
                                 {
                                     send_message(action + " SUCCESS " + vid_str);                             
                                     oVM.disconnect();
                                     dVM.disconnect();
                                     continue;
                                 }
                             }
                             catch(Exception e)
                             {
                                 send_message(action + " FAILURE " + vid_str + " Failed connection to host " +
                                                        hostName +". Reason: " + e.getMessage());
                                 oVM.disconnect();
                                 dVM.disconnect();
                                 continue;
                              }
                     
                         }
                         oVM.disconnect();
                         dVM.disconnect();
                         continue;
                     }
                 } // if (action.equals("RESTORE"))
                 
                 if (action.equals("MIGRATE"))
                 {      
                     send_message(action + " FAILURE " + vid_str + " Action not implemented."); 
                     if(!debug)
                        send_error(action + " FAILURE " + vid_str + " Action not implemented."); 
                     continue;
                 } // if (action.equals("MIGRATE"))      
                 
                 if (action.equals("POLL"))
                 {      
                     if (str_split.length < 4)
                     {
                         send_message(action + " FAILURE " + vid_str);
                         send_error("FAILURE Wrong number of arguments for POLL " + 
                                            "action. Number args = [" + str_split.length + "]."); 
                         continue;
                     }
                     else
                     {
                         vid_str               = str_split[1];
                         hostName              = str_split[2];  
                         String vmName         = str_split[3];
                         
                         String                pollInfo;
                         
                         try
                         {  

                             String[] argsWithHost = new String[arguments.length+2];

                             for(int i=0;i<arguments.length;i++)
                             {
                                 argsWithHost[i] = arguments[i];
                             }

                             argsWithHost[arguments.length]      = "--url";
                             argsWithHost[arguments.length + 1 ] = "https://" + hostName + ":443/sdk";

                             GetProperty gPHost = new GetProperty(argsWithHost, "HostSystem", hostName);
                             GetProperty gPVM   = new GetProperty(argsWithHost, "VirtualMachine", vmName);

                             if(!gPHost.connect())
                             {
                                throw new Exception();
                             }

                             String hostCPUMhz = gPHost.getObjectProperty("summary.hardware.cpuMhz").toString();
 
                             gPHost.disconnect();

                             if(!gPVM.connect())
                             {
                                throw new Exception();
                             }
                             
                             String powerState = 
                                   gPVM.getObjectProperty("runtime.powerState").toString();
                                   
                            if (powerState.equals("poweredOn"))
                            {

                                 String vmCPUMhz = 
                                      gPVM.getObjectProperty("summary.quickStats.overallCpuUsage").toString();       
                             
                                 String vmMEMMb  = 
                                      gPVM.getObjectProperty("summary.quickStats.guestMemoryUsage").toString();

                                 gPVM.disconnect();

                                 int hostCPUMhz_i = Integer.parseInt(hostCPUMhz);      
                                 int vmCPUMhz_i   = Integer.parseInt(vmCPUMhz);      
                                 int vmCPUperc    = (vmCPUMhz_i / hostCPUMhz_i) * 100;
                             
                                 pollInfo = "STATE=a USEDMEMORY=" + vmMEMMb + " USEDCPU=" + vmCPUperc;
                             }
                             else
                             {
                                 if (powerState.equals("suspended"))
                                 {
                                     pollInfo = "STATE=p";
                                 }
                                 else // Machine poweredOff
                                 {
                                     pollInfo = "STATE=d";
                                 }
                             }
                             
                         }
                         catch(Exception e)
                         {                             
                             pollInfo = "STATE=-";
                         }

                         send_message(action + " SUCCESS " + vid_str + " " + pollInfo);                                        
                         continue;
                     }                
                 } // if (action.equals("POLL"))     
             } //  else if (action.equals("FINALIZE"))
        } // while(!fin)
    } // loop

    void init() 
    {
        // Nothing to do here
        send_message("INIT SUCCESS");
    }

    void finalize_mad() 
    {
        send_message("FINALIZE SUCCESS");
    }
    
    void enable_standard_output()
    {   
        System.setOut(stdout);
    }

    void enable_standard_error()
    {   
        System.setErr(stderr);
    }

    
    void disable_standard_output()
    {
        try
        {        
            System.setOut(new PrintStream(new FileOutputStream("/dev/null")));
        }
        catch(Exception e)
        {}
    }

    void disable_standard_error()
    {   
        try
        {        
            System.setErr(new PrintStream(new FileOutputStream("/dev/null")));
        }
        catch(Exception e)
        {}
    }


    void send_message(String str)
    {
        synchronized (System.out)
        {   
            enable_standard_output();
            System.out.println(str);
            disable_standard_output();
        }
        
        if(debug){ send_error(str);}
    }
    
    void send_error(String str)
    {
        Date date = new Date();
        Format formatter;
        formatter = new SimpleDateFormat("[dd.MM.yyyy HH:mm:ss] ");
        synchronized (System.err)
        {   
            enable_standard_error();
            System.err.println(formatter.format(date)+str);
            disable_standard_error();
        }
    }
}


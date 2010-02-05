/*
# -------------------------------------------------------------------------#
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad #
# Complutense de Madrid (dsa-research.org)                                 #
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
import java.text.*;
import java.util.*;

import com.vmware.vim.*;
import com.vmware.apputils.*;
import com.vmware.apputils.vim.*;


/************************************
 * Monitors physical VMware hosts   *
 * through the VI API               *
 ************************************/
class OneImVmware extends Thread 
{

    private String[] arguments;

    boolean              debug;

    PrintStream 	 stdout;
    PrintStream 	 stderr; 

    // Entry point - main procedure
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
	
        OneImVmware oiv = new OneImVmware(args,debug_flag);
        oiv.loop();
    }

    // Constructor
    OneImVmware(String[] args,boolean _debug) 
    {
        debug = _debug;
        arguments = args;
    
        // Get out and err descriptors
        stdout = System.out;
        stderr = System.err;
        
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
        String  host;
        String  hid_str = null;
        String  hostToMonitor;
        boolean end     = false;
        
        BufferedReader in = new BufferedReader(
                                new InputStreamReader(System.in));

        while (!end) 
        {            
            // Read a line a parse it
            try
            {
                str = in.readLine();
            }
            catch (IOException e)
            {
                String message = e.getMessage().replace('\n', ' ');
                send_message(action + " FAILURE " + hid_str + " " + message);
                send_error  (action + " FAILURE " + hid_str +
                             " Action malformed. Reason: " + message);
            }

            String str_split[] = str.split(" ", 4); 
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
            } else if (str_split.length != 3)
                   {
                      send_message("FAILURE Unknown command");
                   }
                   else
                   {
                       action        = str_split[0].toUpperCase();
                       hid_str       = str_split[1];
                       hostToMonitor = str_split[2];
                     
                       if (action.equals("MONITOR"))
                       {
                          // Let's gather data from the host
                          
                          GetProperty gP;
                          boolean     rf;
                          String      response = "HYPERVISOR=vmware";
                       
                          String[] argsWithHost = 
                              new String[arguments.length+2];
                          
                          for(int i=0;i<arguments.length;i++)
                          {
                              argsWithHost[i] = arguments[i];
                          }
                          
                          argsWithHost[arguments.length]      = "--url";
                          argsWithHost[arguments.length + 1 ] = 
                                "https://" + hostToMonitor + ":443/sdk";

                          gP = new GetProperty(argsWithHost, 
                                               "HostSystem", 
                                               hostToMonitor);

                          try
                          {
                             if(!gP.connect())
                             {
                                throw new Exception("Connection to host " + 
                                            hostToMonitor + " failed.");
                             }
                                              
                             // Now it's time to build the response 
                             // gathering the needed properties 
                       
                          // Static Information   
                       
                              long totalMemory = 
                                     Long.parseLong(gP.getObjectProperty("hardware.memorySize").toString().trim());
                              totalMemory /= 1024;   
                              
                              response = response + ",TOTALMEMORY=" + totalMemory;
                       
                              int numCpus = 
                                     Integer.parseInt(gP.getObjectProperty("hardware.cpuInfo.numCpuCores").
                                                      toString().trim());
                              numCpus *= 100;
                              response = response + ",TOTALCPU=" + numCpus;
                              
                              response = response + ",MODELNAME=\"" 
                                                  + gP.getObjectProperty("hardware.systemInfo.model")
                                                  + "\"";
                              
                              double cpuSpeed = 
                                     Double.parseDouble(gP.getObjectProperty("hardware.cpuInfo.hz").toString().trim());
                              // From hz to Mhz
                              cpuSpeed/=1000000;
                       
                              response = response + ",CPUSPEED=" + (int)cpuSpeed;
                        
                        
                          // Dynamic Information
                             // CPU
                              rf = gP.getPerformanceCounter("cpu.usage.average", 60);
                              if (!rf) throw new Exception();
                              // Convert from 1/10000 to 1/100
                              int usedCpu = (int)(gP.getMeasure()/100);
                              response = response + ",USEDCPU="+usedCpu;
                              
                              response = response + ",FREECPU="+(100-usedCpu);
                       
                             // MEM 
                              rf = gP.getPerformanceCounter("mem.usage.average", 60);
                              if (!rf) throw new Exception();
                              // Convert from percentage to actual value
                              int usedMemory = (int)(totalMemory * (gP.getMeasure()/100))/100;
                              response = response + ",USEDMEMORY=" + usedMemory;
        
                              response = response + ",FREEMEMORY=" + (totalMemory-usedMemory);
                              
                             // NET
                              int net=0; 
                              rf = gP.getPerformanceCounter("net.transmitted.average", 60);
                              if (!rf) net = 0;
                              else net = (int)gP.getMeasure();
                              response = response + ",NETTX=" + net;
        
                              rf = gP.getPerformanceCounter("net.received.average", 60);
                              if (!rf) net = 0;
			      else net = (int)gP.getMeasure();
                              response = response + ",NETRX=" + net;

                              // Send the actual response
                              send_message("MONITOR SUCCESS " + hid_str + " " + response);    

                              gP.disconnect();
                          }
                          catch(Exception e)
                          {
                              gP.disconnect();
                              
                              send_message("MONITOR FAILURE " + hid_str + " Failed monitoring host " + 
                                                  hostToMonitor + ".");
                              
                              if(debug)
                              {
                                  send_error("Failed monitoring host " + hostToMonitor + 
                                             ".Reason: "+ e.getMessage() +
                                             "\n---- Debug stack trace ----");
                                  enable_standard_error();
                                  e.printStackTrace();
                                  disable_standard_error();
                                  send_error("---------------------------");
                              }
                              else
                              {   // If debug activated, this will be replicated in send_message
                                  send_error("MONITOR FAILURE " + hid_str + " Failed monitoring host " + hostToMonitor);
                              }
                          } // catch		   
                      } // if (action.equals("MONITOR"))
                   } // else if (str_split.length != 4)
        } // while(!end)
    } // loop

    void init() 
    {
        // Nothing to do here
        send_message("INIT SUCCESS");
    }

    void finalize_mad() 
    {
        // Nothing to do here
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
        
        if(debug) send_error(str);
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


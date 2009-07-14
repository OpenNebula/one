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



class OneImVmware extends Thread 
{

    private String[] arguments;

    boolean              debug;


    // Entry point - main procedure
    
    public static void main(String[] args) 
    {
        boolean debug_flag;

        // first, make redirection
        
        PrintStream stdout = System.out;                                       
        PrintStream stderr = System.err;
      
        System.setOut(stderr);
        System.setErr(stdout);

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
    }
    

    // Main loop, threaded
    void loop() 
    {
        String str    = null;
        String action  = null;
        String host;
        String hid_str = null;
		String hostToMonitor;
        boolean fin = false;
        
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
                    System.err.println(action + " FAILURE " + hid_str + " " + message);
                }
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
                fin = true;
            } else if (str_split.length != 3)
                   {
                       synchronized (System.err)
                       {
                           System.err.println("FAILURE Unknown command");
                       }
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
                       
                          try
                          {
                              String[] argsWithHost = new String[arguments.length+2];
                              
                              for(int i=0;i<arguments.length;i++)
                              {
                                  argsWithHost[i] = arguments[i];
                              }
                              
                              argsWithHost[arguments.length]      = "--url";
                              argsWithHost[arguments.length + 1 ] = "https://" + hostToMonitor + ":443/sdk";

//                              argsWithHost[arguments.length + 1 ] = "https://localhost:8008/sdk";
                              gP = new GetProperty(argsWithHost, "HostSystem", hostToMonitor);
                                              
                              // Now it's time to build the response gathering the properties needed
                       
                          // Static Information   
                       
                              int totalMemory = 
                                     Integer.parseInt(gP.getObjectProperty("hardware.memorySize").toString().trim());
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
                              rf = gP.getPerformanceCounter("net.transmitted.average", 60);
                              if (!rf) throw new Exception();
                              response = response + ",NETTX=" + (int)gP.getMeasure();
        
                              rf = gP.getPerformanceCounter("net.received.average", 60);
                              if (!rf) throw new Exception();
                              response = response + ",NETRX=" + (int)gP.getMeasure();
                       
                              // Send the actual response
                              System.err.println("MONITOR SUCCESS " + hid_str + " " + response);    
                          }
                          catch(Exception e)
                          {
                              System.out.println("Failed monitoring host " + hostToMonitor);
                              if(debug)
                              {
                                  e.printStackTrace();
                              }
                              
                              System.err.println("MONITOR FAILURE " + hid_str + " Failed monitoring host " + 
                                                  hostToMonitor + ". Please check the VM log.");
                          } // catch		   
           			} // if (action.equals("MONITOR"))
                   } // else if (str_split.length != 4)
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


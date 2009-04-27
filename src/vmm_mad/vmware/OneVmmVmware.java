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

    private String[] arguments;

    // Entry point - main procedure
    
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
            } 
            else 
            {
                if (action.equals("DEPLOY"))
                {                           
                    if (str_split.length != 4)
                    {
                       synchronized (System.err)
                       {
                           System.err.println("FAILURE Unknown command");
                       }
                    }
                    else
                    {
                        vid_str        = str_split[1];
                        hostName       = str_split[2];  
                        fileName       = str_split[3];
                                          
                        try
                        {
                            // First, register the VM
                            String[] argsWithHost = new String[arguments.length+2];
                            
                            for(int i=0;i<arguments.length;i++)
                            {
                                argsWithHost[i] = arguments[i];
                            }
                            
                            argsWithHost[arguments.length]      = "--url";
                            // TODO this is just for testing
                            //  argsWithHost[arguments.length + 1 ] = "https://" + hostName + ":443/sdk";
                            argsWithHost[arguments.length + 1 ] = "https://localhost:8008/sdk";
                            
                            // let's read the XML file and extract needed info
                            
                            ParseXML pXML = new ParseXML(fileName);
                            
                            DeployVM dVM = new DeployVM(argsWithHost, hostName, "one-" + vid_str,pXML);
                            
                            if(!dVM.registerVirtualMachine())
                            {
                                throw new Exception("Error registering VM.");
                            }
                            
                            // Now, proceed with the reconfiguration
                            
                            if(!dVM.shapeVM())
                            {
                                throw new Exception("Error reconfiguring VM.");
                            }
                            
                            continue;
                         
                         }
                         catch(Exception e)
                         {
                             System.out.println("Failed deploying VM " + vid_str + " into " + hostName + 
                                                ".Reason:" + e.getMessage());
                             e.printStackTrace();
                        
                             System.err.println("DEPLOY FAILURE " + vid_str + " Failed deploying VM in host " + 
                                                 hostName + ". Please check the VM log.");
                         } // catch
           		    } // else if (str_split.length != 4)
                 } // if (action.equals("DEPLOY"))
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


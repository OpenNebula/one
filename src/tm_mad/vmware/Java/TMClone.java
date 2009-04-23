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
import java.net.*;
import java.io.*;
import javax.net.ssl.*;

import org.w3c.dom.Document;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;


/*
 * Used to stage VMs in the ESXi Server
 * Accepts a Source and Destination, of the form
 *  machineSource:path_to_source machineDest:path_to_dest
 * although the path to dest will be used to extract the one-id
 * and files stored in datastore/one-id
 */

public class TMClone 
{
    private String oneID        = "";
    
    // Helpers from VI samples
    private static  ServiceContent content;    
    private static  AppUtil        cb = null;
    private static  VimPortType    service;
    
    private String                 datastore  = "";
    private String                 datacenter = "";
    
    private String                 pathToVm   = "";
    
    /* Copies a VM from local FS to ESXi
     * @param pathToVm localpath of the VM
     */
    private void copyVM() throws Exception 
    {
         String [] listOfVMFiles = getDirFiles(pathToVm);
         
         for(int i=0; i<listOfVMFiles.length; i++) 
         {                  
            String remoteFilePath = "/" +oneID+"/"+listOfVMFiles[i];
            String localFilePath  = pathToVm+"/"+listOfVMFiles[i]; 
                    
            if(localFilePath.indexOf("vdisk") != -1) 
            {             
               String dataStoreName =
                         pathToVm.substring(pathToVm.lastIndexOf("#")+1);
               remoteFilePath = 
                         "/"+oneID+"/"+dataStoreName+"/"+listOfVMFiles[i];
              /* if(localFilePath.indexOf("flat") == -1) 
               {               
                  diskNames.add(dataStoreName+"/"+listOfVMFiles[i]);               
               } */           
            }
            else 
            {
               remoteFilePath = "/"+oneID+"/"+listOfVMFiles[i];            
            }
            transferVMFiles(remoteFilePath,localFilePath);
         }
    }
    
    /* Performs the actual copying through HTTP
     * @param remoteFilePath remote path of the VM on the ESXi
     * @param localFilePath  localpath of the VM
     */    
    private void transferVMFiles(String remoteFilePath, String localFilePath) 
           throws Exception 
    {
        String serviceUrl = cb.getServiceUrl();
        serviceUrl = serviceUrl.substring(0,serviceUrl.lastIndexOf("sdk")-1); 
        
        String httpUrl = serviceUrl +"/folder" + remoteFilePath+"?dcPath="
                        +datacenter +"&dsName="+ datastore;
                        
        httpUrl = httpUrl.replaceAll("\\ ","%20");                
        HttpURLConnection conn = getConnection(httpUrl);
        conn.setRequestProperty( org.apache.axis.transport.http.HTTPConstants.HEADER_CONTENT_LENGTH,"1024");
        
        OutputStream out   = conn.getOutputStream();      
        FileInputStream in = new FileInputStream(new File(localFilePath));

        // Perform the actual staging
        byte[] buf = new byte[1024];
        int len = 0;
        while ((len = in.read(buf)) > 0)
        {
           out.write(buf, 0, len);
           out.flush();
        }  
        conn.getResponseMessage();
        conn.disconnect();
        out.close();
     }
     
     /* Returns list of files available on a folder
      * @param localDir local path containing files to be listed
      * @return list of files or null if none
      */
     private String [] getDirFiles(String localDir) throws Exception
     {
        File temp = new File(localDir);      
        String [] listOfFiles = temp.list();
        
        if(listOfFiles != null) 
        {
           return listOfFiles;
        }
        else 
        {
           return null;
        }
     }
     
     /*
      * Gets http connection to ESXi server
      * @param urlString contact point to the ESXi server
      * @returns http connection to ESXi server
      */
     private HttpURLConnection getConnection(String urlString) throws Exception 
     {
         String cookieString = getCookie();
         trustAllHttpsCertificates();
         
         HostnameVerifier hv = new HostnameVerifier() 
         {
            public boolean verify(String urlHostName, SSLSession session)
            {
               return true;
            }
         };     

         HttpsURLConnection.setDefaultHostnameVerifier(hv);
         URL url                = new URL(urlString);               
         HttpURLConnection conn = (HttpURLConnection) url.openConnection();
         conn.setDoOutput(true);

         conn.setRequestProperty(
            org.apache.axis.transport.http.HTTPConstants.HEADER_COOKIE,
            cookieString);

         conn.setRequestProperty(
            org.apache.axis.transport.http.HTTPConstants.HEADER_CONTENT_TYPE,
            "application/octet-stream");

         conn.setRequestProperty(
            org.apache.axis.transport.http.HTTPConstants.HEADER_EXPECT,
            "100-continue");      
         conn.setRequestMethod("PUT");
         return conn;
      }
      
      private static void trustAllHttpsCertificates() throws Exception 
      {    
          javax.net.ssl.TrustManager[] trustAllCerts = 
                                   new javax.net.ssl.TrustManager[1]; 
          javax.net.ssl.TrustManager tm = new myTMan(); 
          trustAllCerts[0] = tm; 
          javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("SSL"); 
          sc.init(null, trustAllCerts, null); 
          javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory()); 
      }


      
      /*
       * Get ESXi cookie
       * @return string ESXi cookie
       */      
      private String getCookie() throws Exception
      {
         com.vmware.vim.VimPortType test = cb.getConnection().getService();
         org.apache.axis.client.Stub st = (org.apache.axis.client.Stub)test;
         org.apache.axis.client.Call callObj = st._getCall();
         org.apache.axis.MessageContext msgContext = callObj.getMessageContext();
         String cookieString 
            = (String)msgContext.getProperty(
                 org.apache.axis.transport.http.HTTPConstants.HEADER_COOKIE); 
         return cookieString;
      }
    

    
    TMClone(String source, String destiny) throws Exception
    {
        String[] connectionArgs = new String[6];
        
        String hostName = destiny.substring(0,destiny.indexOf(":"));
        pathToVm        = source.substring(source.indexOf(":")+1,
                                           source.length());
        oneID           = destiny.substring(destiny.indexOf(":")+1,
                                            destiny.length());
        oneID           = oneID.substring(0,oneID.lastIndexOf("/")                          );
        oneID           = oneID.substring(0,oneID.lastIndexOf("/")                          );    
        oneID           = oneID.substring(oneID.lastIndexOf("/")+1                          );
                                              
        connectionArgs[0]="--url";
        connectionArgs[1]="https://" + hostName + ":8008/sdk";
        connectionArgs[2]="--username";
        connectionArgs[3]= System.getProperty("username");  
        connectionArgs[4]="--password";
        connectionArgs[5]= System.getProperty("password");
        
        cb = AppUtil.initialize("TMClone", null, connectionArgs);
        cb.connect(); 
           
           // Todo change hardcoding                             
        ManagedObjectReference hostMor =                                                    
               cb.getServiceUtil().getDecendentMoRef(null,
                                                     "HostSystem",                                                                                                                             
                                                     hostName);
        
        // TODO make this dymamic. 
        datacenter = "ha-datacenter";
           
        datastore = "datastore1";

        com.vmware.apputils.vim.ServiceConnection sc = cb.getConnection();
        content = sc.getServiceContent();
        service = sc.getService();
    }
    
    protected void finalize() throws Throwable
    {	
		cb.disConnect();
    }
    
    public static void main(String[] args) 
    {
        boolean success    = true;
        
        // first, make redirection
        
        PrintStream stdout = System.out;                                       
        PrintStream stderr = System.err;
      
        System.setOut(stderr);
        System.setErr(stdout);
        
        if(args.length!=2)
        {
            success = false;
        }
        else
        {
            try
            {
                TMClone tmc = new TMClone(args[0],args[1]);
                tmc.copyVM();
            }
            catch(Exception e)
            {
                e.printStackTrace();
                success = false;
            }
        }
        
        if (success)
        {
            System.exit(0);
        }
        else
        {
            System.exit(-1);    
        }
    }
    
    
    public static class myTMan implements javax.net.ssl.TrustManager,
           javax.net.ssl.X509TrustManager 
    {
       public java.security.cert.X509Certificate[] getAcceptedIssuers() 
       {
          return null;
       } 
       public boolean isServerTrusted(
              java.security.cert.X509Certificate[] certs) 
       {
          return true;
       }
       public boolean isClientTrusted(
              java.security.cert.X509Certificate[] certs) 
       {
          return true;
       } 
       public void checkServerTrusted(
              java.security.cert.X509Certificate[] certs, String authType)
              throws java.security.cert.CertificateException 
       {
          return;
       } 
       public void checkClientTrusted(
              java.security.cert.X509Certificate[] certs, String authType)
              throws java.security.cert.CertificateException 
       {
          return;
       }
    }
}

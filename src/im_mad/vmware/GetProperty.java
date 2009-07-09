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
 * Used to obtain properties from Managed Object Reference from ESXi
 */

public class GetProperty 
{
    // Helpers from VI samples
    private static  ServiceContent content;    
    private static  AppUtil cb = null;
    private static  VimPortType service;  
    private ManagedObjectReference moRef; 
    
    // Measure of the property
    private double measure;

    /*
     * Gets first property that matches propertyName
     * @param moRef, objet to get property from
     * @param propertyName, name of the property
     * @return representation of the property
     */ 
    Object getObjectProperty(String propertyName)
     throws RuntimeFault, RemoteException 
     {
        return getProperties(new String[] { propertyName })[0];
     }
     
     /*
      * Gets properties that matches any of the strings
      * @param moRef, objet to get properties from
      * @param propertyName, name of the property
      * @return representation of the properties
      */  
     Object[] getProperties(String[] properties)
     throws RuntimeFault, RemoteException 
     {
        // PropertySpec specifies what properties to
        // retrieve and from type of Managed Object
        PropertySpec pSpec = new PropertySpec();
        pSpec.setType(moRef.getType());
        pSpec.setPathSet(properties);

        // ObjectSpec specifies the starting object and
        // any TraversalSpecs used to specify other objects 
        // for consideration
        ObjectSpec oSpec = new ObjectSpec();
        oSpec.setObj(moRef);

        // PropertyFilterSpec is used to hold the ObjectSpec and 
        // PropertySpec for the call
        PropertyFilterSpec pfSpec = new PropertyFilterSpec();
        pfSpec.setPropSet(new PropertySpec[] {pSpec});
        pfSpec.setObjectSet(new ObjectSpec[] {oSpec});

        // retrieveProperties() returns the properties
        // selected from the PropertyFilterSpec
        ObjectContent[] ocs = service.retrieveProperties(
              content.getPropertyCollector(),
              new PropertyFilterSpec[] {pfSpec});

        // Return value, one object for each property specified
        Object[] ret = new Object[properties.length];

        if(ocs != null) 
        {
           for(int i=0; i<ocs.length; ++i)   
           {
              ObjectContent oc = ocs[i];
              DynamicProperty[] dps = oc.getPropSet();
              if(dps != null) 
              {
                 for(int j=0; j<dps.length; ++j) 
                 {
                    DynamicProperty dp = dps[j];
                    // find property path index
                    for(int p=0; p<ret.length; ++p) 
                    {
                       if(properties[p].equals(dp.getName()))
                       {
                          ret[p] = dp.getVal();
                       }
                    }
                 }
              }
           }
        }
        return ret;
     }
     
     /*
      * Gets performance counter from a MOB (ManagedObjectReference). Sets measure to
      * be retrieved using getMeasure
      * @param mor, ManagedObjectReference
      * @param counter, name of the performance counter
      * @return representation of the properties
      */
    
    public boolean getPerformanceCounter(String counter, 
                                          int intervalInt) throws Exception
    {

       int counterID;
       int key;
       String group;
       String name;
       String rollup;
                                                 
       // Get the Performance Manager
       ManagedObjectReference pmRef 
       	= cb.getConnection().getServiceContent().getPerfManager();
       // Get supported perf counters in the system
       PerfCounterInfo[] cInfo 
       	= (PerfCounterInfo[])cb.getServiceUtil().getDynamicProperty(pmRef, 
                                                                   "perfCounter");
       // Create a hashmap for these counters    
       TreeMap PerfByID   = new TreeMap();
       TreeMap PerfByName = new TreeMap();
   
       for (int i = 0; i < cInfo.length; i++) 
       {
            key    = cInfo[i].getKey();
            group  = cInfo[i].getGroupInfo().getKey();
            name   = cInfo[i].getNameInfo().getKey();
            rollup = cInfo[i].getRollupType().toString();
         
            PerfByID.put  (key, group + "." + name + "." + rollup);
            PerfByName.put(group + "." + name + "." + rollup, key);
        }
        
        Integer origCounterId = (Integer)PerfByName.get(counter);
        PerfProviderSummary perfSum 
        	= cb.getConnection().getService().queryPerfProviderSummary(pmRef, moRef);
        
        Integer interval = perfSum.getRefreshRate();
        
        // Get available Performance metrics for the entity
        PerfMetricId[] Ids = 
            cb.getConnection().getService().queryAvailablePerfMetric(pmRef,
                                                                     moRef, null, null, interval);
        boolean idExists = false;
        PerfMetricId[] metricId = null;
        if (Ids != null) 
        {
            
            for (int j = 0; j < Ids.length; j++) 
            {
                // Check if the counter exists for the entity
                if (Ids[j].getCounterId() == origCounterId) 
                {
                    idExists = true;
                    metricId = new PerfMetricId[]{Ids[j]};
                    break;
                }
            }
            if (idExists) 
            {
                Integer Intv = new Integer(intervalInt);
            
                PerfQuerySpec qSpec = new PerfQuerySpec();
                qSpec.setEntity(moRef);
                qSpec.setMetricId(metricId);
                qSpec.setFormat("normal");
                qSpec.setIntervalId(interval);
                qSpec.setMaxSample(1);
               
                PerfQuerySpec[] qSpecs = new PerfQuerySpec[] {qSpec};

                if (moRef != null) 
                {
                    PerfEntityMetricBase[] pEntity = getPerfIdsAvailable(qSpecs, pmRef);
            
                    if (pEntity != null) 
                    {
                        for (int i = 0; i < pEntity.length; i++) 
                        {

                              PerfMetricSeries[] vals = ((PerfEntityMetric)pEntity[i]).getValue();
                              PerfSampleInfo[]  infos = ((PerfEntityMetric)pEntity[i]).getSampleInfo();
                              if (vals != null) 
                              {
                                  for (int vi=0; vi<vals.length; ++vi)
                                  {
                                      counterID = vals[vi].getId().getCounterId();

                                      if(vals[vi] instanceof PerfMetricIntSeries) 
                                      {
                                          PerfMetricIntSeries val = (PerfMetricIntSeries)vals[vi];
                                          long[] longs = val.getValue();
                                          if (longs !=null && longs.length>=1)
                                          {
                                              measure = longs[(longs.length-1)];
                                              return true;
                                          }
                                      }
                                   }
                               }           
                           }
                       }
                    }
                }
                else 
                {
                     return false;
                }
            }
            return false;
      }


    private PerfEntityMetricBase[] getPerfIdsAvailable(PerfQuerySpec[] querySpecs,
                                     ManagedObjectReference entityMoRef) throws Exception 
    {
         PerfEntityMetricBase[] perfEntity = null;
         
         if (entityMoRef != null) 
         {
            try 
            {
                perfEntity 
                      = cb.getConnection().getService().queryPerf(entityMoRef, querySpecs);
            } 
            catch (Exception e) 
            {

            }
         }
         return perfEntity;
    }
    
    public double getMeasure()
    {
        return measure;
    }
    
    GetProperty(String[] args, String entity, String entityName) throws Exception
    {
        cb = AppUtil.initialize("GetProperty", null, args);
        cb.connect();
        

        moRef = cb.getServiceUtil().getDecendentMoRef(null,entity,
                                                           entityName);


        com.vmware.apputils.vim.ServiceConnection sc = cb.getConnection();
        content = sc.getServiceContent();
        service = sc.getService();
    }
    
    protected void finalize() throws Throwable
    {	
		cb.disConnect();
    }
}

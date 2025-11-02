package com.lifeinpulse.domains;

import AppClasses.ManageClassesOfTypes;
import Messaging.MessageSent;
import RRI.RequestResponseInfo;
import UtilitiesForOtherClasses.Primiti;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.googlecode.objectify.annotation.Cache;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.lifeinpulse.MPM;
import com.lifeinpulse.TapalifeServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import nl.basjes.parse.useragent.UserAgent;
import nl.basjes.parse.useragent.UserAgentAnalyzer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;

@Entity
@Cache
public class LocalAIhardware implements Serializable
{
    private transient static final long serialVersionUID = 1291L;

    static String html;

    static UserAgentAnalyzer uaa;

    static final String LocalAIhardwareBucketName = "localaihardware";
    static final String FILENAME = "localaihardware.csv";

    static final String LOCALAIHARDWARE_KEY = "localaihardware_key";
    static final long INTERVAL_TO_CHECK = Primiti.minute * 5;
    static int NUM_FIELDS = 15;

    @Id
    Long id;

    long datetime;

    public String myKey;

    int detected_memorySize;
    int manual_memorySize;
    float detected_diskSize;
    String application;
    String baseline_features = null;
    String agent_device_os = null;
    String llm_uniqueID = null;
    String modelOfMyLLM_id = null;
    String selectedModelType = null;
    int loadingDuration_0 = 0;
    int processingDuration_0 = 0;
    int firstCharDuration_0 = 0;
    int loadingDuration_1 = 0;
    int processingDuration_1 = 0;
    int firstCharDuration_1 = 0;


    //------------------------------------------------------------------
	public static void landingPage(RequestResponseInfo rri)
	{

    if(html == null)
    {
        String filePath = TapalifeServlet.absolutePathUntilWebApp + "localAIhardware/index.html";
			try {
                String s = Files.readString(Path.of(filePath));
                int pos = s.indexOf("<body");
                pos = s.indexOf(">", pos +1);
                int pos2 = s.indexOf("</body>");
                html = s.substring(pos + 1, pos2);
            }
             catch (Exception e)
            {
                html = "something went wrong reading the HTML";
                e.printStackTrace();
            }

    }

    rri.returnTopBarForNextDIV(null, "<a target='_blank' href='https://github.com/franciscoreis/localAIhardware'><u>GitHub repository</u></a> &nbsp; & &nbsp; <a target='_blank' href='https://localAIhardware.com'><u>localAIhardware.com</u></a>");
    if(TapalifeServlet.runLocal)
        rri.returnBottomBarForNextDIV(null, "<a target='_blank' href='http://localhost:8080/localAIhardware/index.html'><u>local direct link</u></a>");

    rri.returnEVAL("loadMyLLMfiles('MyLLMroot.loadLocalAIhardwareJSandExecuteCommand(\"ONLOAD\")', true)");

	rri.returnThisDIV("api_localaihardware_project", "Developer", "Local AI Hardware", html);

	}

    //-------------------------------------------------------------
    synchronized public static void api(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
        if(!TapalifeServlet.CORS_ALLOW_IS_GLOBAL_NOT_CASE_BY_CASE)
            response.setHeader("Access-Control-Allow-Origin", "*");


        RequestResponseInfo rri = new RequestResponseInfo();

        String jsonResponse = null;
        try {
            String jsonBody = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

            if("get_agent_device_os".equals(jsonBody))
            {
                         //so that the client sends more info!
                response.setHeader("Permissions-Policy",
                        "ch-ua=*; ch-ua-mobile=*; ch-ua-platform=*; ch-ua-platform-version=*; " +
                        "ch-ua-model=*; ch-ua-arch=*; ch-ua-bitness=*; ch-ua-full-version-list=*");
                response.setHeader("Accept-CH",
                        "Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, " +
                        "Sec-CH-UA-Model, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List");

                 StringBuilder agentInfo = new StringBuilder();

                if(uaa == null)
                try {
                  uaa = UserAgentAnalyzer.newBuilder() //must add log4j-to-slf4j in POM.XML !!!
                    .hideMatcherLoadStats() //add System.setProperty("org.slf4j.simpleLogger.log.nl.basjes.parse.useragent", "error"); // silence YAUAA
                    .withCache(10_000)      // important: cache!
                    .withField("DeviceClass")
                    .withField("DeviceName")

                    .withField("OperatingSystemClass")
                    .withField("OperatingSystemName")
                    .withField("OperatingSystemVersion")

                    .withField("LayoutEngineClass")
                    .withField("AgentClass")
                    .withField("AgentName")
                    .withField("AgentVersion")
                    //.withAllFields()        // or only the fields you need (faster)
                    .build();


                  } catch (Throwable t) {
                    // dump full cause chain so you see the real reason in logs
                    throw t;
                  }

                    UserAgent agent = uaa.parse(request.getHeader("User-Agent"));

                    agentInfo.append("{\n");
                    boolean first = true;
                    for (String fieldName: agent.getAvailableFieldNamesSorted())
                    if(!fieldName.startsWith("_") && !fieldName.startsWith("AgentInformation"))
                    {
                        if(first)
                            first = false;
                        else
                            agentInfo.append(",\n");
                        agentInfo.append("\"" + fieldName + "\": \"" + agent.getValue(fieldName) + "\"");
                        if(TapalifeServlet.runLocal)
                          System.out.println(fieldName + " = " + agent.getValue(fieldName));
                    }
                    agentInfo.append("\n}");

                jsonResponse = agentInfo.toString();
                return;
            } //  if("get_agent_device_os".equals(jsonBody))



            if (jsonBody != null && !jsonBody.isEmpty())
            {
            JsonFactory factory = new JsonFactory(); // or new JsonFactoryBuilder().build()
            try (JsonParser p = factory.createParser(jsonBody)) {
                int id = 0;
                String name = null;


                // Move to START_OBJECT
                if (p.nextToken() != JsonToken.START_OBJECT) throw new IllegalStateException("Expected object");


                LocalAIhardware localAIhardware = new LocalAIhardware();
                localAIhardware.datetime = new Date().getTime();

                int items = 0;
                while (p.nextToken() != JsonToken.END_OBJECT) {
                    items++;
                    String field = p.getCurrentName();     // at FIELD_NAME
                    p.nextToken();                         // move to field value
                    switch (field) {

                        case "detected_memoryzSize": localAIhardware.detected_memorySize = p.getIntValue();break;
                        case "manual_memoryzSize": localAIhardware.manual_memorySize = p.getValueAsInt(); break;
                        case "detected_diskSize": localAIhardware.detected_diskSize = p.getFloatValue(); break;

                        case "application": localAIhardware.application = p.getText();

                        case "baseline_features":
                            localAIhardware.baseline_features = p.getText();
                            break;
                        case "agent_device_os": localAIhardware.agent_device_os = p.getText(); break;
                        case "llm_uniqueID":
                            localAIhardware.llm_uniqueID = p.getText();
                            break;
                        case "modelOfMyLLM_id":
                            localAIhardware.modelOfMyLLM_id = p.getText();
                            break;
                        case "selectedModelType":
                            localAIhardware.selectedModelType = p.getText();
                            break;

                        case "loadingDuration_0":
                            localAIhardware.loadingDuration_0 = p.getIntValue();
                            break;
                        case "processingDuration_0":
                            localAIhardware.processingDuration_0 = p.getIntValue();
                            break;
                        case "firstCharDuration_0":
                            localAIhardware.firstCharDuration_0 = p.getIntValue();
                            break;

                        case "loadingDuration_1":
                            localAIhardware.loadingDuration_1 = p.getIntValue();
                            break;
                        case "processingDuration_1":
                            localAIhardware.processingDuration_1 = p.getIntValue();
                            break;
                        case "firstCharDuration_1":
                            localAIhardware.firstCharDuration_1 = p.getIntValue();
                            break;
                        default:
                            items = 1000;
                            p.skipChildren(); // skip unknown nested objects/arrays efficiently
                    }
                }

                if (items == NUM_FIELDS)
                {
                 saveToBigQuery(rri, localAIhardware, 0);
                jsonResponse = "{\"status\": \"success\", \"received_data\": \"true\", \"message\": \"Success! Up to 10 minutes to become available\"}";
                }
            }


            }

            // Create a simple success message to send back

        } catch (IOException e)
        {
            rri.myPrintStackTrace(e, null);
        }
        finally
        {

        if(jsonResponse != null)
            response.setStatus(HttpServletResponse.SC_OK);
        else
        {
            jsonResponse = "{\"status\": \"error\", \"received_data\": \"true\", \"message\": \"bad json format or invalid data\"}";
            response.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE);
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        out.print(jsonResponse);
        out.flush();

        }


    }
//------------------------------------------------------------------------
static public void saveToBigQuery(RequestResponseInfo rri, LocalAIhardware localAIhardware, long latency)
{

	try
	{
      // Initialize client that will be used to send requests. This client only needs to be created
      // once, and can be reused for multiple requests.
      //BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();

      // Get table
      //if(tableId == null)
      //	  tableId = TableId.of(datasetName, tableName);



      //myLoggingsTotal may be greater than myLoggings.size() for some are the same and thus omitted and placed in extraTimes
      String rriUniqueID = null;
      if(rri.myLoggingsTotal > 1)
      {
	  if(rri.uniqueCompressedUUID == null)
		rri.uniqueCompressedUUID = Primiti.compressUUID(rri, UUID.randomUUID());
	  rriUniqueID = rri.myLoggingsTotal + "_" + rri.uniqueCompressedUUID;
      }


      rri.mpm.makePersistent(rri, localAIhardware);
        // If any of the insertions failed, this lets you inspect the errors

      if(TapalifeServlet.runLocal)
          createLocalAIhardwareFile(rri);
      else
      {
          ManageClassesOfTypes mcot = ManageClassesOfTypes.getFromKey(rri, LOCALAIHARDWARE_KEY);
          if(mcot == null)
          {
              mcot = new ManageClassesOfTypes();
              mcot.myKey = LOCALAIHARDWARE_KEY;
              mcot.myLong = new Date().getTime() + INTERVAL_TO_CHECK;
              rri.mpm.makePersistent(rri, mcot);
          }
          else checkIfMust_createLocalAIhardwareFile(rri, mcot); //optional for 1 minute interrupts will check every 5 minutes

      }
    }
	catch (Exception e)
	{
     e.printStackTrace();
    }


}
    //----------------------------------------------------------------------------------
    public static void checkIfMust_createLocalAIhardwareFile(RequestResponseInfo rri, ManageClassesOfTypes mcot)
    {
    if(mcot == null)
         mcot = ManageClassesOfTypes.getFromKey(rri, LOCALAIHARDWARE_KEY);
    if(mcot != null && mcot.myLong < rri.requestDate)
       {
        MPM.deleteClassStringID_now(rri, ManageClassesOfTypes.class, LOCALAIHARDWARE_KEY);
        createLocalAIhardwareFile(rri);
       }

    }
//----------------------------------------------------------------------------------
    private static void createLocalAIhardwareFile(RequestResponseInfo rri)
    {
            List<LocalAIhardware> myLocalAIhardwares = getLocalAIhardwareList(rri, "", 1000, new Date().getTime());

            myLocalAIhardwares.size();

            long maxDatetime = 0;
            HashMap<String, LLMmodelTypeMinMax> mapLLMmodelTypeToMInMax = new HashMap<>();
            for(LocalAIhardware localAIhardware : myLocalAIhardwares)
            {
                maxDatetime = Math.max(maxDatetime, localAIhardware.datetime);

                String key = localAIhardware.llm_uniqueID + " " + localAIhardware.modelOfMyLLM_id + " " + localAIhardware.selectedModelType + " " + localAIhardware.application + " "
                        + localAIhardware.detected_memorySize + " " + localAIhardware.manual_memorySize + " "
                        + localAIhardware.agent_device_os.length() + " " + localAIhardware.agent_device_os + " "
                        + localAIhardware.baseline_features;
                LLMmodelTypeMinMax llmmodelTypeToMinMax = mapLLMmodelTypeToMInMax.get(key);
                if(llmmodelTypeToMinMax == null)
                {
                    llmmodelTypeToMinMax = new LLMmodelTypeMinMax();
                    llmmodelTypeToMinMax.key = key;
                    mapLLMmodelTypeToMInMax.put(key, llmmodelTypeToMinMax);
                }
                llmmodelTypeToMinMax.numData ++;

                llmmodelTypeToMinMax.minDatetime = Math.min(llmmodelTypeToMinMax.minDatetime, localAIhardware.datetime);
                llmmodelTypeToMinMax.maxDatetime = Math.max(llmmodelTypeToMinMax.maxDatetime, localAIhardware.datetime);

               llmmodelTypeToMinMax.averageLoadingDuration_0 += localAIhardware.loadingDuration_0;
                llmmodelTypeToMinMax.minLoadingDuration_0 = Math.min(llmmodelTypeToMinMax.minLoadingDuration_0, localAIhardware.loadingDuration_0);
                llmmodelTypeToMinMax.maxLoadingDuration_0 = Math.max(llmmodelTypeToMinMax.maxLoadingDuration_0, localAIhardware.loadingDuration_0);

                llmmodelTypeToMinMax.averageLoadingDuration_1 += localAIhardware.loadingDuration_1;
                llmmodelTypeToMinMax.minLoadingDuration_1 = Math.min(llmmodelTypeToMinMax.minLoadingDuration_1, localAIhardware.loadingDuration_1);
                llmmodelTypeToMinMax.maxLoadingDuration_1 = Math.max(llmmodelTypeToMinMax.maxLoadingDuration_1, localAIhardware.loadingDuration_1);

                llmmodelTypeToMinMax.averageFirstCharDuration_0 += localAIhardware.firstCharDuration_0;
                llmmodelTypeToMinMax.minFirstCharDuration_0 = Math.min(llmmodelTypeToMinMax.minFirstCharDuration_0, localAIhardware.firstCharDuration_0);
                llmmodelTypeToMinMax.maxFirstCharDuration_0 = Math.max(llmmodelTypeToMinMax.maxFirstCharDuration_0, localAIhardware.firstCharDuration_0);

                llmmodelTypeToMinMax.averageFirstCharDuration_1 += localAIhardware.firstCharDuration_1;
                llmmodelTypeToMinMax.minFirstCharDuration_1 = Math.min(llmmodelTypeToMinMax.minFirstCharDuration_1, localAIhardware.firstCharDuration_1);
                llmmodelTypeToMinMax.maxFirstCharDuration_1 = Math.max(llmmodelTypeToMinMax.maxFirstCharDuration_1, localAIhardware.firstCharDuration_1);

                llmmodelTypeToMinMax.averageProcessingDuration_0 += localAIhardware.processingDuration_0;
                llmmodelTypeToMinMax.minProcessingDuration_0 = Math.min(llmmodelTypeToMinMax.minProcessingDuration_0, localAIhardware.processingDuration_0);
                llmmodelTypeToMinMax.maxProcessingDuration_0 = Math.max(llmmodelTypeToMinMax.maxProcessingDuration_0, localAIhardware.processingDuration_0);

                llmmodelTypeToMinMax.averageProcessingDuration_1 += localAIhardware.processingDuration_1;
                llmmodelTypeToMinMax.minProcessingDuration_1 = Math.min(llmmodelTypeToMinMax.minProcessingDuration_1, localAIhardware.processingDuration_1);
                llmmodelTypeToMinMax.maxProcessingDuration_1 = Math.max(llmmodelTypeToMinMax.maxProcessingDuration_1, localAIhardware.processingDuration_1);
       }

            for(LLMmodelTypeMinMax llmmodelTypeToMinMax: mapLLMmodelTypeToMInMax.values())
              if(llmmodelTypeToMinMax.numData > 1)
                {
                    llmmodelTypeToMinMax.averageLoadingDuration_0 /= llmmodelTypeToMinMax.numData;
                    llmmodelTypeToMinMax.averageLoadingDuration_1 /= llmmodelTypeToMinMax.numData;
                    llmmodelTypeToMinMax.averageFirstCharDuration_0 /= llmmodelTypeToMinMax.numData;
                    llmmodelTypeToMinMax.averageFirstCharDuration_1 /= llmmodelTypeToMinMax.numData;
                    llmmodelTypeToMinMax.averageProcessingDuration_0 /= llmmodelTypeToMinMax.numData;
                    llmmodelTypeToMinMax.averageProcessingDuration_1 /= llmmodelTypeToMinMax.numData;
                }



            Storage storage = rri.googleStorage();

            Blob blob = storage.get(BlobId.of(LocalAIhardwareBucketName, filenameLocalOrProduction()));

            if (blob != null)
            {
            HashMap<String, LLMmodelTypeMinMax> existing_mapLLMmodelTypeToMInMax = new HashMap<>();

            String s = new String(blob.getContent(), StandardCharsets.UTF_8);
            int lastPosGlobal = 0;
            while(lastPosGlobal < s.length())
            {
                int pos = s.indexOf("\n", lastPosGlobal);
                if(pos == -1)
                    break;
                String line = s.substring(lastPosGlobal, pos);
                lastPosGlobal = pos + 1;

                int lastPos = 0;
                LLMmodelTypeMinMax llmmodelTypeToMinMax = new LLMmodelTypeMinMax();
                pos = line.indexOf(","); llmmodelTypeToMinMax.numData = Long.parseLong(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(" ", lastPos);
                int numChars = Integer.parseInt(line.substring(lastPos, pos));
                lastPos = pos + 1 + numChars;
                llmmodelTypeToMinMax.key = line.substring(pos +1, lastPos);
                lastPos++; //","
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minDatetime = Long.parseLong(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxDatetime = Long.parseLong(line.substring(lastPos, pos)); lastPos = pos + 1;

     pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageLoadingDuration_0 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minLoadingDuration_0 = (int)Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageLoadingDuration_0)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxLoadingDuration_0 = (int)Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageLoadingDuration_0)); lastPos = pos + 1;

                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageLoadingDuration_1 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minLoadingDuration_1 = (int) Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageLoadingDuration_1)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxLoadingDuration_1 = (int) Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageLoadingDuration_1)); lastPos = pos + 1;

                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageProcessingDuration_0 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minProcessingDuration_0 = (int) Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageProcessingDuration_0)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxProcessingDuration_0 = (int) Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageProcessingDuration_0)); lastPos = pos + 1;

                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageProcessingDuration_1 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minProcessingDuration_1 = (int) Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageProcessingDuration_1)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxProcessingDuration_1 = (int) Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageProcessingDuration_1)); lastPos = pos + 1;

                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageFirstCharDuration_0 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minFirstCharDuration_0 = (int) Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageFirstCharDuration_0)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxFirstCharDuration_0 = (int) Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageFirstCharDuration_0)); lastPos = pos + 1;

                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageFirstCharDuration_1 = Float.parseFloat(line.substring(lastPos, pos)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minFirstCharDuration_1 = (int) Math.floor(Math.min(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageFirstCharDuration_1)); lastPos = pos + 1;
                pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxFirstCharDuration_1 = (int) Math.ceil(Math.max(Integer.parseInt(line.substring(lastPos, pos)), llmmodelTypeToMinMax.averageFirstCharDuration_1)); lastPos = pos + 1;

                existing_mapLLMmodelTypeToMInMax.put(llmmodelTypeToMinMax.key, llmmodelTypeToMinMax);
            }

            for(LLMmodelTypeMinMax llmmodelTypeToMinMax: mapLLMmodelTypeToMInMax.values())
            {
                LLMmodelTypeMinMax llmmodelTypeToMinMax2 = existing_mapLLMmodelTypeToMInMax.get(llmmodelTypeToMinMax.key);
                if(llmmodelTypeToMinMax2 == null)
                    existing_mapLLMmodelTypeToMInMax.put(llmmodelTypeToMinMax.key, llmmodelTypeToMinMax);
                else
                {
                    long numData = llmmodelTypeToMinMax.numData + llmmodelTypeToMinMax2.numData;

                    llmmodelTypeToMinMax2.minDatetime = llmmodelTypeToMinMax2.minDatetime == 0
                            ? llmmodelTypeToMinMax.minDatetime //old stuff or error
                            : Math.min(llmmodelTypeToMinMax2.minDatetime, llmmodelTypeToMinMax.minDatetime);
                    llmmodelTypeToMinMax2.maxDatetime = Math.max(llmmodelTypeToMinMax2.maxDatetime, llmmodelTypeToMinMax.maxDatetime);

                    llmmodelTypeToMinMax2.averageLoadingDuration_0 =
                            (llmmodelTypeToMinMax2.averageLoadingDuration_0 * llmmodelTypeToMinMax2.numData
                             + llmmodelTypeToMinMax.averageLoadingDuration_0 * llmmodelTypeToMinMax.numData)
                                / numData;
                    llmmodelTypeToMinMax2.averageLoadingDuration_1 =
                            (llmmodelTypeToMinMax2.averageLoadingDuration_1 * llmmodelTypeToMinMax2.numData
                             + llmmodelTypeToMinMax.averageLoadingDuration_1 * llmmodelTypeToMinMax.numData)
                                / numData;
                    llmmodelTypeToMinMax2.averageFirstCharDuration_0 =
                            (llmmodelTypeToMinMax2.averageFirstCharDuration_0 * llmmodelTypeToMinMax2.numData
                             + llmmodelTypeToMinMax.averageFirstCharDuration_0 * llmmodelTypeToMinMax.numData)
                                / numData;
                    llmmodelTypeToMinMax2.averageProcessingDuration_0 =
                            (llmmodelTypeToMinMax2.averageProcessingDuration_0 * llmmodelTypeToMinMax2.numData
                             + llmmodelTypeToMinMax.averageProcessingDuration_0 * llmmodelTypeToMinMax.numData)
                                / numData;
                    llmmodelTypeToMinMax2.averageProcessingDuration_1 =
                            (llmmodelTypeToMinMax2.averageProcessingDuration_1 * llmmodelTypeToMinMax2.numData
                             + llmmodelTypeToMinMax.averageProcessingDuration_1 * llmmodelTypeToMinMax.numData)
                                / numData;
                    llmmodelTypeToMinMax2.numData = numData;

                llmmodelTypeToMinMax2.minLoadingDuration_0 = Math.min(llmmodelTypeToMinMax2.minLoadingDuration_0, llmmodelTypeToMinMax.minLoadingDuration_0);
                llmmodelTypeToMinMax2.maxLoadingDuration_0 = Math.max(llmmodelTypeToMinMax2.maxLoadingDuration_0, llmmodelTypeToMinMax.maxLoadingDuration_0);

                llmmodelTypeToMinMax2.minLoadingDuration_1 = Math.min(llmmodelTypeToMinMax2.minLoadingDuration_1, llmmodelTypeToMinMax.minLoadingDuration_1);
                llmmodelTypeToMinMax2.maxLoadingDuration_1 = Math.max(llmmodelTypeToMinMax2.maxLoadingDuration_1, llmmodelTypeToMinMax.maxLoadingDuration_1);

                llmmodelTypeToMinMax2.minFirstCharDuration_0 = Math.min(llmmodelTypeToMinMax2.minFirstCharDuration_0, llmmodelTypeToMinMax.minFirstCharDuration_0);
                llmmodelTypeToMinMax2.maxFirstCharDuration_0 = Math.max(llmmodelTypeToMinMax2.maxFirstCharDuration_0, llmmodelTypeToMinMax.maxFirstCharDuration_0);

                llmmodelTypeToMinMax2.minFirstCharDuration_1 = Math.min(llmmodelTypeToMinMax2.minFirstCharDuration_1, llmmodelTypeToMinMax.minFirstCharDuration_1);
                llmmodelTypeToMinMax2.maxFirstCharDuration_1 = Math.max(llmmodelTypeToMinMax2.maxFirstCharDuration_1, llmmodelTypeToMinMax.maxFirstCharDuration_1);

                llmmodelTypeToMinMax2.minLoadingDuration_0 = Math.min(llmmodelTypeToMinMax2.minLoadingDuration_0, llmmodelTypeToMinMax.minLoadingDuration_0);
                llmmodelTypeToMinMax2.maxLoadingDuration_0 = Math.max(llmmodelTypeToMinMax2.maxLoadingDuration_0, llmmodelTypeToMinMax.maxLoadingDuration_0);

                llmmodelTypeToMinMax2.minLoadingDuration_1 = Math.min(llmmodelTypeToMinMax2.minLoadingDuration_1, llmmodelTypeToMinMax.minLoadingDuration_1);
                llmmodelTypeToMinMax2.maxLoadingDuration_1 = Math.max(llmmodelTypeToMinMax2.maxLoadingDuration_1, llmmodelTypeToMinMax.maxLoadingDuration_1);

                }
            } // for
            mapLLMmodelTypeToMInMax = existing_mapLLMmodelTypeToMInMax; //important later

            } //blob != null



            BlobId blobId = BlobId.of(LocalAIhardwareBucketName, filenameLocalOrProduction());
			BlobInfo blobInfo = BlobInfo
									.newBuilder(blobId)//bucket, filename
									.setContentType("text/plain")
									.setContentEncoding("gzip")
									.setCacheControl("public, max-age=300")  //max is 1 year https://ashton.codes/set-cache-control-max-age-1-year/
									.build();

        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {

            GZIPOutputStream gzipOS = new GZIPOutputStream(byteArrayOutputStream);

                            //NOTE: SWITCHED ABOVE USING mapLLMmodelTypeToMInMax = existing_mapLLMmodelTypeToMInMax;
            for(LLMmodelTypeMinMax llmmodelTypeToMinMax: mapLLMmodelTypeToMInMax.values())
                gzipOS.write((llmmodelTypeToMinMax.numData + ","
                    + llmmodelTypeToMinMax.key.length() + " " + llmmodelTypeToMinMax.key + ","
                    + llmmodelTypeToMinMax.minDatetime + ","
                    + llmmodelTypeToMinMax.maxDatetime + ","

                    + llmmodelTypeToMinMax.averageLoadingDuration_0 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minLoadingDuration_0, llmmodelTypeToMinMax.averageLoadingDuration_0)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxLoadingDuration_0, llmmodelTypeToMinMax.averageLoadingDuration_0)) + ","

                    + llmmodelTypeToMinMax.averageLoadingDuration_1 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minLoadingDuration_1, llmmodelTypeToMinMax.averageLoadingDuration_1)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxLoadingDuration_1, llmmodelTypeToMinMax.averageLoadingDuration_1)) + ","

                    + llmmodelTypeToMinMax.averageProcessingDuration_0 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minProcessingDuration_0, llmmodelTypeToMinMax.averageProcessingDuration_0)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxProcessingDuration_0, llmmodelTypeToMinMax.averageProcessingDuration_0)) + ","

                    + llmmodelTypeToMinMax.averageProcessingDuration_1 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minProcessingDuration_1, llmmodelTypeToMinMax.averageProcessingDuration_1)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxProcessingDuration_1, llmmodelTypeToMinMax.averageProcessingDuration_1)) + ","

                    + llmmodelTypeToMinMax.averageFirstCharDuration_0 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minFirstCharDuration_0, llmmodelTypeToMinMax.averageFirstCharDuration_0)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxFirstCharDuration_0, llmmodelTypeToMinMax.averageFirstCharDuration_0)) + ","

                    + llmmodelTypeToMinMax.averageFirstCharDuration_1 + ","
                    + (int) Math.floor(Math.min(llmmodelTypeToMinMax.minFirstCharDuration_1, llmmodelTypeToMinMax.averageFirstCharDuration_1)) + ","
                    + (int) Math.ceil(Math.max(llmmodelTypeToMinMax.maxFirstCharDuration_1, llmmodelTypeToMinMax.averageFirstCharDuration_1)) + ","

                    + "\n").getBytes("UTF-8"));

            gzipOS.flush();
			gzipOS.close();

            Blob resultBlob = storage.create(blobInfo, byteArrayOutputStream.toByteArray());
            if(resultBlob == null)
                MessageSent.enviarEmailHTML(rri, "francisco@wapicode.com", null, "createLocalAIhardwareFile resultBlob == null",
					"Datetime = " + Primiti.dateTimeFormat.format(new Date())
							+ "\nDomain = " + rri.domain
							+ "\n rri.servletInfo = " + rri.servletPath, false, null, null);
            else
			    rri.mpm.deletePersistentAll(rri, myLocalAIhardwares, false);
        }
        catch (Exception e)
        {
            rri.myPrintStackTrace(e, null);
        }
    }
//--------------------------------------------------
private static String filenameLocalOrProduction()
{
    return (TapalifeServlet.runLocal ? "local_" : "") + FILENAME;
}
//------------------------------------------------------------------
private static List<LocalAIhardware> getLocalAIhardwareList(RequestResponseInfo rri, String whereString, int daysBefore, long datetimeUpTo)
{
	return (List<LocalAIhardware>) rri.mpm.queryAll(rri, LocalAIhardware.class);
}
//---------------------------------------------------------


}

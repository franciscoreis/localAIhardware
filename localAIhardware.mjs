"use strict"

var cdniverse = "https://storage.googleapis.com/cdniverse/" //const may conflict

var llm_selected
var model_selected

const SIMULATE_NO_WEBGPU = false

var first_update_localAIhardware_mainTable = true

var manual_memoryzSize = 0

var firstOrSecond = 0
var loadingDuration = []
var processingDuration = []
var firstCharTime
var firstCharDuration = []

var last_baselineFeaturesAvailableToText
var last_agent_device_os, last_agent_device_os_STRING

var lastType_bestSettingsForThisType
var lastElemID_bestSettingsForThisType = "localAIhardware_mainTable"
var lastOptions_bestSettingsForThisType = ""
var lastCallWhenSelect_bestSettingsForThisType
var minAVERAGEmax = 0
var loadCharProc = 23  //11 12 13 21 22 23 = load FirstChar Processing load FirstChar Processing

var lastNumView_menuSelectModelType = 0

var set_localAIhardware_dataGrid
var rebuildMaps = true

var mapLLMIDtoObject, setLLMIDtoObject
var mapModelIDtoObject, setModelIDtoObject
var mapTypeToObject, setTypeToObject
var mapAgentBrowserToObject, setAgentBrowserToObject

var textAreaProcessing

var userMode = undefined //not set
var userLanguage = navigator.language //may be set
var chrome_builtin_translator
const translations = new Map()

let deviceWasmOrWebgpu = "wasm";
              if ("gpu" in navigator) {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) deviceWasmOrWebgpu = "webgpu";
              }


var chatPlaces_obj = {temporaryResponse: function(response, llmORba, objectAsync, newChunck)
                {
                     if(!firstCharTime)
                        firstCharTime = new Date().getTime()
                     if(textAreaProcessing !== undefined)
                         textAreaProcessing.innerHTML = "processing... \n" + newChunck
                }}

var dataBaseline
var browsersBreakdown
var browsersInfoMap
var mapFeatureToDataLine
var baselineFeaturesAvailable
const ids = ['chrome','safari','edge','firefox','ios_saf',"and_ff","and_chr","and_uc"
                    ,"android","opera","op_mob","op_mini","ie","ie_mob","bb","kaios","and_qq","and_uc"]

const mapBrowsertoObject = new Map(
        [
          ["chrome", {name: "Chrome Desktop", stats_id: 'chrome'}]
          ,["chrome_android", {name: "Chrome Mobile", stats_id: 'and_chr'}]
          ,["edge", {name: "Microsoft Edge", stats_id: 'edge'}]
          ,["firefox", {name: "Firefox Desktop", stats_id: 'firefox'}]
          ,["firefox_android", {name: "Firefox Mobile", stats_id: 'and_ff'}]
          ,["safari", {name: "Safari Desktop", stats_id: 'safari'}]
          ,["safari_ios", {name: "Safari Mobile", stats_id: 'ios_saf'}]
        ])

// FIND FEATURES: https://github.com/web-platform-dx/web-features-explorer/blob/main/additional-data/wpt.json
// FIND NEW FEATURES https://github.com/web-platform-dx/web-features-explorer/blob/main/additional-data/origin-trials.json
const mapIDtoObject = new Map(
        [
            //1. Run compute efficiently (GPU/CPU/NN accelerators)
          ["webgpu", {group: 1, name: "WebGPU", description: "the main API for running ML inference efficiently on modern GPUs."}]
          ,["webgl2", {group: 1, name: "WebGL2", description: "fallback for models that still use shaders for compute"}]
          ,["wasm-simd", {group: 1, name: "WebAssembly", description: "portable CPU execution for ML models"}]
          ,["wasm-threads", {group: 1, name: "WebAssembly Threads", description: "parallelize model execution"}]
          ,["webnn", {group: 1, name: "WebNN API", description: "direct mapping to device neural accelerators"}]
            //2. Handle model files and storage
          ,["streams", {group: 2, name: "Streams API", description: "progressively load large model files"}]
          ,["readable-byte-streams", {group: 2, name: "Fetch with ReadableStream", description: "stream weights from network"}]
          ,["file-system-access", {group: 2, name: "File System Access API (OPFS)", description: "store models locally for offline use"}]
          ,["indexeddb", {group: 2, name: "IndexedDB", description: "persistent structured storage of model data"}]
          ,["server-sent-events", {group: 2, name: "Server Sent Events", description: "streaming from server to client"}]
          ,["abortable-fetch", {group: 2, name: "Abortable fetch", description: "cancel task on server"}]
            //3. Work with media input/output
          ,["media-source", {group: 3, name: "MediaDevices / getUserMedia", description: "access microphone and camera for input"}]
          ,["web-audio", {group: 3, name: "Web Audio API", description: "process audio for speech recognition or TTS"}]
          ,["webcodecs", {group: 3, name: "WebCodecs", description: "efficient video decoding/encoding, useful for vision models"}]
          ,["webrtc", {group: 3, name: "WebRTC", description: "real-time media streaming"}]
            //4. Performance & memory
          ,["shared-memory", {group: 4, name: "SharedArrayBuffer", description: "enables high-performance multithreading for ML runtimes"}]
          ,["atomics-wait-async", {group: 4, name: "Atomics", description: "synchronization in WASM multi-threaded inference"}]
          ,["transferable-arraybuffer", {group: 4, name: "Large Blob / ArrayBuffer handling", description: "to load big models"}]
            //5. Security / isolation
          ,["isolation", {group: 5, name: "Cross-Origin Isolation", description: "prerequisite for SharedArrayBuffer"}]
          ,["is-secure-context", {group: 5, name: "Secure Contexts (HTTPS)", description: "required for WebGPU, getUserMedia, WebNN, etc"}]
        ]
)

const mapMainSecondaryIndirectToObject = new Map([
   [0, {name: "does not use", color: "#fff", letter: ""}]
   ,[1, {name: "main/core", color: "#88f", letter: "M"}]
   ,[2, {name: "secondary/fallback", color: "#0ff", letter: "s"}]
   ,[3, {name: "indirectly", color: "#f0f", letter: "i"}]
   ,[4, {name: "performance", color: "#FFA500", letter: "P"}]
])

/*
webgpu webgl2 wasm-simd wasm-threads webnn
streams readable-byte-streams file-system-access indexeddb
media-source web-audio webcodecs webrtc
shared-memory atomics-wait-async transferable-arraybuffer
isolation is-secure-context
*/

const groupsOfFeatures = [""
                    , "Run compute efficiently (GPU/CPU/NN accelerators)"
                    , "Handle model files, storage, server streaming"
                    , "Work with media input/output"
                    , "Performance & memory"
                    , "Security / isolation"
                    ]



const statusToColor = new Map([['available', '#0f0'],['other','#fff']])
const baselineStatusToColor = new Map([['widely', '#dfd'], ['newly', '#ffc'], ['limited', '#fdd']])

var lastGridViewed



function hello()
{
    alert("Hello, local AI  world!")
}

function showPopoverWithContent(s)
{
    const pop = document.createElement("div");
    pop.insertAdjacentHTML("afterbegin", s)
    pop.className = "my-popover"
    pop.setAttribute("popover", "auto") // enable popover behavior
    document.body.appendChild(pop)
    pop.showPopover()
}

function formatBytes(bytes, decimals = 2)
{
  if (bytes === 0) return "0 Bytes";

  const k = 1024; // or 1000 for metric
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
//-----------------------------------------------------------------
function default_call_bestSettingsForThisType(type, llmID, modelID, uuid = "")
{
showMessageErrorOnSOSforDuration("Can be a call to an application with parameters: TYPE=" + type + "  LLMID=" + llmID + "  MODELID=" + modelID + "  UUID=" + uuid)
}
//-----------------------------------------------------------------
async function update_localAIhardware_mainTable(numView)
{

    let s
    if(first_update_localAIhardware_mainTable)
    {
        first_update_localAIhardware_mainTable = false
        let params = new URLSearchParams(document.location.search);
        if(params.get("laih_uuid"))
        {
        const llm_uniqueID = decodeURIComponent(params.get("llmID"))
        const modelOfMyLLM_id = decodeURIComponent(params.get("modelID"))
        const type = decodeURIComponent(params.get("type"))
        s = await LocalAIhardware.MyLLMroot.calculateMenu_llm_model(llm_uniqueID, modelOfMyLLM_id, type, true)
        }
    }

    if(!s)
      s = menuSelectModelType(numView)

    document.getElementById("localAIhardware_mainTable").innerHTML = s

}
//-------------------------------------
async function setUserMode(userMode_param, elemIDforInnerHTML)
{
    if(userMode !== undefined || userMode_param === undefined)
        return
    userMode = userMode_param
    if(userMode && userLanguage.indexOf("en") === -1)
    try
    {
    if (!('Translator' in self))
                return showMessageErrorOnSOSforDuration("no Chrome Built-in AI available", 3000)
            //    throw new Error('Summarizer API not supported');


            const avail = await Translator.availability({
                sourceLanguage: 'en',
                targetLanguage: userLanguage,
                });

        if (avail !== "unavailable")
           chrome_builtin_translator = await Translator.create({
                    sourceLanguage: 'en',
                    targetLanguage: userLanguage,
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            if(elemIDforInnerHTML)
                                document.getElementById(elemIDforInnerHTML).innerHTML = e.loaded * 100 + "% loading translations..."
                            // e.loaded * 100
                        });
                    },
                });

    }
    catch(e)
    {
        chrome_builtin_translator = undefined
    }

}
//-----------------------------------------------------------------
async function translate(englishString)
{
 let translated = translations.get(englishString)
 if(translated)
     return translated
translated = englishString

 if(chrome_builtin_translator)
 try
 {

    translated = await chrome_builtin_translator.translate(englishString, {
            context: ''
            ,outputLanguage: userLanguage
          });
 }
 catch(e)
 {
 }
translations.set(englishString, translated)
return translated
}
//-----------------------------------------------------------------
async function sortBest(type, elemIDforInnerHTML, options, userMode_param, callWhenSelect)
{
    await setUserMode(userMode_param, elemIDforInnerHTML)
    bestSettingsForThisType(type, elemIDforInnerHTML, options, callWhenSelect)
}
//-----------------------------------------------------------------
async function bestSettingsForThisType(type = lastType_bestSettingsForThisType, elemIDforInnerHTML = lastElemID_bestSettingsForThisType
                                       , options = lastOptions_bestSettingsForThisType, callWhenSelect = lastCallWhenSelect_bestSettingsForThisType)
{
    if(!set_localAIhardware_dataGrid)
       await downloadDataGrid()

    lastElemID_bestSettingsForThisType = elemIDforInnerHTML
    lastOptions_bestSettingsForThisType = options

    lastType_bestSettingsForThisType = type
    lastCallWhenSelect_bestSettingsForThisType = callWhenSelect


    let select = "<select onClick='event.stopPropagation()' onChange='window.LocalAIhardware.bestSettingsForThisType(this.value)'>"
    for (let [name, modelOfMyLLM] of ModelOfMyLLMroot.modelTypes)
        select += "<option value='" + name + "' " + (name == type ? "selected" : "") + ">" + name + "</option>"
    select += "</select>"

    let s = "<h3>" + select + "&nbsp; Best available AI <b style='color:green'>" + type + "</b>"
        + " &nbsp; <button onClick='window.LocalAIhardware.viewDataGridHTML()' style='padding:6px;border-radius:10px'>View Data Grid</button>"
        + "</h3>"



    if(!last_agent_device_os)
        return BaseLineFeatures.get_agent_device_os(true, function(){bestSettingsForThisType(type, elemIDforInnerHTML, options)})

    s += "<br><b>" + last_agent_device_os_STRING + "</b>"

    let s2 = "<br><br><table border=1><tr><th>browser</th>"
                + "<th>load (ms)<br>min &nbsp; max</th>"
                + "<th>first char<br>min &nbsp; max</th>"
                + "<th>processing<br>min &nbsp; max</th>"
                + "<th>load (ms)<br>(second)</th>"
                + "<th>first char<br>(second)</th>"
                + "<th>processing<br>(second)</th>"
        + "</tr>"

    const mapKeyToObject = new Map()
    for(let llmmodelTypeToMinMax of set_localAIhardware_dataGrid)
    if((llmmodelTypeToMinMax.type === type || ModelOfMyLLMroot.MODEL_TYPE_ALL === type)
        && last_agent_device_os.OperatingSystemName === llmmodelTypeToMinMax.agent_device_os.OperatingSystemName)
    {

        const key = llmmodelTypeToMinMax.agent_device_os.AgentName
            + " " + llmmodelTypeToMinMax.llmID
            + " " + llmmodelTypeToMinMax.modelID

        const object = mapKeyToObject.get(key)
        if(!object)
        {
             mapKeyToObject.set(key, {
                                        llmID: llmmodelTypeToMinMax.llmID
                                      , modelID: llmmodelTypeToMinMax.modelID
                                      , numData: llmmodelTypeToMinMax.numData
                                      , agent_device_os: llmmodelTypeToMinMax.agent_device_os
                                      , AgentVersion_min: llmmodelTypeToMinMax.agent_device_os.AgentVersion
                                      , AgentVersion_max: llmmodelTypeToMinMax.agent_device_os.AgentVersion
                                      , averageLoadingDuration_0: llmmodelTypeToMinMax.averageLoadingDuration_0
                                      , averageFirstCharDuration_0: llmmodelTypeToMinMax.averageFirstCharDuration_0
                                      , averageProcessingDuration_0: llmmodelTypeToMinMax.averageProcessingDuration_0
                                      , averageLoadingDuration_1: llmmodelTypeToMinMax.averageLoadingDuration_1
                                      , averageFirstCharDuration_1: llmmodelTypeToMinMax.averageFirstCharDuration_1
                                      , averageProcessingDuration_1: llmmodelTypeToMinMax.averageProcessingDuration_1

                                      , minLoadingDuration_0: llmmodelTypeToMinMax.minLoadingDuration_0
                                      , minFirstCharDuration_0: llmmodelTypeToMinMax.minFirstCharDuration_0
                                      , minProcessingDuration_0: llmmodelTypeToMinMax.minProcessingDuration_0
                                      , minLoadingDuration_1: llmmodelTypeToMinMax.minLoadingDuration_1
                                      , minFirstCharDuration_1: llmmodelTypeToMinMax.minFirstCharDuration_1
                                      , minProcessingDuration_1: llmmodelTypeToMinMax.minProcessingDuration_1

                                      , maxLoadingDuration_0: llmmodelTypeToMinMax.maxLoadingDuration_0
                                      , maxFirstCharDuration_0: llmmodelTypeToMinMax.maxFirstCharDuration_0
                                      , maxProcessingDuration_0: llmmodelTypeToMinMax.maxProcessingDuration_0
                                      , maxLoadingDuration_1: llmmodelTypeToMinMax.maxLoadingDuration_1
                                      , maxFirstCharDuration_1: llmmodelTypeToMinMax.maxFirstCharDuration_1
                                      , maxProcessingDuration_1: llmmodelTypeToMinMax.averageProcessingDuration_1


                    })
        }
        else
        {
           if(object.AgentVersion_min > llmmodelTypeToMinMax.agent_device_os.AgentVersion)
             object.AgentVersion_min = llmmodelTypeToMinMax.agent_device_os.AgentVersion
           if(object.AgentVersion_max < llmmodelTypeToMinMax.agent_device_os.AgentVersion)
             object.AgentVersion_max = llmmodelTypeToMinMax.agent_device_os.AgentVersion


            const tot = object.numData + llmmodelTypeToMinMax.numData
            object.averageLoadingDuration_0 = (object.averageLoadingDuration_0 * object.numData + llmmodelTypeToMinMax.averageLoadingDuration_0 * llmmodelTypeToMinMax.numData) / tot
            object.averageFirstCharDuration_0 = (object.averageFirstCharDuration_0 * object.numData + llmmodelTypeToMinMax.averageFirstCharDuration_0 * llmmodelTypeToMinMax.numData) / tot
            object.averageProcessingDuration_0 = (object.averageProcessingDuration_0 * object.numData + llmmodelTypeToMinMax.averageProcessingDuration_0 * llmmodelTypeToMinMax.numData) / tot
            object.averageLoadingDuration_1 = (object.averageLoadingDuration_1 * object.numData + llmmodelTypeToMinMax.averageLoadingDuration_1 * llmmodelTypeToMinMax.numData) / tot
            object.averageFirstCharDuration_1 = (object.averageFirstCharDuration_1 * object.numData + llmmodelTypeToMinMax.averageFirstCharDuration_1 * llmmodelTypeToMinMax.numData) / tot
            object.averageProcessingDuration_1 = (object.averageProcessingDuration_1 * object.numData + llmmodelTypeToMinMax.averageProcessingDuration_1 * llmmodelTypeToMinMax.numData) / tot
            object.numData = tot

          object.minLoadingDuration_0 = Math.min(object.minLoadingDuration_0, llmmodelTypeToMinMax.minLoadingDuration_0)
          object.minFirstCharDuration_0 = Math.min(object.minFirstCharDuration_0, llmmodelTypeToMinMax.minFirstCharDuration_0)
          object.minProcessingDuration_0 = Math.min(object.minProcessingDuration_0, llmmodelTypeToMinMax.minProcessingDuration_0)
          object.minLoadingDuration_1 = Math.min(object.minLoadingDuration_1, llmmodelTypeToMinMax.minLoadingDuration_1)
          object.minFirstCharDuration_1 = Math.min(object.minFirstCharDuration_1, llmmodelTypeToMinMax.minFirstCharDuration_1)
          object.minProcessingDuration_1 = Math.min(object.minProcessingDuration_1, llmmodelTypeToMinMax.maxProcessingDuration_1)

          object.maxLoadingDuration_0 = Math.min(object.maxLoadingDuration_0, llmmodelTypeToMinMax.maxLoadingDuration_0)
          object.maxFirstCharDuration_0 = Math.min(object.maxFirstCharDuration_0, llmmodelTypeToMinMax.maxFirstCharDuration_0)
          object.maxProcessingDuration_0 = Math.min(object.maxProcessingDuration_0, llmmodelTypeToMinMax.maxProcessingDuration_0)
          object.maxLoadingDuration_1 = Math.min(object.maxLoadingDuration_1, llmmodelTypeToMinMax.maxLoadingDuration_1)
          object.maxFirstCharDuration_1 = Math.min(object.maxFirstCharDuration_1, llmmodelTypeToMinMax.maxFirstCharDuration_1)
          object.maxProcessingDuration_1 = Math.min(object.maxProcessingDuration_1, llmmodelTypeToMinMax.minProcessingDuration_1)

        }

        s2 += "<tr><td>" + llmmodelTypeToMinMax.agent_device_os.AgentName + "</td>"
           + "<td>" + llmmodelTypeToMinMax.averageLoadingDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minLoadingDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxLoadingDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageFirstCharDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minFirstCharDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxFirstCharDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageProcessingDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minProcessingDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxProcessingDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageLoadingDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minLoadingDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxLoadingDuration_1
           + "<td>" + llmmodelTypeToMinMax.averageFirstCharDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minFirstCharDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxFirstCharDuration_1
           + "<td>" + llmmodelTypeToMinMax.averageProcessingDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minProcessingDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxProcessingDuration_1
           + "</tr>"

    }

     let sortBest = ""
     if(mapKeyToObject.size === 0)
         sortBest = await translate("NO DATA FOR YOUR DEVICE")
       else {
         sortBest = await translate("Ordenate by")
         for (let i = -1; i <= 1; i++)
             sortBest += "&nbsp; <label style='vertical-align:sub'><input onClick='LocalAIhardware.minAVERAGEmax=" + i + ";window.LocalAIhardware.bestSettingsForThisType()' type='radio' name='localAIhardware_minAVERAGEmax' " + (LocalAIhardware.minAVERAGEmax === i ? "checked" : "") + ">" + ["min", "avg", "max"][i + 1] + "</label>"

         sortBest += " &nbsp; " + await translate("shown times in milliseconds")
         sortBest += "<br><table border=1><tr><th title='"+ await translate("total samples")+"'>t</th><th>"+ await translate("browser + Engine + Model") + "</th>"
             + "<th>icons</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 11 ? "onClick='LocalAIhardware.loadCharProc=11;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("load") + "<br>min &nbsp; max</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 12 ? "onClick='LocalAIhardware.loadCharProc=12;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("first char") + "<br>min &nbsp; max</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 13 ? "onClick='LocalAIhardware.loadCharProc=13;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("processing") + "<br>min &nbsp; max</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 21 ? "onClick='LocalAIhardware.loadCharProc=21;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("load") + "<br>(second)</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 22 ? "onClick='LocalAIhardware.loadCharProc=22;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("first char") + "<br>(second)</th>"
             + "<th " + (LocalAIhardware.loadCharProc !== 23 ? "onClick='LocalAIhardware.loadCharProc=23;window.LocalAIhardware.bestSettingsForThisType()' style='cursor:pointer;color:blue'" : "") + ">"+ await translate("processing") + "<br>(second)</th>"
             + "</tr>"


         const mapAsc = new Map([...mapKeyToObject.entries()].sort(function (a, b) {
                 let x, y
                 switch (LocalAIhardware.loadCharProc + " " + LocalAIhardware.minAVERAGEmax) {
                     case "11 0" :
                         x = a[1].averageLoadingDuration_0;
                         y = b[1].averageLoadingDuration_0;
                         break
                     case "11 -1" :
                         x = a[1].minLoadingDuration_0;
                         y = b[1].minLoadingDuration_0;
                         break
                     case "11 1" :
                         x = a[1].maxLoadingDuration_0;
                         y = b[1].maxLoadingDuration_0;
                         break
                     case "12 0" :
                         x = a[1].averageFirstCharDuration_0;
                         y = b[1].averageFirstCharDuration_0;
                         break
                     case "12 -1" :
                         x = a[1].minFirstCharDuration_0;
                         y = b[1].minFirstCharDuration_0;
                         break
                     case "12 1" :
                         x = a[1].maxFirstCharDuration_0;
                         y = b[1].maxFirstCharDuration_0;
                         break
                     case "13 0" :
                         x = a[1].averageProcessingDuration_0;
                         y = b[1].averageProcessingDuration_0;
                         break
                     case "13 -1" :
                         x = a[1].minProcessingDuration_0;
                         y = b[1].minProcessingDuration_0;
                         break
                     case "13 1" :
                         x = a[1].maxProcessingDuration_0;
                         y = b[1].maxProcessingDuration_0;
                         break
                     case "21 0" :
                         x = a[1].averageLoadingDuration_1;
                         y = b[1].averageLoadingDuration_1;
                         break
                     case "21 -1" :
                         x = a[1].minLoadingDuration_1;
                         y = b[1].minLoadingDuration_1;
                         break
                     case "21 1" :
                         x = a[1].maxLoadingDuration_1;
                         y = b[1].maxLoadingDuration_1;
                         break
                     case "22 0" :
                         x = a[1].averageFirstCharDuration_1;
                         y = b[1].averageFirstCharDuration_1;
                         break
                     case "22 -1" :
                         x = a[1].minFirstCharDuration_1;
                         y = b[1].minFirstCharDuration_1;
                         break
                     case "22 1" :
                         x = a[1].maxFirstCharDuration_1;
                         y = b[1].maxFirstCharDuration_1;
                         break
                     case "23 0" :
                         x = a[1].averageProcessingDuration_1;
                         y = b[1].averageProcessingDuration_1;
                         break
                     case "23 -1" :
                         x = a[1].minProcessingDuration_1;
                         y = b[1].minProcessingDuration_1;
                         break
                     case "23 1" :
                         x = a[1].maxProcessingDuration_1;
                         y = b[1].maxProcessingDuration_1;
                         break
                     default:
                         return 1
                 }
                 return x === y ? 0 : x < y ? -1 : 1
             }
         ))


         for (let [key, llmmodelTypeToMinMax] of mapAsc)
         {

             const llm = MyLLMroot.mapIDtoMyLLMs.get(llmmodelTypeToMinMax.llmID)
             const model = ModelOfMyLLMroot.modelsOfMyLLM.get(llmmodelTypeToMinMax.modelID)
             const compatible = key.startsWith(last_agent_device_os.AgentName)
             let llmANDmodel = llm.name + " => " + model.name
             if(!callWhenSelect)
                 callWhenSelect = "LocalAIhardware.default_call_bestSettingsForThisType"
             llmANDmodel = "<a href='Javascript:"+callWhenSelect+"(\""+ type +"\",\"" + llmmodelTypeToMinMax.llmID + "\",\"" + llmmodelTypeToMinMax.modelID + "\")'>" + llmANDmodel + "</a>"

             sortBest += "<tr style='" + (compatible ? "" : ";background-color:#ffb") + "'><td>" + llmmodelTypeToMinMax.numData + "</td>"
                 + "<td style='text-align:left'>" + llmmodelTypeToMinMax.agent_device_os.OperatingSystemName + " &nbsp; <b>" + llmmodelTypeToMinMax.agent_device_os.AgentName + " " + llmmodelTypeToMinMax.AgentVersion_min + (llmmodelTypeToMinMax.AgentVersion_min !== llmmodelTypeToMinMax.AgentVersion_max ? "-" + llmmodelTypeToMinMax.AgentVersion_max : "")  + "</b><br>" + llmANDmodel + "</td>"
                 + "<td>" + llm?.icon("40px") + model?.icon("40px") + "</td>"
                 + "<td>" + boldIf(11, 0, llmmodelTypeToMinMax.averageLoadingDuration_0.toFixed(1)) + "<br>" + boldIf(11, -1, llmmodelTypeToMinMax.minLoadingDuration_0) + " &nbsp; " + boldIf(11, 1, llmmodelTypeToMinMax.maxLoadingDuration_0)
                 + "<td>" + boldIf(12, 0, llmmodelTypeToMinMax.averageFirstCharDuration_0.toFixed(1)) + "<br>" + boldIf(12, -1, llmmodelTypeToMinMax.minFirstCharDuration_0) + " &nbsp; " + boldIf(12, 1, llmmodelTypeToMinMax.maxFirstCharDuration_0)
                 + "<td>" + boldIf(13, 0, llmmodelTypeToMinMax.averageProcessingDuration_0.toFixed(1)) + "<br>" + boldIf(13, -1, llmmodelTypeToMinMax.minProcessingDuration_0) + " &nbsp; " + boldIf(13, 1, llmmodelTypeToMinMax.maxProcessingDuration_0)
                 + "<td>" + boldIf(21, 0, llmmodelTypeToMinMax.averageLoadingDuration_1.toFixed(1)) + "<br>" + boldIf(21, -1, llmmodelTypeToMinMax.minLoadingDuration_1) + " &nbsp; " + boldIf(21, 1, llmmodelTypeToMinMax.maxLoadingDuration_1)
                 + "<td>" + boldIf(22, 0, llmmodelTypeToMinMax.averageFirstCharDuration_1.toFixed(1)) + "<br>" + boldIf(22, -1, llmmodelTypeToMinMax.minFirstCharDuration_1) + " &nbsp; " + boldIf(22, 1, llmmodelTypeToMinMax.maxFirstCharDuration_1)
                 + "<td>" + boldIf(23, 0, llmmodelTypeToMinMax.averageProcessingDuration_1.toFixed(1)) + "<br>" + boldIf(23, -1, llmmodelTypeToMinMax.minProcessingDuration_1) + " &nbsp; " + boldIf(23, 1, llmmodelTypeToMinMax.maxProcessingDuration_1)
                 + "</tr>"
         }
         sortBest += "</table><br>" + await translate("Notes: sorted from fastest to slowest. Samples are compatible with your browser and operating system.")

     } //size > 0

    let result
    if(options.indexOf("only_sortBest") !== -1)
        result = sortBest
    else
        result = s + "<br><br>" + sortBest + s2


    document.getElementById(elemIDforInnerHTML).innerHTML = result + "<br>&nbsp;"
}
//-----------------------------------------------------------------
function boldIf(loadCharProc_param, minAVERAGEmax_param, s)
{
return loadCharProc_param === LocalAIhardware.loadCharProc && minAVERAGEmax_param === LocalAIhardware.minAVERAGEmax
    ? "<b style='color:green'>" + s + "</b>" : s
}
//-----------------------------------------------------------------
function menuSelectModelType(numView = lastNumView_menuSelectModelType, uuid = "") {
    const type = ModelOfMyLLMroot.selectedModelType

    let s = ""

    lastNumView_menuSelectModelType = numView

    s += "<button onClick='window.LocalAIhardware.viewDataGridHTML()' style='padding:6px;border-radius:10px'>View Data Grid</button>"

    let num = 0
    for (let label of ["beta testers", "under construction"])
    {
        s += "<label>&nbsp;<input type='radio' onClick='MyLLMroot.showLLmsUnderConstruction=" + num + ";LocalAIhardware.ModelOfMyLLMroot.selectThisType();' name='radios_choose_under_construction' " + (MyLLMroot.showLLmsUnderConstruction === num ? "checked" : "") + ">&nbsp;" + TLtranslateFromTo(label) + "&nbsp;</label>"
        num++
    }

    s += " &nbsp; &nbsp; application "
    for (let num = 0; num < 2; num++)
        s += "<label title='"+ ["opens new netral tab","uses popover in this application"][num] +"'>&nbsp;<input type='radio' onClick='BaseLineFeatures.calculateOnUniqueTab=" + (num === 0) + "' name='radios_choose_under_construction' " + ( (num === 0) === BaseLineFeatures.calculateOnUniqueTab ? "checked" : "") + ">&nbsp;"
            + TLtranslateFromTo(["neutral", "domain"][num]) + "&nbsp;</label>"


    s += "<br><br>"

    /*
    let select = "<select onClick='event.stopPropagation()' onChange='LocalAIhardware.ModelOfMyLLMroot.selectThisType(\"" + uuid + "\", this.value)'>"
    for (let [name, modelOfMyLLM] of ModelOfMyLLMroot.modelTypes)
        select += "<option value='" + name + "' " + (name == type ? "selected" : "") + ">" + name + "</option>"
    select += "</select>"
    s += select + " &nbsp; "
    */

    for (let [name, modelOfMyLLM] of ModelOfMyLLMroot.modelTypes)
        s += "&nbsp;<button onClick='LocalAIhardware.ModelOfMyLLMroot.selectThisType(\"" + uuid + "\",\"" + name + "\")' style='"+ (name === ModelOfMyLLMroot.selectedModelType ? "background-color:white" : "") +"'>" + name + "</button>&nbsp;"

    s += "<br><br>"
    const titles = ["engines", "models"]
    for(let n = 0; n < titles.length; n++)
        s += "<label> &nbsp; <input onClick='window.LocalAIhardware.update_localAIhardware_mainTable(" + n + ")' type='radio' "+ (numView === n ? "checked" : "") +" name='radios_engines_models' style='margin-bottom:6px'>&nbsp;" + TLtranslateFromTo(titles[n]) + "&nbsp;</label>"

    if (numView === 0)
    {

    //TABLE 1
    s += "<br><table border='1'><tr>"
        + "<td colspan=3>" + TLtranslateFromTo("engines") + " / " + TLtranslateFromTo("models") + "</td>"
    for (let [name, modelOfMyLLM] of ModelNameLLM.mapNameToModels)
        s += "<td>" + modelOfMyLLM.icon("25px") + "</td>"
    s += "</tr>"

    for (let [name, llm] of MyLLMroot.mapMyLLMs) {
        s += "<tr class='table_with_all_llm_" + llm.uniqueID + " back_ground_color_availability_" + llm.uniqueID + "' style='background-color:" + llm.rowColor() + "'>"
            + "<td style='border-right:1px solid #fff'>" + llm.localORcloudORsharedAIicon("24px") + "</td>"
            + "<td style='border-right:1px solid #fff" + llm.addToBackgroundImage() + "'>" + llm.icon("20px") + "</td>"
            + "<td style='text-align:left;border-left:1px solid #fff'>" + llm.name + "</td>"
        for (let [name, modelOfMyLLM] of ModelNameLLM.mapNameToModels)
        {
            const numModelsOfLLM = llm.numModelsOfLLMwithType(type, modelOfMyLLM)
            s += "<td onClick='LocalAIhardware.MyLLMroot.calculate_llmID_modelName(\""+llm.uniqueID+"\",\""+modelOfMyLLM.name+"\")' class='numModelsOfLLM_modelOfMyLLM_" + llm.uniqueID+"\"' class='numModelsOfLLM_modelOfMyLLM_" + llm.uniqueID + "_" + modelOfMyLLM.name + "' style='" + (numModelsOfLLM ? "cursor:pointer" : "") + "'>" + (numModelsOfLLM || "") + "</td>"
        }
        s += "</tr>"
    }


    s += "</table>"

    }
    else if(numView === 1)
    {
    //TABLE 2
    s += "<br><table border='1'><tr>"
        + "<td colspan=2 rowspan=2>" + TLtranslateFromTo("models") + "<br>" + TLtranslateFromTo("engines") + "</td>"
    for (let [name, llm] of MyLLMroot.mapMyLLMs)
        s += "<td class='table_with_all_llm_" + llm.uniqueID + "' style='background-color:" + llm.rowColor() + "'>" + llm.localORcloudORsharedAIicon("24px") + "</td>"
    s += "</tr><tr>"
    for (let [name, llm] of MyLLMroot.mapMyLLMs)
        s += "<td class='table_with_all_llm_" + llm.uniqueID + "' style='background-color:" + llm.rowColor() + llm.addToBackgroundImage() + "'>" + llm.icon("25px") + "</td>"
    s += "</tr>"

    for (let [name, modelOfMyLLM] of ModelNameLLM.mapNameToModels) {
        s += "<tr>"
            + "<td style='border-right:1px solid #fff'>" + modelOfMyLLM.icon("20px") + "</td><td style='text-align:left;border-left:1px solid #fff'>" + modelOfMyLLM.name + "</td>"
        for (let [name, llm] of MyLLMroot.mapMyLLMs)
        {
            const numModelsOfLLM = llm.numModelsOfLLMwithType(type, modelOfMyLLM)
            s += "<td onClick='LocalAIhardware.MyLLMroot.calculate_llmID_modelName(\""+llm.uniqueID+"\",\""+modelOfMyLLM.name+"\")' class='table_with_all_llm_" + llm.uniqueID + "' style='background-color:" + llm.rowColor() + (numModelsOfLLM ? ";cursor:pointer" : "") + "'>" + (numModelsOfLLM || "") + "</td>"
        }

        s += "</tr>"
    }
    s += "</table>"
    }

    s += "<br><table style='margin-top:6px'><tr>"
    for (let i = 0; i < MyLLMroot.LLMreadinessStates.length; i++)
        s += "<td style='background-color:" + MyLLMroot.LLMreadinessStateBKcolors[i] + "'>&nbsp; " + TLtranslateFromTo(MyLLMroot.LLMreadinessStates[i]) + " &nbsp;</td>"
    s += "</tr></table>"

    //s += "<br>" + MyLLMroot.showOffLocalAIandCloudAI("30px", "16px", " &nbsp;");

    return s
}
//--------------------------------------------------------------
function baselineFeaturesAvailableToText()
{
    let s = ""
    for(let featureID in baselineFeaturesAvailable)
        if(baselineFeaturesAvailable[featureID])
            s += featureID + " "
    return s.trim();
}
//-----------------------------------------------------------------
async function viewDataGridHTML(reload)
{
   lastGridViewed = "viewDataGridHTML"
    document.getElementById("localAIhardware_mainTable").innerHTML =

        "<br><button onClick='window.LocalAIhardware.update_localAIhardware_mainTable()' style='padding:6px;border-radius:10px'>View Browser Compatibility Grid</button>"
        + " &nbsp; &nbsp; <button onCLick='window.LocalAIhardware.viewDataGridHTML(true)' style='background-color:#fdd'>reload</button>"
        + "<br><br>"
        + await viewDataGrid(reload)

}
//-----------------------------------------------------------------
async function viewDataGrid(reload)
{
    if(!set_localAIhardware_dataGrid || reload)
       await downloadDataGrid()

    if(!set_localAIhardware_dataGrid)
        return "<b style='color:red'>file with data not found or wrong version</b>"

    let s = "<table border='1'><tr><th>num</th><th>LLM ID</th><th>Model ID</th><th>type</th>"
                + "<th>baseline</th>"
                + "<th>DeviceClass<br>DeviceName</th>"
                + "<th>OS Class<br>OS Name<br>OS Version</th>"
                + "<th>Agent Class<br>Agent Name<br>Version</th>"
                + "<th>memory<br>(manual)</th>"
                + "<th>load (ms)<br>min &nbsp; max</th>"
                + "<th>first char<br>min &nbsp; max</th>"
                + "<th>processing<br>min &nbsp; max</th>"
                + "<th>load (ms)<br>(second)</th>"
                + "<th>first char<br>(second)</th>"
                + "<th>processing<br>(second)</th>"
                + "<th>from date<br>to date</th>"
                + "</tr>"

    if(rebuildMaps)
    {
        mapLLMIDtoObject = new Map()
        mapModelIDtoObject = new Map()
        mapTypeToObject = new Map()
        mapAgentBrowserToObject = new Map()
    }
    setLLMIDtoObject = new Map()
    setModelIDtoObject = new Map()
    setTypeToObject = new Map()
    setAgentBrowserToObject = new Map()

    for(let llmmodelTypeToMinMax of set_localAIhardware_dataGrid)
    {
       if(rebuildMaps)
       {
       BaseLineFeatures.addToMapIncNum(mapLLMIDtoObject, llmmodelTypeToMinMax.llmID)
       BaseLineFeatures.addToMapIncNum(mapModelIDtoObject, llmmodelTypeToMinMax.modelID)
       BaseLineFeatures.addToMapIncNum(mapTypeToObject, llmmodelTypeToMinMax.type)
       BaseLineFeatures.addToMapIncNum(mapAgentBrowserToObject, llmmodelTypeToMinMax.agent_device_os.AgentName)
       }

       if(LocalAIhardware.selectedIn_mapLLMIDtoObject && LocalAIhardware.selectedIn_mapLLMIDtoObject !== llmmodelTypeToMinMax.llmID)
           continue
       if(LocalAIhardware.selectedIn_mapModelIDtoObject && LocalAIhardware.selectedIn_mapModelIDtoObject !== llmmodelTypeToMinMax.modelID)
           continue
       if(LocalAIhardware.selectedIn_mapTypeToObject && LocalAIhardware.selectedIn_mapTypeToObject !== llmmodelTypeToMinMax.type)
           continue
       if(LocalAIhardware.selectedIn_mapAgentBrowserToObject && LocalAIhardware.selectedIn_mapAgentBrowserToObject !== llmmodelTypeToMinMax.agent_device_os.AgentName)
           continue

       BaseLineFeatures.addToMapIncNum(setLLMIDtoObject, llmmodelTypeToMinMax.llmID)
       BaseLineFeatures.addToMapIncNum(setModelIDtoObject, llmmodelTypeToMinMax.modelID)
       BaseLineFeatures.addToMapIncNum(setTypeToObject, llmmodelTypeToMinMax.type)
       BaseLineFeatures.addToMapIncNum(setAgentBrowserToObject, llmmodelTypeToMinMax.agent_device_os.AgentName)


       s += "<tr><td style='text-align:right'>&nbsp;" + llmmodelTypeToMinMax.numData + " <button onClick='MyLLMroot.calculateMenu_llm_model(\"" + llmmodelTypeToMinMax.llmID + "\",\"" + llmmodelTypeToMinMax.modelID + "\",\"" + llmmodelTypeToMinMax.type +"\")'>+</button>&nbsp;</td>"
           + "<td>" + llmmodelTypeToMinMax.llmID + "</td>"
           + "<td>" + llmmodelTypeToMinMax.modelID + "</td>"
           + "<td><a href='javascript:window.LocalAIhardware.bestSettingsForThisType(\""+llmmodelTypeToMinMax.type+"\")'>" + llmmodelTypeToMinMax.type + "</a></td>"
           + "<td><textarea style='width:130px;height:44px'>" + llmmodelTypeToMinMax.baseline_features + "</textarea></td>"
           + "<td>" + llmmodelTypeToMinMax.agent_device_os.DeviceClass + "<br>" + llmmodelTypeToMinMax.agent_device_os.DeviceName + "</td>"
           + "<td>" + llmmodelTypeToMinMax.agent_device_os.OperatingSystemClass + "<br>" + llmmodelTypeToMinMax.agent_device_os.OperatingSystemName + "<br>" + llmmodelTypeToMinMax.agent_device_os.OperatingSystemVersion +  "</td>"
           + "<td>" + llmmodelTypeToMinMax.agent_device_os.AgentClass + "<br>" + llmmodelTypeToMinMax.agent_device_os.AgentName + "<br>" + llmmodelTypeToMinMax.agent_device_os.AgentVersion + "</td>"
           + "<td>" + llmmodelTypeToMinMax.detected_memorySize + "<br>" + (llmmodelTypeToMinMax.manual_memoryzSize || "&nbsp;") + "</td>"
           + "<td>" + llmmodelTypeToMinMax.averageLoadingDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minLoadingDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxLoadingDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageFirstCharDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minFirstCharDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxFirstCharDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageProcessingDuration_0.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minProcessingDuration_0  + " &nbsp; " + llmmodelTypeToMinMax.maxProcessingDuration_0
           + "<td>" + llmmodelTypeToMinMax.averageLoadingDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minLoadingDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxLoadingDuration_1
           + "<td>" + llmmodelTypeToMinMax.averageFirstCharDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minFirstCharDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxFirstCharDuration_1
           + "<td>" + llmmodelTypeToMinMax.averageProcessingDuration_1.toFixed(1) + "<br>" + llmmodelTypeToMinMax.minProcessingDuration_1  + " &nbsp; " + llmmodelTypeToMinMax.maxProcessingDuration_1
           + "<td>" + new Date(llmmodelTypeToMinMax.minDatetime).toLocaleString() + "<br>" + new Date(llmmodelTypeToMinMax.maxDatetime).toLocaleString() + "</td>"
           + "</tr>"

    }

    s += "</table>"

    rebuildMaps = false

    let options = "<button onClick='window.LocalAIhardware.showAll_viewDataGrid()'>show all</button> &nbsp; "

    return options + " "
        + BaseLineFeatures.showMapInSelector(mapLLMIDtoObject, setLLMIDtoObject, "selectedIn_mapLLMIDtoObject", "LLMs")
        + BaseLineFeatures.showMapInSelector(mapModelIDtoObject, setModelIDtoObject, "selectedIn_mapModelIDtoObject", "models")
        + BaseLineFeatures.showMapInSelector(mapTypeToObject, setTypeToObject, "selectedIn_mapTypeToObject", "types")
        + BaseLineFeatures.showMapInSelector(mapAgentBrowserToObject, setAgentBrowserToObject, "selectedIn_mapAgentBrowserToObject", "browsers")
        + "<br>" + s
}
//-----------------------------------------------------------------
function showAll_viewDataGrid()
{
    LocalAIhardware.selectedIn_mapLLMIDtoObject = ""
    LocalAIhardware.selectedIn_mapModelIDtoObject = ""
    LocalAIhardware.selectedIn_mapTypeToObject = ""
    LocalAIhardware.selectedIn_mapAgentBrowserToObject = ""

    LocalAIhardware.viewDataGridHTML()
}
//-----------------------------------------------------------------
async function downloadDataGrid()
{
const url = "https://storage.googleapis.com/localaihardware/local_localaihardware.csv"

  const res = await fetch(url, { cache: "no-store" }); // or "force-cache"
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const s = await res.text();

  set_localAIhardware_dataGrid = new Set()
  rebuildMaps = true
  let lastPos = 0
  let lastPosGlobal = 0
    while(lastPosGlobal < s.length)
    {
        let pos = s.indexOf("\n", lastPosGlobal)
        if(pos == -1)
            break
        const line = s.slice(lastPosGlobal, pos)
        lastPosGlobal = pos + 1

        let lastPos = 0
        let llmmodelTypeToMinMax = {}
        pos = line.indexOf(","); llmmodelTypeToMinMax.numData = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(" ", lastPos)
        let numChars = parseInt(line.slice(lastPos, pos))
        lastPos = pos + 1 + numChars
        const key = line.slice(pos + 1, lastPos)
        lastPos++ // ","
         /* from LocalAIhardware.java
          String key = localAIhardware.llm_uniqueID + " " + localAIhardware.modelOfMyLLM_id + " " + localAIhardware.selectedModelType + " " + localAIhardware.application + " "
                        + localAIhardware.detected_memoryzSize + " " + localAIhardware.manual_memoryzSize + " "
                        + localAIhardware.agent_device_os.length() + " " + localAIhardware.agent_device_os + " "
                        + localAIhardware.baseline_features;
          */
        const pos2 = key.indexOf(' ')
        const pos3 = key.indexOf(' ', pos2 + 1)
        const pos4 = key.indexOf(' ', pos3 + 1)
        const pos5 = key.indexOf(' ', pos4 + 1)
        const pos6 = key.indexOf(' ', pos5 + 1)
        const pos7 = key.indexOf(' ', pos6 + 1)
        const pos8 = key.indexOf(' ', pos7 + 1)
        llmmodelTypeToMinMax.llmID = key.slice(0, pos2)
        llmmodelTypeToMinMax.modelID = key.slice(pos2 + 1, pos3)
        llmmodelTypeToMinMax.type = key.slice(pos3 + 1, pos4)
        llmmodelTypeToMinMax.application = key.slice(pos4 + 1, pos5)
        llmmodelTypeToMinMax.detected_memorySize  = parseInt(key.slice(pos5 + 1, pos6))
        llmmodelTypeToMinMax.manual_memoryzSize  = parseInt(key.slice(pos6 + 1, pos7))
        numChars = parseInt(key.slice(pos7 + 1, pos8))
        llmmodelTypeToMinMax.agent_device_os_STRING = key.slice(pos8 + 1, pos8 + 1 + numChars)
        llmmodelTypeToMinMax.agent_device_os = JSON.parse(llmmodelTypeToMinMax.agent_device_os_STRING)
        llmmodelTypeToMinMax.baseline_features = key.slice(pos8 + 1 + numChars)

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minDatetime = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxDatetime = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageLoadingDuration_0 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minLoadingDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxLoadingDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageLoadingDuration_1 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minLoadingDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxLoadingDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageProcessingDuration_0 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minProcessingDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxProcessingDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageProcessingDuration_1 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minProcessingDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxProcessingDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageFirstCharDuration_0 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minFirstCharDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxFirstCharDuration_0 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;

        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.averageFirstCharDuration_1 = parseFloat(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.minFirstCharDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;
        pos = line.indexOf(",", lastPos); llmmodelTypeToMinMax.maxFirstCharDuration_1 = parseInt(line.slice(lastPos, pos)); lastPos = pos + 1;


        set_localAIhardware_dataGrid.add(llmmodelTypeToMinMax)

  }
}
//--------------------------------------------------------------
class MyLLMroot
{
    static mapIDtoMyLLMs = new Map()
    static mapNameToMyLLMs = new Map()
    static mapMyLLMs = new Map()
    static mapMyLocalLLMs = new Map()
    static mapMyCloudLLMs = new Map()

    static STATE_AVAILABILITY_GOOD = 0
    static STATE_AVAILABILITY_READY = 1
    static STATE_AVAILABILITY_AVAILABLE = 2
    static STATE_AVAILABILITY_UNAVAILABLE = 3
    static LLMreadinessStates = ["good", "ready", "available", "unavailable"]
    static LLMreadinessStateBKcolors = ["#fff", "#dfd", "#ffc", "#fdd"]

    static initialized = false

    static activeLLM
    static activeModelOfLLM


    static mapUUIDtoChatPlaces_obj = new Map()
    static showLLmsUnderConstruction = 0 //0 use     1 under construction

    name = "LLM root"
    image = ""
    selectedModel = ""
    underConstruction = true
    active = false
    availability = MyLLMroot.STATE_AVAILABILITY_UNAVAILABLE //unavailable

    constructor(uniqueID, name, imageURL, siteURL = "https://aimagazine.com/articles/top-10-ai-cloud-platforms")
    {
        this.uniqueID = uniqueID
        this.name = name
        this.image = cdniverse + imageURL
        this.siteURL = siteURL
        this.costPerMillionTokenIn = 10
        this.costPerMillionTokenOut = 10
        MyLLMroot.mapNameToMyLLMs.set(this.name, this)
        MyLLMroot.mapIDtoMyLLMs.set(uniqueID, this)
        MyLLMroot.mapMyLLMs.set(this.name, this)
        this.models = new Map()

    }
 //----------------------------------------
    static initialize() {
        if (MyLLMroot.initialized)
            return
        MyLLMroot.initialized = true
        new MyWebLLM()
        new MyTransformersJS()
        new MyMediaPipe()
        new MyChromeBuiltInAI()
        new MyAppleIntelligence()
        new MyTensorFlowJS()
        new MyONNX()

        new MyChatGPT_key()
        new MyGemini_key()
//CORS policy ERRORS
        new MyPerplexity_key()
        new MyAnthropic_key()
        new MyGroq_key()

        new ModelNameLLM(ModelOfMyLLMroot.MODEL_META, "Meta", "llama-meta.webp")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_DEEPSEEK, "High-Flyer", "deepseek-blue-logo-symbol-25654.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_QWEN, "Alibaba Cloud", "Qwen_logo.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_GEMMA, "Google Deepmind", "gemma-seeklogo.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_SONAR, "Perplexity", "sonar_by_perplexity.png")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_CLAUDE, "Anthropic", "claude-ai-icon.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_GPT, "OpenAI", "chatgpt-6.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_LIQUID, "Liquid AI", "liquid.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_GEMINI, "Gemini", "google-gemini-icon.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_APPLE_FM, "Apple FM", "Apple_Intelligence.svg")
        new ModelNameLLM(ModelOfMyLLMroot.MODEL_XENOVA, "Xenova", "xenova.png")

    ModelType.modelTypeAll = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_ALL, "", false)
    ModelType.modelTypeChat = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_CHAT, "chat", false)
    ModelType.modelTypeSummary = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_SUMMARY, "summarizing", true, 1, 1, 2)
    ModelType.modelTypeTranslator = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR, "translator", true, 1, 1, 1)
    ModelType.modelTypeImageRecognition = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_IMAGE_RECOGNITION, "image recognition", true, 1, 1, 2)
    ModelType.modelTypeImageGeneration = new ModelType(ModelOfMyLLMroot.MODEL_TYPE_IMAGE_GENERATION, "image generation", false)

    }

//---------------------------------------
static replacePromptBy_infoWithObjectsInPlace_objects(type = ModelOfMyLLMroot.selectedModelType, prompt, systemContent, infoWithObjectsInPlace)
{

         let first = true
         if(infoWithObjectsInPlace)
         for(let obj3d of infoWithObjectsInPlace.objects)
           if(obj3d.textDocument)
           {
              if(first)
              {
                  first = false
                  systemContent = MyLLMroot.systemContentForSelectedType(type)
                  prompt = ""
              }
              else
                prompt += "\n\n"
             prompt +=  obj3d.textDocument
         }

    if(systemContent === undefined)
        systemContent = MyLLMroot.systemContentForSelectedType(type)

    return {prompt: prompt, systemContent: systemContent};
}
//---------------------------------------
    addModelsFromArray(arr) {
        for (let modelOfLLM of arr) {
            if (!this.selectedModel)
                this.selectedModel = modelOfLLM
            this.addModel(modelOfLLM.id, modelOfLLM)
        }
    }

//---------------------------------------
    addModel(modelID, modelInfo) {
        this.models.set(modelID, modelInfo)
    }

//----------------------------------------
    modelSelectHTML() {
        let s = "<select onChange='MyLLMroot.command(\"SET_MODEL\", \"" + this.name + "\", this.value)''>"
        for (let [id, model] of this.models)
            s += "<option value='" + model.id + "'" + (model.id == this.selectedModel ? "selected" : "") + ">" + model.name + "</option>"
        s += "</select>"
        return s
    }
//----------------------------------------------------------------
    numModelsOfLLMwithType(type, modelOfMyLLM)
    {
        const llm = this
        let num = 0
        for (let [name, model] of llm.models)
          if(!modelOfMyLLM || model.family === modelOfMyLLM.name)
            if (type === ModelOfMyLLMroot.MODEL_TYPE_ALL
                || model.type.indexOf(type) !== -1
            )
        num++
        return num
    }
    //----------------------------------------
    numModelsOfLLM(modelOfMyLLM) {
        let num = 0
        for (let [name, model] of this.models)
            if (model.family === modelOfMyLLM.name)
                num++
        return num
    }
//----------------------------------------
    modelsOfLLMwithName(modelOfMyLLM_name, type) {
        let arr = []
        for (let [name, model] of this.models)
            if (model.family === modelOfMyLLM_name)
               if(!type || type === ModelOfMyLLMroot.MODEL_TYPE_ALL
                 || model.type.indexOf(type) !== -1
                    )
                arr.push(model)
        return arr
    }
//----------------------------------------
    localORcloudORsharedAIicon(height = "30px") {
        if (this instanceof MyLocalLLMroot)
            return MyLLMroot.localAIicon(height)
        else if (this instanceof MyCloudLLMroot)
            return MyLLMroot.cloudAIicon(height)
        else if (this instanceof MySharedLLMroot)
            return MyLLMroot.sharedAIicon(height)
    }
//---------------------------------------------------------------
    static localAIicon(height = "30px") {
        return "<img src='" + cdniverse + "ChatPlaces/LocalAI.svg' style='height:" + height + "'>"
    }

//---------------------------------------------------------------
    static cloudAIicon(height = "30px") {
        return "<img src='" + cdniverse + "ChatPlaces/CloudAI.svg' style='height:" + height + "'>"
    }

//---------------------------------------------------------------
    static sharedAIicon(height = "30px") {
        return "<img src='" + cdniverse + "ChatPlaces/SharedAI.svg' style='height:" + height + "'>"
    }
//--------------------------------------------------------------------------------------------------------
    addToBackgroundImage() {
        return ""
    }
//----------------------------------------
    icon(height = "30px") {
        return "<img src='" + this.image + "' style='height:" + height + "' title='" + this.name + "'>"
    }
//-------------------------------------------------------------------
static promptForSelectedType()
{
    switch(ModelOfMyLLMroot.selectedModelType)
    {
        case ModelOfMyLLMroot.MODEL_TYPE_SUMMARY: return "summarize"
        case ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR: return "translate"
        default: return "prompt"

    }

}
//-------------------------------------------------------------------
static systemContentForSelectedType(type = ModelOfMyLLMroot.selectedModelType)
{
    switch(type)
    {
        case ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR:
            return "You are a professional translator. Translate from English to Spanish. "
                    +"Do not explain, do not add notes. Keep meaning, tone, and formatting."
        case ModelOfMyLLMroot.MODEL_TYPE_SUMMARY:
            return "Summarize the user's text in a concise paragraph. Preserve key facts and tone."
        default:
            return "You are a helpful assistant"
    }
}
//-------------------------------------------------------------------
static dataForSelectedType()
{
    switch(ModelOfMyLLMroot.selectedModelType)
    {
        case ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR: //to spanish
        case ModelOfMyLLMroot.MODEL_TYPE_SUMMARY: return `
The Meridian Project: A Comprehensive Fictional Case Study for Summarization Tests
Executive Summary

The Meridian Project was a two-year initiative (January 2023–December 2024) to design, build, and launch a cross-platform knowledge engine that unified personal notes, enterprise documents, and real-time web signals into a single searchable graph. The team pursued three objectives: (1) achieve sub-200ms query latency for complex semantic searches; (2) obtain 25% adoption among pilot customers within six months of launch; and (3) meet EU/US data residency and privacy constraints without degrading performance. The program delivered a mixed outcome. Objective (1) was met in controlled conditions (median 176ms across three regions) but not consistently under real traffic (p95 420ms during peak). Objective (2) fell short at 12% adoption despite positive qualitative feedback, largely due to onboarding friction and unclear pricing. Objective (3) was met with caveats: compliance audits passed, but certain analytics features were disabled in the EU region, reducing product value there.

This document compiles the project narrative, architecture notes, experiments, stakeholder interviews, financials, and a postmortem timeline. It is intentionally verbose and redundant in places to stress-test summarizers. You’ll find repeated concepts expressed in multiple ways, overlapping section summaries, and varied writing styles—analytical, narrative, bullet-pointed, and dialogic.

Background and Problem Statement

Knowledge workers face three persistent issues:

Fragmentation: Content is scattered across emails, chat logs, cloud drives, issue trackers, and wikis.

Latency of insight: Even when indexed, relationships between items (e.g., “which customer complaints correlate with a specific release?”) require time-consuming manual joins.

Compliance friction: Organizations with cross-border operations must respect regional data boundaries while preserving collaboration.

The Meridian Project proposed a “center of truth” that combines symbolic metadata (file types, authors, timestamps), vector embeddings (semantic similarity), and a temporal graph (who saw what, when) to power queries like: “Show me docs related to Q3 churn that were cited by Sales within 48 hours of a product incident and summarize root causes.”

The bet was simple: if the system could answer messy, cross-tool questions fast and privately, teams would accept small workflow changes in exchange for big clarity gains.

Scope and Non-Goals

In scope: ingestion connectors, vectorization pipeline, a query planner that blends lexical+vector retrieval, a governance layer (residency, retention, redaction), and three user surfaces (search bar, briefing digest, API).
Out of scope: authoring tools (no WYSIWYG editor), email client replacement, or becoming a general analytics platform. The team frequently revisited these boundaries; some engineers advocated for a light authoring feature, but it was deferred to preserve focus.

Stakeholders and Roles

Elena Varga (Program Lead): Balanced product strategy with partner negotiations.

Harish Nair (Chief Architect): Owned the retrieval and ranking stack.

Marta Silva (Security & Compliance): Drove DPIA, SOC 2 controls, and audit prep.

Daniel Cho (Growth): Led pricing experiments and onboarding funnels.

Regional Advisors: EU (Berlin), US (Austin), APAC (Singapore).

Pilot Customers: Five mid-market firms (legal tech, biotech, SaaS, fintech, media).

Board Liaison: Provided quarterly oversight, pressed for earlier monetization.

Architecture Overview (High Level)

Ingest Layer

37 connectors (Google Drive, OneDrive, Slack, Jira, Confluence, Notion, GitHub, Zendesk, Box, and custom S3).

Change Data Capture polling every 2–15 minutes with backoff.

Normalization to a canonical document model with immutable content hashes.

Processing & Vectorization

Text extraction via pluggable parsers (PDF, DOCX, HTML, MD).

Embeddings generated using a hybrid setup (general semantic, domain-tuned collections).

Document shards include both sparse terms (BM25) and dense embeddings (768-dim).

PII detectors annotate entities (names, emails, IDs) for downstream masking.

Graph Store

Directed temporal edges: references, edits, views, citations with timestamps.

Region-scoped subgraphs to enforce residency by tenancy and data category.

Incremental compaction to speed neighbor expansion queries.

Query & Ranking

Planner fuses lexical scores, vector similarity, and graph proximity.

Re-ranking uses lightweight cross-encoders for top-k candidates.

Caching includes result set digests keyed on query intent signatures.

Governance & Residency

Data tagged as EU, US, or GLOBAL; default is inherit from source system.

Redaction policies applied at render time, with audit trails for every override.

“Explainability” view shows why an item appeared in results.

Surfaces

Search: single bar with operators (e.g., region:EU before:2024-06-01 topic:"churn").

Briefing Digest: adaptive weekday summary with at most seven items.

API: GraphQL with per-field residency checks.

Performance Targets and Results

Target: p50 < 200ms, p90 < 350ms, p99 < 800ms for cross-region semantic queries up to 10k token corpus slices.

Reality (launch month):

p50 ~ 176ms (US), 192ms (EU), 209ms (APAC).

p95 ~ 420ms (US spikes tied to connector bursts).

p99 occasionally > 1.2s when graph expansion added three or more hops.

Three mitigations helped: (a) early exit for low-entropy queries, (b) vector cache warming for popular embeddings, (c) adaptive k in re-ranking based on observed query ambiguity.

Privacy and Compliance Outcomes

Passed SOC 2 Type I (Sep 2024) and Type II (Dec 2024) with minor corrective actions.

DPIA completed for EU pilots; largest risk flagged: secondary use of metadata for model tuning. Meridian disabled cross-tenant tuning and switched to synthetic data for relevance trials in EU.

DSAR tooling delivered (search, export, delete) within 30 days SLA; median completion 6 days.

Limitation: The EU deployment lacked usage analytics at the event-level granularity, complicating product iteration.

User Research Highlights

Recruitment: 41 knowledge workers (PMs, legal analysts, support managers, research scientists).
Findings (qualitative):

Users loved instant “why is this result here?” explanations; it built trust.

The onboarding wizard was too long (13 steps) and used jargon (vectorizer, shard, residency).

The digest email was either “perfect” or “noise” depending on role; customization helped.

Pricing confusion: seat-based vs document-indexed pricing led to anxiety about “hidden costs.”

The biggest wow-moment: answering questions that spanned tools (e.g., Slack + Jira + Google Docs).

Top requested features:

Inline editing or commenting without opening the source app.

Near-duplicate clustering to reduce result fatigue.

“Confidence bands” for summaries (low/medium/high) with toggles to show evidence.

Pricing Experiments

A/B Test A (May 2024): $39/seat vs $19/seat + $5/1k docs indexed.

Conversion: 3.1% vs 5.7% respectively.

Churn at 60 days: 14% (flat) vs 22% (usage-linked anxiety).

A/B Test B (Aug 2024): Usage-based query credits vs unlimited queries + limited connectors.

Teams preferred unlimited queries; connector caps triggered admin frustration.

Final pilot pricing: $25/seat, unlimited queries, 5 connectors included, $4 per extra connector.

Conclusion: Simplicity beats theoretical fairness. Admins will overpay modestly to avoid budgeting mental overhead.

Security Incidents and Responses

April 12, 2024: A staging misconfiguration allowed an internal service account to read a sanitized EU dataset from a US bucket for 22 minutes. No customer data exfiltration; auditors notified. Automated region-locks were hardened with deny-by-default IAM policies and Terraform guardrails.

October 3, 2024: Connector for a legacy wiki leaked page titles (not content) to activity logs without hashing. Patched in 4 hours; retroactive scrubbing performed. Users received a clear impact statement and a toggle to disable title logging per connector.

Experiments Worth Noting

Edge Summarization (Failed Initially): Running small summarizers at the CDN edge cut latency but introduced inconsistency vs central models. A later iteration pinned model versions per tenant to stabilize outputs.

Multi-Vector Indexing (Mixed): Maintaining separate embedding spaces for task-specific intents (definition, how-to, decision) improved relevance in legal tech but confused ranking in SaaS support.

Local-Only Mode (EU): A mode that forbid any cross-region metadata worked, but the lack of cross-tenant learning reduced recommendation quality by ~8–12% MAP@10.

Human-in-the-Loop Labels: Light feedback UI for “useful / not useful / misleading” drove a 3.4-point DCG gain over six weeks when applied to re-ranking weights.

Timeline of Major Events (Condensed)

2023-01: Kickoff; architecture RFC #000 introduced hybrid retrieval plan.

2023-03: First connectors live; p95 latency 1.8s; morale high.

2023-06: Graph prototype lands; edges explode in cardinality; compaction becomes priority.

2023-09: First EU tenant; residency tags propagate end-to-end.

2023-12: Beta search shipped to five pilot teams; docs explainability view added.

2024-02: Digest feature adopted by two pilots; early positive feedback.

2024-04: Staging region incident; policies tightened.

2024-06: Pricing experiments start; connector-cap model rejected.

2024-09: SOC 2 Type I pass; data mapping catalog published.

2024-12: General Availability; adoption under goal at 12%; board pushes for sharper positioning.

Technical Deep Dive: Query Execution Walkthrough

Example query: “customer churn in Q3 cited by sales within 48h of an incident”

Parsing: Identify entities: customer churn (concept), Q3 (time window), cited by sales (actor), within 48h (temporal constraint), incident (event class).

Candidate Retrieval:

Lexical: BM25 gets 2,400 docs with “churn”, “retention”, “lost accounts”.

Dense: Vector index pulls top-k 1,200 semantically related items.

Union produces 2,860 candidates.

Graph Filter: Expand incidents → edges → sales citations; constrain to 48h window. Keep 316 items.

Re-Ranking: Cross-encoder scores top 128; final list trimmed to 20 with diversity penalties to avoid near duplicates.

Policy Application: EU tenant; three items redacted (PII in appendices).

Response Packaging: Explanations attach mini-graphs indicating path: incident → postmortem → sales deck.

Median latency: 196ms (cache warm), 382ms (cold).

Onboarding Funnel Metrics (First 60 Days Post-Launch)

Landing → Start Trial: 9.4%

Start Trial → Add First Connector: 71%

Add Connector → Finish Wizard: 46%

Finish Wizard → First Query: 88%

First Query → Repeat Queries (Day 3): 54%

Repeat Queries → Invite Teammate: 27%

Trial → Pay: 12%

Drop-off analysis: The 13-step wizard accounted for most friction. Reducing it to eight steps, removing jargon, and auto-detecting recommended connectors improved “Finish Wizard” by 14 points in a later cohort.

Internal Debates (Selected Excerpts)

Harish: “If we add inline editing, we risk a slippery slope toward being a document system.”
Elena: “Editing isn’t authorship; it’s a way to act on insights. Let’s scope to comments + tags.”
Marta: “Residency rules don’t break just because we add comments. But we must tag them precisely.”
Daniel: “Customers pay for outcomes. If editing increases perceived value, pricing can hold.”

Engineer A: “Multiple embedding spaces complicate maintenance.”
Engineer B: “But they mirror user intent better. One size fits all is why relevance dips.”

Competitive Landscape (As Assessed Mid-2024)

Incumbent A: Exceptional enterprise security certifications, slower iteration cadence, complex pricing.

Upstart B: Slick UI, limited governance, fast onboarding.

Horizontal Platform C: Offers a basic search that’s “good enough” for non-regulated teams.

Meridian’s wedge was “explainable results + governance.” The risk: that “good enough” would beat “great but nuanced” if friction remained high.

Financials (Illustrative)

R&D Spend (2023): $3.1M; (2024): $4.0M

Cloud & Tooling: $860k (compute heavy vector ops, cross-region replication).

Sales & Marketing: $1.2M (content, pilots, events).

ARR at 2024 Year-End: $1.05M across 58 paying customers.

Gross Margin: 68% (goal was 75%); vector store egress and re-ranking costs overran budget.

Unit economics improved when embeddings were cached and long-tail connectors were moved to on-demand ingestion.

Postmortem: What Worked

Explainability: The “why is this here?” view increased trust and reduced support tickets by 23%.

Residency-First Design: Winning deals in regulated industries required this from day one.

Hybrid Retrieval: Combining lexical, dense, and graph signals outperformed any single approach.

Postmortem: What Didn’t

Onboarding Complexity: Technical metaphors leaked into the UI and made users feel underqualified.

Pricing Anxiety: Document-indexed pricing punished heavy knowledge teams psychologically, even when total cost was similar.

EU Feature Parity: Turning off granular analytics for compliance reduced the perception of product momentum.

Recommendations (Next 12 Months)

UX: Collapse the wizard to four screens; default to recommended connectors; postpone advanced knobs.

Pricing: Keep $25/seat, include 10 connectors, and sell storage expansions in clean tiers.

Relevance: Adopt per-tenant vector cache warming and sparse-term boost tuning.

Governance: Invest in in-product, human-readable policy explainers (not just JSON logs).

Expansion: Target legal tech and biotech first; both valued traceability and audit trails.

Feature Gate: Implement inline comments and tags, not full editing; measure lift in retention.

Customer Vignettes (Fictionalized)

BiotechCo: Researchers were drowning in Slack threads linking to papers, internal protocols, and Salesforce notes. Meridian’s digest highlighted the three most cited documents after each release. Outcome: faster literature reviews; friction: no inline annotations.

FinServe: Compliance officers liked the evidence trails but balked at connector caps. A pilot turned into a paid plan after unlimited queries were confirmed.

MediaHouse: Editors asked for near-duplicate clustering to avoid seeing twenty versions of the same pitch deck. Once added, satisfaction rose, but API limits on their CMS integration caused throttling.

Glossary (Selected Terms)

Residency: The geographic location where data is stored and processed.

DSAR: Data Subject Access Request; user asks to see or delete their data.

Re-ranking: Rescoring top candidates using a more expensive model.

Explainability View: UI that shows features and edges that elevated a result.

Vector Cache Warming: Precomputing nearest neighbors for frequent intents.

Frequently Asked Questions

Q: Why not build an editor?
A: Scope control. Comments/tags deliver actionability without competing with authoring tools.

Q: Can I confine everything to the EU?
A: Yes, with feature trade-offs: fewer analytics and slower cross-team recommendations.

Q: What happens if two connectors disagree about a document’s residency?
A: The strictest rule wins; conflicts trigger an admin alert and block cross-region propagation.

Q: Does Meridian “learn” from my data?
A: Only within your tenant, and only with explicit opt-in; otherwise synthetic data powers relevance trials.

Sample Changelog (Abbreviated)

v0.9.11 (2024-09-14): Added per-connector encryption keys; fixed Jira pagination bug.

v1.0.0 (2024-12-02): GA release; improved explainability with visual edge paths; reduced cold-start latency by 17%.

v1.0.3 (2025-01-20): Enabled comment threads (tenant opt-in); added near-duplicate clusters in search results.

Contradictory Summaries (Deliberately Included)

Short Take #1: Meridian nailed performance but failed market fit due to pricing complexity.

Short Take #2: Meridian underperformed on performance at high percentiles; users still loved it, but compliance limitations in the EU capped growth.

Short Take #3: Success hinged on explainability; everything else was table stakes.

These three takes can’t all be true simultaneously but each has supporting evidence somewhere in this dossier—useful for testing how a summarizer reconciles conflicting narratives.

Representative Data Row (Synthetic)
tenant_id: EU-3491
query_text: "churn sources after incident 2024 Q3"
time_window: "2024-07-01..2024-09-30"
candidates_lexical: 2400
candidates_vector: 1200
candidates_union: 2860
graph_neighbors_considered: 9134
final_results: 20
latency_ms: { p50: 198, p90: 332, p99: 874 }
redactions_applied: 3
digest_clicked: true

Dialogue Snippet (Fictional)

PM: “Why did the doc about renewals show up in a query about churn?”
System: “Because it cited an incident postmortem within 36 hours and used semantically similar phrases (‘lost accounts’, ‘defection risk’).”
PM: “Can I suppress near duplicates?”
System: “Yes. Toggle ‘cluster similar’ in settings. Current cluster size estimate: 7 documents.”
PM: “Show me only EU-resident items.”
System: “Applied. Three results removed due to residency constraints. Click to view policy trail.”

Risk Register (Excerpt)

R-01 Model Drift: Relevance degrades if embeddings change silently. Mitigation: pin versions per tenant; scheduled evals.

R-02 Connector API Limits: Throttling degrades ingest freshness. Mitigation: adaptive polling and backoff.

R-03 Residency Conflicts: Data tagged inconsistently across sources. Mitigation: strictest-wins + admin alerts.

R-04 Perception of Surveillance: Users worry about activity edges. Mitigation: private edges by default; opt-in sharing.

R-05 Cost Overrun: Dense index growth outpaces revenue. Mitigation: tiered storage and eviction policies.

Redundant Mini-Summary #1

Meridian attempted to unify scattered knowledge into a fast, explainable search. It succeeded technically in median latency and compliance, struggled with p95 spikes, and lost momentum due to onboarding and pricing complexity. Governance was a differentiator; EU parity remained a challenge.

Redundant Mini-Summary #2

A hybrid of lexical, vector, and graph signals powered queries that spanned tools. Users trusted the system but disliked the setup overhead. When pricing was simplified and near-duplicate clustering enabled, engagement improved, especially for legal tech and biotech teams.

Redundant Mini-Summary #3

What mattered most: clarity (explainability), speed under load, and frictionless onboarding. Meridian hit two partially and missed one decisively.

Appendix A: Sample Operator Cheatsheet

region:EU — restrict to EU-resident items.

before:2024-07-01 — filter documents before date.

actor:"sales" — limit to items created or cited by Sales.

"churn" ~2 "incident" — phrase proximity search.

type:deck OR type:doc — restrict by document type.

cited_within:48h(incident) — temporal relation operator.

Appendix B: Synthetic Email Digest Example

Subject: Your Meridian Briefing — Thursday, October 24
1. Incident Postmortem Summary (EU)

Key causes: misconfigured health checks, delayed alerting.

Related: “Q3 churn review” (cited 4× by Sales within 48h).
2. Renewal Forecast Notes

Top accounts at risk: Minora (score 0.71), Lasker (0.65).
3. Product Pulse

Release 1.0.3 improved cold-start by 17%.
4. Open Questions

Should EU tenants opt into comment analytics? (default NO)

Appendix C: Customer Objections and Responses

“We can’t index legal documents due to confidentiality.”
Response: Fine-grained scopes; selective indexing; on-prem connector supports vaults.

“Your seat count is unclear with contractors.”
Response: Free viewer seats; pay only for creators and admins.

“What if the summarizer makes mistakes?”
Response: Confidence labels and evidence links; require two clicks to share externally.

Final Reflection

If Meridian proved anything, it’s that trust and clarity define whether knowledge systems stick. Performance wins demos, governance wins deals, and onboarding wins hearts. When those three align—speed, safety, simplicity—the rest follows. When even one is misaligned, the story gets complicated, and complicated stories are hard to sell, even when they’re true.
        `
        default: return ""
    }
}
//-------------------------------------------------------------------
static async calculateTimes()
{
    document.getElementById("loadingDuration_" + firstOrSecond).innerHTML = "waiting..."
    document.getElementById("firstCharDuration_" + firstOrSecond).innerHTML = "waiting..."
    document.getElementById("processingDuration_" + firstOrSecond).innerHTML = "waiting..."

    textAreaProcessing = document.getElementById("textResponse")
    textAreaProcessing.innerHTML = "processing..."
    textAreaProcessing.style.display = ""

    let prompt = this.promptForSelectedType()
    let data = this.dataForSelectedType()
    firstCharTime = 0

    llm_selected.responseStreaming = MyLLMroot.streamingResponses

    const timeInitial = new Date().getTime()
    llm_selected.selectedModel = model_selected
    await MyLLMroot.makeThisLLMactive(llm_selected, ModelOfMyLLMroot.selectedModelType)
    const timeMakeActive = new Date().getTime()
    const infoWithObjectsInPlace = {objects: [{textDocument: data}]}
    let text = await llm_selected.test(prompt, ModelOfMyLLMroot.selectedModelType, chatPlaces_obj, infoWithObjectsInPlace, {})
    textAreaProcessing.innerHTML = text

    const timeProcessing = new Date().getTime()

    loadingDuration[firstOrSecond] = timeMakeActive - timeInitial

    processingDuration[firstOrSecond] = timeProcessing - timeMakeActive
    firstCharDuration[firstOrSecond] = firstCharTime ? firstCharTime - timeMakeActive : processingDuration[firstOrSecond]

    document.getElementById("loadingDuration_" + firstOrSecond).innerHTML = loadingDuration[firstOrSecond].toFixed(1) + " ms"
    document.getElementById("firstCharDuration_" + firstOrSecond).innerHTML = firstCharDuration[firstOrSecond].toFixed(1) + " ms"
    document.getElementById("processingDuration_" + firstOrSecond).innerHTML = processingDuration[firstOrSecond].toFixed(1) + " ms"

    if(firstOrSecond === 0)
    {
        firstOrSecond = 1
        document.getElementById("button_calculate_first_second").innerHTML = "calculate second"
    }
    else
    {
      const b1 = document.getElementById("button_calculate_first_second")
      b1.style.backgroundColor = ""
      b1.style.color = ""
      const b2 = document.getElementById("button_post_data_to_server")
      b2.style.backgroundColor = "green"
      b2.style.color = "white"
    }
}
//----------------------------------------
static calculate_llmID_modelName(llm_uniqueID, modelOfMyLLM_name)
{
    firstOrSecond = 0

    const llm = MyLLMroot.mapIDtoMyLLMs.get(llm_uniqueID)
    const arrayOfModels = llm.modelsOfLLMwithName(modelOfMyLLM_name, ModelOfMyLLMroot.selectedModelType)
    if(arrayOfModels.length === 0)
        alert("no models of llm")
    else if(arrayOfModels.length === 1)
            LocalAIhardware.MyLLMroot.calculateMenu_llm_model(llm_uniqueID, arrayOfModels[0].id, ModelOfMyLLMroot.selectedModelType)
    else
    {
        let s = "<table><tr><th colspan='2'>choose model</th></tr>"
        for(let modelOfMyLLM of arrayOfModels)
            s += "<tr onClick='LocalAIhardware.MyLLMroot.calculateMenu_llm_model(\""+llm_uniqueID+"\",\"" + modelOfMyLLM.id + "\")' style='cursor:pointer'>"
                + "<td>" + modelOfMyLLM.icon("20px") + "</td>"
                + "<td style='text-align:left'>" + modelOfMyLLM.name + "</td>"
                + "</tr>"
        s += "</table>"
        showPopoverWithContent(s)
    }
}
//----------------------------------------
static async calculateMenu_llm_model(llm_uniqueID, modelOfMyLLM_id, type = ModelOfMyLLMroot.selectedModelType, justReturnString)
{

if(type)
    ModelOfMyLLMroot.selectedModelType = type
else
   type = ModelOfMyLLMroot.selectedModelType

if(type === ModelOfMyLLMroot.MODEL_TYPE_ALL)
    return alert("choose a function (chat, summary, ...)")

if(BaseLineFeatures.calculateOnUniqueTab && !justReturnString)
  return window.open((document.location.hostname === "localhost"
            ?  document.location.origin + "/localAIhardware/index.html"
            : "https://localaihardware.com")
        + "?laih_uuid=" + crypto.randomUUID().replaceAll("-", "")
        + "&llmID=" + encodeURIComponent(llm_uniqueID)
        + "&modelID=" + encodeURIComponent(modelOfMyLLM_id)
        + "&type=" + encodeURIComponent(type)
    , '_blank').focus()

const result = await navigator.storage.estimate()
const memorySizeForOriginPrivateFileSystem = result.quota

MyLLMroot.activeLLM?.releaseMemory()
MyLLMroot.activeLLM = undefined

llm_selected = MyLLMroot.mapIDtoMyLLMs.get(llm_uniqueID)
model_selected = llm_selected.models.get(modelOfMyLLM_id)

let s = "<table><tr><th rowspan='2' style='width:1px'>" + llm_selected.icon() + "</th><th style='text-align:left'>"+ llm_selected.name +"</th><th>&nbsp;+&nbsp;</th><th style='text-align:right'>" + model_selected.name + "</th><th rowspan='2' style='width:1px'>" + model_selected.icon("30px") + "</th></tr>"
                + "<tr><td colspan='3' style='color:green'>operation = <b>" + ModelOfMyLLMroot.selectedModelType + "</b></td></tr>"
                + "</table>"

    last_baselineFeaturesAvailableToText = baselineFeaturesAvailableToText()
    if(!last_agent_device_os)
        BaseLineFeatures.get_agent_device_os()

    s += "<center><table>"
       + "<tr>"

       + "<td>Memory</td><td> <input type='number' disabled value='"+navigator.deviceMemory+"' style='width:40px' title='aproximated to avoid device fingerprinting'> GBytes</td></tr>"
       + "<tr><td>manual</td><td><input id='input_localAIhardware_manualMemorySize' type='number' style='width:40px' value='"+manual_memoryzSize+"' "+ (manual_memoryzSize === 0 ? "" : "disabled") +" > GBytes</td></tr>"
       + "<tr><td>Disk</td><td>"+formatBytes(memorySizeForOriginPrivateFileSystem)+"</td></tr>"
      + "<tr><td>Application</td><td><input id='input_localAIhardware_application' type='text' disabled value='" + (BaseLineFeatures.calculateOnUniqueTab ? "none" : document.location.hostname) + "' style='width:100px'></td></tr>"

       + "<td colspan=4>Browser Baseline Features<br><textarea style='width:300px;height:100px' disabled>" + last_baselineFeaturesAvailableToText +"</textarea></td></tr>"
       + "<tr><td colspan=4>Agent + Device + Operating System<br><textarea id='textarea_agent_device_os' style='width:300px;height:100px' disabled>" + last_agent_device_os_STRING +"</textarea></td></tr>"
       + "<tr><th>timing</th><th>first</th><th>second</th><th>&nbsp;</th></tr>"
       + "<tr><td>Loading</td><td id='loadingDuration_0' style='text-align:right'>"+ (firstOrSecond === 0 ? "no data" : loadingDuration[0].toFixed(1) + " ms") +"</td><td id='loadingDuration_1' style='text-align:right'>no data</td><td>&nbsp;</td></tr>"
       + "<tr><td>First char received</td><td id='firstCharDuration_0' style='text-align:right'>"+ (firstOrSecond === 0 ? "no data" : firstCharDuration[0].toFixed(1) + " ms") +"</td><td id='firstCharDuration_1' style='text-align:right'>no data</td><td>&nbsp;</td></tr>"
       + "<tr><td>Last char received</td><td id='processingDuration_0' style='text-align:right'>"+ (firstOrSecond === 0 ? "no data" : processingDuration[0].toFixed(1) + " ms") +"</td><td id='processingDuration_1' style='text-align:right'>no data</td><td>&nbsp;</td></tr>"
       + "</table>"
       + "<br>"
       + "<button id='button_calculate_first_second' onClick='MyLLMroot.calculateTimes(\"" + llm_uniqueID + "\",\"" + modelOfMyLLM_id + "\")' style='margin-bottom:6px;color:white;background-color:green'>" + TLtranslateFromTo(firstOrSecond == 0 ? "calculate first" : "calculate second") +"</button>"
       + " &nbsp; <button id='button_post_data_to_server' onCLick='BaseLineFeatures.postDataToServer()' style='margin-bottom:6px'>" + TLtranslateFromTo("post local AI Hardware data") +"</button>"
       + "<br><textarea id='textResponse' disabled style='display:none;width:350px;height:100px'></textarea>"
       + "</center>"

if(justReturnString)
    return s

showPopoverWithContent(s)

}
//----------------------------------------
static async calculateMenu_llm_model_OLD(llm_uniqueID, modelOfMyLLM_id)
{

const result = await navigator.storage.estimate()
const memorySizeForOriginPrivateFileSystem = result.quota

const llm = MyLLMroot.mapIDtoMyLLMs.get(llm_uniqueID)
const model = llm.models.get(modelOfMyLLM_id)

let s = "<table style='width:100%'><tr><th style='width:1px'>" + llm.icon() + "</th><th style='text-align:left'>"+ llm.name +"</th><th>&nbsp;+&nbsp;</th><th style='text-align:right'>" + model.name + "</th><th style='width:1px'>" + model.icon("30px") + "</th></tr></table>"

    s += "<center><table>"
       + "<tr><td>Memory</td><td> <input type='number' disabled value='"+navigator.deviceMemory+"' style='width:40px' title='aproximated to avoid device fingerprinting'> GBytes</td></tr>"
       + "<tr><td>manual</td><td><input type='number' style='width:40px'> GBytes</td></tr>"
       + "<tr><td>Disk</td><td>"+formatBytes(memorySizeForOriginPrivateFileSystem)+"</td></tr>"
       + "<tr><td>Loading first time</td><td>no data</td></tr>"
       + "<tr><td>Loading second time</td><td>no data</td></tr>"
       + "<tr><td>First char received</td><td>no data</td></tr>"
       + "<tr><td>Last char received</td><td>no data</td></tr>"

       + "</table>"
       + "<br>"
       + "<button onClick='calculateTimes(\"" + llm_uniqueID + "\",\"" + modelOfMyLLM_id + "\")' style='margin-bottom:6px'>" + TLtranslateFromTo("calculate") +"</button>"
       + " &nbsp; <button style='margin-bottom:6px'>" + TLtranslateFromTo("post local AI Hardware data") +"</button>"
       + "</center>"
showPopoverWithContent(s)

}
//---------------------------------------
    async checkboxActivate(checkbox, type_name, )
    {

    }
//-------------------------------------------------
    static async makeThisLLMactive(llm, type_name)
    {
        if (MyLLMroot.activeLLM !== llm)
        {
            if (MyLLMroot.activeLLM) //can be null
                MyLLMroot.activeLLM.releaseMemory()
            this.active = true
            MyLLMroot.activeLLM = llm
            await llm.checkboxActivate(undefined, type_name)
        }
    }
//----------------------------------------
    releaseMemory() {

    }
//---------------------------------------------
    getAvailability() {
        return this.availability //in MyCloudLLMroot is calculated
    }
//-------------------------------------------
    rowColor() {
        return MyLLMroot.LLMreadinessStateBKcolors[this.getAvailability()]
    }
//--------------------------------------------------------------------------------------------------------
    updateRowColor() {
        $(".back_ground_color_availability_" + this.uniqueID).css("backgroundColor", this.rowColor())
    }
//-------------------------------------------------
}//class MyLLMroot

//--------------------------------------------------------------------------------------------------------

class MyLocalLLMroot extends MyLLMroot {
    static localLLMs_enabled = true
    static selectedLocalMyLLMname = "WebLLM"

    constructor(uniqueID, name, imageURL, siteURL) {
        super(uniqueID, name, imageURL, siteURL)
        this.availability = MyLLMroot.STATE_AVAILABILITY_READY
        this.uniqueID = uniqueID
        this.responseStreaming = false
        MyLLMroot.mapMyLocalLLMs.set(name, this)
    }
} //class MyLocalLLMroot


//------------------------------------------------------------
class MyWebLLM extends MyLocalLLMroot {
    static myWebLLM
    // https://scribbler.live/2024/10/02/Large-Language-Models-in-the-Browser-with-WebLLM.html
    //     const webllm = await await_import("https://esm.run/@mlc-ai/web-llm")

    constructor() {
        super("ID_WEBLLM", "WebLLM", "AI/WebLLM_logo.jpg")
        MyWebLLM.myWebLLM = this
        this.underConstruction = false
        this.responseStreaming = true

        // read https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L293 and present choices!
        this.addModelsFromArray([
            //  https://huggingface.co/mlc-ai
            new ModelOfMyLLMroot(MyWebLLM.myWebLLM, "Llama-3.2-1B-Instruct-q4f32_1-MLC", "Llama 3.2-1B Instruct", ModelOfMyLLMroot.MODEL_TYPE_CHAT + " " + ModelOfMyLLMroot.MODEL_TYPE_SUMMARY + " " + ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR, ModelOfMyLLMroot.MODEL_META)
            , new ModelOfMyLLMroot(MyWebLLM.myWebLLM, "Llama-3.1-8B-Instruct-q4f32_1-MLC", "Llama 3.1-8B Instruct", ModelOfMyLLMroot.MODEL_TYPE_CHAT + " " + ModelOfMyLLMroot.MODEL_TYPE_SUMMARY + " " + ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR, ModelOfMyLLMroot.MODEL_META)
            , new ModelOfMyLLMroot(MyWebLLM.myWebLLM, "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC", "DeepSeek R1 Distill Qwen 7B", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_DEEPSEEK)
            //, "gemma-2-2b-it-q4f16_1-MLC Gemma2 2B" // VRAM 1895.3
            //, "Qwen2.5-0.5B-Instruct-q4f16_1-MLC QWEN 2.5 0.5B 16 bits" // VRAM 944Mb

            /*, "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC"
            , "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC"
            , "Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC"
            , "Hermes-2-Theta-Llama-3-8B-q4f32_1-MLC"
            , "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC"
            , "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC"
            , "Hermes-3-Llama-3.2-3B-q4f32_1-MLC"
            , "Hermes-3-Llama-3.2-3B-q4f16_1-MLC"
            , "Hermes-3-Llama-3.1-8B-q4f32_1-MLC"
            , "Hermes-3-Llama-3.1-8B-q4f16_1-MLC"
            , "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC"
            , "Phi-3.5-mini-instruct-q4f16_1-MLC"
            , "Phi-3.5-mini-instruct-q4f32_1-MLC"
            , "Phi-3.5-mini-instruct-q4f32_1-MLC-1k"
            , "Phi-3.5-vision-instruct-q4f16_1-MLC"
            , "Mistral-7B-Instruct-v0.3-q4f16_1-MLC"
            , "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC"
            , "WizardMath-7B-V1.1-q4f16_1-MLC"
            , "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"

             */
        ])
    }
//---------------------------------------
    async test(s, type_name, chatPlaces_obj, infoWithObjectsInPlace, options)
    {

     let uuid = chatPlaces_obj.uuid

     const result = MyLLMroot.replacePromptBy_infoWithObjectsInPlace_objects(type_name, s, undefined, infoWithObjectsInPlace)
     s = result.prompt
     const systemContent = result.systemContent



     const messages = [
      { role: "system", content: systemContent},
      { role: "user", content: s},
    ];

    // Enable streaming for real-time response
    const chunks = await this.selectedModel.engine.chat.completions.create({
      messages,
      stream: true, // Enable streaming
      temperature: 0.7,
    });

    let response = "";
    for await (const chunk of chunks)
        {
          const newChunck = chunk.choices[0]?.delta.content || ""
          response += newChunck
          chatPlaces_obj.temporaryResponse(response, this, options.objectAsync, newChunck)
        }
    return response

    }
    // --------------------------------------
    async checkboxActivate(checkbox, type_name, numErrors = 0)
    {
            if (this.engine)
                return

            if (!this.alreadyLoaded)
            {
                const {
                    CreateMLCEngine,
                    MLCEngine
                } = await await_import(document.location.protocol + "//esm.run/@mlc-ai/web-llm")
                this.CreateMLCEngine = CreateMLCEngine
                this.MLCEngine = MLCEngine
            }

            this.alreadyLoaded = true
            // https://scribbler.live/2024/10/02/Large-Language-Models-in-the-Browser-with-WebLLM.html
            // https://github.com/mlc-ai/web-llm/blob/main/examples/get-started/src/get_started.ts

            // Progress callback to track model loading
            const initProgressCallback = (progress) => {
                showHideSelector(".loading_info_myLLMs", progress.progress > 0)

                if(textAreaProcessing !== undefined)
                   textAreaProcessing.innerHTML = "processing... \nloading model: " + (progress.progress * 100) + "%"

                //console.log(`Model loading progress: ${progress}%`);
            };

            // Create and load the engine with the selected model
            if (!this.selectedModel.engine)
            try
            {
                // selectorLoading show
                this.selectedModel.engine = await this.CreateMLCEngine(this.selectedModel.id,
                {
              initProgressCallback: initProgressCallback, // Pass progress callback
              //logLevel: "INFO", // specify the log level
                },
                // customize kv cache, use either context_window_size or sliding_window_size (with attention sink)
                {
                  context_window_size: 9128,   //has to hold the text for summarizing, translation
                  // sliding_window_size: 1024,
                  // attention_sink_size: 4,
                },
             )}
             catch(e)
                {
                    numErrors++
                    if(numErrors < 10)
                        await this.checkboxActivate(checkbox, type_name, numErrors)
                    else
                        showMessageErrorOnSOSforDuration(e.name + ": " + e.message, 5000)
                }

        document.querySelectorAll(".loading_info_myLLMs").forEach(el => el.hidden = true);

        }
} //class MyWebLLM

//------------------------------------------------------------
class MyTransformersJS extends MyLocalLLMroot {
    static myTransformersJS

    constructor() {
        super("ID_TRANS_JS", "TransformersJS", "AI/huggingface_logo.svg")
        MyTransformersJS.myTransformersJS = this
        this.underConstruction = false

        // read https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L293 and present choices!
        this.addModelsFromArray([
            //in https://huggingface.co/models filter for public models  libraries:TransformersJS
            //"Xenova/gemma-2-9b-it-quantized",

            // models for "text-generation" pipeline

            //FAILED TO FETCH "onnx-community/Llama-3.2-1B-Instruct TEST"
            //"google/flan-t5-small TEST" //unsupported model type
            //"google/flan-t5-small TEST"  //not found
            new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "onnx-community/Qwen3-0.6B-ONNX", "Qwen3-0.6B", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_QWEN)
            , new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "onnx-community/Qwen2.5-0.5B-Instruct", "Qwen2.5-0.5B", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_QWEN)
            , new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "onnx-community/LFM2-350M-ONNX", "Liquid AI 350M", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_LIQUID)
            , new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "onnx-community/dinov3-vits16-pretrain-lvd1689m-ONNX", "DINOv3 vits16", ModelOfMyLLMroot.MODEL_TYPE_IMAGE_RECOGNITION, ModelOfMyLLMroot.MODEL_META)
            , new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "Xenova/distilbart-cnn-6-6", "Xenova CNN 6x6", ModelOfMyLLMroot.MODEL_TYPE_SUMMARY, ModelOfMyLLMroot.MODEL_XENOVA)
            , new ModelOfMyLLMroot(MyTransformersJS.myTransformersJS, "Xenova/opus-mt-en-es", "Xenova Opus En-Es", ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR, ModelOfMyLLMroot.MODEL_XENOVA)
            ,

        ])
    }
//----------------------------------------
     releaseMemory()
     {
         if(this.generator)
         {   this.generator.dispose()
             this.generator = undefined
         }
         if(this.summarization)
         {   this.summarization.dispose()
             this.summarization = undefined
         }
         if(this.translator)
         {   this.translator.dispose()
             this.translator = undefined
         }
         if(this.classifier)
         {   this.classifier.dispose()
             this.classifier = undefined
         }
         if(this.qaPipeline)
         {   this.qaPipeline.dispose()
             this.qaPipeline = undefined
         }
         if(this.text2text_generator)
         {   this.text2text_generator.dispose()
             this.text2text_generator = undefined
         }

     }
    //---------------------------------------
    async checkboxActivate(checkbox, type_name) {
        if (!checkbox || checkbox.checked)
        {
            if (this.engine)
                return



          if (!this.alreadyLoaded)
            {
                const {
                    pipeline,
                    TextStreamer,
                    env,
                } = await await_import(
                    //"https://cdn.jsdelivr.net/npm/@xenova/transformers@latest"
                    //document.location.protocol
                    "https:"
                    + "//cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6"
                    )

                this.pipeline = pipeline
                this.TextStreamer = TextStreamer
                this.env = env
                this.env.backends.onnx.wasm.numThreads = 1; // SUPER IMPORTANT: avoids SAB requirement (does not CRACS on https:// Production)
                //NEVER!!! this.env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
                this.env.device = navigator.gpu && !SIMULATE_NO_WEBGPU ? "webgpu" : "wasm" // Will gracefully fall back if WebGPU isn't available.
                //https://medium.com/@kenzic/run-models-in-the-browser-with-transformers-js-2d0983ba3ce9
            }

                let result
                let messages
                let generator
                let MODEL

             switch (type_name)
                {
                    case "TEST_image_recognition":

                        if(this.image_feature_extractor)
                            return

                        if(true)
                            this.object_detection = await this.pipeline(
                            "object-detection",
                            "Xenova/detr-resnet-50",           // good default; runs fully in-browser
                            { device: deviceWasmOrWebgpu }               // falls back to WASM if unavailable
                          )

                        break

                    case "feature extraction":

                         if(false)
                         this.image_feature_extractor = await this.pipeline(
                            "image-feature-extraction",
                            "Xenova/vit-base-patch16-224",           // or Xenova/vit-base-patch16-224
                            { device: deviceWasmOrWebgpu }                      // falls back to WASM if unavailable
                          );
                        if(true)
                          this.image_feature_extractor = await this.pipeline(
                            'image-feature-extraction',
                            'onnx-community/dinov3-vits16-pretrain-lvd1689m-ONNX',
                            { device: deviceWasmOrWebgpu }
                            )
                        if(false)
                          this.image_feature_extractor = await this.pipeline(
                            'feature-extraction',
                            'Xenova/clip-vit-base-patch16',
                            { device: deviceWasmOrWebgpu }
                            )



                        break

                    case "summary":

                        MODEL = this.selectedModel.id;
                                //'Xenova/t5-small' // model
                                //"Xenova/distilbart-cnn-6-6" // good quality/size tradeoff
                                //"Xenova/t5-base"

                         this.summarizer = await this.pipeline("summarization", MODEL, {
                            // Prefer WebGPU when available; fallback handled internally
                            device: deviceWasmOrWebgpu,
                            progress_callback: (p) => {
                              const info = [p.status, p.file ?? "", p.progress ?? ""].filter(Boolean).join(" ");
                              if(textAreaProcessing !== undefined)
                                textAreaProcessing.innerHTML = "processing... \n" + info
                                },
                        });
                      break

                    case "translator":

                        MODEL = this.selectedModel.id;
                                //'Xenova/t5-small' // model
                                //"Xenova/distilbart-cnn-6-6" // good quality/size tradeoff
                                //"Xenova/t5-base"

                         this.translator = await this.pipeline("translation", MODEL, {
                            // Prefer WebGPU when available; fallback handled internally
                            device: deviceWasmOrWebgpu,
                            progress_callback: (p) => {
                              const info = [p.status, p.file ?? "", p.progress ?? ""].filter(Boolean).join(" ");
                               if(textAreaProcessing !== undefined)
                                textAreaProcessing.innerHTML = "processing... \n" + info
                               },
                        });
                      break
                    case "TEST_classifier":

                        //https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser
                        const classifier = await this.pipeline('sentiment-analysis');

                        result = await classifier('I thing you are ugly and I do not like you');

                        alert(result[0].label + " " + result[0].score)
                        //await loadScriptsAwait()
                        // Allocate a pipeline for sentiment-analysis
                        // const pipe = await pipeline('sentiment-analysis')

                        //const out = await pipe('I love transformers!')
                        break
                    case "TEST_detector": //https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser
                        const detector = await this.pipeline("object-detection", "Xenova/detr-resnet-50");
                        break
                    case "TEST_generator":

                        // Set environment configurations
                        env.useBrowserCache = false;
                        env.allowLocalModels = false;

                        // Asynchronously initialize and use the pipeline
                        this.generator = await this.pipeline(
                            'text-generation', //# uses GPT-2
                            'Xenova/TinyLlama-1.1B-Chat-v1.0'
                        );

                        // Define the list of messages
                        messages = [
                            {"role": "system", "content": "You are a friendly assistant."},
                            {"role": "user", "content": "Explain thermodynamics in simple terms."},
                        ];

                        // Construct the prompt
                        const prompt = generator.tokenizer.apply_chat_template(messages, {
                            tokenize: false, add_generation_prompt: true,
                        });

                        // Generate a response
                        result = await generator(prompt, {
                            max_new_tokens: 256,
                            temperature: 0.7,
                            do_sample: true,
                            top_k: 50,
                        });

                        alert('Successful response generation:', result);
                        break;
                    case "TEST_translation": //translation, etc https://www.restack.io/p/transformers-answer-js-examples-cat-ai
                        break
                    case "TEST_qa" : //https://www.restack.io/p/transformers-js-answer-examples-cat-ai
                        const qaPipeline = await this.pipeline('question-answering');
                        const context = 'Transformers.js is a library for natural language processing.';
                        const question = 'What is Transformers.js?';

                        result = await qaPipeline({question, context});
                        alert(result.answer);
                        break
                    case "TEST_t2tgen": //https://huggingface.co/tasks/text-generation#completion-generation-models
                        const text2text_generator = await this.pipeline("text2text-generation")
                        result = await text2text_generator("question: What is 42 ? context: 42 is the answer to life, the universe and everything")
                        alert(result)
                        //[{'generated_text': 'the answer to life, the universe and everything'}]

                        result = await text2text_generator("translate from English to French: I'm very happy")
                        alert(result)
                        //[{'generated_text': 'Je suis très heureux'}]
                        break
                    case "TEST_inference": // https://huggingface.co/tasks/text-generation#completion-generation-models
                        const {
                                        InferenceClient,
                                    } = await await_import(document.location.protocol + "//huggingface/inference")

                        const inference = new InferenceClient(HF_TOKEN);
                        await inference.conversational({
                            model: "distilbert-base-uncased-finetuned-sst-2-english",
                            inputs: "I love this movie!",
                        });
                        break
                    default:

                                // TESTE_MODELS_STRANGE_THINGS()

                    // Create and load the engine with the selected model
                    if (!this.selectedModel.engine)
                    {

                        this.generator = await this.pipeline(
                          "text-generation", //"text2text-generation",
                          this.selectedModel.id,  //787 MB network DevTools
                                            {
                                            device: this.env.device, //device
                                            dtype: this.dType(),
                                            }
                         )

                    break
                 } //switch

            }

            document.querySelectorAll(".loading_info_myLLMs").forEach(el => el.hidden = true);

            this.alreadyLoaded = true

        }

    }
 //-----------------------------------------------------------------
    async test(s, type_name, chatPlaces_obj, infoWithObjectsInPlace, options = "")
    {
        const result = MyLLMroot.replacePromptBy_infoWithObjectsInPlace_objects(type_name, s, undefined, infoWithObjectsInPlace)
        s = result.prompt
        const systemContent = result.systemContent

       //if(type_name === ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR)
          //type_name = ModelOfMyLLMroot.MODEL_TYPE_CHAT


        const uuid = chatPlaces_obj.uuid

        const messages = [
          { role: "system", content: systemContent},
          { role: "user", content: s},
        ];


        let textChunks = ""
        let res

        switch(type_name) {

            case "summary":

                res = await this.summarizer(s
                    , {
                     min_length: 120
                    , max_length: 220
                    , truncate: true
                    , callback_function: (textChunk) => {
                        textChunks += textChunk;
                        chatPlaces_obj.temporaryResponse(textChunks, this, options.objectAsync)
                    }
                });
             return res[0].summary_text

            case "translator":

                res = await this.translator(s
                    , {
                    // min_length: 120
                    //max_length: 10000
                     truncate: false
                    , callback_function: (textChunk) => {

                        textChunks += textChunk;
                        chatPlaces_obj.temporaryResponse(textChunks, this, options.objectAsync)
                    }
                });
             return res[0].translation_text

            case "image recognition":

                //const url = 'https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png';
                //const res = await fetch(url);
                //let  blob = await res.blob();

                let features

                // The input can be a URL, or the `src` of an `<img>` element.
                let num  = 0
                let mapLabelToStatistics = new Map()
                let oneByOne =  infoWithObjectsInPlace.objects.size > 1 && options.ONE_BY_ONE

                let response = "Object recognition"  + (oneByOne ? " One by One"
                                                   : infoWithObjectsInPlace.objects.size === 1
                                                     ? "Image"
                                                     : "All together")
                                        + "\n\n"

                for (let obj3d of infoWithObjectsInPlace.objects)
                {
                    num++

                    if(options.ONE_BY_ONE)
                        mapLabelToStatistics = new Map()

                    const divParent = obj3d.elementImportant().parentNode
                    let img = undefined //under construction

                    const blob = await fetch(img.src).then(r => r.blob());

                    features = await this.object_detection(blob, {threshold: 0.5})


                    if(oneByOne)
                        response += "\n"
                    response += num + ". " + obj3d.socialName + "\n"
                    if(oneByOne)
                        response += "\n"

                    for (const { box, label, score } of features)
                    {
                        let statistics = mapLabelToStatistics.get(label)
                        if(!statistics)
                            {
                            statistics = {max: 0, min: 1, frequency: 0}
                            mapLabelToStatistics.set(label, statistics)
                            }
                        statistics.frequency++
                        statistics.max = Math.max(statistics.max, score)
                        statistics.min = Math.min(statistics.min, score)
                    }

                     if(!oneByOne && num === infoWithObjectsInPlace.objects.size)
                        response += "\n"

                    if(oneByOne || num === infoWithObjectsInPlace.objects.size)
                        for(let [label, statistics]of mapLabelToStatistics)
                            response += "   " + statistics.frequency + "x " + label + " (" + rst(statistics.min, 0, 3) + (statistics.min !== statistics.max ? " - " + rst(statistics.max, 0, 3) : "") + ")\n"
                }

                return response

            case "feature extraction":


                // The input can be a URL, or the `src` of an `<img>` element.
                for (let obj3d of infoWithObjectsInPlace.objects)
                {
                    const divParent = obj3d.elementImportant().parentNode
                    let img = undefined //under construction

                    features = await this.image_feature_extractor(img.src, {pooling: 'mean', normalize: true});
                    console.log(features);
                }

                if (this.object_detection)
                {
                    for (const { box, label, score } of features) {
                        console.log(label);
                    }
                }
                // embedding is a Tensor-like object: { data: Float32Array, dims: [1, D] }
                 else console.log("dims:", features.dims, "first 8:", features.data.slice(0, 8));

                break

            case "chat":


                // V3 to follow Python's version
                const streamer = new this.TextStreamer(this.generator.tokenizer, {
                    skip_prompt: true,                 // don’t resend the prompt
                    callback_function: (textChunk) => {
                        textChunks += textChunk;
                        chatPlaces_obj.temporaryResponse(textChunks, this, options.objectAsync)
                    }
                })

                // Generate a response
                let output

                switch (this.selectedModel.id) {
                    case "onnx-community/Qwen3-0.6B-ONNX":
                    case "onnx-community/Qwen2.5-0.5B-Instruct":
                        output = await this.generator(messages,
                            {
                            //    max_new_tokens: 4096,
                                // Other parameters like temperature, top_k can be added here
                                streamer: streamer // Pass the callback here!
                            })
                        break
                    case "onnx-community/LFM2-350M-ONNX":
                        output = await this.generator(messages, {
                          //  max_new_tokens: 512,
                            do_sample: false,
                            streamer: streamer //w TextStreamer(generator.tokenizer, { skip_prompt: true, skip_special_tokens: true }),
                        })
                        break
                }


                return output[0].generated_text.at(-1).content
            break
        }
    }
    //-------------------------
    dType() {

        switch(this.selectedModel.id)
        {
            case "onnx-community/Qwen3-0.6B-ONNX": return "q4f16"
            default: return "q4" //important
        }

    }
//------------------------------------------------
} //class MyTransformersJS



//------------------------------------------------------------
class MyMediaPipe extends MyLocalLLMroot {
    static modelFileNameRemote = //cdniverse + "AI/models/gemma2-2b-it-gpu-int8.bin" //
        'https://storage.googleapis.com/jmstore/WebAIDemos/models/Gemma2/gemma2-2b-it-gpu-int8.bin';
    static modelFileName = 'http://localhost/gemma2-2b-it-gpu-int8.bin';
    static CHAT_PERSONA_NAME = 'chatPersona';
    static API_PERSONA_NAME = 'apiPersona';
    static CHAT_PERSONA_HISTORY = [];
    static API_PERSONA_HISTORY = [];

    static myMediaPipe

    constructor() {
        super("ID_MEDIAPIPE", "MediaPipe", "AI/mediapipe_icon.svg")
        MyMediaPipe.myMediaPipe = this
        this.underConstruction = false

        // read https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L293 and present choices!
        this.addModelsFromArray([    //  https://huggingface.co/mlc-ai
            new ModelOfMyLLMroot(MyMediaPipe.myMediaPipe, "gemma-2b-it-gpu-int8.bin", "Gemma-2b Instruct", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GEMMA)

        ])
    }
   //---------------------------------------
    async test(s, type_name, chatPlaces_obj)
    {
     const uuid = chatPlaces_obj.uuid

     const messages = [
      { role: "system", content: "You are a helpful assistant"},
      { role: "user", content: s},
    ];

     let inputPrompt = s

        if(!this.llmInference)
           return showMessageErrorOnSOSforDuration("Model not yet loaded and active")

              this.llmInference.generateResponse(
              inputPrompt,
              (partialResult, done) =>
              {

                    this.textContent += partialResult;
                    chatPlaces_obj.temporaryResponse(Primiti.separateHTMLdocument(this.textContent).text, this, options.objectAsync)
            });

        return this.textContent
    }
    // --------------------------------------
    async checkboxActivate(checkbox, type_name)
    {

        if(!checkbox || checkbox.checked) {

            if (this.engine)
                return

            if (!this.alreadyLoaded)
            {
                 const {
                    FilesetResolver,
                    LlmInference,
                } = await await_import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai")

                 this.FilesetResolver = FilesetResolver
                 this.LlmInference = LlmInference

                await loadScriptsAwait('https://cdn.jsdelivr.net/gh/jasonmayes/web-ai-model-proxy-cache@main/FileProxyCache.min.js')


                this.FileProxyCache = FileProxyCache
                this.alreadyLoaded = true
            }

            //https://github.com/jasonmayes/WebAIAgent/blob/main/js/app.js
            //https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js

            const thisLLM = this

            const selectorLoading = ".loading_info_myLLMs"

            function fileProgressCallback(textUpdate)
            {

            }


            // Attempt to load from cache or localhost.
              let dataUrl = await FileProxyCache.loadFromURL(MyMediaPipe.modelFileName, fileProgressCallback);
              // If failed due to no local file stored, fetch cloud version instead from cache or remote.
              if (dataUrl === null)
                dataUrl = await FileProxyCache.loadFromURL(MyMediaPipe.modelFileNameRemote, fileProgressCallback);


            if (!this.selectedModel.llmInference)
            {

                //DOWNLOAD MODELS AT https://mediapipe-studio.webapps.google.com/demo/llm_inference

                const genaiFileset = await this.FilesetResolver.forGenAiTasks(
                    // path/to/wasm/root
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
                );


              try {
                this.llmInference = await this.LlmInference.createFromOptions(genaiFileset, {
                baseOptions: {
                  modelAssetPath: dataUrl
                },
                    /*
                    maxTokens: 1000,
                    topK: 40,
                    temperature: 0.8,
                    randomSeed: 101
                     */

                maxTokens: 8000,
                topK: 1,
                temperature: 0.8,
                randomSeed: 64

              });

                    // Select the LLM model you want to load
                    if (!this.selectedModel)
                        this.selectedModel = this.models.values().next().value //[0]

                    this.selectedModel.llmInference = this.llmInference


                } catch (e) {
                    showMessageErrorOnSOSforDuration("ERROR: ", e)
                }

            }
        }

    }
}// class MyMediaPipe


//---------------------------------------------------------------
class MyChromeBuiltInAI extends MyLocalLLMroot {
    constructor() {
        super("ID_CHROMEAI", "Chrome AI", "AI/chrome_logo_social_social media_icon.svg")
        MyChromeBuiltInAI.myChromeBuiltInAI = this
        this.underConstruction = false
        this.responseStreaming = false //true does not work yet...
        if (!('Summarizer' in self))   //does not work !window.ai)
            this.availability = MyLLMroot.STATE_AVAILABILITY_UNAVAILABLE //unavailabe

        // read https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L293 and present choices!
        this.addModelsFromArray([    //  https://huggingface.co/mlc-ai
             new ModelOfMyLLMroot(MyChromeBuiltInAI.myChromeBuiltInAI, "gemini_nano", "Gemini Nano", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GEMINI)
           , new ModelOfMyLLMroot(MyChromeBuiltInAI.myChromeBuiltInAI, "gemini_nano_summarizer", "Gemini Nano Summarizer", ModelOfMyLLMroot.MODEL_TYPE_SUMMARY, ModelOfMyLLMroot.MODEL_GEMINI)
           , new ModelOfMyLLMroot(MyChromeBuiltInAI.myChromeBuiltInAI, "gemini_nano_translator", "Gemini Nano Translator", ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR, ModelOfMyLLMroot.MODEL_GEMINI)
        ])
    }
// --------------------------------------
    async checkboxActivate(checkbox, type = ModelOfMyLLMroot.selectedModelType, numErrors = 0)
    {
         if (this.alreadyLoaded)
             return


        if(type === ModelOfMyLLMroot.MODEL_TYPE_SUMMARY)
        {

        if (!('Summarizer' in self))
           return showMessageErrorOnSOSforDuration("no Chrome Built-in AI available", 3000)
           //    throw new Error('Summarizer API not supported');

        const avail = await Summarizer.availability();
            if (avail === 'unavailable')
                return showMessageErrorOnSOSforDuration('Summarizer unavailable', 3000)

            try
            {
            this.summarizer = await Summarizer.create({
              type: 'key-points',    // "tldr" | "teaser" | "headline" also possible
              format: 'markdown',
              length: 'long',
              expectedInputLanguages: ['en'],
              outputLanguage: 'en',
              monitor(m) {m.addEventListener('downloadprogress', (e) => {
                        // e.loaded * 100
                });
              }
            });

            this.alreadyLoaded = true

            }
            finally
            {
                // selectorLoading hide
            }
        }
        else if(type === ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR) {

            if (!('Translator' in self))
                return showMessageErrorOnSOSforDuration("no Chrome Built-in AI available", 3000)
            //    throw new Error('Summarizer API not supported');


            const avail = await Translator.availability({
                sourceLanguage: 'en',
                targetLanguage: 'es',
                });
            if (avail === 'unavailable')
                return showMessageErrorOnSOSforDuration('Translator unavailable', 3000)

            try {

                this.translator = await Translator.create({
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            // e.loaded * 100
                        });
                    },
                });

                this.alreadyLoaded = true

            } finally {
                // selectorLoading hide
            }
        }

    }
// --------------------------------------
    async test(text, type_name, chatPlaces_obj, infoWithObjectsInPlace, options = "")
    {

        let response = ""

        chatPlaces_obj.prologue = ""


         if(infoWithObjectsInPlace && infoWithObjectsInPlace.objects)
         {

           if(infoWithObjectsInPlace.objects.size > 1 && options.ONE_BY_ONE)
           {
               let summary = ""
               let num = 0
               for (let obj3d of infoWithObjectsInPlace.objects)
               {
                    num++
                    const partial =  "Document " + num + ": " + obj3d.filename + "\n\n" + await this.testREALLY(text + "\n\n" + obj3d.textDocument, chatPlaces_obj, type_name)
                    chatPlaces_obj.temporaryResponse(partial, this, options.objectAsync)
                    summary += "\n\n\n" + partial
               }
               return (chatPlaces_obj.prologue ? chatPlaces_obj.prologue   : "") + summary
           }
           else
           {
                chatPlaces_obj.prologue = infoWithObjectsInPlace.objects.size <= 1
                        ? TLtranslateFromTo_removeFont("summarize one document")
                        : TLtranslateFromTo_removeFont("summarize") + " " + infoWithObjectsInPlace.objects.size + " " + TLtranslateFromTo_removeFont("documents together")

               let num = 0
               for(let obj3d of infoWithObjectsInPlace.objects)
                  text +=  "\n\n" + obj3d.textDocument
           }


          response = await this.testREALLY(text, chatPlaces_obj, type_name)

        }


    return (chatPlaces_obj.prologue ? chatPlaces_obj.prologue + "\n\n" : "") + response


    }
// --------------------------------------
    async testREALLY(text, options = "", type)
    {
     let summary = ""
     if(this.responseStreaming)
        {
           // const controller = new AbortController();
           // cancelBtn.disabled = false;
           // cancelBtn.onclick = () => controller.abort();

         try {

        let stream
        if(type === ModelOfMyLLMroot.MODEL_TYPE_SUMMARY)
          stream = await this.summarizer.summarizeStreaming(text, {
            context: 'Keep key facts; avoid hallucinations.'
            ,outputLanguage: 'en'
          });
        else if(type === ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR)
          stream = await this.translator.translateStreaming(text, {
            context: ''
            ,outputLanguage: 'es'
          });

      for await (const chunk of stream)
        {
          summary += chunk;
          chatPlaces_obj.temporaryResponse(summary, this, options.objectAsync)
        }
    } finally {
      //cancelBtn.disabled = true;
      //bar.style.width = '0%';
      //summarizer.destroy?.();
    }
    }
    else //non streaming
      {
       if(type === ModelOfMyLLMroot.MODEL_TYPE_SUMMARY)
         summary = await this.summarizer.summarize(text, {
         context: 'Keep it accurate and neutral.'
            ,outputLanguage: 'en'
         });
       if(type === ModelOfMyLLMroot.MODEL_TYPE_TRANSLATOR)
         summary = await this.translator.translate(text, {
         context: ''
            ,outputLanguage: 'en'
         });
     }

    return summary
    }
// --------------------------------------
}//class MyChromeBuiltInAI

//---------------------------------------------------------------
class MyAppleIntelligence extends MyLocalLLMroot
{
    constructor () {
        super("ID_APPLE_INTELLIGENCE", "Apple Intelligence", "AI/apple-seeklogo.svg")
        MyAppleIntelligence.myAppleIntelligence = this
        this.underConstruction = false
        //if(!('Summarizer' in self))   //does not work !window.ai)
        this.availability = MyLLMroot.STATE_AVAILABILITY_UNAVAILABLE //unavailabe
        //ONLY AVAILABLE IN App accessing the built in browser (bridge Swift - JavaScript - Swift)

        // Writing tools: rewriting, proofreading, summarizing, tone adjustment.
        // Notification summarization, organizing emails, visual understanding, creative image generation ("Genmoji", Image Playground).

        this.addModelsFromArray([    //  https://huggingface.co/mlc-ai
            new ModelOfMyLLMroot(MyAppleIntelligence.myAppleIntelligence, "apple_foundation_models", "Apple Foundation Models", ModelOfMyLLMroot.MODEL_TYPE_SUMMARY, ModelOfMyLLMroot.MODEL_APPLE_FM)
            , new ModelOfMyLLMroot(MyAppleIntelligence.myAppleIntelligence, "apple_foundation_models", "Apple Foundation Models", ModelOfMyLLMroot.MODEL_TYPE_IMAGE_GENERATION, ModelOfMyLLMroot.MODEL_APPLE_FM)

        ])
    }
//------------------------------------------------------------
   }
//------------------------------------------------------------
class MyTensorFlowJS extends MyLocalLLMroot
{
    constructor ()
    {
        super("ID_TENSORFLOWJS", "TensorFlowJS", "AI/TensorFlow.svg")
        MyTensorFlowJS.myTensorFlowJS = this
   }
} // class MyTensorFlowJS
//------------------------------------------------------------
class MyONNX extends MyLocalLLMroot
{
    constructor ()
    {
        super("ID_ONNXJS", "ONNX JS", "AI/onnxai_logo.svg")
        MyONNX.myONNX = this
    }
} // class MyONNX


//------------------------------------------------------------
class MyCloudLLMroot extends MyLLMroot {
    static mapOnlyTHisID_to_lastS_listCloudAPIkeysHTML = new Map()
    static baseApps = new Set();

    constructor(uniqueID, name_param, imageURL, siteURL) {
        super(uniqueID, name_param, imageURL, siteURL)

        this.availability = MyLLMroot.STATE_AVAILABILITY_AVAILABLE

        MyLLMroot.mapMyCloudLLMs.set(this.name, this)
    }
//-------------------------------------------
    releaseMemory() {
        //in principle nothing to release for heavy memory use is in the cloud
    }
//-------------------------------------------
    localORcloudString() {
        return "CLOUD"
    }
//--------------------------------------------------------------------
    getAvailability() {
       for(let ba of MyCloudLLMroot.baseApps)
           if(ba.cloudAIuniqueID === this.uniqueID)
               return MyLLMroot.STATE_AVAILABILITY_READY
        return this.availability //in MyCloudLLMroot is calculated
    }
//--------------------------------------------------------------------

} // class MyCloudLLMroot


//------------------------------------------------------------
class MyChatGPT_key extends MyCloudLLMroot {
    static myChatGPT_key

    constructor() {
        super("ID_CHATGPT_KEY", "ChatGPT", "AI/chatgpt-6.svg", "https://chatgpt.com/")
        this.costPerMillionTokenIn = 1.25
        this.costPerMillionTokenOut = 10
        MyChatGPT_key.myChatGPT_key = this
        this.underConstruction = false
        this.modelForVercelAI = 'gpt-4o-mini'
        this.addModelsFromArray([
            new ModelOfMyLLMroot(MyChatGPT_key.myChatGPT_key, "gpt-4.1", "ChatGPT 4.1", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GPT)
            , new ModelOfMyLLMroot(MyChatGPT_key.myChatGPT_key, "gpt-4o", "gpt-4o", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GPT)
            , new ModelOfMyLLMroot(MyChatGPT_key.myChatGPT_key, "gpt-3.5-turbo", "gpt-3.5-turbo", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GPT)
            , new ModelOfMyLLMroot(MyChatGPT_key.myChatGPT_key, "gpt-4o-mini", "gpt-4o-mini", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GPT)
        ])
    }
} // class MyChatGPT_key

//------------------------------------------------------------
class MyGemini_key extends MyCloudLLMroot {
    static myGemini_key

    constructor() {
        super("ID_GEMINI_KEY", "Gemini", "AI/google-gemini-icon.svg", "https://gemini.google.com/app")
        MyGemini_key.myGemini_key = this
        this.underConstruction = false
        this.modelForVercelAI = 'models/gemini-2.5-pro'
        this.costPerMillionTokenIn = 1.25
        this.costPerMillionTokenOut = 10

        this.addModelsFromArray([
            new ModelOfMyLLMroot(MyGemini_key.myGemini_key, "gemini-2.5-pro-exp-03-25", "Gemini 2.5 experimental", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GEMINI)
            , new ModelOfMyLLMroot(MyGemini_key.myGemini_key, "gemini-2.5-pro-preview-03-25", "Gemini 2.5 preview", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_GEMINI)
        ])

    }
} // class MyGemini_key


//------------------------------------------------------------
class MyPerplexity_key extends MyCloudLLMroot {
    static myPerplexity_key

    constructor() {
        super("ID_PERPLEXITY_KEY", "Perplexity", "AI/icons8-perplexity-ai.svg", "https://www.perplexity.ai/")
        MyPerplexity_key.myPerplexity_key = this
        this.underConstruction = false
        this.costPerMillionTokenIn = 1
        this.costPerMillionTokenOut = 5

        this.modelForVercelAI = 'llama-3.1-sonar-large-128k-online'
        this.addModelsFromArray([
            new ModelOfMyLLMroot(MyPerplexity_key.myPerplexity_key, "sonar-pro", "sonar-pro", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_SONAR)
        ])
    }
} // class MyPerplexity_key

class MyAnthropic_key extends MyCloudLLMroot //Cluse AI
{
    static myAnthropic_key

    constructor() {
        super("ID_ANTHROPIC_KEY", "Anthropic AI", "AI/claude-ai-icon.svg", "https://www.anthropic.com/");
        MyAnthropic_key.myAnthropic_key = this
        this.underConstruction = false
        this.costPerMillionTokenIn = 3
        this.costPerMillionTokenOut = 15

        this.addModelsFromArray([
            new ModelOfMyLLMroot(MyAnthropic_key.myAnthropic_key, "claude-3-7-sonnet-20250219", "Claude 3.7 Sonnet", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_CLAUDE)
            , new ModelOfMyLLMroot(MyAnthropic_key.myAnthropic_key, "claude-3-opus-20240229", "Claude 3 Opus", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_CLAUDE)
            , new ModelOfMyLLMroot(MyAnthropic_key.myAnthropic_key, "claude-3-5-sonnet-20240620", "Claude 3.5 Sonnet", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_CLAUDE)
            , new ModelOfMyLLMroot(MyAnthropic_key.myAnthropic_key, "claude-3-haiku-20240307", "Claude 3 Haiku", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_CLAUDE)
        ])

    }
} // class MyAnthropic_key


class MyGroq_key extends MyCloudLLMroot //Cluse AI
{
    static myGroq_key

    constructor() {
        super("ID_GROQ_KEY", "Groq AI", "AI/groq-icon-logo-png_seeklogo-605779.png", "https://groq.com/");
        MyGroq_key.myGroq_key = this
        this.underConstruction = false
        this.costPerMillionTokenIn = 0.15
        this.costPerMillionTokenOut = 0.75

        this.modelForVercelAI = "llama-3.3-70b-versatile"
        this.addModelsFromArray([
            new ModelOfMyLLMroot(MyGroq_key.myGroq_key, "llama-3.3-70b-versatile", "Claude 3.7 Sonnet", ModelOfMyLLMroot.MODEL_TYPE_CHAT, ModelOfMyLLMroot.MODEL_META)
        ])

    }
} // class MyGroq_key


//------------------------------------------------------------
//may be useful for network shared AI processing
class MySharedLLMroot extends MyLLMroot {
    static mapOnlyTHisID_to_lastS_listCloudAPIkeysHTML = new Map()
    static baseApps = new Set();

    constructor(uniqueID, name_param, imageURL = "ChatPlaces/SharedAI.svg", chatPlaces_obj) {
        super(uniqueID, name_param, imageURL)
        this.chatPlaces_obj = chatPlaces_obj
        chatPlaces_obj.myLLM = this
        this.underConstruction = false
        this.availability = MyLLMroot.STATE_AVAILABILITY_AVAILABLE
        MyLLMroot.mapMySharedLLMs.set(this.name, this)
    }
} // class MySharedLLMroot

//------------------------------------------------------------
class ModelNameLLM
{
    static mapNameToModels = new Map()


    constructor(name, company, image)
    {
    this.name = name
    this.company = company
    this.image = image

     ModelNameLLM.mapNameToModels.set(name, this)
    }
//------------------------------------------------------------
    icon(height = "20px")
    {
     return "<img src='"+ cdniverse +"AI/models/" + this.image + "' style='height:"+height+"' title='" + this.name + "'>"
    }

}//  class ModelName
//------------------------------------------------------------
class ModelType
{
    constructor(type_name, designation, acceptsEmptyQuestion = false
                , numActionsPossibleWithNoObject = 1
                , numActionsPossibleWithOneObject = 1
                , numActionsPossibleWithManyObjects = 1)
    {
        this.name = type_name
        this.designation = designation
        this.acceptsEmptyQuestion = acceptsEmptyQuestion
        this.numActionsPossibleWithNoObject = numActionsPossibleWithNoObject
        this.numActionsPossibleWithOneObject = numActionsPossibleWithOneObject
        this.numActionsPossibleWithManyObjects = numActionsPossibleWithManyObjects

        ModelOfMyLLMroot.modelTypes.set(type_name, this)
    }
//------------------------------------------------------------
numActionsPossibleForTheseNumberOfObjects(numObjects)
{
    return numObjects === 1
       ? this.numActionsPossibleWithOneObject
       : numObjects > 1
          ? this.numActionsPossibleWithManyObjects
          : this.numActionsPossibleWithNoObject //image recognition have 0, summarization has 1 for the text can be in the prompt
}
//------------------------------------------------------------

}// class ModelType


class ModelOfMyLLMroot
{

    static MODEL_TYPE_OPTIONS = ["no use", "meeting", "all uses"]
    static MODEL_TYPE_ALL = "ALL"
    static MODEL_TYPE_CHAT = "chat"
    static MODEL_TYPE_SUMMARY = "summary"
    static MODEL_TYPE_TRANSLATOR = "translator"
    static MODEL_TYPE_IMAGE_RECOGNITION = "image recognition"
    static MODEL_TYPE_IMAGE_GENERATION = "image generation"
    static modelTypes = new Map()

    static map_uuid_to_modelType = new Map()

     static MODEL_APPLE_FM = "Apple Foundation" //Models
     static MODEL_CLAUDE = "Claude"
     static MODEL_DEEPSEEK = "DeepSeek"
     static MODEL_GEMINI = "Gemini"
     static MODEL_GEMMA = "Gemma"
     static MODEL_GPT = "ChatGPT"
     static MODEL_LIQUID = "Liquid"
     static MODEL_META = "META (Llama, ...)"
     static MODEL_SONAR = "Sonar"
     static MODEL_QWEN = "Qwen"
     static MODEL_XENOVA = "Xenova"

    static selectedModelType = ModelOfMyLLMroot.MODEL_TYPE_ALL

    static modelsOfMyLLM = new Map()

    constructor( myLLM, id, name, types = MODEL_TYPE_CHAT, family = "model", jsonParams = {})
    {
        ModelOfMyLLMroot.modelsOfMyLLM.set(id, this)
        this.myLLM = myLLM
        this.id = id
        this.name = name
        this.type = " " + types.trim() + " " //types are separated by " "
        this.family = family
        this.jsonParams = jsonParams
    }
//-----------------------------------------------------------
icon(height = "20px")
{
    return this.modelFamily().icon(height)
}
//-----------------------------------------------------------
    toString()
    {
        return this.name
    }
//-----------------------------------------------------------
static numModels(localORcloud, type)
    {
        let num = 0;
        for(let [name, modelOfLLM] of ModelOfMyLLMroot.modelsOfMyLLM)
            if (!localORcloud || localORcloud == modelOfLLM.myLLM.localORcloudString())
                if(!type || modelOfLLM.type.indexOf(type) !== -1)
                    num++
        return num
    }

//------------------------------------------------------------
    modelFamily()
    {
      return ModelNameLLM.mapNameToModels.get(this.family)
    }
//------------------------------------------------------------
static selectThisType(uuid = "", type)
{
const iniType = ModelOfMyLLMroot.map_uuid_to_modelType.get(uuid)
if(!type)
    type = iniType || ModelOfMyLLMroot.MODEL_TYPE_ALL

if(!uuid)
    ModelOfMyLLMroot.selectedModelType = type

ModelOfMyLLMroot.map_uuid_to_modelType.set(uuid, type)

update_localAIhardware_mainTable()
//ModelOfMyLLMroot.updateLastGrid()

return iniType !== type
}


} // class ModelOfMyLLMroot
//----------------------------------------------------------------
function LLMengineUsesBaselineFeatures(llm, s) {

    if(!llm.mapLLMbaselineFeaturesToNotMainSecondaryIndirectly)
        llm.mapLLMbaselineFeaturesToNotMainSecondaryIndirectly = new Map()

    s = s.replaceAll("\n", " ").trim()
    while(true)
    {
        const len = s.length
        s = s.replaceAll("  ", " ")
        if(s.length === len)
            break
    }

    let lastPos = 0
    while(lastPos < s.length)
    {
        const mainSecondaryIndirectly = parseInt(s[lastPos])
        lastPos += 2
        let pos = s.indexOf(" ", lastPos)
        if(pos === -1)
            pos = s.length
        const baselineFeature = s.slice(lastPos, pos)
        lastPos = pos +1

        llm.mapLLMbaselineFeaturesToNotMainSecondaryIndirectly.set(baselineFeature, mainSecondaryIndirectly)
    }

}
//----------------------------------------------------------------
class BaseLineFeatures
{
    static calculateOnUniqueTab = true



    static initialize()
    {
        // 0 does not use
        // 1 manin/core
        // 2 secondary/fallback
        // 3 indirectly

        LLMengineUsesBaselineFeatures(MyWebLLM.myWebLLM, `
            1 webgpu  0 webgl2 2 wasm-simd 2 wasm-threads 0 webnn
            1 streams 3 readable-byte-streams 0 file-system-access 1 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            2 shared-memory 2 atomics-wait-async 1 transferable-arraybuffer
            1 isolation 1 is-secure-context
            `)
        LLMengineUsesBaselineFeatures(MyTransformersJS.myTransformersJS, `
            1 webgpu  2 webgl2 2 wasm-simd 2 wasm-threads 0 webnn
            1 streams 1 readable-byte-streams 0 file-system-access 1 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            1 shared-memory 1 atomics-wait-async 0 transferable-arraybuffer
            1 isolation 1 is-secure-context
            `)
        LLMengineUsesBaselineFeatures(MyMediaPipe.myMediaPipe, `
            1 webgpu  1 webgl2 2 wasm-simd 0 wasm-threads 0 webnn
            1 streams 1 readable-byte-streams 0 file-system-access 1 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            0 shared-memory 0 atomics-wait-async 1 transferable-arraybuffer
            1 isolation 1 is-secure-context
            `)
         LLMengineUsesBaselineFeatures(MyChromeBuiltInAI.myChromeBuiltInAI, `
            0 webgpu  0 webgl2 0 wasm-simd 0 wasm-threads 0 webnn
            0 streams 0 readable-byte-streams 0 file-system-access 0 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            0 shared-memory 0 atomics-wait-async 0 transferable-arraybuffer
            0 isolation 0 is-secure-context
            `)
         LLMengineUsesBaselineFeatures(MyAppleIntelligence.myAppleIntelligence, `
            0 webgpu  0 webgl2 0 wasm-simd 0 wasm-threads 0 webnn
            0 streams 0 readable-byte-streams 0 file-system-access 0 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            0 shared-memory 0 atomics-wait-async 0 transferable-arraybuffer
            0 isolation 0 is-secure-context
            `)
          LLMengineUsesBaselineFeatures(MyTensorFlowJS.myTensorFlowJS, `
            1 webgpu  2 webgl2 1 wasm-simd 1 wasm-threads 0 webnn
            1 streams 3 readable-byte-streams 0 file-system-access 1 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            1 shared-memory 0 atomics-wait-async 1 transferable-arraybuffer
            1 isolation 1 is-secure-context
            `)
          LLMengineUsesBaselineFeatures(MyONNX.myONNX, `
            1 webgpu  1 webgl2 1 wasm-simd 1 wasm-threads 4 webnn
            0 streams 0 readable-byte-streams 0 file-system-access 1 indexeddb
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            2 shared-memory 0 atomics-wait-async 2 transferable-arraybuffer
            2 isolation 1 is-secure-context
            `)

           for(let [name, cloudLLM] of MyLLMroot.mapMyCloudLLMs)
             LLMengineUsesBaselineFeatures(cloudLLM, `
            0 webgpu 0 webgl2 0 wasm-simd 0 wasm-threads 0 webnn
            3 streams 3 readable-byte-streams 3 file-system-access 3 indexeddb 1 server-sent-events 4 abortable-fetch
            3 media-source 3 web-audio 3 webcodecs 3 webrtc
            0 shared-memory 0 atomics-wait-async 0 transferable-arraybuffer
            0 isolation 0 is-secure-context
            `)


    }

//Inspired by ChatGPT
static async myCheckBaseLinefeatures()
{

async function hasWebGPU() {
    try {
      return !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function');
    } catch { return false; }
  }

  function hasWebGL2() {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2');
    } catch { return false; }
  }

  // WASM Threads: requires cross-origin isolation + shared memories
  function hasWasmThreads() {
    try {
      // Both must hold for real threads support in the browser
      if (!('SharedArrayBuffer' in self) || !self.crossOriginIsolated) return false;
      // Also verify shared WebAssembly.Memory is accepted (older engines reject this)
      new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
      return true;
    } catch { return false; }
  }

  // WASM SIMD: robust detection is done by compiling a tiny SIMD module.
  // If you want a definitive check, compile a minimal SIMD binary.
  // This fallback returns `true` only when engines that are known to ship SIMD expose it via validation.
  async function hasWasmSimd() {
    // Minimal precompiled wasm (v128.add) would be ideal here; absent that, be conservative:
    // Return true only if WASM exists and the platform is crossOriginIsolated (typical on modern sites) — still not a proof.
    // For a strict test, replace with a real binary compilation.
    try {
      if (!('WebAssembly' in self)) return false;
      // Heuristic: most engines that support threads also support SIMD; still not guaranteed.
      if (hasWasmThreads()) return true;
      // Fallback: assume false when uncertain.
      return false;
    } catch { return false; }
  }

  function hasWebNN() {
    try {
      // Current drafts/impls expose navigator.ml with createContext()
      return !!(navigator.ml && typeof navigator.ml.createContext === 'function');
    } catch { return false; }
  }

  // Streams (high-level), and specifically Readable Byte Streams (+ BYOB readers)
  function hasStreams() {
    return (typeof ReadableStream === 'function' &&
            typeof WritableStream === 'function' &&
            typeof TransformStream === 'function');
  }

  function hasReadableByteStreams() {
    try {
      let supported = false;
      const rs = new ReadableStream({
        type: 'bytes',
        pull(controller) {
          controller.enqueue(new Uint8Array([0]));
          controller.close();
        }
      });
      const reader = rs.getReader({ mode: 'byob' });
      supported = !!reader && typeof reader.read === 'function';
      reader.releaseLock?.();
      return supported;
    } catch { return false; }
  }

  // File System Access (including OPFS)
  function hasFileSystemAccess() {
    return !!(window.showOpenFilePicker || (navigator.storage && navigator.storage.getDirectory));
  }

  function hasIndexedDB() {
    try { return 'indexedDB' in self && !!self.indexedDB; } catch { return false; }
  }

  function hasMediaSource() {
    return !!(window.MediaSource && typeof MediaSource.isTypeSupported === 'function');
  }

  function hasWebAudio() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  function hasWebCodecs() {
    return !!(window.VideoEncoder || window.VideoDecoder || window.AudioEncoder || window.AudioDecoder);
  }

  function hasWebRTC() {
    const hasRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    const hasMediaDevices = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
    return hasRTC && hasMediaDevices;
  }

  // Shared memory + Atomics.waitAsync + transferable ArrayBuffer
  function hasSharedMemory() {
    //return !!(self.SharedArrayBuffer && self.crossOriginIsolated); //ChatGPT
    return typeof SharedArrayBuffer !== 'undefined'  //Gemini
  }

  function hasAtomicsWaitAsync() {
    //return !!(self.Atomics && typeof Atomics.waitAsync === 'function'); //ChatGPT
    return typeof Atomics !== 'undefined' && 'waitAsync' in Atomics //Gemini
  }

  function hasTransferableArrayBuffer() {
    // Detect whether ArrayBuffer can be transferred (detaching the original)
    try {
      const ab = new ArrayBuffer(16);
      const { port1, port2 } = new MessageChannel();
      port1.postMessage(ab, [ab]);
      // If transfer succeeded, ab is detached -> byteLength becomes 0
      return ab.byteLength === 0;
    } catch { return false; }
  }

  function isSecure() {
    return !!self.isSecureContext;
  }

  function isIsolated() {
    return !!self.crossOriginIsolated;
  }

async function checkBaselineFeatures() {
    const [
      webgpu,
      wasmSimd
    ] = await Promise.all([
      hasWebGPU(),
      hasWasmSimd()
    ]);

    const result = {
      // graphics / compute
      'webgpu': webgpu,
      'webgl2': hasWebGL2(),

      // wasm
      'wasm-simd': wasmSimd,          // see note above for strict detection
      'wasm-threads': hasWasmThreads(),

      // ML
      'webnn': hasWebNN(),

      // streams / storage
      'streams': hasStreams(),
      'readable-byte-streams': hasReadableByteStreams(),
      'file-system-access': hasFileSystemAccess(),
      'indexeddb': hasIndexedDB(),

      // media
      'media-source': hasMediaSource(),
      'web-audio': hasWebAudio(),
      'webcodecs': hasWebCodecs(),
      'webrtc': hasWebRTC(),

      // memory & concurrency
      'shared-memory': hasSharedMemory(),
      'atomics-wait-async': hasAtomicsWaitAsync(),
      'transferable-arraybuffer': hasTransferableArrayBuffer(),

      // security / isolation
      'is-secure-context': isSecure(),
      'isolation': isIsolated()
    };

    return result;
  }

// Example usage:
  baselineFeaturesAvailable = await checkBaselineFeatures();

}
//---------------------------------
static postDataToServer()
{
    manual_memoryzSize = document.getElementById("input_localAIhardware_manualMemorySize").valueAsNumber
    BaseLineFeatures.post_LLM_Model_Type_arrDuration_arrloading_arrFirstChar_arrProcessing(
        manual_memoryzSize
        , document.getElementById("input_localAIhardware_application").value
        , last_baselineFeaturesAvailableToText
        , last_agent_device_os
        , llm_selected.uniqueID, model_selected.id,  ModelOfMyLLMroot.selectedModelType
        , loadingDuration, processingDuration,firstCharDuration)
}
//---------------------------------
static async post_LLM_Model_Type_arrDuration_arrloading_arrFirstChar_arrProcessing(manual_memoryzSize = 0, application = "none"
    , baseline_features, agent_device_os
    , llm_uniqueID, modelOfMyLLM_id, selectedModelType
    , loadingDuration, processingDuration, firstCharDuration)
{

     if(typeof manual_memoryzSize !== "number")
        return showMessageErrorOnSOSforDuration("manual_memoryzSize must be a number")

    if(manual_memoryzSize < 0)
        return showMessageErrorOnSOSforDuration("manual_memoryzSize can not be negative")

    if(typeof baseline_features !== "string")
        return showMessageErrorOnSOSforDuration("baseline_features must be a string")

    if(!llm_uniqueID)
        return showMessageErrorOnSOSforDuration("missing llmID")
    const llm = MyLLMroot.mapIDtoMyLLMs.get(llm_uniqueID)
    if(!llm)
        return showMessageErrorOnSOSforDuration("unkown llm_uniqueID: " + llm_uniqueID)

    if(!modelOfMyLLM_id)
        return showMessageErrorOnSOSforDuration("missing modelOfMyLLM_id")
    const model = llm_selected.models.get(modelOfMyLLM_id)
    if(!model)
        return showMessageErrorOnSOSforDuration("unkown llm_uniqueID: " + llm_uniqueID)

    if(!selectedModelType)
        return showMessageErrorOnSOSforDuration("missing selectedModelType")
    if(!ModelOfMyLLMroot.modelTypes.get(selectedModelType))
        return showMessageErrorOnSOSforDuration("unkown selectedModelType: " + selectedModelType)

    if(!Array.isArray(loadingDuration) || loadingDuration[0] === undefined ||  loadingDuration[1] === undefined)
        return showMessageErrorOnSOSforDuration("loadingDuration must be an array with elements [0] && [1] as numbers" + selectedModelType)
    if(!Array.isArray(processingDuration) || processingDuration[0] === undefined ||  processingDuration[1] === undefined)
        return showMessageErrorOnSOSforDuration("processingDuration must be an array with elements [0] && [1] as numbers" + selectedModelType)
    if(!Array.isArray(firstCharDuration) || firstCharDuration[0] === undefined ||  firstCharDuration[1] === undefined)
        return showMessageErrorOnSOSforDuration("firstCharDuration must be an array with elements [0] && [1] as numbers" + selectedModelType)

    const url = location.protocol + "//" + (location.hostname === "localhost"
                                                    ? "api.localaihardware.localhost:" + location.port
                                                    : "api.localaihardware.com")
                + "/"

  const result = await navigator.storage.estimate()
  const memorySizeForOriginPrivateFileSystem = result.quota



    // The data you want to send
const data = {
        detected_memoryzSize: navigator.deviceMemory || 0
        , manual_memoryzSize: manual_memoryzSize || 0
        , application : application
        , detected_diskSize: memorySizeForOriginPrivateFileSystem || 0
        , baseline_features: baseline_features
        , agent_device_os: last_agent_device_os_STRING
        , llm_uniqueID: llm_uniqueID
        , modelOfMyLLM_id: modelOfMyLLM_id
        , selectedModelType: selectedModelType
        , loadingDuration_0: loadingDuration[0]
        , processingDuration_0: processingDuration[0]
        , firstCharDuration_0: firstCharDuration[0]
        , loadingDuration_1: loadingDuration[1]
        , processingDuration_1: processingDuration[1]
        , firstCharDuration_1: firstCharDuration[1]
};

fetch(url, {
  // Method itself
  method: 'POST',

  // Additional headers
  headers: {
    //'Content-Type': 'application/json' //requires pre-flight CORS
      'Content-Type': 'application/x-www-form-urlencoded' //does not do  pre-flight CORS
  },

  // Body of the request, must be a string
  body: JSON.stringify(data)
})
.then(response => {
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json(); // Parse the JSON in the response
})
.then(responseData => {
      if(responseData.message)
      {
          if(application === "none") //unique tab
          {
          alert(responseData.message)
          window.location = "https://localaihardware.com/localaihardware_logo_507X168.jpg"
          return
          }
        showMessageOnSOSforDuration(responseData.message, 3000)
      }
      loadingDuration[1] = undefined
      processingDuration[1] = undefined
      firstCharDuration[1] = undefined
      firstOrSecond = 1
      first_update_localAIhardware_mainTable = true
      window.LocalAIhardware.update_localAIhardware_mainTable()
})
.catch(error => {
     showMessageOnSOSforDuration("ERROR: " + error, 3000)
});



}
//---------------------------------
static async get_agent_device_os(first = true, callAtEnd)
{
     const url = location.protocol + "//" + (location.host.indexOf("localhost:") !== -1
                                                    ? "api.localaihardware.localhost:" + location.port
                                                    : "api.localaihardware.com") + "/get_agent_device_os";

    fetch(url, {
  // Method itself
  method: 'POST',

  // Additional headers
  headers: {
    //'Content-Type': 'application/json' //requires pre-flight CORS
      'Content-Type': 'application/x-www-form-urlencoded' //does not do  pre-flight CORS
  },

  // Body of the request, must be a string
  body: "get_agent_device_os"
})
.then(response => {
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
 return response.json()

})
.then(responseData => {

        last_agent_device_os = responseData
        last_agent_device_os_STRING =  JSON.stringify(responseData)
        const textArea = document.getElementById("textarea_agent_device_os")
        if(textArea)
            textArea.innerHTML = last_agent_device_os_STRING
        if(first) //browser may send more INFO for received Permissions-Policy and Accept-CH in headers
            BaseLineFeatures.get_agent_device_os(false, callAtEnd)
        else if(callAtEnd)
            callAtEnd()
})
.catch(error => {
     showMessageOnSOSforDuration("ERROR: " + error, 3000)
});

}
//---------------------------------
    static addToMapIncNum(map, key)
    {
        let object = map.get(key)
        object ? object.num++ : map.set(key, {num: 1})
    }
//---------------------------------
    static showMapInSelector(mapAgentBrowserToObject, setBeingShowned, selectedName, title = "options")
    {
        selectedName = "window.LocalAIhardware." + selectedName
        if(!mapAgentBrowserToObject.size)
              return ""
        let s = "&nbsp; <select onChange='"+selectedName+"=this.value; window.LocalAIhardware.viewDataGridHTML()'><option value=''>all " + title + "</option>"

        if(!setBeingShowned || setBeingShowned.size === mapAgentBrowserToObject.size)
            for(let [key, object] of mapAgentBrowserToObject)
                s += "<option value='" + key + "' "+ (eval(selectedName) === key ? "selected" : "") +">" + key + " (" + object.num + ")</option>"
        else
        {
            for(let [key, object2] of setBeingShowned)
            {
              const object = mapAgentBrowserToObject.get(key)
              if(object)
                s += "<option value='" + key + "' "+ (eval(selectedName) === key ? "selected" : "") +">" + key + " (" + object2.num + " of " + object.num + ")</option>"
            }
            s += "<option disabled>-----------</option>"
            for(let [key, object] of mapAgentBrowserToObject)
              if(!setBeingShowned.has(key))
                s += "<option value='" + key + "' "+ (eval(selectedName) === key ? "selected" : "") +">" + key + " (0 of " + object.num + ")</option>"
        }
        s += "</select> &nbsp;"
        return s
    }
//---------------------------------
} //class BaseLineFeatures
//---------------------------------

await BaseLineFeatures.myCheckBaseLinefeatures()

MyLLMroot.initialize()
BaseLineFeatures.initialize()

const LocalAIhardware = {
    hello,
    update_localAIhardware_mainTable,
    MyLLMroot,
    viewDataGridHTML,
    showAll_viewDataGrid,
    bestSettingsForThisType,
    minAVERAGEmax,
    loadCharProc,
    sortBest,
    ModelOfMyLLMroot,
    default_call_bestSettingsForThisType,
}

window.BaseLineFeatures = BaseLineFeatures
window.ModelOfMyLLMroot = ModelOfMyLLMroot
window.MyLLMroot = MyLLMroot


export default LocalAIhardware
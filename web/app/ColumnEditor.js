if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  ColumnEditor
//******************************************************************************
/**
 *   Popup window used to create and edit categories
 *
 ******************************************************************************/

javaxt.express.finance.ColumnEditor = function() {

    var me = this;
    var win, editor, preview;
    var sampleData;
    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var config = {};


    var defaultConfig = {
        style: javaxt.express.finance.style,
        script: "var parseColumns = function(columns){\n" +
                "    return columns;\n" +
                "};"
    };
    defaultConfig.style.grid = {
        container: {
            border: "1px solid #e2e2e2"
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Update grid style using table config
        var gridStyle = defaultConfig.style.grid;
        merge(gridStyle, config.style.table);
        gridStyle.headerColumn += " compact-table";
        gridStyle.column += " compact-table";



      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.className = "panel-toolbar";
        tr.appendChild(td);
        createToolbar(td);


      //Row 2
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createBody(td);



      //Create window
        var body = document.getElementsByTagName("body")[0];
        win = new javaxt.dhtml.Window(body, {
            width: 800,
            height: 600,
            valign: "middle",
            modal: true,
            body: table,
            style: merge({
                body: {
                    padding: "0px",
                    verticalAlign: "top",
                    color: "#484848"
                }
            }, config.style.window)
        });
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = document.createElement('div');


      //Add button
        var runButton = createButton(toolbar, {
            label: "Run",
            icon: "runIcon",
            disabled: false
        });
        runButton.onClick = runScript;


        var saveButton = createButton(toolbar, {
            label: "Save",
            icon: "saveIcon",
            disabled: false
        });
        saveButton.onClick = function(){
            me.onSubmit(editor.getValue());
        };

        parent.appendChild(toolbar);
    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){

        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;

      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "50%";
        tr.appendChild(td);
        createEditor(td);


      //Row 2
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "50%";
        tr.appendChild(td);
        createPreview(td);

        parent.appendChild(table);
    };



  //**************************************************************************
  //** createEditor
  //**************************************************************************
    var createEditor = function(parent){

        var onRender = function(){
            editor = CodeMirror(parent, {
                value: "",
                mode:  "javascript",
                lineNumbers: true,
                indentUnit: 4
            });

            editor.setValue = function(str){
                var doc = this.getDoc();
                doc.setValue(str);
                doc.clearHistory();

                var cm = this;
                setTimeout(function() {
                    cm.refresh();
                },200);
            };
            editor.getValue = function(){
                return this.getDoc().getValue();
            };
            editor.setValue(config.script);
        };

      //Check whether the table has been added to the DOM
        var w = parent.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = parent.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    onRender();
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            onRender();
        }

    };


  //**************************************************************************
  //** createPreview
  //**************************************************************************
    var createPreview = function(parent){
        preview = document.createElement("div");
        preview.style.height = "100%";
        parent.appendChild(preview);
    };


  //**************************************************************************
  //** reset
  //**************************************************************************
    this.reset = function(){
        if (editor) editor.setValue(config.script);
        sampleData = [];
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(script){
        if (editor){
            editor.setValue(script);
            runScript();
        }
    };


  //**************************************************************************
  //** loadData
  //**************************************************************************
    this.loadData = function(data){
        sampleData = data;
        var limit = 50;
        if (sampleData.length>limit) sampleData = sampleData.slice(0,limit);
        updateGrid(sampleData);
    };


  //**************************************************************************
  //** runScript
  //**************************************************************************
    var runScript = function(){
        (function (script) {
            try{
                eval(script);
                var rows = [];
                for (var i=0; i<sampleData.length; i++){
                    var cols = parseColumns(sampleData[i]);
                    rows.push(cols);
                    if (i>=100) break;
                }
                updateGrid(rows);
            }
            catch(e){
                alert(e);
            }
        })(editor.getValue());
    };


  //**************************************************************************
  //** updateGrid
  //**************************************************************************
    var updateGrid = function(data, colSpec){


      //Clear grid
        preview.innerHTML = "";


      //Define columns as needed
        if (!colSpec){
            colSpec = [];
            var numColumns = data[0].length;
            var header = alphabet.slice(0, numColumns);
            for (var i=0; i<numColumns; i++){
                colSpec.push({
                    header: header[i].toUpperCase(),
                    width: Math.round((1/numColumns)*100) + "%",
                    sortable: false
                });
            }
        }


      //Create grid and load data
        new javaxt.dhtml.DataGrid(preview, {
            style: config.style.grid,
            columns: colSpec
        }).load(data);

    };




    this.onCancel = function(){};
    this.onSubmit = function(script){};




    this.setTitle = function(str){
        win.setTitle(str);
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        win.show();
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        win.hide(); //same as close
    };


  //**************************************************************************
  //** close
  //**************************************************************************
    this.close = function(){
        win.close();
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(parent, btn){
        var defaultStyle = JSON.parse(JSON.stringify(config.style.toolbarButton));
        if (btn.style) btn.style = merge(btn.style, defaultStyle);
        else btn.style = defaultStyle;
        return javaxt.express.finance.utils.createButton(parent, btn);
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;


    init();
};
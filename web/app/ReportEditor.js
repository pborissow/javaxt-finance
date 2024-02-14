if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  ReportEditor
//******************************************************************************
/**
 *   Panel used to create and edit custom reports
 *
 ******************************************************************************/

javaxt.express.finance.ReportEditor = function(parent, config) {

    var me = this;
    var defaultConfig = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


        var table = createTable(parent);



      //Create toolbar
        createToolbar(table.addRow().addColumn("panel-toolbar"));


      //Create main div
        createBody(table.addRow().addColumn({ height: "100%" }));

        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** onClose
  //**************************************************************************
    this.onClose = function(){};


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(report){
        console.log(report);
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var table = createTable(parent);
        table.style.width = "";
        var tr = table.addRow();

        var backButton = createButton(tr.addColumn(), {
            label: "Reports",
            icon: "fas fa-th" //"fas fa-arrow-left"
        });
        backButton.onClick = function(){
            me.onClose();
        };


        createSpacer(tr.addColumn({verticalAlign: "bottom"}));


      //Add button
        var saveButton = createButton(tr.addColumn(), {
            label: "Save",
            icon: "fas fa-check-square"
        });
        saveButton.onClick = function(){

        };

    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){


      //Get default explorer nodes
        var defaultNodes = {};
        new bluewave.Explorer().getConfig().nodes.forEach((node)=>{
            defaultNodes[node.type] = node;
        });


      //Generate a list of nodes for explorer to use
        var nodes = [
            {
                title: "Database",
                type: "query",
                icon: "fas fa-database",
                editor: {
                    width: 1020,
                    height: 600,
                    resizable: true,
                    class: javaxt.express.finance.ReportQuery
                },
                inputNodes: []
            }
        ];
        ["filter", "pieChart", "barChart", "lineChart",
        "treeMapChart", "calendarChart"].forEach((nodeType)=>{
            var node = defaultNodes[nodeType];
            node.inputNodes.push("query");
            nodes.push(node);
        });




      //Instantiate explorer
        var explorer = new bluewave.Explorer(parent, {
            nodes: nodes,
            toolbar: {
                nodes: nodes.map(a => a.type)
            }
        });
        explorer.update();


        console.log(config);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var get = javaxt.dhtml.utils.get;

    var createButton = javaxt.express.finance.utils.createButton;
    var createSpacer = javaxt.express.finance.utils.createSpacer;

    init();
};
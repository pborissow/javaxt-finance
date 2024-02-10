if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.Dashboard = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {

    };

    var accountStats; //<--DataStore
    var accountChart, linkChart; //<--Chart.js


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;



      //Create table with 3 columns
        var table = createTable(parent);
        var tr = table.addRow();
        renderAccounts(tr.addColumn({ textAlign: "center" }));
        renderLinkStatus(tr.addColumn({ textAlign: "center" }));
        renderFreshness(tr.addColumn({ textAlign: "center" }));




      //Create data store
        getTransactionsPerAccount(orgConfig, function(){
            accountStats = orgConfig.stats.accounts;

            var updateCharts = function(){
                var data = {};
                for (var i=0; i<accountStats.length; i++){
                    var record = accountStats.get(i);
                    data[record.name] = record.count;
                }
                accountChart.load(data);
                linkChart.load(data);
            };
            updateCharts();

            var events = ["add", "remove", "update"];
            for (var i=0; i<events.length; i++){
                accountStats.addEventListener(events[i], function(){
                    updateCharts();
                }, me);
            }
        });


        me.el = table;
    };


  //**************************************************************************
  //** renderAccounts
  //**************************************************************************
    var renderAccounts = function(parent){
        var canvas = createCanvas(parent);
        var chart = createDoughnut(canvas);
        accountChart = chart;
        accountChart.load = function(data){
            var dataset = chart.data.datasets[0];
            dataset.data = [];

            for (var key in data) {
                if (data.hasOwnProperty(key)){
                    var val = data[key];
                    if (key!=="N/A"){
                        dataset.data.push(val);
                    }
                }
            }

            dataset.backgroundColor = [];
            dataset.borderWidth = [];
            var colorIndex = 0;
            var colors = javaxt.express.finance.style.colors;
            for (var i=0; i<dataset.data.length; i++){
                var color = colors[colorIndex];
                colorIndex++;
                if (colorIndex===dataset.data.length) colorIndex=0;
                dataset.backgroundColor.push(color);
                dataset.borderWidth.push(0);
            }
            dataset.hoverBackgroundColor = dataset.backgroundColor;

            chart.update();
        };

        createElement("div", parent, "dashboard-caption").innerText =
        "Transactions Per Account";
    };


  //**************************************************************************
  //** renderLinkStatus
  //**************************************************************************
    var renderLinkStatus = function(parent){
        var canvas = createCanvas(parent);
        var chart = createDoughnut(canvas);
        linkChart = chart;
        linkChart.load = function(data){
            var linked = 0;
            var unlinked = 0;
            for (var key in data) {
                if (data.hasOwnProperty(key)){
                    var val = data[key];
                    if (key==="N/A") unlinked = val;
                    else linked+= val;
                }
            }
            var dataset = chart.data.datasets[0];
            dataset.data[0] = linked;
            dataset.data[1] = unlinked;
            var percentLinked = (linked/(linked+unlinked))*100;
            //console.log(percentLinked);
            chart.update();
        };

        createElement("div", parent, "dashboard-caption").innerText =
        "Link Status";
    };


  //**************************************************************************
  //** renderFreshness
  //**************************************************************************
    var renderFreshness = function(parent){
        var canvas = createCanvas(parent);
        var chart = createDoughnut(canvas);

        createElement("div", parent, "dashboard-caption").innerText =
        "Freshness Score";
    };


  //**************************************************************************
  //** createCanvas
  //**************************************************************************
    var createCanvas = function(parent){
        var w = 250;
        var h = 250;
        var div = createElement("div", parent, {
            width: w+"px",
            height: h+"px",
            display: "inline-block"
        });
        
        var canvas = createElement("canvas", div, {
            width: w+"px",
            height: h+"px"
        });
        canvas.width = w;
        canvas.height = h;
        return canvas;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
    var createDoughnut = javaxt.express.finance.utils.createDoughnut;
    var getTransactionsPerAccount = javaxt.express.finance.utils.getTransactionsPerAccount;

    init();

};
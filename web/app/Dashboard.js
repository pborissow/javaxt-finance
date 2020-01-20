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



      //Create table with 2 rows
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        var row1 = td;

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        var row2 = td;

        parent.appendChild(table);
        me.el = table;



      //Create pie charts in row 1
        table = createTable();
        row1.appendChild(table);
        tbody = table.firstChild;
        tr = document.createElement("tr");
        tbody.appendChild(tr);

        td = document.createElement("td");
        td.style.textAlign = "center";
        tr.appendChild(td);
        renderAccounts(td);

        td = document.createElement("td");
        td.style.textAlign = "center";
        tr.appendChild(td);
        renderLinkStatus(td);

        td = document.createElement("td");
        td.style.textAlign = "center";
        tr.appendChild(td);
        renderFreshness(td);




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
            var d = (linked/(linked+unlinked))*100;
            console.log(d);
            chart.update();
        };
    };


  //**************************************************************************
  //** renderFreshness
  //**************************************************************************
    var renderFreshness = function(parent){
        var canvas = createCanvas(parent);
        var chart = createDoughnut(canvas);
    };


  //**************************************************************************
  //** createCanvas
  //**************************************************************************
    var createCanvas = function(parent){
        var w = 250;
        var h = 250;
        var div = document.createElement("div");
        div.style.width = w+"px";
        div.style.height = h+"px";
        div.style.display = "inline-block";
        parent.appendChild(div);

        var canvas = document.createElement("canvas");
        canvas.style.width = w+"px";
        canvas.style.height = h+"px";
        canvas.width = w;
        canvas.height = h;
        div.appendChild(canvas);
        return canvas;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createDoughnut = javaxt.express.finance.utils.createDoughnut;
    var getTransactionsPerAccount = javaxt.express.finance.utils.getTransactionsPerAccount;

    init();

};
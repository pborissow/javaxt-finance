if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.Dashboard = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        
    };


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



      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td;


        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        //td.innerHTML = "Dashboard";
        renderLinkStatus(td);

        parent.appendChild(table);
        me.el = table;
    };
    
    
  //**************************************************************************
  //** renderLinkStatus
  //**************************************************************************
    var renderLinkStatus = function(parent){
        
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
        var ctx = canvas.getContext('2d');

        var data = {
            labels: [
                "Value"
            ],
            datasets: [
                {
                    data: [0, 0],
                    backgroundColor: [
                        "#3ec556",
                        "#f8f8f8"
                    ],
                    hoverBackgroundColor: [
                        "#3ec556",
                        "rgba(0,0,0,0)"
                    ],
                    borderWidth: [
                        0, 0
                    ]
                }]
        };


        
        var chart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                cutoutPercentage: 88,
                animation: {
                    animationRotate: true,
                    duration: 2000
                },
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: false
                }
            }
        });
        
        
        var dataset = chart.data.datasets[0];
        
        get("report/linkStatus", {
            success: function(text){
                var stats = JSON.parse(text);
                stats.linked = 85;
                stats.unlinked = 15;
                dataset.data[0] = stats.linked;
                dataset.data[1] = stats.unlinked;
                var d = (stats.linked/(stats.linked+stats.unlinked))*100;
                console.log(d);
            },
            failure: function(request){
                alert(request);
            }
        });
        
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var post = javaxt.dhtml.utils.post;
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;


    init();

};
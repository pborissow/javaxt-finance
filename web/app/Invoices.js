if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.Invoices = function(parent, config) {

    var me = this;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td;


        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        td.innerHTML = "Invoices";


        parent.appendChild(table);
        me.el = table;
    };





  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var post = javaxt.dhtml.utils.post;
    var createTable = javaxt.dhtml.utils.createTable;


    init();

};
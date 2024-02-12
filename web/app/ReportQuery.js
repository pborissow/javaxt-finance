if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  QueryEditor
//******************************************************************************
/**
 *   Panel used to query for data
 *
 ******************************************************************************/

javaxt.express.finance.ReportQuery = function(parent, config) {

    var me = this;
    var defaultConfig = {
        queryService: "sql/"
    };

    var waitmask;
    var dbView;



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

        waitmask = config.waitmask;

        var div = createElement("div", parent, {
            height: "100%",
            overflow: "hidden",
            borderRadius: "0 0 5px 5px"
        });


        dbView = new javaxt.express.DBView(div, {
            waitmask: waitmask,
            style:{
                container: {
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#fff"
                },
                border: "1px solid #dcdcdc",
                table: javaxt.dhtml.style.default.table,
                toolbar: javaxt.dhtml.style.default.toolbar,
                toolbarButton: javaxt.dhtml.style.default.toolbarButton
            }

        });
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        dbView.clear();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(node){
        me.clear();


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, node.config);


      //Merge clone with default config
        merge(clone, config.chart);
        var nodeConfig = clone;


      //Update query
        var query = nodeConfig.query;
        if (query){
            query = query.trim();
            if (query.length>0){
                dbView.setQuery(query);
                dbView.executeQuery();
            }
        }
    };


  //**************************************************************************
  //** getConfig
  //**************************************************************************
    this.getConfig = function(){

        var config = {
            query: dbView.getQuery(),
            hasHeader: true //required for parseData() in Utils.js
        };


        var grid = dbView.getComponents().grid;
        if (grid) config.columns = grid.getConfig().columns;


        return config;
    };


  //**************************************************************************
  //** getData
  //**************************************************************************
  /** Returns all the records associated with the current query via a given
   *  callback. The data is a JSON array representing CSV data.
   */
    this.getData = function(callback){
        if (!callback) return;

        var query = dbView.getQuery();

        getCSV(query, function(csv){
            if (csv){
                csv = parseCSV(csv, {
                    headers: true
                });
            }
            else{
                csv = [];
            }

            callback.apply(me, [csv]);

        }, this);
    };



  //**************************************************************************
  //** getCSV
  //**************************************************************************
    var getCSV = function(query, callback, scope){

        if (!query || query.length===0){
            callback.apply(scope, []);
            return;
        }

        var payload = {
            query: query,
            format: "csv",
            limit: -1
        };

        post(config.queryService, JSON.stringify(payload), {
            success : function(text){
                if (text && text.length===0) text = null;
                callback.apply(scope, [text]);
            },
            failure: function(response){
                alert(response);
                callback.apply(scope, []);
            }
        });
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createElement = javaxt.dhtml.utils.createElement;
    var post = javaxt.dhtml.utils.post;
    var parseCSV = bluewave.utils.parseCSV;

    init();
};
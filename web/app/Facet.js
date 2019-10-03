if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};


//******************************************************************************
//**  Facet
//******************************************************************************
/**
 *   Used to render an individual facet in a facet panel.
 *   Requires javaxt.dhtml.Checkbox
 *
 ******************************************************************************/

javaxt.express.Facet = function(parent, config) {
    this.className = "javaxt.express.Facet";

    var me = this;
    var body;

    var defaultConfig = {

        title: "Title",

        style: {

            panel: {
                backgroundColor: "#e1f2ff",
                marginBottom: "8px"
            },

            header: {
                backgroundColor: "#b0d4f3",
                color: "#003a92",
                padding: "4px 8px"
            },

            body: {
                padding: "4px 8px"
            },

            label: {
                //fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "12px",
                color: "#3e3e3e",
                whiteSpace: "nowrap",
                cursor: "pointer",
                padding: "1px 0 0 5px"
            },

            checkmark: {
                content: "",
                display: "block",
                width: "4px",
                height: "7px",
                border: "solid #ffffff",
                borderWidth: "0 2px 2px 0",
                transform: "rotate(45deg)",
                margin: "1px 0 0 4px"
            }
        },

        sort: {
            field: "name", //or count
            direction: "desc"
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;



      //Merge config with default config
        config = merge(config, defaultConfig);


        var facet = document.createElement('div');
        setStyle(facet, config.style["panel"]);

        var header = document.createElement('div');
        setStyle(header, config.style["header"]);
        if (typeof config.title === "string"){
            header.innerHTML = config.title;
        }
        else{
            header.appendChild(config.title);
        }
        facet.appendChild(header);

        body = document.createElement('div');
        setStyle(body, config.style["body"]);
        facet.appendChild(body);


        parent.appendChild(facet);

    };


    this.onChange = function(){};


    this.getTitle = function(){
        return config.title;
    };

    this.getKey = function(){
        return config.key;
    };

    this.clear = function(){
        body.innerHTML = "";
    };

    this.getBody = function(){
        return body;
    };

  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update the facet with new data.
   */
    this.update = function(data){
        me.clear();

        var getLabel = config.getLabel;
        var filterName = config.key;


      //Convert data (json) into an array
        var arr = [];
        for (var key in data){
            if (data.hasOwnProperty(key)){
                arr.push({
                    label: key,
                    count: data[key]
                });
            }
        }


      //Sort the array as needed
        if (config.sort){
            var field = config.sort.field;
            var direction = config.sort.direction;

            if (field=="name"){
                if (direction==null) direction = "asc";
                arr.sort(function(a, b){
                    var x = a.label.toLowerCase();
                    var y = b.label.toLowerCase();
                    if (direction=="desc"){
                        if (x < y) {return 1;}
                        if (x > y) {return -1;}
                    }
                    else{
                        if (x < y) {return -1;}
                        if (x > y) {return 1;}
                    }
                    return 0;
               });
            }
            else if (field=="count"){
                if (direction==null) direction = "desc";
                arr.sort(function(a, b){
                    var x = a.count;
                    var y = b.count;
                    if (direction=="desc"){
                        if (x < y) {return 1;}
                        if (x > y) {return -1;}
                    }
                    else{
                        if (x < y) {return -1;}
                        if (x > y) {return 1;}
                    }
                    return 0;
               });
            }
        }


      //Iterate through the array and create facet labels and checkboxes
        for (var idx in arr){

            var entry = arr[idx];
            var count = entry.count;
            var label = entry.label;
            if (getLabel) label = getLabel(label);



          //Check whether the checkbox should be checked
            var checked = false;
            if (config.filter[filterName]){
                var arr = config.filter[filterName].split(",");
                for (var i=0; i<arr.length; i++){
                    if (arr[i]==entry.label+""){
                        checked = true;
                        break;
                    }
                }
            }


          //Create checkbox
            var div = document.createElement("div");
            var checkbox = new javaxt.dhtml.Checkbox(div,{
                label: label + " (" + count + ")",
                value: entry.label,
                checked: checked,
                style: {
                    label: config.style.label,
                    check: config.style.checkmark
                }
            });


          //Add custom property to the checkbox
            checkbox.filterName = filterName;


          //Add logic to update the filter whenever the user clicks the checkbox
            checkbox.onClick = function(checked){
                var filterName = this.filterName;
                var val = this.getValue()+"";
                var currFilter = config.filter[filterName];

                if (checked){

                  //Add val to filter
                    if (currFilter){
                        var updateFilter = true;
                        var arr = currFilter.split(",");
                        for (var i=0; i<arr.length; i++){
                            if (arr[i]==val){
                                updateFilter = false;
                                break;
                            }
                        }
                        if (updateFilter) config.filter[filterName] += "," + val;
                    }
                    else{
                        config.filter[filterName] = val;
                    }
                }
                else{

                  //Remove val from filter
                    if (currFilter){
                        var str = "";
                        var arr = currFilter.split(",");
                        for (var i=0; i<arr.length; i++){
                            if (arr[i]!=val){
                                if (str.length>0) str+= ",";
                                str += arr[i];
                            }
                        }
                        if (str.length>0){
                            config.filter[filterName] = str;
                        }
                        else{
                            delete config.filter[filterName];
                        }
                    }
                }

                me.onChange();
            };


            body.appendChild(div);
        }
    };


  //**************************************************************************
  //** Utilites
  //**************************************************************************
  /** Common functions found in Utils.js */
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;


    init();
};
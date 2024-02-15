package javaxt.express.finance;

import javaxt.express.finance.web.WebApp;
import javaxt.express.finance.utils.*;

import static javaxt.utils.Console.*;
import static javaxt.express.ConfigFile.*;

import javaxt.io.Jar;
import javaxt.json.*;
import javaxt.sql.*;
import java.util.*;


//******************************************************************************
//**  Main
//******************************************************************************
/**
 *   Command line interface used to start the web server or to run specialized
 *   functions (e.g. import data, maintenance scripts, tests, etc).
 *
 ******************************************************************************/

public class Main {

  //**************************************************************************
  //** Main
  //**************************************************************************
  /** Entry point for the application.
   */
    public static void main(String[] inputs) throws Exception {
        HashMap<String, String> args = parseArgs(inputs);


      //Get jar file and schema
        Jar jar = new Jar(Main.class);
        javaxt.io.File jarFile = new javaxt.io.File(jar.getFile());


      //Get config file
        javaxt.io.File configFile = (args.containsKey("-config")) ?
            getFile(args.get("-config"), jarFile) :
            new javaxt.io.File(jar.getFile().getParentFile(), "config.json");

        if (!configFile.exists()) {
            System.out.println("Could not find config file. Use the \"-config\" parameter to specify a path to a config");
            return;
        }



      //Initialize config
        Config.init(configFile, jar);
        Database database = Config.getDatabase();



      //Process command line arguments
        if (args.containsKey("-test")){

        }
        else if (args.containsKey("-maintenance")){
            Maintenance.parseArgs(inputs, database);
        }
        else{

          //Get web config
            JSONObject webConfig = Config.get("webserver").toJSONObject();
            if (webConfig==null){
                System.out.println("Config file is missing \"webserver\" config information");
                return;
            }

          //Override port config as needed
            Integer port = getValue(args, "-p", "-port").toInteger();
            if (port!=null) webConfig.set("port", port);


          //Start the web server
            new WebApp(webConfig, database).start();
        }
    }
}
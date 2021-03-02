package javaxt.express.finance;
import javaxt.express.finance.web.WebApp;
import javaxt.express.finance.utils.*;
import javaxt.utils.Console;
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

    private static Console console = new Console();


  //**************************************************************************
  //** Main
  //**************************************************************************
  /** Entry point for the application.
   */
    public static void main(String[] arr) throws Exception {
        HashMap<String, String> args = Console.parseArgs(arr);


      //Get jar file and schema
        Jar jar = new Jar(Main.class);
        javaxt.io.File jarFile = new javaxt.io.File(jar.getFile());


      //Get config file
        javaxt.io.File configFile = (args.containsKey("-config")) ?
            Config.getFile(args.get("-config"), jarFile) :
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
            Connection conn = null;
            try{
                //conn = database.getConnection();
                //conn.close();
            }
            catch(Exception e){
                if (conn!=null) conn.close();
                e.printStackTrace();
            }
        }
        else if (args.containsKey("-updateSources")){
            Maintenance.updateSources(arr[arr.length-1], database);
        }
        else{
            try{
                if (!Config.has("webserver")){
                    throw new Exception("Config file is missing \"webserver\" config information");
                }
                else{
                    JSONObject webConfig = Config.get("webserver").toJSONObject();
                    if (args.containsKey("-port")) webConfig.set("port", Integer.parseInt(args.get("-port")));
                    new WebApp(webConfig, database).start();
                }
            }
            catch(Exception e){
                e.printStackTrace();
            }
        }
    }
}
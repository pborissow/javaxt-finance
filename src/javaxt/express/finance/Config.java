package javaxt.express.finance;
import javaxt.express.utils.DbUtils;
import javaxt.json.*;
import javaxt.sql.*;
import java.util.*;


//******************************************************************************
//**  Config Class
//******************************************************************************
/**
 *   Provides thread-safe, static methods used to get and set application
 *   variables.
 *
 ******************************************************************************/

public class Config {

    private static javaxt.express.Config config = new javaxt.express.Config();

    private Config(){}


  //**************************************************************************
  //** init
  //**************************************************************************
  /** Used to load a config file (JSON) and initialize the database
   */
    public static void init(javaxt.io.File configFile, javaxt.io.Jar jar) throws Exception {

        JSONObject json = new JSONObject(configFile.getText());


      //Update relative paths in the database config (H2 only)
        JSONObject dbConfig = json.get("database").toJSONObject();
        if (dbConfig.has("path")){
            updateFile("path", dbConfig, configFile);
            String path = dbConfig.get("path").toString().replace("\\", "/");
            dbConfig.set("host", path);
            dbConfig.remove("path");
        }



      //Update relative paths in the schema config
        JSONObject schemaConfig = json.get("schema").toJSONObject();
        updateFile("path", schemaConfig, configFile);
        updateFile("updates", schemaConfig, configFile);



      //Update relative paths in the web config
        JSONObject webConfig = json.get("webserver").toJSONObject();
        updateDir("webDir", webConfig, configFile, false);
        updateDir("logDir", webConfig, configFile, true);
        updateDir("jobDir", webConfig, configFile, true);
        updateFile("keystore", webConfig, configFile);



      //Load config
        config.init(json);


      //Get database connection info
        Database database = getDatabase();


      //Update database properties as needed
        if (database.getDriver().equals("H2")){

          //Set H2 to PostgreSQL mode
            Properties properties = database.getProperties();
            if (properties==null){
                properties = new java.util.Properties();
                database.setProperties(properties);
            }
            properties.setProperty("MODE", "PostgreSQL");
            properties.setProperty("DATABASE_TO_LOWER", "TRUE");
            properties.setProperty("DEFAULT_NULL_ORDERING", "HIGH");
        }


      //Enable database caching
        database.enableMetadataCache(true);



      //Initialize schema (create tables, indexes, etc)
        javaxt.io.File schema = new javaxt.io.File(get("schema").get("path").toString());
        if (!schema.exists()) throw new Exception("Schema not found");
        String sql = schema.getText();
        if (schemaConfig.has("updates")){
            javaxt.io.File updates = new javaxt.io.File(get("schema").get("updates").toString());
            if (updates.exists()){
                sql += "\r\n";
                sql += updates.getText();
            }
        }
        String tableSpace = get("schema").get("tablespace").toString();
        boolean newDB = DbUtils.initSchema(database, sql, tableSpace);



      //Inititalize connection pool
        database.initConnectionPool();


      //Initialize models
        Model.init(jar, database.getConnectionPool());




      //Add default accounts and categories from the template
        if (newDB){
            JSONObject template = config.get("template").toJSONObject();
            if (template!=null){
                JSONArray accounts = template.get("accounts").toJSONArray();
                if (accounts!=null){
                    try{
                        for (int i=0; i<accounts.length(); i++){
                            String accountName = accounts.get(i).get("name").toString();
                            Account account = new Account();
                            account.setName(accountName);
                            account.setActive(true);
                            account.save();


                            JSONObject categories = accounts.get(i).get("categories").toJSONObject();
                            JSONArray income = categories.get("income").toJSONArray();
                            for (int j=0; j<income.length(); j++){
                                String categoryName = income.get(j).toString();
                                Category category = new Category();
                                category.setName(categoryName);
                                category.setAccount(account);
                                category.setIsExpense(false);
                                category.save();
                            }
                            JSONArray expenses = categories.get("expenses").toJSONArray();
                            for (int j=0; j<expenses.length(); j++){
                                String categoryName = expenses.get(j).toString();
                                Category category = new Category();
                                category.setName(categoryName);
                                category.setAccount(account);
                                category.setIsExpense(true);
                                category.save();
                            }
                        }
                    }
                    catch(Exception e){
                        e.printStackTrace();
                    }
                }
            }
        }
    }


  //**************************************************************************
  //** has
  //**************************************************************************
  /** Returns true if the config has a given key.
   */
    public static boolean has(String key){
        return config.has(key);
    }


  //**************************************************************************
  //** get
  //**************************************************************************
  /** Returns the value for a given key.
   */
    public static JSONValue get(String key){
        return config.get(key);
    }


  //**************************************************************************
  //** getDatabase
  //**************************************************************************
    public static javaxt.sql.Database getDatabase(){
        return config.getDatabase();
    }


  //**************************************************************************
  //** getFile
  //**************************************************************************
  /** Returns a File for a given path
   *  @param path Full canonical path to a file or a relative path (relative
   *  to the jarFile)
   */
    public static javaxt.io.File getFile(String path, javaxt.io.File jarFile){
        javaxt.io.File file = new javaxt.io.File(path);
        if (!file.exists()){
            file = new javaxt.io.File(jarFile.MapPath(path));
        }
        return file;
    }

    private static javaxt.io.File getFile(String path, java.io.File jarFile){
        return getFile(path, new javaxt.io.File(jarFile));
    }


  //**************************************************************************
  //** updateDir
  //**************************************************************************
  /** Used to update a path to a directory defined in a config file. Resolves
   *  both canonical and relative paths (relative to the configFile).
   */
    public static void updateDir(String key, JSONObject config, javaxt.io.File configFile, boolean create){
        if (config.has(key)){
            String path = config.get(key).toString();
            if (path==null){
                config.remove(key);
            }
            else{
                path = path.trim();
                if (path.length()==0){
                    config.remove(key);
                }
                else{

                    javaxt.io.Directory dir = new javaxt.io.Directory(path);
                    if (!dir.exists()) dir = new javaxt.io.Directory(configFile.MapPath(path));

                    if (!dir.exists() && create) dir.create();


                    if (dir.exists()){
                        config.set(key, dir.toString());
                    }
                    else{
                        config.remove(key);
                    }
                }
            }
        }
    }


  //**************************************************************************
  //** updateFile
  //**************************************************************************
  /** Used to update a path to a file defined in a config file. Resolves
   *  both canonical and relative paths (relative to the configFile).
   */
    public static void updateFile(String key, JSONObject config, javaxt.io.File configFile){
        if (config.has(key)){
            String path = config.get(key).toString();
            if (path==null){
                config.remove(key);
            }
            else{
                path = path.trim();
                if (path.length()==0){
                    config.remove(key);
                }
                else{

                    javaxt.io.File file = new javaxt.io.File(path);
                    if (!file.exists()) file = new javaxt.io.File(configFile.MapPath(path));

                    config.set(key, file.toString());
//                    if (file.exists()){
//                        config.set(key, file.toString());
//                    }
//                    else{
//                        config.remove(key);
//                    }
                }
            }
        }
    }
}
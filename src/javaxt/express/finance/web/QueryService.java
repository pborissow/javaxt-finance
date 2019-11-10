package javaxt.express.finance.web;
import javaxt.json.JSONObject;
import javaxt.utils.Console;


//******************************************************************************
//**  QueryService
//******************************************************************************
/**
 *   Provides a set of web methods used to query the database.
 *
 ******************************************************************************/

public class QueryService extends javaxt.express.services.QueryService {
    private static Console console = new Console();

    public QueryService(javaxt.sql.Database database, JSONObject config){
        super(database, getJobDir(config), getLogDir(config));
    }

    private static javaxt.io.Directory getJobDir(JSONObject config){
        javaxt.io.Directory jobDir = null;
        if (config.has("jobDir")){
            String dir = config.get("jobDir").toString().trim();
            if (dir.length()>0){
                jobDir = new javaxt.io.Directory(dir);
                jobDir = new javaxt.io.Directory(jobDir.toString() + "sql");
                jobDir.create();
            }
        }
        if (jobDir==null || !jobDir.exists()){
            throw new IllegalArgumentException("Invalid \"jobDir\" defined in the \"webserver\" section of the config file");
        }
        console.log("jobDir: " + jobDir);
        return jobDir;
    }

    private static javaxt.io.Directory getLogDir(JSONObject config){
        javaxt.io.Directory logDir = null;
        if (config.has("logDir")){
            String dir = config.get("logDir").toString().trim();
            if (dir.length()>0){
                logDir = new javaxt.io.Directory(dir);
                logDir = new javaxt.io.Directory(logDir.toString() + "sql");
                logDir.create();
                if (logDir.exists()) console.log("logDir: " + logDir);
            }
        }
        return logDir;
    }
}
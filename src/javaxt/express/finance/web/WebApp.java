package javaxt.express.finance.web;

import java.util.*;
import java.io.IOException;
import java.security.KeyStore;
import java.net.InetSocketAddress;

import javaxt.express.*;
import javaxt.express.notification.*;
import javaxt.express.Authenticator;

import javaxt.http.servlet.*;

import javaxt.json.*;
import static javaxt.utils.Console.*;


public class WebApp extends HttpServlet {

    private javaxt.io.Directory web;
    private javaxt.io.Directory logDir;
    private ArrayList<InetSocketAddress> addresses;
    private FileManager fileManager;
    private WebServices ws;
    private Logger logger;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public WebApp(JSONObject config, javaxt.sql.Database database) throws Exception {


      //Set path to the web directory
        if (config.has("webDir")){
            String webDir = config.get("webDir").toString();
            web = new javaxt.io.Directory(webDir);
            if (!web.exists() || webDir.length()==0){
                throw new IllegalArgumentException("Invalid \"webDir\" defined in config file");
            }
        }
        console.log("webDir: " + web);



      //Get keystore
        KeyStore keystore = null;
        char[] keypass = null;
        if (config.has("keystore") && config.has("keypass")){
            try{
                keypass = config.get("keypass").toString().toCharArray();
                keystore = KeyStore.getInstance("JKS");
                keystore.load(new java.io.FileInputStream(config.get("keystore").toString()), keypass);
            }
            catch(Exception e){
                keystore = null;
                keypass = null;
            }
        }



      //Instantiate file manager
        fileManager = new FileManager(web);



      //Instantiate web services
        ws = new WebServices(database, config);



      //Instantiate authenticator
        setAuthenticator(new Authenticator(){
            public java.security.Principal getPrinciple(){

                User user = (User) getUser();
                if (user!=null) return user;

                try{
                    /*
                    //TODO: Authenticate the user
                    String[] credentials = getCredentials();
                    String username = credentials[0];
                    String password = credentials[1];

                    if (username!=null && password!=null){

                    }
                    */

                    user = new User(); //admin user
                }
                catch(Exception e){
                }

                setUser(user);
                return user;
            }
        });



      //Generate list of socket addresses to bind to
        addresses = new ArrayList<>();
        Integer port = config.get("port").toInteger();
        addresses.add(new InetSocketAddress("0.0.0.0", port==null ? 80 : port));
        if (keystore!=null){
            try{
                setKeyStore(keystore, new String(keypass));
                setTrustStore(keystore);
                addresses.add(new InetSocketAddress("0.0.0.0", port==null ? 443 : port));
            }
            catch(Exception e){
                //e.printStackTrace();
            }
        }


      //Get log directory
        if (config.has("logDir")){
            String path = config.get("logDir").toString();
            if (path.length()>0){
                logDir = new javaxt.io.Directory(path);
                console.log("logDir: " + logDir);
            }
        }
    }


  //**************************************************************************
  //** start
  //**************************************************************************
  /** Used to start the HTTP server and logger
   */
    public void start(){
      //Start web logger
        if (logDir!=null){
            logger = new Logger(logDir.toFile());
            new Thread(logger).start();
        }


      //Start the server
        int threads = 50;
        javaxt.http.Server server = new javaxt.http.Server(addresses, threads, this);
        server.start();
    }


  //**************************************************************************
  //** processRequest
  //**************************************************************************
  /** Used to process http get and post requests.
   */
    public void processRequest(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {


        if (logger!=null) logger.log(request);



      //Check if the server support HTTPS
        if (this.supportsHttps()){

          //Set "Content-Security-Policy"
            response.setHeader("Content-Security-Policy", "upgrade-insecure-requests");


          //Redirect http request to https as needed
            javaxt.utils.URL url = new javaxt.utils.URL(request.getURL());
            if (!url.getProtocol().equalsIgnoreCase("https")){
                url.setProtocol("https");
                response.sendRedirect(url.toString(), true);
                return;
            }
        }


      //Get path from url, excluding servlet path and leading "/" character
        String path = request.getPathInfo();
        if (path!=null) path = path.substring(1);


      //Get first "directory" in the path
        String service = path==null ? "" : path.toLowerCase();
        if (service.contains("/")) service = service.substring(0, service.indexOf("/"));


      //Generate response
        Authenticator authenticator = (Authenticator) getAuthenticator(request);
        if (!authenticator.handleRequest(service, response)){


          //Send static file if we can
            if (service.length()==0){

              //If the service is empty, send welcome file (e.g. index.html)
                fileManager.sendFile(request, response);
                return;
            }
            else{

              //Check if the service matches a file or folder in the web
              //directory. If so, send the static file as requested.
                for (Object obj : web.getChildren()){
                    String name = null;
                    if (obj instanceof javaxt.io.File){
                        name = ((javaxt.io.File) obj).getName();
                    }
                    else{
                        name = ((javaxt.io.Directory) obj).getName();
                    }
                    if (service.equalsIgnoreCase(name)){
                        fileManager.sendFile(request, response);
                        return;
                    }
                }
            }



          //If we're still here, we either have a bad file request or a web
          //service request. In either case, send the request to the
          //webservices endpoint to process.
            ws.processRequest(request, response);
        }
    }


}
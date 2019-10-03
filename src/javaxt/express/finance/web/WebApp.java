package javaxt.express.finance.web;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.security.KeyStore;
import java.util.*;

import javaxt.express.*;
import javaxt.http.servlet.*;
import javaxt.json.*;
import javaxt.utils.Console;

public class WebApp extends HttpServlet {

    private javaxt.io.Directory web;
    private FileManager fileManager;
    private WebServices ws;
    private Console console = new Console();
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
        String downloadDir = config.get("downloadDir").toString();
        if (downloadDir!=null){
            if (downloadDir.length()>0){
                javaxt.io.Directory dir = new javaxt.io.Directory(downloadDir);
                ws = new WebServices(database, dir);
            }
        }
        if (ws==null) throw new IllegalArgumentException(
            "Failed to instantiate webservices. Check if \"downloads\" is defined in config file");



      //Instantiate authenticator
        //setAuthenticator(new Authenticator());



      //Generate list of socket addresses to bind to
        ArrayList<InetSocketAddress> addresses = new ArrayList<>();
        addresses.add(new InetSocketAddress("0.0.0.0", 80));
        if (keystore!=null){
            try{
                setKeyStore(keystore, new String(keypass));
                setTrustStore(keystore);
                addresses.add(new InetSocketAddress("0.0.0.0", 443));
            }
            catch(Exception e){
                //e.printStackTrace();
            }
        }


      //Start web logger
        if (config.has("logDir")){
            String path = config.get("logDir").toString();
            if (path.length()>0){
                javaxt.io.Directory logDir = new javaxt.io.Directory(path);
                console.log("logDir: " + logDir);
                logger = new Logger(logDir.toFile());
                new Thread(logger).start();
            }
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



      //Get credentials
        String[] credentials = request.getCredentials();


      //Generate response
        if (service.equals("login")){
            if (credentials==null){
                response.setStatus(401, "Access Denied");
                response.setHeader("WWW-Authenticate", "Basic realm=\"Access Denied\""); //<--Prompt the user for thier credentials
                response.setContentType("text/plain");
                response.write("Unauthorized");
            }
            else{
                try{
                    request.authenticate();
                    //response.setContentType("application/json");
                    //response.write(((User) request.getUserPrincipal()).toJson().toString());
                    response.write(request.getUserPrincipal().getName());
                }
                catch(Exception e){
                    response.setStatus(403, "Not Authorized");
                    response.setContentType("text/plain");
                    response.write("Unauthorized");
                }
            }
        }
        else if (service.equals("logoff") || service.equalsIgnoreCase("logout")){
            response.setStatus(401, "Access Denied");
            Boolean prompt = new javaxt.utils.Value(request.getParameter("prompt")).toBoolean(); //<--Hack for Firefox
            if (prompt!=null && prompt==true){
                response.setHeader("WWW-Authenticate", "Basic realm=\"" +
                "This site is restricted. Please enter your username and password.\"");
            }
            response.setContentType("text/plain");
            response.write("Unauthorized");
        }
        else if (service.equals("whoami")){
            String username = (credentials!=null) ? credentials[0] : null;
            if (username==null || username.equals("logout")) throw new ServletException(400);
            else{
                response.setContentType("text/plain");
                response.write(username);
            }
        }
        else{



          //Send static file if we can
            if (service.length()==0){

              //If the service is empty, send welcome file (e.g. index.html)
                fileManager.sendFile(request, response);
                return;
            }
            else{

              //Check if the service matches a file or folder in the web directory.
              //If so, send the static file as requested. Note that the current
              //implementation searches the web directory for each http request,
              //which is terribly inefficient. We need some sort of caching with
              //a file watcher...
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
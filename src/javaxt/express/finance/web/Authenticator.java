package javaxt.express.finance.web;
import javaxt.http.servlet.*;

//******************************************************************************
//**  ServiceAuthentication
//******************************************************************************
/**
 *   Used to authenticate HTTP requests and assign a user principle
 *
 ******************************************************************************/

public class Authenticator implements javaxt.http.servlet.Authenticator {


  //Local variables
    private String[] credentials;
    private static User user = new User();


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Constructor that can be used to set up global variables.
   */
    public Authenticator(){
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class and parse user credentials. Called
   *  with each HTTP request via the newInstance() method.
   */
    public Authenticator(HttpServletRequest request){
    }


  //**************************************************************************
  //** newInstance
  //**************************************************************************
  /** Creates a new instance of this class. Called with each HTTP request.
   */
    public Authenticator newInstance(HttpServletRequest request){
        return new Authenticator(request);
    }


  //**************************************************************************
  //** getCredentials
  //**************************************************************************
  /** Returns username/password associated with an HTTP request.
   */
    public String[] getCredentials() {
        return credentials;
    }


  //**************************************************************************
  //** authenticate
  //**************************************************************************
  /** Used to authenticate a client request. If the Authenticator fails to
   *  authenticate the client, this method throws a ServletException.
   */
    public void authenticate() throws ServletException {
        if (user==null) throw new ServletException();
    }


  //**************************************************************************
  //** getPrinciple
  //**************************************************************************
  /** Returns an implementation of a java.security.Principal.
   */
    public User getPrinciple(){
        return user;
    }


  //**************************************************************************
  //** isUserInRole
  //**************************************************************************
  /** Not implemented. Returns a null.
   */
    public boolean isUserInRole(String role){
        return false;
    }


  //**************************************************************************
  //** getAuthType
  //**************************************************************************
  /** Returns the authentication scheme used to authenticate clients. In this
   *  case, we use "BASIC" authentication.
   */
    public String getAuthType(){
        return null; //BASIC_AUTH;
    }

}
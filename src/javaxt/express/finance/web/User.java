package javaxt.express.finance.web;

public class User implements java.security.Principal, javaxt.express.User {
    private String username = "admin";
    private long id = 1;
    private int accessLevel = 5;

    public String getName(){
        return username;
    }
    public Long getID(){
        return id;
    }
    public int getAccessLevel(){
        return accessLevel;
    }
}
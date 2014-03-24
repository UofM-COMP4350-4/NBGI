Networked BoardGame Infrastructure
====

Winter 2014 Project for Software Engineering 2 Group 4

Website Access: http://ec2-54-213-160-158.us-west-2.compute.amazonaws.com

##Setup/Initialization
###Server
install mysql for node
	npm install mysql
	
Run Tools:
 1. update-repo   
 2. initialize   
 3. build-web-app   
 4. run-server (in sudo and with & to run it in the background)   

##Database
###Database Access:

```sh
mysql -h host -u root -p #you can append database name here, -p will make it so that mysql will prompt you for a password
```

###How to remotely connect to the database
- We can't access the database because we dont have remote access
for our root user. It is strongly frowned upon to create remote access
for the root user since its the admin user so i created a new user  
- below is the code to grant a user local and remote access:

```mysql
GRANT ALL ON *.* TO 'ubuntu'@'localhost'; //local access
GRANT ALL ON *.* TO 'ubuntu'@'%'; //remote access
``` 

- you may have to set the password for ubuntu:

```mysql
SET PASSWORD FOR 'ubuntu'@'localhost' = PASSWORD("");
```

- Next to enable remote access, from your home directory (home/ubuntu/NBGI) run :
	sudo vi /etc/mysql/my.cnf
	- change bind-address to your aws instances public dns.
	- Also, go to your AWS instance and add a new inbound rule for mysql (if you
	dont have one)
	- That's all you need

- You mat have to change the hostname in server.js, relationDBTests, and relationDB

##Tools
* `initialize.[bat|sh]` - Run after cloning repo. Will pull submodules and node libraries
* `update-repo.[bat|sh]` - Updates the repo and submodules to current state
* `build-webapp.[bat|sh]` - Builds the Enyo web client and copies it to the server/public directory
* `run-server.[bat|sh]` - Run the node server, with optional argument port and ip as passed arguments.

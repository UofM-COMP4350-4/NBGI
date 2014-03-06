Networked BoardGame Infrastructure
====

Winter 2014 Project for Software Engineering 2 Group 4

Website Access: http://ec2-54-213-160-158.us-west-2.compute.amazonaws.com

Database Access:
* Enter mysql -u root -p
* Enter pass as Group4

How to remotely connect to the database
- We can't access the database because we dont have remote access
for our root user. It is strongly frowned upon to create remote access
for the root user since its the admin user so i created a new user
- GRANT ALL ON *.* TO 'ubuntu'@'localhost'; //local access
- GRANT ALL ON *.* TO 'ubuntu'@'%'; //remote access
	- The above query creates a user 'ubuntu' with no password (forget the password for now)
- Next to enable remote access, from your home directory (home/ubuntu/NBGI) run :
	sudo vi ../../../etc/mysql/my.cnf
	- change bind-address = 127.0.0.1 to 0.0.0.0
	- Also, go to your AWS instance and add a new inbound rule for mysql (if you
	dont have one)
	- That's all you need

**Tools**
* `initialize.[bat|sh]` - Run after cloning repo. Will pull submodules and node libraries
* `update-repo.[bat|sh]` - Updates the repo and submodules to current state
* `build-webapp.[bat|sh]` - Builds the Enyo web client and copies it to the server/public directory
* `run-server.[bat|sh]` - Run the node server, with optional argument port and ip as passed arguments.

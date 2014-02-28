var assert = require("assert");
var serverJS = require("../server.js");
var http = require("http");


/*  Server Tests
 *  Use: Test class to be used with Mocha.  Tests the Server.js functions.
 */

function setup(path, text, callback){
	var options = {
		host: "localhost",
		path: path + "?" + text
		//data: text
	};
	
	var req = http.request(options, callback);
	req.end();
}
			
describe('Server Test Suite', function(){
	describe('Server Test Class', function() {
		//Test valid data sent to the Server's /initialize method
		it('Test: Valid Initialize Data', function() {
			var path = "/initialize";
			var text = "userID=5";
			var userData = "";
						
			var callback = function(response)
			{
				response.on('error', function(err){
					console.log("Error received" + err);
				});
				
				response.on('data', function(chunk){					
					userData += chunk;
				});
				
				response.on('end', function(){
					userData = JSON.parse(userData);//parse out the JSON object
					console.log("Data received " + userData.userID);
					assert.equal(response.statusCode, 200);
					assert.notEqual(userData, undefined);
					assert.equal(userData.userID, 1);
				});		
			};
			
			setup(path, text, callback);
		});
		
		//Test invalid data sent to the Server's /initialize method
		it('Test: Invalid Initialize Data', function() {
			var path = "/initialize";
			var text = "userID=-1";
			var userData = "{}";
						
			callback = function(response)
			{
				response.on('error', function(err){
					console.log("Error received" + err);
				});
				
				response.on('data', function(chunk){					
					userData += chunk;
				});
				
				response.on('end', function(){
					userData = JSON.parse(userData);//parse out the JSON object
					console.log("Data received " + userData.userID);
					assert.notEqual(response.statusCode, 200);
					assert.notEqual(userData, undefined);
					assert.equal(userData.userID, undefined);
				});		
			};
			
			setup(path, text, callback);
		});
		
		it('Test: CreateNewGame Invalid data', function() {
			//console.log("I get here test 2");
		});
		
		it('Test: Inivialize Invalid Data', function() {
			//console.log("I get here test 3");
		});
	});
});
enyo.singleton({
	name: "ClientServerComm",
	kind: "Component",
	components: [
		{ kind:"Socket", name:"gameSocket", url:"http://localhost:10089", 
			onmatchFound:"onMatchFound", onreceivePlayResult:"onReceivePlayResult", 
			onclientConnectedToServer:"onClientConnected" }
	],
	
	create: function() {
		this.inherited(arguments);
		//this.initialize( "1", enyo.bind(this, "initCallback"));
	},
	
	createSocket: function() {		
		this.$.gameSocket.connect();
	},
	
	onClientConnected: function() {
		if(window.userID)
		{
			this.$.gameSocket.emit('userSetup', window.userID);
		}
		else
		{
			this.log('Invalid userID found');
		}
	},
	
	onMatchFound: function(inSender, inEvent) {
		// initialize the game board
		this.log('Received on match found event');
	},
	
	onReceivePlayResult: function(inSender, inEvent) {
		enyo.Signals.send("playResult", {gameboard:inEvent});
	},
	
	sendUserSetupEvent: function(userID) {
		this.log("Sending " + userID + " to the server.");
		this.$.gameSocket.emit('userSetup', userID);
	},
	
	sendPlayMoveEvent: function(move) {
		this.$.gameSocket.emit('receiveMove', move);
	},
	
	//request a list of games from the Server
	listGames: function(callback)
	{
		var request = new enyo.Ajax({
			url: "listOfGames",
			method: "GET",
			handleAs: "json"
		});
		//this.log("list of games request sent");
		request.response(enyo.bind(this, "listOfGamesResponse", callback));
		request.go();
	},
	
	listOfGamesResponse: function(callback, request, response)
	{
		this.log("response received");
		if(response)
		{		
			this.log(response);
			callback(response.games);
		}
	},
	
	queueForGame: function(userID, gameID, callback) {
		//This method is supposed to send an AJAX call
		// to the Server to create a new game (userID, gameID) and use the
		// resulting object from the server to create a game view
		var request = new enyo.Ajax({
			url: "http://localhost/queueForGame", //URL goes here
			method: "GET", //You can also use POST
			handleAs: "json" //options are "json", "text", or "xml"
		});
		request.response(enyo.bind(this, "queueResponse", callback)); //tells Ajax what the callback function is
		request.go({userid: userID, gameid: gameID});		
	},
	
	queueResponse: function(callback, request, response){
		callback(response.err);
	},
	
	createNewGame: function(userid, gameID, callback) {
		//This method is supposed to send an AJAX call
		// to the Server to create a new game (userID, gameID) and use the
		// resulting object from the server to create a game view
		var request = new enyo.Ajax({
			url: "createNewGame", //URL goes here
			method: "GET", //You can also use POST
			handleAs: "json" //options are "json", "text", or "xml"
		});
		this.view.$.createGameButton.setContent("Game Created 1");
		request.response(enyo.bind(this, "createGameResponse", callback)); //tells Ajax what the callback function is
		request.go({userID: userid, gameid: gameID});		
	},
	
	initialize: function(userID, callback) {
		var request = new enyo.Ajax({
			url: "http://localhost/initialize", //URL goes here
			method: "GET", //You can also use POST
			handleAs: "json" //options are "json", "text", or "xml"
		});
		request.response(enyo.bind(this, "initializeResponse", callback)); //tells Ajax what the callback function is
		request.go({userid: userID});
	},
	
	initializeResponse: function(callback, request, response) {
		if(response)
		{
			this.log(response);
			this.log('Server responded with userID: ' + response.user.userID);
			callback(response);
			this.createSocket();
		}		
	},
	
	createGameResponse: function(callback, request, response) {
		if (response) 
		{
			this.log(response);
			callback(response.instanceID, response.url);
		}		
	}
});
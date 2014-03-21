var Matchmaker = require('../models/GameMatchmaker.js').GameMatchmaker;
var GameMgmnt = require('../models/GameManagement.js');
var GameSocket = require('../controllers/GameSocketController.js').createGameSocket(10086);
var Validator = require('./ValidateObjectController.js');

var noop = function() {};

GameSocket.on("userDisconnect", function(inEvent) {
	module.exports.leaveAllMatchmaking(inEvent.userID);
});

module.exports = {
	// recieves inital queue request, validates it and passes it on to matchmaking
	joinMatchmaking: function(userID, gameID, callback){
		Validator.ValidateArgs(arguments, Number, Number, Validator.OPTIONAL);
		callback = callback || noop;
		Matchmaker.joinQueue(userID, gameID);
		module.exports.checkForMatch(gameID, function(response) {
			callback(response);
		});
	},
	checkForMatch: function(gameID, callback) {
		Validator.ValidateArgs(arguments, Number, Validator.OPTIONAL);
		callback = callback || noop;
		GameMgmnt.availableGames(function(gameList){
			var maxPlayers = 2;
			var queue = Matchmaker.getGameQueue(gameID);
			for(var i=0; i<gameList.length; i++) {
				if(gameList[i].gameID==gameID) {
					maxPlayers = gameList[i].maxPlayers;
					break;
				}
			}
			if(Matchmaker.queueTotal(gameID)>=maxPlayers) {
				GameMgmnt.setupMatch(gameID, undefined, function(instanceID) {
					var players = [];
					var addUsersToMatch = function() {
						if(players.length<maxPlayers) {
							var currUser = queue.shift();
							players.push(currUser);
							GameMgmnt.joinMatch(currUser, instanceID, function(err) {
								if(err) {
									count--;
								}
								addUsersToMatch();
							});
						} else {
							GameMgmnt.getGameboard(instanceID, gameID, function(gb) {
								for(var i=0; i<players.length; i++) {
									console.log(players[i]);
									console.log(JSON.stringify(gb));
									GameSocket.sendMatchEvent(players[i], gb);
								}
								callback(gb);
							});
						}
					};
					addUsersToMatch();
				});
			} else {
				callback();
			}
		});
	},
	leaveAllMatchmaking: function(userID){
		Validator.ValidateArgs(arguments, Number);
		Matchmaker.removeFromQueue(userID);
	},
	reset: function() {
		Matchmaker.clearQueue();
	}
};

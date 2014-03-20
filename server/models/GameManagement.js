var Validator = require("../controllers/ValidateObjectController.js");
var DataStore = require('../controllers/DataStoreController.js');
var GameSocket = require('../controllers/GameSocketController.js').createGameSocket(10086);
var Player = require('./Player.js').Player;

//used to ensure a unique instanceID in conjunction with datetime
var serverInstanceBase = 0;
// All game instances currently loaded in memory.
// Games get saved to database when all users disconnect
// Note: Guest users do not have their data retained
var matches = {};
// All online users
var onlineUsers = [];
// Cache of available games
var availGames;
var GameDefinitions = {};
var noop = function() {};

GameSocket.on("userConnect", function(inEvent) {
	module.exports.userConnected(inEvent.userID, noop);
});
GameSocket.on("moveReceived", function(inEvent) {
	if(matches[inEvent.instanceID]) {
		matches[inEvent.instanceID].RequestMove(inEvent);
	}
});
GameSocket.on("userDisconnect", function(inEvent) {
	module.exports.userDisconnected(inEvent.userID, noop);
});

var moveFailureHandler = function(inEvent) {
	GameSocket.SendDataToUser(inEvent.userToPlay, inEvent);
};
var boardChangedHandler = function(inEvent) {
	GameSocket.SendDataToAllUsersInGame(inEvent.instanceID, inEvent);
};
var playResultHandler = function(inEvent) {
	GameSocket.SendDataToAllUsersInGame(inEvent.instanceID, inEvent);
};

module.exports = {
	// Gets the static list of game IDs, game names, and max players
	availableGames: function(callback) {
		Validator.ValidateArgs(arguments, Function);
		if(!availGames) {
			DataStore.getListOfGames(function(gamesEntries) {
				availGames = gamesEntries;
				callback(availGames);
			});
		} else {
			callback(availGames);
		}
	},
	// Creates a new game for a game ID and then 
	setupMatch: function(gameID, instanceID, callback) {
		Validator.ValidateArgs(arguments, Number, Validator.OPTIONAL, Function);
		console.log('SetupMatch: gameID-' + gameID + ' instanceID-' + instanceID);
		module.exports.gameTypeFromID(gameID, function(gameType) {
			if(!GameDefinitions[gameID]) {
				GameDefinitions[gameID] = require("../controllers/" + gameType + "GameController.js")[gameType + "GameController"];
			}
			if(instanceID!==undefined) {
				instanceID = parseInt(instanceID, 10);
				if(matches[instanceID]) {
					callback(instanceID);
				} else {
					module.exports.getGameboard(instanceID, function(gb) {
						console.log('SetupMatch: Gameboard returned from GetGameboard is ' + JSON.stringify(gb));
						if(gb) {
							matches[instanceID] = new GameDefinitions[gameID](gb);
							matches[instanceID].on("moveFailure", moveFailureHandler);
							matches[instanceID].on("boardChanged", boardChangedHandler);
							matches[instanceID].on("playResult", playResultHandler);
						} else {
							// Special case where game entry exists, but gameboard data missing
							matches[instanceID] = new GameDefinitions[gameID]({instanceID:instanceID, gameID:gameID});
							matches[instanceID].on("moveFailure", moveFailureHandler);
							matches[instanceID].on("boardChanged", boardChangedHandler);
							matches[instanceID].on("playResult", playResultHandler);
						}
						
						DataStore.lookupMatch(instanceID, function(entries) {
								console.log('SetupMatch: Entried returned from lookupMatch are ' + JSON.stringify(entries));
								var loadPlayers = function() {
									// load other players into game
									if(entries.length>0) {
										var curr = entries.pop();
										module.exports.joinMatch(curr.userID, instanceID, loadPlayers);
									} else {
										callback(instanceID);
									}
								};
								loadPlayers();
						});
					});
				}
			} else {
				var id = ((new Date().getTime())*100) + (serverInstanceBase%100);
				matches[id] = new GameDefinitions[gameID]({instanceID:id, gameID:gameID});
				matches[id].on("moveFailure", moveFailureHandler);
				matches[id].on("boardChanged", boardChangedHandler);
				matches[id].on("playResult", playResultHandler);
				serverInstanceBase++;
				callback(id);
			}
		});
	},
	joinMatch: function(userID, instanceID, callback) {
		Validator.ValidateArgs(arguments, Number, Number, Function);
		if(matches[instanceID]) {
			console.log('JoinMatch: InstanceID passed in is ' + instanceID);
			console.log('JoinMatch: Players are ' + JSON.stringify(matches[instanceID].gameBoard.players));
			if(matches[instanceID].gameBoard.players.length < matches[instanceID].gameBoard.maxPlayers) {
				module.exports.userNameFromID(userID, function(userName) {
					console.log('JoinMatch: UserName returned from userNameFromID is ' + userName);
					matches[instanceID].gameBoard.AddPlayer(new Player(userID, userName));
					console.log('JoinMatch: ' + JSON.stringify(matches[instanceID].gameBoard.players));
					console.log('JoinMatch: ' + JSON.stringify(matches[instanceID]));
					GameSocket.JoinRoom(userID, instanceID);
					callback();
				});
			} else {
				callback({errorCode:1, errorText:"Game full"});
			}
		} else {
			DataStore.lookupMatch(instanceID, function(entries) {
				console.log('JoinMatch: Entries returned from lookupMatch: ' + JSON.stringify(entries));
				if(entries && entries.length>0) {
					module.exports.setupMatch(entries[0].gameID, instanceID, function(id) {
						module.exports.joinMatch(userID, instanceID, callback);
					});
				} else {
					throw new Error("Instance does not exist: " + instanceID);
				}
			});
		}
	},
	leaveMatch: function(userID, instanceID, callback) {
		Validator.ValidateArgs(arguments, Number, Number, Function);
		DataStore.removeFromMatch(instanceID, userID, function(err) {
			if(matches[instanceID]) {
				// TODO: add proper function call to game match to remove user
				for(var i=0; i<matches[instanceID].gameBoard.players.length; i++) {
					if(matches[instanceID].gameBoard.players[i].id == userID) {
						matches[instanceID].gameBoard.players.splice(i, 1);
					}
				}
				GameSocket.LeaveRoom(userID, instanceID);
				if(matches[instanceID].gameBoard.players.length<=1) {
					// TODO handle win/draw/end of game to socket
					delete matches[instanceID];
					GameSocket.CloseRoom(instanceID);
					DataStore.endMatch(instanceID, callback);
				} else {
					callback();
				}
			} else {
				DataStore.lookupMatch(instanceID, function(entries) {
					if(!entries || entries.length<=1) {
						// Somehow we got to this sitatuation. Possibly magic? Do cleanup!
						DataStore.endMatch(instanceID, callback);
					} else {
						callback();
					}
				});
			}
		});
	},
	userConnected: function(userID, callback) {
		Validator.ValidateArgs(arguments, Number, Function);
		DataStore.getUserInformation(userID, function(userInfo) {
			console.log('User Connected: UserInfo is ' + JSON.stringify(userInfo));
			onlineUsers.push(userInfo);
			module.exports.findByUser(userID, function(state) {
				var instances = Object.keys(state);
				var setupItem = function() {
					if(instances.length>0) {
						var curr = instances.pop();
						if(matches[curr]) {
							setupItem();
						} else {
							module.exports.setupMatch(state[curr].gameID, curr, function() {
								setupItem();
							});
						}
					} else {
						callback();
					}
				};
				setupItem();
			});
		});
	},
	userDisconnected: function(userID, callback) {
		Validator.ValidateArgs(arguments, Number, Function);
		for(var i=0; i<onlineUsers.length; i++) {
			if(onlineUsers[i].userID == userID) {
				onlineUsers.splice(i, 1);
				break;
			}
		}
		module.exports.findByUser(userID, function(state) {
			console.log('UserDisconnected: State returned from findByUserID(' + userID + ') is ' + JSON.stringify(state));
			console.log(state[0]);
			var entries = [];
			for(var instanceID in state) {
				entries.push(instanceID);
				var players = state[instanceID].players;
				var found = false;
				for(var j=0; j<players.length && !found; j++) {
					for(var k=0; k<onlineUsers.length && !found; k++) {
						if(onlineUsers[k].userID==players[j]) {
							found = true;
						}
					}
				}
				if(!found) {
					delete matches[instanceID];
				}
			}
			var saveMatches = function() {
				if(entries.length>0) {
					var curr = entries.pop();
					DataStore.storeToMatch(state[curr].instanceID, userID, state[curr].gameID, function() {
						DataStore.saveGameBoard(state[curr].instanceID, state[curr], function() {
							saveMatches();
						});
					});
				} else {
					callback();
				}
			};
			saveMatches();
		});
	},
	userNameFromID: function(userID, callback) {
		Validator.ValidateArgs(arguments, Number);
		for(var i=0; i<onlineUsers.length; i++) {
			if(onlineUsers[i].userID == userID) {
				callback(onlineUsers[i].userName);
				return;
			}
		}
		DataStore.getUserInformation(userID, function(userInfo) {
			console.log('UserNameFromID: User Information returned from db is ' + JSON.stringify(userInfo));
			callback(userInfo.userName);
		});
	},
	gameTypeFromID: function(gameID, callback) {
		Validator.ValidateArgs(arguments, Number, Function);
		module.exports.availableGames(function(gameObj) {
			for(var i=0; i<gameObj.length; i++) {
				if(gameObj[i].gameID == gameID) {
					callback(gameObj[i].gameType);
					return;
				}
			}
			callback();
		});
	},
	findByUser: function(userID, callback) {
		Validator.ValidateArgs(arguments, Number, Function);
		var userState = {};
		for(var x in matches) {
			for(var i=0; i<matches[x].gameBoard.players.length; i++) {
				if(matches[x].gameBoard.players[i].id == userID) {
					userState[x] = matches[x].gameBoard.CreateBoardGameJSONObject();
				}
			}
		}
		console.log('FindByUser: UserState is ' + JSON.stringify(userState));
		DataStore.matchesByUser(userID, function(entries) {
			console.log('FindByUser: Matches returned from the database are' + JSON.stringify(entries));
			var loadItem = function() {
				if(entries.length>0) {
					var curr = entries.pop();
					if(!userState[curr.instanceID]) {
						DataStore.loadGameBoard(curr.instanceID, function(gb) {
							console.log("FindByUser: LoadGameBoard from database is " + JSON.stringify(gb));
							userState[curr.instanceID] = gb;
							if(!userState[curr.instanceID]) {
								// Special case where game match entry exists, but gameboard missing
								if(!GameDefinitions[curr.gameID]) {
									module.exports.gameTypeFromID(curr.gameID, function(type) {
										GameDefinitions[curr.gameID] = require("../controllers/" + type + "GameController.js")[type + "GameController"];
										var game = new GameDefinitions[curr.gameID]({instanceID:curr.instanceID, gameID:curr.gameID});
										userState[curr.instanceID] = game.gameBoard;
										loadItem();
									});
								} else {
									var game = new GameDefinitions[curr.gameID]({instanceID:curr.instanceID, gameID:curr.gameID});
									userState[curr.instanceID] = game.gameBoard;
									loadItem();
								}
							} else {
								loadItem();
							}
						});
					} else {
						loadItem();
					}
				} else {
					callback(userState);
				}
			};
			loadItem();
		});
	},
	getMatches: function() {
		return matches;
	},
	getGameboard: function(instanceID, callback) {
		Validator.ValidateArgs(arguments, Number, Function);
		if(matches[instanceID]) {
			callback(matches[instanceID].gameBoard.CreateBoardGameJSONObject());
		} else {
			DataStore.loadGameBoard(instanceID, callback);
		}
	},
	reset: function() {
		serverInstanceBase = 0;
		matches = {};
		onlineUsers = [];
		availGames = undefined;
		GameDefinitions = {};
	}
};
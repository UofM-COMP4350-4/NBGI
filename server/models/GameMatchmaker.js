// GameMatchmaker.js
// Controller that gets called when users click the "Play game" button
// adds users to a FIFO queue (First-in-First-Out for the ADT un-initiated)
// once two users or more are in the queue, two (or more) users with the same settings (same game for now) will be selected together and each will be sent a response.
// If both users respond to the response within an arbitrary ammount of time, they will be passed to the GameCreator(sp?) opject which will send them the game objects

// the queue runs in an infitite loop and listens on port TBD for the action of the user pressing a play button

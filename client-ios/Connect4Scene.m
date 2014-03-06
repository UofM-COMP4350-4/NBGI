//
//  MyScene.m
//  Sample
//
//  Created by Cameron McKay on 2/26/2014.
//  Copyright (c) 2014 Cameron McKay. All rights reserved.
//

#import "Connect4Scene.h"

@implementation Connect4Scene

NSMutableArray* listOfMoves;

-(id)initWithSize:(CGSize)size {
    if (self = [super initWithSize:size]) {
        self.backgroundColor = [SKColor colorWithRed:1.0 green:1.0 blue:1.0 alpha:1.0];
        
        SKLabelNode *myLabel = [SKLabelNode labelNodeWithFontNamed:@"Chalkduster"];
        
        myLabel.text = @"Hello, World!";
        myLabel.fontSize = 30;
        myLabel.position = CGPointMake(CGRectGetMidX(self.frame),
                                       CGRectGetMidY(self.frame));
        
        [self addChild:myLabel];
        [self initializeMutableArray];
        [self drawGameBoard:listOfMoves];
    }
    return self;
}

-(void)initializeMutableArray {
    listOfMoves = [[NSMutableArray alloc]init];
    Move *move;
    
    for (int row = 0; row < 6; row++) {
        for (int col = 0; col < 7; col++) {
            move = [[Move alloc]init];
            move.position = CGPointMake(row, col);
            move.userID = 12;
            [listOfMoves addObject:move];
        }
    }
}

-(void)drawGameBoard:(NSArray*) listOfMoves {
    SKSpriteNode *connect4Board = [SKSpriteNode spriteNodeWithImageNamed:@"board"];
    SKSpriteNode *yellowConnect4Piece;
    SKSpriteNode *redConnect4Piece = [SKSpriteNode spriteNodeWithImageNamed:@"redChip"];
    SKSpriteNode *emptySpace = [SKSpriteNode spriteNodeWithImageNamed:@"whiteChip"];
    int offset = 10;
    const int rowSize = 6;
    const int colSize = 7;
    CGFloat frameHeight = self.frame.size.height;
    CGFloat frameWidth = self.frame.size.width;
    CGFloat boardHeight = self.frame.size.height-200;
    CGFloat boardWidth = self.frame.size.width-300;
    CGFloat cellHeight = (boardHeight / (rowSize));
    CGFloat cellWidth = (boardWidth / (colSize));
    
    double rowOffset = (frameWidth - boardWidth)/2;
    double colOffset = 0;//(frameHeight - boardHeight)/2;
    
    connect4Board.position = CGPointMake(CGRectGetMidX(self.frame), CGRectGetMidY(self.frame));
    connect4Board.size = CGSizeMake(boardWidth, boardHeight);
    [self addChild:connect4Board];
    
    for (int index = 0; index < [listOfMoves count]; index++) {
        yellowConnect4Piece = [SKSpriteNode spriteNodeWithImageNamed:@"blueChip"];
        Move *currentMove = [listOfMoves objectAtIndex:index];
        int currRow = currentMove.position.x;
        int currCol = currentMove.position.y; // framesize - boardsize / 2
        CGRect cellRect = CGRectMake(0,0, cellWidth, cellHeight);
        yellowConnect4Piece.position = CGPointMake(currCol*cellWidth+rowOffset+CGRectGetMidX(cellRect), currRow*cellHeight+colOffset+CGRectGetMidY(cellRect));
        yellowConnect4Piece.size = CGSizeMake(cellWidth, cellHeight);
        [self addChild:yellowConnect4Piece];
        // if the userID is playerID draw red
//        if (playerID == currentPlayerID) {
//            [self addChild:yellowConnect4Piece];
//        }
//        else {
//            [self addChild:redConnect4Piece];
//        }
    }
}

-(void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    
        //CGPoint location = [touch locationInNode:self];
        // send a message with the request information
}

-(void)update:(CFTimeInterval)currentTime {
    /* Called before each frame is rendered */
}

@end

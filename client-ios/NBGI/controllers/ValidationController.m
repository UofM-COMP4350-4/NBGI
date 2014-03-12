//
//  ValidationController.m
//  NBGI
//
//  Created by Cameron McKay on 3/12/2014.
//  Copyright (c) 2014 Christopher Catton. All rights reserved.
//

#import "ValidationController.h"

@implementation ValidationController

+ (void) ValidateObject : (id) data {
    if (data == Nil || data == NULL) {
        [NSException raise:@"Invalid Object" format:@"Data cannot be Nil, nil or NULL."];
    }
};

@end
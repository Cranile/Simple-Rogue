
class GameMap {
    constructor(tileW, tileH, scale, mapW, mapH, cameraW, cameraH, game) {

        this.tileW = tileW;
        this.tileH = tileH;

        this.scale = scale;

        this.mapW = mapW;
        this.mapH = mapH;

        this.cameraW = cameraW;
        this.cameraH = cameraH;

        this.gameRef = game;
        //saves the layout of the map NOT THE CONTENT!
        this.gameMapStructure = [];
        //saves the content of the map, key is tile coordinate , value 
        this.gameMapContent = new Map();


        this.canvasW;
        this.canvasH;

        this.playerSpawnPoint = undefined;
        //blocktypes should only save the basic data of the TYPES of blocks, no the blocks themselves, eg: wall is a type, stone wall is a block OF TYPE wall
        //types should only have id and isSolid or isInteractive or trigger condition.
        //blocks are made out of types and save the sprite, color or gradient they use, as well as aditional info like description or the type of interaction
        this.blockTypes = {
            "void": {
                solid: true,
                id: 0,
                className: "void",
                color: "#000000"
            },
            "ground": {
                solid: false,
                id: 1,
                className: "ground",
                color: "#421616"
            },
            "wall": {
                solid: true,
                id: 2,
                className: "wall",
                sprite: { "x": 96, "y": 208, "w": "16", "h": "16" }
            },

        }
        this.blockTypesById = {
            0: this.blockTypes.void,
            1: this.blockTypes.ground,
            2: this.blockTypes.wall,
        }
        this.blockList = {};

    }

    async init() {
        return new Promise((resolve) => {
            this.setCanvasSize();
            //create or load map
            let tempMap = this.roomPlacementGeneration();
            this.gameMapStructure = tempMap[0];
            this.gameMapContent = tempMap[1];
            
            resolve(true);
        })
    }

    update() {

    }
    draw(ctx, x, y, offsetX, offsetY) {
        //choose between raw color and sprite texture
        //get if tile uses texture by translatting current coordinates to map and check for tile id

        let currentTileStructure = this.getTileStructure(x,y);
        //console.log(currentTileStructure);
        if (
            currentTileStructure === undefined ||
            y > this.gameRef.player.positionY + this.gameRef.fov ||
            y < this.gameRef.player.positionY - this.gameRef.fov ||
            x > this.gameRef.player.positionX + this.gameRef.fov ||
            x < this.gameRef.player.positionX - this.gameRef.fov 
        ) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.rect((offsetX + x * this.tileW) * this.scale, (offsetY + y * this.tileH) * this.scale, this.tileW * this.scale, this.tileH * this.scale);
            ctx.fill();
            return;
        }

        if (currentTileStructure.sprite !== undefined) {
            ctx.drawImage(this.gameRef.tileset,
                currentTileStructure.sprite.x, currentTileStructure.sprite.y,
                currentTileStructure.sprite.w, currentTileStructure.sprite.h,
                (offsetX + x * this.tileW) * this.scale, (offsetY + y * this.tileH) * this.scale,
                this.tileW * this.scale, this.tileH * this.scale
            );

        } else {
            let col = currentTileStructure.color;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.rect((offsetX + x * this.tileW) * this.scale, (offsetY + y * this.tileH) * this.scale, this.tileW * this.scale, this.tileH * this.scale);
            ctx.fill();
        }

        if (this.hasContentOnCoords(x, y) === true) {
            let currentTileContent = this.getTileItem(x, y);
            if (currentTileContent.length > 0) {
                currentTileContent = currentTileContent[0];
            }

            ctx.drawImage(this.gameRef.tileset,
                currentTileContent.sprite.x, currentTileContent.sprite.y,
                currentTileContent.sprite.w, currentTileContent.sprite.h,
                (offsetX + x * this.tileW) * this.scale, (offsetY + y * this.tileH) * this.scale,
                this.tileW * this.scale, this.tileH * this.scale
            );
        }
        
    }

    createMap() {
        console.log("new map requested");
        let cont = 0;
        let tempMap = [];
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                tempMap[this.mapToTile(x, y)] = cont;
                if (cont === 3) {
                    cont = 0;
                } else {
                    cont++;
                }
            }
        }
        return tempMap;
    }
    generateBoxMap() { //BoxMap is only for testing, use hand made or properly random generated maps for release.
        console.log("generate box map");
        let tempMap = [];
        let tempContent = new Map();
        let randomGrounds = [];

        let hasdoor = 0;
        let hasvoid = false;
        let hasPlayerSpawn = false;
        let potions = 0;
        let items = []
        let hasKey = false;
        let hasEnemy = 0;

        let randX, randY;

        let coords;
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {

                if (x === 0 || x === this.mapW - 1) {
                    tempMap[this.mapToTile(x, y)] = this.blockTypes.wall.id; //add wall
                } else if (y === 0) {
                    tempMap[this.mapToTile(x, y)] = this.blockTypes.wall.id; //add wall
                } else if (y === this.mapH - 1) {
                    tempMap[this.mapToTile(x, y)] = this.blockTypes.wall.id; //add wall
                } else {
                    tempMap[this.mapToTile(x, y)] = this.blockTypes.ground.id; //add ground
                    randomGrounds.push(this.mapToTile(x, y));
                }

            }
        }

        
        let shuffle = (grounds) => {
            return grounds
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
        }

        randomGrounds = shuffle(randomGrounds);

        while (potions < 5) {
            let tileIndex = randomGrounds.pop();
            tempContent.set(tileIndex, this.gameRef.entitiesList.potion.id);
            potions++;
        }

        let { sword, axe, heroSword, chestPlate, ironChestplate, steelChestplate } = this.gameRef.entitiesList;
        let itemsToShow = [sword, axe, heroSword, chestPlate, ironChestplate, steelChestplate];
        for (const item of itemsToShow) {
            items.push({ id: item.id, show: false });
        }

        for (const item of items) {
            let tileIndex = randomGrounds.pop();
            tempContent.set(tileIndex, item.id);
            item.show = true;
        }

        /*
        Doors are not necesary for the freecodecamp version of the game, this should be re implemented for the post freecodecamp version.
        while (hasdoor < 3) {
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add door
            if (tempMap[this.mapToTile(randX, randY)] === this.blockTypes.ground.id) {
                let doorName = "Door" + hasdoor * 1;
                let newdoor = new Structure(doorName, randX, randY, this.gameRef.entitiesList.door, this.gameRef.characterTypes.struct, this.gameRef, this.gameRef.entityCount);
                this.gameRef.addNewEntity(newdoor);
                hasdoor++;
                newdoor.setLock();
                while (!hasKey) {
                    let randX = Math.floor(Math.random() * this.mapW);
                    let randY = Math.floor(Math.random() * this.mapH);
                    //add player spawn point
                    if (tempMap[this.mapToTile(randX, randY)] === this.blockTypes.ground.id) {
                        coords = [randX, randY];
                        let newKey = this.gameRef.getKey(newdoor.getKeyCode());
                        if (newKey === false) {
                            console.log("failed to create key");
                            break;
                        }
                        tempContent.set(this.mapToTile(randX, randY), newKey);
                        hasKey = true;
                    }
                }
                hasKey = false;
            }
        }
        */

        while (hasEnemy < 5) {
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add door
            if (tempMap[this.mapToTile(randX, randY)] === this.blockTypes.ground.id) {
                let newenemy = new Character("enemy " + hasEnemy, randX, randY, this.gameRef.entitiesList.goblin, this.gameRef.characterTypes.rogue, this.gameRef, this.gameRef.entityCount);
                newenemy.setStanceToPlayer("enemy");
                this.gameRef.addNewEntity(newenemy);
                hasEnemy++;
            }
        }

        while (!hasvoid) {
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add void
            if (tempMap[this.mapToTile(randX, randY)] === this.blockTypes.ground.id) {
                coords = [randX, randY];
                tempMap[this.mapToTile(coords[0], coords[1])] = this.blockTypes.void.id;
                hasvoid = true;
            }
        }

        
        //add stair
        
        while (!hasPlayerSpawn) {
           let randX = 10;
           let randY = 10;
           //add player spawn point
           if (tempMap[this.mapToTile(randX, randY)] === this.blockTypes.ground.id) {
               coords = [randX, randY];
               this.playerSpawnPoint = coords;
               hasPlayerSpawn = true;
           }
        }
        return [tempMap, tempContent];
    }

    roomPlacementGeneration(){
        let tempMap = new Array(this.mapW * this.mapH);
        let tempContent = new Map();

        let roomAmmount = 0;
        let maxRoomAmmount = 10;
        let roomsPositions = ["s"];

        let tries = 0; //to prevent infinite map creation, if max tries are reached, create the map with less rooms
        let notCollisionsCount; //add 1 for each box on the array for which the new box didnt collide, if at array.length === this var, then build new room


        let minRoomSize = 6;
        let maxRoomSize = 12;

        let minItemsPerRoom = 0;
        let maxTotalItems = 20;
        let maxItemsPerRoom = 3;

        let items = [];
        let randomGrounds = [];
        let potions = 0;

        let { sword, axe, heroSword, chestPlate, ironChestplate, steelChestplate } = this.gameRef.entitiesList;
        let itemsToShow = [sword, axe, heroSword, chestPlate, ironChestplate, steelChestplate];
        for (const item of itemsToShow) {
            items.push({ id: item.id, show: false });
        }

        let minTotalMonsters;
        let maxTotalMonsters;

        let minMonstersPerRoom;
        let maxMonstersPerRoom;
        while(roomAmmount < maxRoomAmmount ){
            
            let roomSize = Math.floor(Math.random() * (maxRoomSize - minRoomSize) + minRoomSize);
            
            let randX = Math.floor(Math.random() * (this.mapW - roomSize));
            let randY = Math.floor(Math.random() * (this.mapH - roomSize));

            notCollisionsCount = 0 ;
            let tempRoom = {
                startX: randX,
                startY: randY,
                endX: randX + roomSize,
                endY: randY + roomSize,
                totalSize: roomSize * roomSize,
            };
            for(let i = 0; i < roomsPositions.length ; i++){
                
                if(roomsPositions.length >= maxRoomAmmount){
                    break; //this is a failsafe, dont delete
                }
                if(!(roomsPositions[0] === "s") && !(this.areBoxColliding(tempRoom.startX ,tempRoom.startY, tempRoom.endX, tempRoom.endY, roomsPositions[i].startX, roomsPositions[i].startY, roomsPositions[i].endX, roomsPositions[i].endY))){
                    //console.log("not collision", notCollisionsCount, "roomcount: ",roomAmmount);
                    notCollisionsCount++;
                }
                if(roomsPositions.length <= 1 && roomsPositions[0] === "s" || notCollisionsCount >= roomsPositions.length ){
                    //console.log("creating new room,",roomAmmount);
                    roomsPositions[ roomAmmount ] = tempRoom;
                    tries = 0;
                    
                    for(let x = roomsPositions[ roomAmmount ].startX; x < roomsPositions[ roomAmmount ].endX ; x++){
                        for(let y = roomsPositions[ roomAmmount ].startY; y < roomsPositions[ roomAmmount ].endY; y++){

                            if(x === roomsPositions[ roomAmmount ].startX 
                                || x === roomsPositions[ roomAmmount ].endX  -1
                                || y === roomsPositions[ roomAmmount ].startY 
                                || y === roomsPositions[ roomAmmount ].endY  -1
                            ){
                                tempMap[ this.mapToTile(x, y) ] = this.blockTypes.wall.id;
                            }else{
                                tempMap[ this.mapToTile(x, y) ] = this.blockTypes.ground.id;
                                randomGrounds.push(this.mapToTile(x, y));
                            }
                            
                        }
                    }
                    if(this.playerSpawnPoint === undefined){
                        this.playerSpawnPoint = [
                            Math.floor((roomsPositions[ roomAmmount ].endX -1 + roomsPositions[ roomAmmount ].startX ) / 2)
                            ,
                            Math.floor((roomsPositions[ roomAmmount ].endY -1 + roomsPositions[ roomAmmount ].startY) / 2)
                        ];
                        randomGrounds.pop( this.mapToTile(this.playerSpawnPoint[0], this.playerSpawnPoint[1]) )
                    }
                    roomAmmount++;
                }
            }
            tries++;
            if(tries > 1000){
                roomAmmount = maxRoomAmmount;
            }
        }

        let shuffle = (grounds) => {
            return grounds
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
        }
        randomGrounds = shuffle(randomGrounds);
        maxItemsPerRoom = Math.round(maxTotalItems / roomsPositions.length);
        

        //generate tunnels between rooms
        let currentX,currentY;
        let nextRoomX,nextRoomY;
        
        // tunels and items could be genretaed on the same for loop
        for(let i = 0; i < roomsPositions.length; i++){
            let directionX = 1, directionY = 1;
            currentX = Math.floor((roomsPositions[i].endX -1 + roomsPositions[i].startX ) / 2); // start on the middle of current room
            currentY = Math.floor((roomsPositions[i].endY -1 + roomsPositions[i].startY ) / 2);
            // get which room is closer on total tiles and make bride towards that
            
            if(i < roomsPositions.length -1){
                nextRoomX = Math.floor((roomsPositions[i + 1].endX -1 + roomsPositions[i + 1].startX ) / 2) // reach  the middle of the next room
                nextRoomY = Math.floor((roomsPositions[i + 1].endY -1 + roomsPositions[i + 1].startY ) / 2)
            }else{
                nextRoomX = Math.floor((roomsPositions[0].endX -1 + roomsPositions[0].startX ) / 2) // reach  the middle of the next room
                nextRoomY = Math.floor((roomsPositions[0].endY -1 + roomsPositions[0].startY ) / 2)
            }
            
            if(currentX > nextRoomX){
                directionX = -1;
            }
            
            for(currentX; currentX !== nextRoomX; currentX += directionX){
                tempMap[ this.mapToTile(currentX, currentY) ] = this.blockTypes.ground.id;
            }
            
            if(currentY > nextRoomY){
                directionY = -1;
            }
            
            for(currentY; currentY !== nextRoomY; currentY += directionY){
                tempMap[ this.mapToTile(currentX, currentY) ] = this.blockTypes.ground.id;
            }
            
        }

        //generate Items
        while (potions < 5) {
            let tileIndex = randomGrounds.pop();
            tempContent.set(tileIndex, this.gameRef.entitiesList.potion.id);
            potions++;
        }

        for (const item of items) {
            let tileIndex = randomGrounds.pop();
            tempContent.set(tileIndex, item.id);
            item.show = true;
        }

        return [tempMap, tempContent];
    }
    mapToTile(x, y) {
        return (this.mapW * y) + x;
    }
    setCanvasSize() {
        this.canvasW = (this.cameraW * this.tileW) * this.scale;
        this.canvasH = (this.cameraH * this.tileH) * this.scale;
    }

    areBoxColliding(aStartX,aStartY,aEndX,aEndY,bStartX,bStartY,bEndX,bEndY){
        
        
        
        if(aStartX >= bStartX && aStartX <= bEndX || aStartY >= bStartY && aStartY <= bEndY ||
            aEndX >= bStartX && aEndX <= bEndX || aEndY >= bStartY && aEndY <= bEndY
            )
        {
            return true;
        }
        /*
        console.log("aEndX < bStartX",aEndX < bStartX ," &&", "aEndY < bStartY", aEndY < bStartY ,"||", "aStartX > bEndX",aStartX > bEndX ,"&&", "aStartY > bEndY",aStartY > bEndY);
        if( !(aEndX < bStartX && aEndY < bStartY || aStartX > bEndX && aStartY > bEndY) ){
            console.log("collision false");
            return false;
        }
        */
        return false;
    }

    getTileStructIDfromCoords(x, y) { //returns the ID of the block stored on that coordinate
        return this.gameMapStructure[this.mapToTile(x, y)];
    }
    getTileContentIDfromCoords(x, y) {
        return this.gameMapContent.get(this.mapToTile(x, y))
    }

    getTileContentIDfromTile(tileNumber) {
        return this.gameMapContent.get(tileNumber)
    }

    hasContentOnCoords(x, y) {
        return this.gameMapContent.has(this.mapToTile(x, y))
    }

    getTileStructure(x, y) { //returns the entire block data based on the ID from the coordinate
        return this.blockTypesById[this.getTileStructIDfromCoords(x, y)];
    }
    getTileItem(x, y) { //returns the data of an item instantiated on the map given a coordinate
        let content = this.getTileContentIDfromCoords(x, y);
        if (content.length > 0) {
            // first goes the item id then the specific interaction key
            return [this.gameRef.entitiesListById[content[0]], content[1]];
        }
        return this.gameRef.entitiesListById[content];
    }

    removeItemFromMap(x, y) {
        this.gameMapContent.delete(this.mapToTile(x, y));
        return "ok";
    }

    isTileSolid(x, y) {
        let temp = this.blockTypesById[this.getTileStructIDfromCoords(x, y)];
        if(temp === undefined){
            return true;
        }
        return temp.solid;
    }
    isInteractable(x, y) {
        let res = this.gameRef.entitiesListById[this.getTileContentIDfromCoords(x, y)];
        if (res !== undefined) {
            return (res.type);
        }
    }
    requestItemPickupAt(x, y) { //gets coords, deletes item from map and returns item id
        let item = this.getTileItem(x, y);
        if (item.length > 0) {
            if (item[0].type === "item") {
                this.removeItemFromMap(x, y);
                return [item[0].id, item[1]];
            }
        }
        if (item.type === "item") {
            this.removeItemFromMap(x, y);
            return item.id;
        }
        return false;
    }
    get canvasSize() {
        return [this.canvasW, this.canvasH];
    }
}

class GameMap{
    constructor(tileW,tileH,scale,mapW,mapH,game){
        
        this.tileW = tileW;
        this.tileH = tileH;

        this.scale = scale;

        this.mapW = mapW;
        this.mapH = mapH;

        this.gameRef = game;
        //saves the layout of the map NOT THE CONTENT!
        this.gameMapStructure = [];
        //saves the content of the map, key is tile coordinate , value 
        this.gameMapContent = new Map();

        this.canvasW;
        this.canvasH;

        this.playerSpawnPoint;
        this.blockTypes = {
            "void":{
                solid: true,
                id: 0,
                className:"void",
                color:"#000000"
            },
            "ground":{
                solid: false,
                id: 1,
                className:"ground",
                color:"#421616"
            },
            "wall":{
                solid: true,
                id: 2,
                className:"wall",
                sprite:{"x":96,"y":208,"w":"16","h":"16"}
            },

        }
        this.blockTypesById = {
            0: this.blockTypes.void,
            1: this.blockTypes.ground,
            2: this.blockTypes.wall,
        }
        this.blockList = {};

    }

    async init(){
        return new Promise((resolve) =>{
            this.setCanvasSize();
            //create or load map
            let tempMap = this.generateBoxMap();
            this.gameMapStructure = tempMap[0];
            this.gameMapContent = tempMap[1];
            resolve(true);
        })
    }

    update(){

    }
    draw(ctx,x,y){
        //choose between raw color and sprite texture
        //get if tile uses texture by translatting current coordinates to map and check for tile id
        let currentTileStructure = this.getTileStructure(x,y);
        if( currentTileStructure.sprite !== undefined){
            ctx.drawImage(this.gameRef.tileset, 
            currentTileStructure.sprite.x , currentTileStructure.sprite.y, 
            currentTileStructure.sprite.w , currentTileStructure.sprite.h,
            (x*this.tileW) * this.scale,(y*this.tileH) * this.scale,
            this.tileW * this.scale,this.tileH * this.scale
            );

        }else{
            let col = currentTileStructure.color;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.rect((x*this.tileW) * this.scale,(y*this.tileH)* this.scale,this.tileW* this.scale, this.tileH* this.scale);
            ctx.fill();
        }

        if(this.hasContentOnCoords(x,y) === true){
            let currentTileContent = this.getTileItem(x,y);
            if(currentTileContent.length > 0){
                currentTileContent = currentTileContent[0];
            }

            ctx.drawImage(this.gameRef.tileset, 
                currentTileContent.sprite.x , currentTileContent.sprite.y, 
                currentTileContent.sprite.w , currentTileContent.sprite.h,
                (x*this.tileW) * this.scale,(y*this.tileH) * this.scale,
                this.tileW * this.scale,this.tileH * this.scale
            );
        }
    }
    
    createMap(){
        console.log("new map requested");
        let cont = 0;
        let tempMap = [];
        for(let y= 0; y < this.mapH; y++){
            for(let x = 0; x < this.mapW; x++){
                tempMap[ this.mapToTile(x,y)] = cont;
                if(cont === 3){
                    cont = 0;
                }else{
                    cont ++;
                }
            }
        }
        return tempMap;
    }
    generateBoxMap(){
        console.log("generate box map");
        let tempMap = [];
        let tempContent = new Map();

        let hasdoor = false; 
        let hasvoid = false;
        let hasPlayerSpawn = false;
        let potions = 0;
        let hasSword = false;
        let hasChestplate = false;
        let hasKey = false;
        let hasEnemy = false;

        let randX,randY;

        let coords;
        for(let y = 0; y < this.mapH; y++){
            for(let x = 0; x < this.mapW; x++){

                if(x === 0 && y===0 || y === 0 && x === this.mapW -1 || x === 0 && y === this.mapH -1 || x === this.mapW -1 && y===this.mapH -1){
                    tempMap[this.mapToTile(x,y)] = this.blockTypes.wall.id; //add wall
                }else if(x === 0 || x === this.mapW -1){
                    tempMap[this.mapToTile(x,y)] = this.blockTypes.wall.id; //add wall
                }else if(y === 0 ){
                    tempMap[this.mapToTile(x,y)] = this.blockTypes.wall.id; //add wall
                }else if( y === this.mapH -1 ){
                    tempMap[this.mapToTile(x,y)] = this.blockTypes.wall.id; //add wall
                }else{
                    tempMap[this.mapToTile(x,y)] = this.blockTypes.ground.id; //add ground
                }
                
            }
        }

        /* old implementation, no entity
        while(!hasdoor){
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add door
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                tempContent.set(this.mapToTile(randX,randY),this.gameRef.entitiesList.door.id);
                hasdoor = true;
            }
        }*/

        while(hasdoor < 3){
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add door
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                let doorName = "Door" + hasdoor * 1;
                let newdoor = new Structure(doorName,randX,randY,this.gameRef.entitiesList.door,this.gameRef.characterTypes.struct,this.gameRef,this.gameRef.entityCount);
                this.gameRef.addNewEntity(newdoor);
                hasdoor ++;
                newdoor.setLock();
                while(!hasKey){
                    let randX = Math.floor(Math.random() * this.mapW);
                    let randY = Math.floor(Math.random() * this.mapH);
                    //add player spawn point
                    if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                        coords = [ randX , randY ];
                        let newKey = this.gameRef.getKey(newdoor.getKeyCode());
                        if(newKey === false){
                            console.log("failed to create key");
                            break;
                        }
                        tempContent.set(this.mapToTile(randX,randY), newKey);
                        hasKey = true;
                    }
                }
                hasKey = false;
            }
        }

        while(!hasEnemy){
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add door
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                let newenemy = new Character("test enemy",randX,randY,this.gameRef.entitiesList.goblin,this.gameRef.characterTypes.rogue,this.gameRef,this.gameRef.entityCount);
                newenemy.setStanceToPlayer("enemy");
                this.gameRef.addNewEntity(newenemy);
                hasEnemy = true;
            }
        }

        while(!hasvoid){
            randX = Math.floor(Math.random() * this.mapW);
            randY = Math.floor(Math.random() * this.mapH);
            //add void
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                coords = [ randX , randY ];
                tempMap[ this.mapToTile(coords[0],coords[1] ) ] = this.blockTypes.void.id;
                hasvoid = true;
            }
        }
        
        while(!hasPlayerSpawn){
            let randX = Math.floor(Math.random() * this.mapW);
            let randY = Math.floor(Math.random() * this.mapH);
            //add player spawn point
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                coords = [ randX , randY ];
                this.playerSpawnPoint = coords;
                hasPlayerSpawn = true;
            }
            
        }
        
        //add stair

        while(potions < 5){
            let randX = Math.floor(Math.random() * this.mapW);
            let randY = Math.floor(Math.random() * this.mapH);
            //add potion
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                //key is position
                tempContent.set(this.mapToTile(randX,randY),this.gameRef.entitiesList.potion.id);
                potions ++;
            }
        }

        while(!hasSword){
            let randX = Math.floor(Math.random() * this.mapW);
            let randY = Math.floor(Math.random() * this.mapH);
            //add player spawn point
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                coords = [ randX , randY ];
                tempContent.set(this.mapToTile(randX,randY),this.gameRef.entitiesList.sword.id);
                hasSword = true;
            }
        }
        while(!hasChestplate){
            let randX = Math.floor(Math.random() * this.mapW);
            let randY = Math.floor(Math.random() * this.mapH);
            //add player spawn point
            if( tempMap[this.mapToTile(randX,randY)] === this.blockTypes.ground.id){
                coords = [ randX , randY ];
                tempContent.set(this.mapToTile(randX,randY),this.gameRef.entitiesList.chestPlate.id);
                hasChestplate = true;
            }
        }


        return [tempMap,tempContent];
    }
    mapToTile(x, y){
        return (this.mapW * y) + x;
    }
    setCanvasSize(){
        this.canvasW = (this.mapW * this.tileW) * this.scale;
        this.canvasH = (this.mapH * this.tileH) * this.scale;
    }

    getTileStructIDfromCoords(x,y){ //returns the ID of the block stored on that coordinate
        return this.gameMapStructure[ this.mapToTile(x, y) ];
    }
    getTileContentIDfromCoords(x,y){
        return this.gameMapContent.get( this.mapToTile(x, y) )
    }

    getTileContentIDfromTile(tileNumber){
        return this.gameMapContent.get( tileNumber )
    }

    hasContentOnCoords(x,y){
        return this.gameMapContent.has( this.mapToTile(x, y) )
    }

    getTileStructure(x,y){ //returns the entire block data based on the ID from the coordinate
        return this.blockTypesById[ this.getTileStructIDfromCoords(x,y)];
    }
    getTileItem(x,y){ //returns the data of an item instantiated on the map given a coordinate
        let content = this.getTileContentIDfromCoords(x,y);
        if(content.length > 0){            
             // first goes the item id then the specific interaction key
             return [this.gameRef.entitiesListById[ content[0] ] , content[1]];
        }
        return this.gameRef.entitiesListById[ content ];
    }

    removeItemFromMap(x,y){
        this.gameMapContent.delete( this.mapToTile(x, y));
        return "ok";
    }

    isTileSolid(x,y){
        return this.blockTypesById[ this.getTileStructIDfromCoords(x,y) ].solid ;
    }
    isInteractable(x,y){
        let res = this.gameRef.entitiesListById[ this.getTileContentIDfromCoords(x,y) ];
        if(res !== undefined){
            return (res.type);
        }
    }
    requestItemPickupAt(x,y){ //gets coords, deletes item from map and returns item id
        let item = this.getTileItem(x,y);
        if(item.length > 0){
            if(item[0].type === "item"){
                this.removeItemFromMap(x,y);
                return [item[0].id,item[1]];
            }
        }
        if(item.type === "item"){
            this.removeItemFromMap(x,y);
            return item.id;
        }
        return false;
    }
    get canvasSize(){
        return[this.canvasW,this.canvasH];
    }
}
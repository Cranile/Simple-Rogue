class Entity {
    constructor(name = "entity", x = 0, y = 0, entityType, charType, game, globalID) {
        this.name = name;

        this.baseMaxHp = charType.hp; // the "natural" maximum ammount of hp an entity can have, this doesnt count equipement or buffs
        this.currentHp = this.baseMaxHp; // the ammount of health points the entity has at the moment
        this.currentMaxHP = this.baseMaxHp; // the current maximum ammount of hp an entity has, this includes equipements and buffs

        this.maxMp = charType.mp;

        this.entityGlobalID = globalID;
        this.positionX = x;
        this.positionY = y;

        this.gameRef = game;
        this.ready = false;

        this.entitySpecs = entityType;
        this.scale = game.scale;

        this.description;
        this.init();
    }

    init() {
        this.ready = true;
    }
    update() {

    }

    draw(ctx, x, y) {
        if (x === this.positionX && y === this.positionY) {
            ctx.drawImage(
                this.gameRef.tileset,
                this.entitySpecs.sprite.x, this.entitySpecs.sprite.y,
                this.entitySpecs.sprite.w, this.entitySpecs.sprite.h,
                (x * this.gameRef.tileW) * this.scale, (y * this.gameRef.tileH) * this.scale,
                this.gameRef.tileW * this.scale, this.gameRef.tileH * this.scale
            );
            /*
            let col = "#0000ff";
            ctx.beginPath();
            ctx.rect(
                (x*this.gameRef.tileW) * this.scale , (y*this.gameRef.tileH)* this.scale,
                this.gameRef.tileW* this.scale , this.gameRef.tileH* this.scale
            );
            ctx.fillStyle = col;
            ctx.fill();
            */
        }
    }

    changePosition(newX = 0, newY = 0) {
        //"teleport" player to a position
        this.positionX = newX;
        this.positionY = newY;
    }

    changeHealth(hp) {
        this.currentHp = this.currentHp + hp;
        
        if (this.currentHp > this.currentMaxHP) {
            this.currentHp = this.currentMaxHP;
        }

        if (this.currentHp <= 0) {
            this.onDeath();
        }

    }

    recieveDamage(damageInput) {
        if (damageInput > 0) {
            this.currentHp -= damageInput;
            console.log(this.name, "recieved:", damageInput, " damage");
        }

        if (this.currentHp <= 0) {
            console.log(this.name, " is dead.");
        }

    }
    
    attackOnOther(damageOutput, target) {
        if (damageOutput === undefined || target === undefined) {
            console.error("Parameters cant be undefined", damageOutput, target);
            return;
        }
    }

    onDeath(){
        console.log(this.name, " is dead.");
    }
    get position() {
        return [this.positionX, this.positionY];
    }
    get currentHealth() {
        return [this.currentHp];
    }
    get health() {
        return [this.currentHp, this.currentMaxHP]
    }
    get readDescription() {
        if (this.description !== undefined) {
            return this.description;
        }
    }
    getName() {
        return this.name;
    }
    setName(newName) {

        this.name = newName;
    }
    set maxHealth(hp) {
        this.baseMaxHp = hp;
    }
    set description(text) {
        this.description = text;
    }
}

class Character extends Entity {
    constructor(name = "Character", x, y, entityType, charType, game, globalID) {
        super(name, x, y, entityType, charType, game, globalID);

        this.baseDmg = charType.dmg;
        this.baseSpd = charType.spd;

        this.actualDmg = this.baseDmg;
        this.actualSpd = this.baseSpd;

        this.inventory = [];
        this.chestArmorLvl = 0;
        this.weaponLvl = 0;

        this.potionAmmount = 0;

        this.xpUntilNextLvl = 5;
        this.currentXP = 0;
        this.xpScaling = 2; //every time a level up happens, the xp until next level gets multiplied by this scaling.
        this.currentLvl = 1;
        this.maxLevel = 10;

        this.xpValue = 2 * this.currentLvl; // the ammount of xp this entity gives when killed

        this.lastHitBy; //keeps track on which entity hit this entity.

        this.keysIndex = []; // store the key indentifier

    }
    init() {

    }
    setStanceToPlayer(stance) {
        if (stance === "enemy") {
            this.stance = "enemy";
            console.log("this character is now enemy of the player");
            return;
        } else if (stance === "ally") {
            this.stance = "ally";
            console.log("this character is now ally to the player");
            return;
        }
        console.log("wrong stance parameter, not set.", stance);
    }
    addItemToInventoty(item, ammount, extra) {
        let newitem = {
            id: undefined,
            ammount: undefined,
        };
        let emptySlot = undefined;
        newitem.id = item;
        newitem.ammount = ammount;
        if (this.inventory.length === 0 || this.inventory.length === 1 && this.inventory[0] === undefined) {
            this.inventory[0] = newitem;
            if(newitem.id === this.gameRef.entitiesList.potion.id){
                this.potionAmmount += newitem.ammount;
            }
        } else {

            for (let i = 0; i < this.inventory.length; i++) {
                console.log(i);
                if (this.inventory[i] === undefined) {
                    console.log("found undefined",i);
                    emptySlot = i;
                    break;
                }else if (this.inventory[i].id === newitem.id) {
                    if(newitem.id === this.gameRef.entitiesList.potion.id){
                        this.potionAmmount += newitem.ammount;
                    }
                    this.inventory[i].ammount += newitem.ammount;
                    return;
                }
            }
            if (emptySlot === undefined) {
                //if no free slots have been found, open a new one
                console.log("open new slot");
                this.inventory[this.inventory.length] = newitem;
                if(newitem.id === this.gameRef.entitiesList.potion.id){
                    this.potionAmmount += newitem.ammount;
                }
            } else {
                console.log("use old");
                this.inventory[emptySlot] = newitem;
                if(newitem.id === this.gameRef.entitiesList.potion.id){
                    this.potionAmmount += newitem.ammount;
                }
            }
        }
        let tempItem = this.gameRef.entitiesListById[item];
        if (tempItem.subtype === "equipable") {
            console.log("equip");
            this.addItemStats(tempItem)
        }
    }
    addItemStats(item) {
        if (item.category === "armor") {
            if (item.stats.level < this.chestArmorLvl) {
                console.log("new item is worse than already equiped");
                return;
            }
            this.chestArmorLvl = item.stats.level;
            this.currentMaxHP = this.baseMaxHp + item.stats.health;
            this.currentHp = this.currentMaxHP;
        }
        if (item.category === "weapon") {
            if (item.stats.level < this.weaponLvl) {
                console.log("new item is worse than already equiped");
                return;
            }
            this.weaponLvl = item.stats.level;
            this.actualDmg = this.baseDmg + item.stats.damage;
            this.actualSpd = this.baseSpd + item.stats.speed;
        }
    }
    removeItemFromInventory(item){
        for(let i = 0; i < this.inventory.length; i++){
            if(this.inventory[ i ].id === item.id){
                if(this.inventory[ i ].ammount > 1){
                    this.inventory[ i ].ammount -= 1; //reduce current ammount of that item
                }else{
                    this.inventory [ i ] = undefined; //delete from inventory
                }
                if(item.id === this.gameRef.entitiesList.potion.id){
                    this.potionAmmount -= 1;
                }
            }
        }
    }
    hasItemOnInv(item){
        for(let i = 0; i < this.inventory.length; i++){
            if(this.inventory[ i ].id === item.id){
                return true;
            }
        }
    }
    move(positionX = 0, positionY = 0) {
        let newCoords = this.calculateMovingCoords(positionX, positionY);
        if (newCoords === false) {
            return;
        }
        this.changePosition(newCoords[0], newCoords[1]);
    }

    calculateMovingCoords(positionX = 0, positionY = 0) { //TILE based movement
        //check if it can move to desired pos
        //check if colliding with enemy, call attack
        let newCoords = [this.positionX, this.positionY];

        //the if check is because the recieved data could be undefined, by not moving on some axis, then it stays the same
        if (positionX !== undefined) {
            newCoords[0] = this.positionX + positionX;
        }
        if (positionY !== undefined) {
            newCoords[1] = this.positionY + positionY;
        }

        if (this.gameRef.gameMap.isTileSolid(newCoords[0], newCoords[1])) {

            return false;
        }
        let interactableObj = this.gameRef.hasEntityOnPos(newCoords[0], newCoords[1]);
        if (interactableObj !== false) {
            if (interactableObj.entitySpecs.type === "struct") {
                if (interactableObj.canPass(this)) {
                    return newCoords;
                } else {
                    return false;
                }
            }
            if (interactableObj.entitySpecs.type === "character") {
                console.log("character");
                this.interact(interactableObj);
                return false;
            }
        }
        return newCoords;
    }

    pickupItem() {
        if (this.gameRef.gameMap.hasContentOnCoords(this.positionX, this.positionY)) {
            let newitem = this.gameRef.gameMap.requestItemPickupAt(this.positionX, this.positionY);
            if (newitem === false) {
                console.log("not item");
                return;
            }
            if (newitem.length > 0) {
                this.keysIndex[this.keysIndex.length] = newitem[1];
                newitem = newitem[0]
            }
            this.addItemToInventoty(newitem, 1)
            return;
        }
        console.log("no item to pickup");
    }
    consumePotion(){
        let potion = this.gameRef.entitiesList.potion
        if(this.currentHp === this.currentMaxHP){
            console.log("health is full");
            return;
        }
        if(this.hasItemOnInv(potion)){
            console.log("take potion");
            this.changeHealth(potion.heal);
            this.removeItemFromInventory(potion);
            return;
        }
        console.log("no potion avaliabe");
        return;
    }
    hasKey(keycode) {
        for (let i = 0; i < this.keysIndex.length; i++) {
            if (this.keysIndex[i] === keycode) {
                return true;
            }
        }
        return false;
    }

    onDeath(){
        console.log(this.name,"was killed by",this.gameRef.entitiesIndex.get(this.lastHitBy).name );
        this.gameRef.entitiesIndex.get(this.lastHitBy).recieveXP(this.xpValue);
    }
    recieveXP(xpAmmount){
        if(this.currentLvl >= this.maxLevel){
            return;
        }
        //this method will fail if entity recieves enough xp to level up multiple times
        //a better way would need to pre define the "ranks" of xp until next level, and check how many the entity has surpased
        this.currentXP += xpAmmount;
        console.log(this.name," got ",xpAmmount," XP");
        if(this.currentXP >= this.xpUntilNextLvl){
            this.levelUp();
        }
    }
    levelUp(){
        let healthBonus = this.currentMaxHP - this.baseMaxHp;
        console.log(healthBonus);
        let dmgBonus = this.actualDmg - this.baseDmg;
        console.log(dmgBonus);

        this.currentLvl += 1;
        this.xpUntilNextLvl = this.xpUntilNextLvl * this.xpScaling;
        this.xpValue = 3 * this.currentLvl;

        console.log(this.name," has leveled up, now is level:",this.currentLvl);

        this.baseDmg += this.currentLvl;
        this.baseMaxHp += this.currentLvl;
        
        // update current stats
        this.currentMaxHP = this.baseMaxHp + healthBonus;
        this.currentHp = this.currentMaxHP;
        this.actualDmg = this.baseDmg + dmgBonus;
    }
    
    recieveDamage(damageInput,attackerID) {
        this.lastHitBy = attackerID;
        if (damageInput > 0) {
            this.currentHp -= damageInput;
            console.log(this.name, "recieved:", damageInput, " damage");
        }

        if (this.currentHp <= 0) {
            console.log(this.name, " is dead.");
            this.onDeath();
            return;
        }
        //counterattack if other attacked
        if(attackerID !== this.entityGlobalID){
            console.log("attacker",this.gameRef.entitiesIndex.get(attackerID),attackerID);
            this.attackOnOther(this.gameRef.entitiesIndex.get(attackerID),attackerID);
        }
    }

    attackOnOther(target, attacker=false) {
        if (target === undefined) {
            console.error("Parameters cant be undefined", target);
            return;
        }
        if(attacker !== false){
            target.recieveDamage(this.actualDmg,attacker);
            return
        }
        target.recieveDamage(this.actualDmg,this.entityGlobalID);
    }
}

class Structure extends Entity {
    constructor(name = "Character", x, y, entityType, charType, game, globalID) {
        super(name, x, y, entityType, charType, game, globalID);

        this.isSolid = false;
        this.locked = false;
        this.keyPairCode = undefined;
    }

    action() { //how this element reacts when interacted with
        if (this.locked) {

        }
    }

    canPass(entity) {

        if (this.isSolid) {

            return false;
        }
        if (this.locked === false) {

            return true;
        }
        if (this.locked) {
            if (entity.hasKey(this.keyPairCode)) {
                console.log("usas la llave para abrir la puerta");
                return true;
            }
            if (entity.keysIndex.length > 0) {
                console.log("ninguna de tus llaves funciona con esta puerta.");
            } else {
                console.log("te falta una llave para poder pasar");
            }
            return false;
        }
        return;
    }
    setIsSolid(boolean) {
        this.isSolid = boolean;
    }
    setLock() {
        this.keyPairCode = this.gameRef.addNewKey();
        this.locked = true;
    }
    setUnlock() {
        this.locked = false;
    }
    getKeyCode() {

        return this.keyPairCode;
    }
}

class Player extends Character {
    constructor(name, x, y, entityType, charType, game, globalID) {
        super(name, x, y, entityType, charType, game, globalID);
    }

    init() {
        window.addEventListener("keyup", event => this.getKey(event));
        this.positionX = this.gameRef.gameMap.playerSpawnPoint[0];
        this.positionY = this.gameRef.gameMap.playerSpawnPoint[1];
    }

    getKey(event) {
        let openMenu = (menues, menu) => {
            for (const [name, value] of Object.entries(menues)) {
                if (name === menu) {
                    menues[name] = !value;
                    continue;
                }

                menues[name] = false;
            }
        }

        switch (event.code) {
            case "KeyW":
                this.move(0, -1);
                break;
            case "KeyS":
                this.move(0, 1);
                break;
            case "KeyD":
                this.move(1);
                break;
            case "KeyA":
                this.move(-1);
                break;
            case "KeyQ":
                this.consumePotion();
                break;
            case "KeyE":
                this.pickupItem();
                break;
            case "KeyC":
                openMenu(this.gameRef.menues, "character");
                break;
            case "KeyI":
                openMenu(this.gameRef.menues, "inventory");
                break;
            // quick toggle fields of view
            case "KeyF":
                this.gameRef.fov = this.gameRef.fov < 1000 ? 1000 : 5;
                break;
            default:
                break;
        }
    }

    interact(target) {
        if (target === undefined) {
            console.error("entity undefined");
            return;
        }

        if (target.stance === "enemy") {
            if (target.currentHealth <= 0) {
                console.log("enemy is already dead, loot?");
                return;
            }
            this.attackOnOther(target);
            return;
        }

        if (target.stance === "ally") {
            console.log("ally");

        }
        return;
    }
}

class Game {
    //all interactables must be of type entity, NPCs, Items and structures like doors or stairs
    //these should be stored on the same database, separated from actual structures like ground or walls
    //structures should not have the interactable tag, only entities
    //-----
    //all the lists should be created outside the class, and imported.
    //listById should not be created manually, instead generate dynamically based on each list
    constructor(tileW, tileH, scale = 1, mapW, mapH, canvasName) {
        this.tileSetURL;
        this.tileset = new Image();
        //saves the gameMap Object
        this.gameMap;
        //this.mapToTile = this.gameMap.mapToTile();

        this.player;

        this.entitiesIndex = new Map(); //this keeps a list of all the currently instantiated entities, enemies, allies, structures(interactables like doors) and the player | delete from index when instance is removed
        this.entityCount = 0;

        this.keysIndex = new Map();
        this.keyCount = 0;
        //size of tiles on PX
        this.tileW = tileW;
        this.tileH = tileH;
        //scale of the map
        this.scale = scale;
        //size of map on tiles
        this.mapW = mapW;
        this.mapH = mapH; //map height should not exceed screen height

        this.canvasName = canvasName;
        this.gameCanvas;

        this.canvasW;
        this.canvasH;
        this.ctx;

        this.fov; //field of view is the area the player can see, this implementation dosn't take into account walls, so player can se through, this doesn't save previously seen areas(fog of war)
        this.menues = {
            "inventory": false,
            "character": false
        }
        //these two should be the same
        this.entitiesList = {
            //all Mob type entities should appear in mayus
            "player": {
                id: 0,
                sprite: { "x": 480, "y": 16, "w": "16", "h": "16" },
                type: "character",
                color: "blue"
            },
            "goblin": {
                id: 1,
                sprite: { "x": 400, "y": 32, "w": "16", "h": "16" },
                type: "character",
                color: "green"
            },
            "wizard": {
                id: 2,
                sprite: { "x": 385, "y": 16, "w": "16", "h": "16" },
                type: "character",
                color: "purple"
            },
            "necromancer": {
                id: 3,
                sprite: { "x": 496, "y": 16, "w": "16", "h": "16" },
                type: "character",
                color: "brown"
            },
            "skeleton": {
                id: 4,
                sprite: { "x": 464, "y": 96, "w": "16", "h": "16" },
                type: "character",
                color: "brown"
            },
            "potion": {
                id: 5,
                sprite: { "x": 528, "y": 208, "w": "16", "h": "16" },
                color: "red",
                type: "item",
                subtype: "consumible",
                heal: 5,
            },
            "sword": {
                id: 6,
                sprite: { "x": 560, "y": 112, "w": "16", "h": "16" },
                color: "gray",
                type: "item",
                subtype: "equipable",
                category: "weapon",
                stats: {
                    level: 1,
                    damage: 2,
                    speed: -1,
                }
            },
            "chestPlate": {
                id: 7,
                sprite: { "x": 512, "y": 16, "w": "16", "h": "16" },
                color: "orange",
                type: "item",
                subtype: "equipable",
                category: "armor",
                stats: {
                    level: 1,
                    health: 5,
                }
            },
            "key": {
                id: 8,
                sprite: { "x": 544, "y": 176, "w": "16", "h": "16" },
                color: "orange",
                type: "item",
                subtype: "quest",
            },
            "door": {
                id: 9,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: true,
                type: "struct",
                subtype: "door",
            },
            "stair": {
                id: 10,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: false,
                type: "struct",
                subtype: "transition",//for level transition, portals, trapdoors, stairs, holes, etc
            },
            "chest": {
                id: 11,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: true,
                type: "struct",
                subtype: "container",
            },
            "bookshelf": {
                id: 12,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: true,
                type: "struct",
                subtype: "misc", //decorations or interactables (levers, buttons, etc)
                description: "books neatly ordered on a bookshelf",
            },
            "axe": {
                id: 13,
                sprite: { "x": 640, "y": 112, "w": "16", "h": "16" },
                color: "gray",
                type: "item",
                subtype: "equipable",
                category: "weapon",
                stats: {
                    level: 2,
                    damage: 4,
                    speed: -1,
                }
            },
            "heroSword": {
                id: 14,
                sprite: { "x": 528, "y": 144, "w": "16", "h": "16" },
                color: "gray",
                type: "item",
                subtype: "equipable",
                category: "weapon",
                stats: {
                    level: 3,
                    damage: 6,
                    speed: -1,
                }
            },
            "ironChestplate": {
                id: 15,
                sprite: { "x": 528, "y": 16, "w": "16", "h": "16" },
                color: "orange",
                type: "item",
                subtype: "equipable",
                category: "armor",
                stats: {
                    level: 2,
                    health: 7,
                }
            },
            "steelChestplate": {
                id: 16,
                sprite: { "x": 544, "y": 16, "w": "16", "h": "16" },
                color: "orange",
                type: "item",
                subtype: "equipable",
                category: "armor",
                stats: {
                    level: 3,
                    health: 9,
                }
            },
        };
        this.entitiesListById = Object.values(this.entitiesList);
        this.characterTypes = {
            "warrior": {
                "hp": 25,
                "mp": 5,
                "dmg": 5,
                "spd": 5,
            },
            "rogue": {
                "hp": 8,
                "mp": 5,
                "dmg": 8,
                "spd": 10,
            },
            "mage": {
                "hp": 10,
                "mp": 15,
                "dmg": 5,
                "spd": 8,
            },
            "struct": {
                "hp": 50,
                "mp": 0,
                "dmg": 0,
                "spd": 0,
            }
        }
        this.init();
    }

    async setMap() {
        return new Promise((resolve) => {
            resolve(new GameMap(this.tileW, this.tileH, this.scale, this.mapW, this.mapH, this));
        });
    }
    async init() {
        //Initialize variables or methods
        this.gameCanvas = document.getElementById(this.canvasName);

        this.tileset.src = "./colored-transparent_packed.png";
        if (this.gameCanvas === undefined) {
            console.error("canvas not found");
            return;
        }


        this.ctx = this.gameCanvas.getContext("2d");
        this.ctx.scale(this.scale, this.scale);


        this.gameMap = await this.setMap()

        let isMapfinish = await this.gameMap.init();
        let canvasSize = this.gameMap.canvasSize;

        this.canvasW = canvasSize[0];
        this.canvasH = canvasSize[1];
        this.gameCanvas.width = canvasSize[0];
        this.gameCanvas.height = canvasSize[1];

        this.player = new Player("player", 5, 5, this.entitiesList.player, this.characterTypes.warrior, this, this.entityCount);
        this.addNewEntity(this.player);
        this.fov = 5;

        this.ctx.imageSmoothingEnabled = false; //if this is set before resizing, pixels get blurry
        this.draw();

    }

    update() {
        //Update important data / behaviour
    }

    draw() {
        //Draw graphics on canvas
        this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        let currentSecond = 0, frameCount = 0, framesLastSecond = 0, lastFrameTime = 0;
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {

                this.gameMap.draw(this.ctx, x, y);
                if (
                    y <= this.player.positionY + this.fov &&
                    y >= this.player.positionY - this.fov &&
                    x <= this.player.positionX + this.fov &&
                    x >= this.player.positionX - this.fov
                ) {
                    this.entitiesIndex.forEach(entity => {
                        entity.draw(this.ctx, x, y);
                    });
                }

            }
        }
        // INVENTORY UI
        if (this.menues.inventory) {
            let inventoryModal = new InventoryModal(this.ctx, this.canvasW, this.canvasH);
            inventoryModal.withContext({
                player: this.player, entitiesListById: this.entitiesListById, tileset: this.tileset
            }).draw();
        }
        if (this.menues.character) {
            let characterModal = new CharacterModal(this.ctx, this.canvasW, this.canvasH);
            characterModal.withContext({ player: this.player }).draw();
        }
        // HEALTH BAR

        //background
        let originX = (this.canvasW * 90) / 100;
        let originY = (this.canvasH * 2) / 100;
        let healthWidth = 100, healthHeight = 20;
        this.ctx.beginPath();
        this.ctx.fillStyle = "gray";
        this.ctx.rect(originX, originY, healthWidth, healthHeight);
        this.ctx.fill();

        //health bar
        let hp = this.player.health;
        //hp[0] = current health, hp[1] max health
        let percent = ((hp[1] - hp[0]) * 100) / hp[1];
        let filler = healthWidth - percent;
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.rect(originX, originY, filler, healthHeight);
        this.ctx.fill();

        //border
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.rect(originX + 1, originY + 1, healthWidth + 1, healthHeight + 1);
        this.ctx.stroke();

        //health numbers
        this.ctx.beginPath();
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "black";
        let text = hp[0] + " / " + hp[1];
        this.ctx.fillText(text, originX + 2, originY + 19);

        //potions list
        let xfromHealth = 20, yfromHealth = 20;
        let listwidth = 100, listheight = 40;
        this.ctx.beginPath();
        this.ctx.fillStyle = "gray";
        this.ctx.rect(originX , originY + yfromHealth + (listheight / 2), listwidth, listheight);
        this.ctx.fill();

        //health numbers
        this.ctx.beginPath();
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "black";
        let potionlisttext = "Potions: " + this.player.potionAmmount;
        this.ctx.fillText(potionlisttext, originX , originY + yfromHealth + listheight );
        requestAnimationFrame(() => this.draw());
    }

    fetchProject() {
        //get the data needed to start the game
    }

    addNewEntity(entity) {
        this.entitiesIndex.set(this.entityCount, entity);
        this.entityCount++;
    }

    removeEntity(entityID) {
        this.entitiesIndex.delete(entityID);
    }
    hasEntityOnPos(coordX, coordY) {
        let tileNumber = this.gameMap.mapToTile(coordX, coordY);
        let entityTile;
        let res = false;

        for (let entity of this.entitiesIndex.entries()) {
            entityTile = this.gameMap.mapToTile(entity[1].positionX, entity[1].positionY);
            if (tileNumber === entityTile) {
                return entity[1];
            }
        }
        return false;
    }
    addNewKey() {
        let newKey = this.keyCount;
        this.keysIndex.set(newKey, this.entitiesList.key.id)
        this.keyCount++;
        return newKey;
    }
    getKey(keycode) {

        if (this.keysIndex.has(keycode)) {

            return [this.keysIndex.get(keycode), keycode];
        }
        return false;
    }
}

class Bag {
    constructor(name, bagSize) {
        //the name of this bag
        this.name = name;
        //
        this.bagSize = bagSize;
        //save the items here
        this.slots = [];
        //quick search for items. usefull for finding multiple stacks of the same item.
        this.dictionary = new Map();
    }

    update() {

    }
    expandBag() {

    }
    reduceBag() {

    }
    addItem() {

    }
    removeItem() {

    }
}
class Inventory extends Bag {
    constructor(name, bagSize) {
        super(name, bagSize);

        //a structure to store the equiped armor, weapons and ammunition
        //this should be paired with a key(the slot, head, torso, left hand etc.) and the value being the actual equipment
        this.equipment = new Map();
    }

    draw() {

    }
}

class Modal {

    constructor(ctx, canvasW, canvasH) {
        this.ctx = ctx;
        this.canvasW = canvasW;
        this.canvasH = canvasH;
    }

    withContext(context) {
        const attributes = Object.entries(context);
        for (const [name, attribute] of attributes) {
            this[name] = attribute
        }
        return this;
    }
}

class InventoryModal extends Modal {
    draw() {
        let invSlots = 20;
        let invSlotSize = 48; //px
        let innerPadding = 6; //px
        let padding = 5;//px

        let originX = 0;
        let originY = 0;

        let endX = originX + padding * 2;
        let endY = originY + padding * 2;

        let maxSlotWidth = originX + invSlotSize + padding * 2 + innerPadding;
        let count = 1;
        let width = (this.canvasW * 30) / 100;
        let height = (this.canvasH * 60) / 100;

        //inventory bg
        this.setBackgroundStyle(width);
        this.drawBackground(width, height, originX, originY, padding);

        for (let i = 0; i < invSlots; i++) {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.backgroundStyle;
            this.ctx.rect(endX, endY, invSlotSize + innerPadding, invSlotSize + innerPadding);
            this.ctx.lineWidth = padding;
            this.ctx.stroke();

            if (this.player.inventory[i]) {
                let itemspr = this.entitiesListById[this.player.inventory[i].id];
                //console.log(itemspr);
                this.ctx.drawImage(this.tileset,
                    itemspr.sprite.x, itemspr.sprite.y,
                    itemspr.sprite.w, itemspr.sprite.h,
                    endX + (innerPadding / 2), endY + (innerPadding / 2),
                    invSlotSize, invSlotSize
                );
                let font = invSlotSize / 2 + "px Arial";
                this.ctx.font = font;
                this.ctx.fillStyle = "white";
                this.ctx.fillText(
                    this.player.inventory[i].ammount,
                    (endX + invSlotSize + innerPadding) - this.ctx.measureText("1").width,
                    (endY + invSlotSize)
                );
            }

            if (Math.floor(width / maxSlotWidth) <= count) {
                endX = originX + padding * 2;
                endY = endY + invSlotSize + (padding * 2) + innerPadding;
                count = 1;
            } else {
                count++;
                endX = endX + invSlotSize + (padding * 2) + innerPadding;
            }
        }
    }

    setBackgroundStyle(width) {
        let col = this.ctx.createLinearGradient(0, 0, width, 0);
        col.addColorStop(0, "#2d1818");
        col.addColorStop(0.2, "#4d3131");
        col.addColorStop(0.5, "#5b4848");
        col.addColorStop(0.7, "#4d3131");
        col.addColorStop(1, "#2d1818");
        this.backgroundStyle = col;
    }

    drawBackground(width, height, originX, originY, padding) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.backgroundStyle;
        this.ctx.rect(originX, originY, width, height);
        this.ctx.fill();
        this.ctx.lineWidth = padding;
        this.ctx.strokeStyle = "black";
        this.ctx.stroke();
    }
}

class CharacterModal extends Modal {
    draw() {
        let padding = 5;//px

        let originX = 0;
        let originY = 0;

        let width = (this.canvasW * 30) / 100;
        let height = (this.canvasH * 60) / 100;

        //inventory bg
        this.setBackgroundStyle(width);
        this.drawBackground(width, height, originX, originY, padding);

        this.ctx.beginPath();
        this.ctx.font = "30px Arial";
        this.ctx.fillStyle = "black";

        let text = "character sheet";
        this.ctx.fillText(text, originX + 6, originY + 32);

        this.ctx.font = "20px Arial";

        let texts = [
            "base damage: " + this.player.baseDmg + " + " + (this.player.actualDmg - this.player.baseDmg) + " = " + this.player.actualDmg,
            "weapon level: " + this.player.weaponLvl,
            "base health: " + this.player.baseMaxHp + " + " + (this.player.currentMaxHP - this.player.baseMaxHp) + " = " + this.player.currentMaxHP,
            "armor level: " + this.player.chestArmorLvl,
            "base attack speed: " + this.player.baseSpd + " + " + (this.player.actualSpd - this.player.baseSpd) + " = " + this.player.actualSpd,
            "Level: " + this.player.currentLvl,
            "XP: " + this.player.currentXP + " / " + this.player.xpUntilNextLvl,
        ]

        for (const [i, text] of texts.entries()) {
            this.ctx.fillText(text, originX + 6, originY + 32 * (i + 2));
        }
    }

    setBackgroundStyle(width) {
        let col = this.ctx.createLinearGradient(0, 0, width, 0);
        col.addColorStop(0, "#2d1818");
        col.addColorStop(0.2, "#4d3131");
        col.addColorStop(0.5, "#5b4848");
        col.addColorStop(0.7, "#4d3131");
        col.addColorStop(1, "#2d1818");
        this.backgroundStyle = col;
    }

    drawBackground(width, height, originX, originY, padding) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.backgroundStyle;
        this.ctx.rect(originX, originY, width, height);
        this.ctx.fill();
        this.ctx.lineWidth = padding;
        this.ctx.strokeStyle = "black";
        this.ctx.stroke();
    }
}
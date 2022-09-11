class Entity {
    constructor(name = "entity", x = 0, y = 0, entityType, charType, game, globalID) {
        this.name = name;

        this.baseHp = charType.hp;
        this.maxHp = charType.hp;
        this.currentHp = this.maxHp;

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
        this.actualhp += hp;

        if (this.actualhp > this.maxHp) {
            this.actualhp = this.maxHp;
        }

        if (this.actualhp <= 0) {
            console.log(this.name, " is dead.");
        }

    }

    attackOnSelf(damageInput) {
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
        target.attackOnSelf(damageOutput);
    }

    get position() {
        return [this.positionX, this.positionY];
    }
    get currentHealth() {
        return [this.currentHp];
    }
    get health() {
        return [this.currentHp, this.maxHp]
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
        this.maxHp = hp;
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
        if (this.inventory.length === 0) {

            this.inventory[0] = newitem;
        } else {

            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i] === undefined) {

                    emptySlot = i;
                }
                if (this.inventory[i].id === newitem.id) {

                    this.inventory[i].ammount += newitem.ammount;

                }
            }
            if (emptySlot === undefined) {
                //if no free slots have been found, open a new one

                this.inventory[this.inventory.length] = newitem;
            } else {

                this.inventory[emptySlot] = newitem;
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
            this.maxHp = this.baseHp + item.stats.health;
            this.currentHp = this.maxHp;
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

    hasKey(keycode) {
        for (let i = 0; i < this.keysIndex.length; i++) {
            if (this.keysIndex[i] === keycode) {
                return true;
            }
        }
        return false;
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
        if (event.code === "KeyW") {
            this.move(0, -1);

        } else if (event.code === "KeyS") {
            this.move(0, 1);
        }

        if (event.code === "KeyD") {
            this.move(1);

        } else if (event.code === "KeyA") {
            this.move(-1);

        }

        if (event.code === "KeyE") {
            this.pickupItem();
        }
        if (event.code === "KeyC") {
            console.log("character sheet");
            if (this.gameRef.inventoryOpen) {
                this.gameRef.inventoryOpen = !this.gameRef.inventoryOpen;
            }
            this.gameRef.characterOpen = !this.gameRef.characterOpen;
        }
        if (event.code === "KeyI") {
            if (this.gameRef.characterOpen) {
                this.gameRef.characterOpen = !this.gameRef.characterOpen;
            }
            this.gameRef.inventoryOpen = !this.gameRef.inventoryOpen;
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
            this.attackOnOther(this.actualDmg, target);
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

        this.inventoryOpen = false;
        this.characterOpen = false;
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
                id: 10,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: true,
                type: "struct",
                subtype: "container",
            },
            "bookshelf": {
                id: 10,
                sprite: { "x": 160, "y": 144, "w": "16", "h": "16" },
                solid: true,
                type: "struct",
                subtype: "misc", //decorations or interactables (levers, buttons, etc)
                description: "books neatly ordered on a bookshelf",
            },
            "axe": {
                id: 11,
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
            "hero_sword": {
                id: 12,
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
            "iron_chestplate": {
                id: 13,
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
            "steel_chestplate": {
                id: 14,
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
        this.entitiesListById = {
            //all Mob type entities should appear in mayus
            0: this.entitiesList.player,
            1: this.entitiesList.goblin,
            2: this.entitiesList.wizard,
            3: this.entitiesList.necromancer,
            4: this.entitiesList.skeleton,
            5: this.entitiesList.potion,
            6: this.entitiesList.sword,
            7: this.entitiesList.chestPlate,
            8: this.entitiesList.key,
            9: this.entitiesList.door,
            10: this.entitiesList.stair,
            11: this.entitiesList.axe,
            12: this.entitiesList.hero_sword,
            13: this.entitiesList.iron_chestplate,
            14: this.entitiesList.steel_chestplate,
        };
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
                "dmg": 10,
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
        if (this.inventoryOpen) {

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
            let col = this.ctx.createLinearGradient(0, 0, width, 0);
            col.addColorStop(0, "#2d1818");
            col.addColorStop(0.2, "#4d3131");
            col.addColorStop(0.5, "#5b4848");
            col.addColorStop(0.7, "#4d3131");
            col.addColorStop(1, "#2d1818");

            this.ctx.beginPath();
            this.ctx.fillStyle = col;
            this.ctx.rect(originX, originY, width, height);
            this.ctx.fill();
            this.ctx.lineWidth = padding;
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();

            for (let i = 0; i < invSlots; i++) {
                this.ctx.beginPath();
                this.ctx.fillStyle = col;
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
        if (this.characterOpen) {
            let padding = 5;//px

            let originX = 0;
            let originY = 0;

            let width = (this.canvasW * 30) / 100;
            let height = (this.canvasH * 60) / 100;

            //inventory bg
            let col = this.ctx.createLinearGradient(0, 0, width, 0);
            col.addColorStop(0, "#2d1818");
            col.addColorStop(0.2, "#4d3131");
            col.addColorStop(0.5, "#5b4848");
            col.addColorStop(0.7, "#4d3131");
            col.addColorStop(1, "#2d1818");

            this.ctx.beginPath();
            this.ctx.fillStyle = col;
            this.ctx.rect(originX, originY, width, height);
            this.ctx.fill();
            this.ctx.lineWidth = padding;
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.font = "30px Arial";
            this.ctx.fillStyle = "black";
            let text = "character sheet";
            this.ctx.fillText(text, originX + 6, originY + 32);

            this.ctx.font = "20px Arial";
            text = "base damage: " + this.player.baseDmg + " + " + (this.player.actualDmg - this.player.baseDmg) + " = " + this.player.actualDmg;
            this.ctx.fillText(text, originX + 6, originY + 32 * 2);
            text = "weapon level: " + this.player.weaponLvl;
            this.ctx.fillText(text, originX + 6, originY + 32 * 3);

            text = "base health: " + this.player.baseHp + " + " + (this.player.maxHp - this.player.baseHp) + " = " + this.player.maxHp;
            this.ctx.fillText(text, originX + 6, originY + 32 * 4);
            text = "armor level: " + this.player.chestArmorLvl;
            this.ctx.fillText(text, originX + 6, originY + 32 * 5);

            text = "base attack speed: " + this.player.baseSpd + " + " + (this.player.actualSpd - this.player.baseSpd) + " = " + this.player.actualSpd;
            this.ctx.fillText(text, originX + 6, originY + 32 * 6);
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
import * as PIXI from "pixi.js";

import RedStoneMap, { Mapset, ObjectType } from "./models/Map";
import { fetchBinaryFile, loadAnimation, loadTexture, loadZippedTextures } from "../utils";
import BufferReader from "../utils/BufferReader";
import Map from "./models/Map";
import Camera from "./Camera";
import LoadingScreen from "./interface/LoadingScreen";
import { DATA_DIR, ENABLE_DRAW_MAP_DEBUG, INTERFACE_DIR, MAPSET_DIR, RMD_DIR, TILE_HEIGHT, TILE_WIDTH } from "./Config";
import RedStone from "./RedStone";
import { ActorImage, CType, MonsterType } from "./models/Actor";
import CommonUI from "./interface/CommonUI";
import Listener from "./Listener";
import { getDistance } from "../utils/RedStoneRandom";
import MonsterSource from "./models/MonsterSource";
import SoundManager from "./SoundManager";
import Actor from "./actor/Actor";
import ActorManager from "./actor/ActorManager";

const getTextureFileName = (textureId, extension = "rso") => {
    if (!extension) throw new Error("[Error] Invalid file extension");

    const idStrLen = String(textureId).length;
    const numZero = 4 - idStrLen;
    if (["rso", "rfo"].includes(extension)) {
        return `sn__object_${(new Array(numZero)).fill(0).join("")}${textureId}.${extension}`;
    }
    else if (extension === "rbd") {
        return `sn__building_${(new Array(numZero)).fill(0).join("")}${textureId}.rbd`;
    }
    else {
        throw new Error("[Error] Unsupported texture type");
    }
}

// temp
const animationObjectTexIds = {
    Brunenstig: {
        rso: [0, 1, 2, 3, 4, 5],
        rfo: [4, 7, 10, 13, 15, 25, 26, 28, 29]
    },
    Mountains_Village: {
        rso: [0, 52]
    }
}

const CONTAINER_SPLIT_BLOCK_SIZE = 10;

ENABLE_DRAW_MAP_DEBUG && PIXI.BitmapFont.from("TitleFont", {
    fill: "#f5b042",
    fontSize: 12
}, {
    chars: '(0123456789),',
    resolution: devicePixelRatio
});

ENABLE_DRAW_MAP_DEBUG && PIXI.BitmapFont.from("ActorPosFont", {
    fill: "#eb4034",
    fontSize: 12
}, {
    chars: '(0123456789),',
    resolution: devicePixelRatio
});

class GameMap {
    constructor() {
        /**
         * @type {Map}
         */
        this.map = null;

        this.tileContainer = new PIXI.Container();
        this.objectContainer = new PIXI.Container();
        this.positionSpecifiedObjectContainer = new PIXI.Container();
        this.shadowContainer = new PIXI.Container();
        this.portalContainer = new PIXI.Container();
        this.foremostContainer = new PIXI.Container();

        this.graphics = new PIXI.Graphics();

        /**
         * @type {{[key: String]: PIXI.Container}}
         */
        this.tileSubContainers = {};

        /**
         * @type {PIXI.Sprite[]}
         */
        this.objectSprites = [];

        /**
         * @type {PIXI.Sprite[]}
         */
        this.positionSpecifiedObjectSprites = [];

        /**
         * @type {PIXI.Sprite[] | PIXI.AnimatedSprite[]}
         */
        this.actorSprites = [];

        window.addEventListener("mouseup", () => {
            if (this.selectedPortal) {
                this.selectedPortal = null;
            }
        });
    }

    reset() {
        window.dispatchEvent(new CustomEvent("displayLogUpdate", { detail: { key: "map-name", value: null } }));

        this.tileContainer.removeChildren();
        this.objectContainer.removeChildren();
        this.positionSpecifiedObjectContainer.removeChildren();
        this.shadowContainer.removeChildren();
        this.portalContainer.removeChildren();
        this.foremostContainer.removeChildren();
        this.graphics.clear();

        RedStone.player.reset();

        RedStone.mainCanvas.mainContainer.removeChild(
            this.objectContainer,
            this.positionSpecifiedObjectContainer,
            this.shadowContainer,
            this.portalContainer,
            this.foremostContainer,
            this.graphics
        );

        RedStone.actors = [];

        this.tileSubContainers = {};
        this.objectSprites = [];
        this.positionSpecifiedObjectSprites = [];
        this.actorSprites = [];

        this.map = null;
        this.onceRendered = false;
        this.initialized = false;
    }

    async loadCommon() {
        this.portalTexture = await loadTexture(`${INTERFACE_DIR}/gateAnm.sad`);
    }

    async loadMap(rmdFileName = "[000]T01.rmd") {
        // async loadMap(rmdFileName = "[373]T02.rmd") {
        // async loadMap(rmdFileName = "[130]G09.rmd") {
        // async loadMap(rmdFileName = "[010]G13.rmd") {
        console.log("[Game]", "Loading scenario file...");
        // const rmd = await fetchBinaryFile(`${RMD_DIR}/[060]T01_A01.rmd`);
        const rmd = await fetchBinaryFile(`${RMD_DIR}/${rmdFileName}`);
        this.map = new RedStoneMap(new BufferReader(rmd));
        this.currentRmdFileName = rmdFileName;
        console.log("[Game]", "Scenario loaded", this.map);

        Camera.setMapSize(this.map.size.width * TILE_WIDTH, this.map.size.height * TILE_HEIGHT);
        this.initPosition();

        const mapsetName = this.map.getMapsetName();
        this.tileTexture = await loadTexture(`${MAPSET_DIR}/${mapsetName}/tile.mpr`);
        this.objectTextures = await loadZippedTextures(`${MAPSET_DIR}/${mapsetName}/${mapsetName}_Objects.zip`);
        this.buildingTextures = Object.keys(this.map.buildingInfos).length ? await loadZippedTextures(`${MAPSET_DIR}/${mapsetName}/${mapsetName}_Buildings.zip`) : null;

        const fetched = {};

        // load actors
        for (let actor of this.map.actorSingles) {
            const group = this.map.actorGroups[actor.internalID];
            const isMonster = [CType.Monster, CType.QuestMonster].includes(actor.charType);
            let actorTextureName;

            if (isMonster) {
                const monsterSource = MonsterSource.allMonsters[group.job];
                actorTextureName = MonsterType[monsterSource.textureId];
                if (actorTextureName === "SkeletonSanta") continue;
            } else {
                actorTextureName = ActorImage[group.job];
            }

            if (!actorTextureName) continue;

            const dir = isMonster ? "monsters" : "NPC";
            const fileName = actorTextureName + ".sad";
            const buffer = fetched[group.job] || (fetched[group.job] = await fetchBinaryFile(`${DATA_DIR}/${dir}/${fileName}`));
            const anim = RedStone.anims[actorTextureName] || (RedStone.anims[actorTextureName] = loadAnimation(buffer));

            const _actor = new Actor();
            const actorDirect = actor.direct === 8 ? ~~(Math.random() * 8) : actor.direct;

            _actor.pos.set(actor.point.x, actor.point.y);
            _actor.direct = actorDirect;
            _actor.horizonScale = group.scale.width;
            _actor.verticalScale = group.scale.height;
            _actor.actorSingle = actor;
            _actor.anm = 2;
            _actor.job = group.job;
            _actor.name = actor.name;
            _actor.body = isMonster ? MonsterSource.allMonsters[group.job].textureId : group.job; // temp
            _actor.actorKind = actor.charType;
            _actor._isMonster_tmp = isMonster;
            _actor.pixiSprite = _actor.getBody().createPixiSprite("body", _actor.pos.x, _actor.pos.y, _actor.anm, _actor.direct, _actor.frame);
            _actor.pixiSprite.shadowSprite = _actor.getBody().createPixiSprite("shadow", _actor.pos.x, _actor.pos.y, _actor.anm, _actor.direct, _actor.frame);

            const sprite = _actor.pixiSprite

            sprite.interactive = true;
            sprite.on("mouseover", () => {
                if (_actor.isDeath()) return;
                ActorManager.focusActor_tmp = _actor;
            });
            sprite.on("mouseout", () => {
                // if (_actor.isDeath()) return;
                ActorManager.focusActor_tmp = null;
            });
            sprite.on("mousedown", () => {
                if (_actor.isDeath()) return;
                ActorManager.lockedTarget_tmp = _actor;
            });

            RedStone.actors.push(_actor);
        }
    }

    async init() {
        if (!this.map) await this.loadMap(RedStone.lastLocation?.map);
        const map = this.map;
        const mapsetName = this.map.getMapsetName();

        for (let i = 0; i < map.size.height; i++) {
            for (let j = 0; j < map.size.width; j++) {
                const tileCode = map.tileData1[i * map.size.width + j];
                const objectCode = map.tileData3[i * map.size.width + j];

                this.renderTile(tileCode, j, i);
                this.renderObject(objectCode, j, i);
            }
        }

        for (const key in this.tileSubContainers) {
            const sc = this.tileSubContainers[key];
            const [blockX, blockY] = key.split("-").map(Number);
            const x = blockX * TILE_WIDTH * CONTAINER_SPLIT_BLOCK_SIZE;
            const y = blockY * TILE_HEIGHT * CONTAINER_SPLIT_BLOCK_SIZE;
            sc.position.set(x, y);
            sc.cacheAsBitmap = true;
        }

        // render position specified objects
        const objects = map.positionSpecifiedObjects;
        objects.forEach(obj => {
            const fileName = getTextureFileName(obj.textureId, "rfo");
            const texture = this.objectTextures.getTexture(fileName);
            const pixiTexture = texture.getPixiTexture(0);
            const x = obj.point.x - texture.shape.body.left[0];
            const y = obj.point.y - texture.shape.body.top[0];

            const sprite = new PIXI.Sprite(pixiTexture);
            sprite.position.set(x, y);
            sprite.blockX = Math.floor(obj.point.x / TILE_WIDTH);
            sprite.blockY = Math.floor(obj.point.y / TILE_HEIGHT);

            // this.positionSpecifiedObjectContainer.addChild(sprite);
            this.positionSpecifiedObjectSprites.push(sprite);

            // animated objects (rfo)
            if (animationObjectTexIds[mapsetName]?.rfo?.includes(obj.textureId)) {
                const pixiTextures = [];
                for (let i = 1; i < texture.frameCount; i++) {
                    pixiTextures.push(texture.getPixiTexture(i));
                }
                const x = obj.point.x - texture.shape.body.left[1];
                const y = obj.point.y - texture.shape.body.top[1];
                const sprite = new PIXI.AnimatedSprite(pixiTextures);
                sprite.position.set(x, y);
                sprite.animationSpeed = 0.1;
                sprite.blockX = Math.floor(obj.point.x / TILE_WIDTH);
                sprite.blockY = Math.floor(obj.point.y / TILE_HEIGHT);
                sprite.play();
                this.positionSpecifiedObjectSprites.push(sprite);
            }

            if (texture.isExistShadow) {
                const pixiTexture = texture.getPixiTexture(0, "shadow");

                const x = obj.point.x - texture.shape.shadow.left[0];
                const y = obj.point.y - texture.shape.shadow.top[0];

                const shadowSprite = new PIXI.Sprite(pixiTexture);
                shadowSprite.position.set(x, y);

                sprite.shadowSprite = shadowSprite;
            }

            if (ENABLE_DRAW_MAP_DEBUG) {
                this.graphics.lineStyle(1, 0x42f575);
                this.graphics.drawCircle(
                    obj.point.x,
                    obj.point.y,
                    10
                );
            }
        });

        this.renderPortals();

        this.map.actorSingles.forEach(async actor => {
            if (ENABLE_DRAW_MAP_DEBUG) {
                this.graphics.lineStyle(3, 0xeb4034);
                this.graphics.drawCircle(actor.point.x, actor.point.y, 10);
            }
        });

        RedStone.mainCanvas.mainContainer.addChild(this.tileContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.portalContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.positionSpecifiedObjectContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.shadowContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.objectContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.foremostContainer);
        RedStone.mainCanvas.mainContainer.addChild(this.graphics);

        if (!this.onceRendered) {
            this.onceRendered = true;
        }

        this.initialized = true;
        window.dispatchEvent(new CustomEvent("displayLogUpdate", { detail: { key: "map-name", value: this.map.name } }));

        try {
            const mapIndex = parseInt(this.currentRmdFileName.match(/\[(\d+)\]/)[1]);
            RedStone.bgmPlayer.play(mapIndex);
        } catch (e) { };
    }

    render() {
        if (!this.initialized) return;

        const startTime = performance.now();

        if (this.selectedPortal) {
            const portalSprite = this.selectedPortal.sprite
            const portalPoint = {
                x: portalSprite.x + portalSprite.width / 2,
                y: portalSprite.y + portalSprite.height / 2
            };
            if (getDistance(RedStone.player, portalPoint) < 70) {
                console.log("portal gate", this.selectedPortal.area.moveToFileName);
                this.moveField(this.selectedPortal.area.moveToFileName);
                this.selectedPortal = null;
                return;
            }
        }

        this.tileContainer.removeChildren();
        this.objectContainer.removeChildren();
        this.shadowContainer.removeChildren();
        this.positionSpecifiedObjectContainer.removeChildren();
        this.foremostContainer.removeChildren();

        Object.keys(this.tileSubContainers).forEach((key, idx) => {
            const [blockX, blockY] = key.split("-").map(Number);
            const x = blockX * TILE_WIDTH * CONTAINER_SPLIT_BLOCK_SIZE;
            const y = blockY * TILE_HEIGHT * CONTAINER_SPLIT_BLOCK_SIZE;
            const tc = this.tileSubContainers[key];

            if (!Camera.isRectInView({
                top: y, left: x,
                width: TILE_WIDTH * CONTAINER_SPLIT_BLOCK_SIZE,
                height: TILE_HEIGHT * CONTAINER_SPLIT_BLOCK_SIZE
            })) {
                return;
            }

            this.tileContainer.addChild(tc);
        });

        RedStone.player.render();
        // TODO: fix this bad implementation
        const actorSprites = RedStone.actors.map(actor => {
            const sprite = actor.pixiSprite;

            sprite.isActorSprite = true;
            sprite.blockX = actor.pos.x / TILE_WIDTH;
            sprite.blockY = actor.pos.y / TILE_HEIGHT;
            sprite.actor = actor;

            return sprite;
        });
        const _sprites = [...this.objectSprites, ...actorSprites].sort((a, b) => {
            return a.blockY - b.blockY;
        });
        const actorSpritesInView = [];
        _sprites.forEach(sprite => {
            let bounds = sprite.getBounds();
            if (sprite.shadowSprite) {
                let _bounds = sprite.shadowSprite.getBounds();
                let mergedBounds = {};
                mergedBounds.top = Math.min(bounds.top, _bounds.top);
                mergedBounds.left = Math.min(bounds.left, _bounds.left);
                mergedBounds.bottom = Math.max(bounds.bottom, _bounds.bottom);
                mergedBounds.right = Math.max(bounds.right, _bounds.right);
                bounds = mergedBounds;
            }

            if (!Camera.isRectInView(bounds)) {
                return;
            }

            if (sprite.isActorSprite) {
                actorSpritesInView.push(sprite, sprite.shadowSprite);

                const actor = sprite.actor;

                actor.getBody().updatePixiSprite(sprite, "body", actor.pos.x, actor.pos.y, actor.anm, actor.direct, actor.frame, actor.horizonScale, actor.verticalScale);
                if (sprite.shadowSprite) {
                    actor.getBody().updatePixiSprite(sprite.shadowSprite, "shadow", actor.pos.x, actor.pos.y, actor.anm, actor.direct, actor.frame, actor.horizonScale, actor.verticalScale);
                } else {
                    sprite.shadowSprite = actor.getBody().createPixiSprite("shadow", actor.pos.x, actor.pos.y, actor.anm, actor.direct, actor.frame, actor.horizonScale, actor.verticalScale);
                }

                sprite.actor.put();
            }

            if (sprite.shadowSprite) {
                (sprite.isBuilding ? this.shadowContainer : this.objectContainer).addChild(sprite.shadowSprite);
            }

            if (ENABLE_DRAW_MAP_DEBUG) {
                const text = new PIXI.BitmapText(`(${sprite.blockX}, ${sprite.blockY})`, {
                    fontName: sprite.isActorSprite ? "ActorPosFont" : "TitleFont"
                });
                text.x = sprite.blockX * TILE_WIDTH;
                text.y = sprite.blockY * TILE_HEIGHT;
                this.foremostContainer.addChild(text);
            }

            this.objectContainer.addChild(sprite);
        });

        this.positionSpecifiedObjectSprites.forEach(sprite => {
            const { x, y, width, height } = sprite;

            if (!Camera.isRectInView({
                top: y, left: x, width, height
            })) {
                return;
            }

            this.positionSpecifiedObjectContainer.addChild(sprite);
            if (sprite.shadowSprite) {
                this.positionSpecifiedObjectContainer.addChild(sprite.shadowSprite);
            }
        });

        // actorSpritesInView.forEach(sprite => {

        // });

        if (ActorManager.focusActor_tmp) {
            // add hover sprite
            const actor = ActorManager.focusActor_tmp;
            const sprite = actor.getBody().createPixiSprite("body", actor.pos.x, actor.pos.y, actor.anm, actor.direct, actor.frame, actor.horizonScale, actor.verticalScale);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            sprite.alpha = 0.5;
            this.foremostContainer.addChild(sprite);
        }

        const endTime = performance.now();
        // window.redgemDebugLog.push({ type: "GameMap Render Time", time: endTime - startTime });
    }

    renderTile(code, blockX, blockY) {
        const tileTextureId = code % (16 << 10);
        const texture = this.tileTexture.getPixiTexture(tileTextureId);
        const sprite = new PIXI.Sprite(texture);
        sprite.width = TILE_WIDTH;
        sprite.height = TILE_HEIGHT;

        const chunkX = ~~(blockX / CONTAINER_SPLIT_BLOCK_SIZE);
        const chunkY = ~~(blockY / CONTAINER_SPLIT_BLOCK_SIZE);
        const chunkName = `${chunkX}-${chunkY}`;

        sprite.position.set((blockX - chunkX * CONTAINER_SPLIT_BLOCK_SIZE) * TILE_WIDTH, (blockY - chunkY * CONTAINER_SPLIT_BLOCK_SIZE) * TILE_HEIGHT);

        this.tileSubContainers[chunkName] = this.tileSubContainers[chunkName] || new PIXI.Container();
        this.tileSubContainers[chunkName].addChild(sprite);
    }

    renderObject(code, blockX, blockY) {
        // TODO: sort objects and shadows

        const map = this.map;
        const mapsetName = this.map.getMapsetName();

        if (code === 0 || code === 8193) return;
        if (code < 16 << 8) return;

        let index;
        let isBuilding = false;

        isBuilding = code >= 16 << 11;
        index = isBuilding ? code % (16 << 11) : code >= (16 << 10) ? code % (16 << 10) : code % (16 << 8);

        const objectInfo = isBuilding ? map.buildingInfos[index] : map.objectInfos[index];
        if (!objectInfo) {
            return;
        }

        const fileName = getTextureFileName(objectInfo.textureId, isBuilding ? "rbd" : undefined);
        const texture = isBuilding ? this.buildingTextures.getTexture(fileName) : this.objectTextures.getTexture(fileName);

        const blockCenterX = blockX * TILE_WIDTH + TILE_WIDTH / 2;
        const blockCenterY = blockY * TILE_HEIGHT + TILE_HEIGHT / 2;
        const x = blockCenterX - texture.shape.body.left[0];
        const y = blockCenterY - texture.shape.body.top[0];

        const pixiTexture = texture.getPixiTexture(0);
        const sprite = new PIXI.Sprite(pixiTexture);
        sprite.position.set(x, y);
        sprite.blockX = blockX;
        sprite.blockY = blockY;
        sprite.isBuilding = true;
        this.objectSprites.push(sprite);

        if (ENABLE_DRAW_MAP_DEBUG) {
            this.graphics.lineStyle(1, 0xf5b042);
            this.graphics.drawRect(
                blockX * TILE_WIDTH,
                blockY * TILE_HEIGHT,
                TILE_WIDTH,
                TILE_HEIGHT
            );
        }

        // animated objects (rso)
        if (!isBuilding && animationObjectTexIds[mapsetName]?.rso?.includes(objectInfo.textureId)) {
            const pixiTextures = [];
            for (let i = 1; i < texture.frameCount; i++) {
                pixiTextures.push(texture.getPixiTexture(i));
            }
            const x = blockCenterX - texture.shape.body.left[1];
            const y = blockCenterY - texture.shape.body.top[1];
            const sprite = new PIXI.AnimatedSprite(pixiTextures);
            sprite.position.set(x, y);
            sprite.animationSpeed = 0.1;
            sprite.blockX = blockX;
            sprite.blockY = blockY;
            sprite.play();
            this.objectSprites.push(sprite);
        }

        // shadow
        if ((objectInfo.isDrawShadow || isBuilding) && texture.isExistShadow) {
            const pixiTexture = texture.getPixiTexture(0, "shadow");

            const x = blockCenterX - texture.shape.shadow.left[0];
            const y = blockCenterY - texture.shape.shadow.top[0];

            const shadowSprite = new PIXI.Sprite(pixiTexture);
            shadowSprite.position.set(x, y);

            sprite.shadowSprite = shadowSprite;
        }

        // render sub objects
        !isBuilding && objectInfo.subObjectInfos.forEach(subObjectInfo => {
            const { textureId, offsetX, offsetY, xAnchorFlag, yAnchorFlag } = subObjectInfo;
            const fileName = getTextureFileName(textureId, "rfo");
            const texture = this.objectTextures.getTexture(fileName);
            const pixiTexture = texture.getPixiTexture(0);

            const x = xAnchorFlag === 0xff ? blockCenterX - 0xff + offsetX - texture.shape.body.left[0] : blockCenterX + offsetX - texture.shape.body.left[0];
            const y = yAnchorFlag === 0xff ? blockCenterY - 0xff + offsetY - texture.shape.body.top[0] : blockCenterY + offsetY - texture.shape.body.top[0];

            const sprite = new PIXI.Sprite(pixiTexture);
            sprite.position.set(x, y);
            sprite.blockX = blockX;
            sprite.blockY = blockY;
            this.objectSprites.push(sprite);

            // animated objects (rfo)
            if (animationObjectTexIds[mapsetName]?.rfo?.includes(textureId)) {
                const pixiTextures = [];
                for (let i = 1; i < texture.frameCount; i++) {
                    pixiTextures.push(texture.getPixiTexture(i));
                }
                const x = blockCenterX - texture.shape.body.left[1];
                const y = blockCenterY - texture.shape.body.top[1];
                const sprite = new PIXI.AnimatedSprite(pixiTextures);
                sprite.blockX = blockX;
                sprite.blockY = blockY;
                sprite.position.set(x, y);
                sprite.animationSpeed = 0.1;
                sprite.play();
                this.objectSprites.push(sprite);
            }
        });

        // render building parts
        if (isBuilding) {
            objectInfo.parts.forEach(frameIndex => {
                const pixiTexture = texture.getPixiTexture(frameIndex);

                const x = blockCenterX - texture.shape.body.left[frameIndex];
                const y = blockCenterY - texture.shape.body.top[frameIndex];

                const sprite = new PIXI.Sprite(pixiTexture);
                sprite.position.set(x, y);
                sprite.blockX = blockX;
                sprite.blockY = blockY;
                sprite.isBuilding = true;

                this.objectSprites.push(sprite);

                if (texture.isExistShadow) {
                    const pixiTexture = texture.getPixiTexture(frameIndex, "shadow");

                    const x = blockCenterX - texture.shape.shadow.left[frameIndex];
                    const y = blockCenterY - texture.shape.shadow.top[frameIndex];

                    const shadowSprite = new PIXI.Sprite(pixiTexture);
                    shadowSprite.position.set(x, y);

                    sprite.shadowSprite = shadowSprite;
                }
            });
        }
    }

    renderPortals() {
        this.map.areaInfos.forEach(area => {
            if (!area.moveToFileName) return;
            if (area.objectInfo !== ObjectType.WarpPortal) return;

            const centerPos = area.centerPos;
            let sprite;

            if (area.gateShape === 1) { // door
                const textures = Array(6).fill(null).map((v, i) => this.portalTexture.getPixiTexture(i));
                sprite = new PIXI.AnimatedSprite(textures);
            }
            else if (area.gateShape === 4) {
                const index = 109;
                const textures = Array(6).fill(null).map((v, i) => this.portalTexture.getPixiTexture(index + i));
                sprite = new PIXI.AnimatedSprite(textures);
            }
            else {
                const index = area.gateDirect + 2;
                const offset = index * 6;
                const textures = Array(6).fill(null).map((v, i) => this.portalTexture.getPixiTexture(offset + i));
                sprite = new PIXI.AnimatedSprite(textures);
            }

            const x = centerPos.x - sprite.width / 2;
            const y = centerPos.y - sprite.height / 2;

            sprite.position.set(x, y);
            sprite.interactive = true;
            sprite.animationSpeed = 0.3;
            sprite.play();
            sprite.on("mouseenter", () => {
                sprite.isHovering = true;

                // TOOD: implement portal grow animations
            });
            sprite.on("mouseleave", () => {
                sprite.isHovering = false;
            });
            sprite.on("mousedown", () => {
                this.selectedPortal = { area, sprite };
            });

            this.portalContainer.addChild(sprite);
        });
    }

    initPosition() {
        if (this.prevRmdName) {
            const portalToPrevMap = this.map.areaInfos.find(area => area.moveToFileName === this.prevRmdName);

            if (portalToPrevMap) {
                Camera.setPosition(portalToPrevMap.centerPos.x, portalToPrevMap.centerPos.y);
                RedStone.player.setPosition(portalToPrevMap.centerPos.x, portalToPrevMap.centerPos.y);
            } else {
                console.log("prev map portal not found :(");
                const portals = this.map.areaInfos.filter(area => [ObjectType.WarpPortal, ObjectType.SystemMovePosition].includes(area.objectInfo));
                const randomPortal = portals[Math.floor(Math.random() * portals.length)];
                Camera.setPosition(randomPortal.centerPos.x, randomPortal.centerPos.y);
                RedStone.player.setPosition(randomPortal.centerPos.x, randomPortal.centerPos.y);
            }
        }
    }

    getRealSize() {
        if (!this.map) return null;
        return {
            width: this.map.size.width * TILE_WIDTH,
            height: this.map.size.height * TILE_HEIGHT
        }
    }

    async moveField(rmdFileName) {
        if (rmdFileName === this.currentRmdFileName) return;
        this.prevRmdName = this.currentRmdFileName;
        LoadingScreen.render();
        RedStone.miniMap.reset();
        this.reset();
        await this.loadMap(rmdFileName);
        await this.init();
        RedStone.mainCanvas.mainContainer.removeChild(RedStone.player.container);
        RedStone.player.reset();
        RedStone.player.render();
        RedStone.miniMap.init();
        LoadingScreen.destroy();
    }

    getBlock(x, y) {
        const blocks = this.map.tileData3;
        if (blocks.length <= y * this.map.size.width + x) {
            return 1;
        }
        return blocks[y * this.map.size.width + x];
    }

    isBlockedWay(ax, ay, bx, by) {
        const x0 = Math.min(ax, bx);
        const x1 = Math.max(ax, bx);
        const y0 = Math.min(ay, by);
        const y1 = Math.max(ay, by);

        if (bx - ax > by - ay) {
            for (let x = x0; x < x1; x++) {
                const block = this.getBlock(
                    Math.round(x / 64),
                    Math.round(lerp(x0, y0, x1, y1, x) / 32)
                );
                if (block !== 0) {
                    console.log("code1", block)
                    return true;
                }
            }
        } else {
            for (let y = y0; y < y1; y++) {
                const block = this.getBlock(
                    Math.round(lerp(y0, x0, y1, x1, y) / 64),
                    Math.round(y / 32)
                );
                if (block !== 0) {
                    console.log("code2", block)
                    return true;
                }
            }
        }

        return false;
    }
}

const lerp = (x00, y00, x11, y11, x) => {
    return y00 + (y11 - y00) * (x - x00) / (x11 - x00);
}

export default GameMap;
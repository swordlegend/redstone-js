import BufferReader from "../../utils/BufferReader";
import { decodeScenarioBuffer, getKeyByValue, sjisByteToString } from "../../utils/RedStoneRandom";
import { MapActorGroup, MapActorSingle } from "./Actor";
import Event from "./Event";

export const MapType = {
    Dungeon: 1,
    Village: 2,
    Shop: 3
}

export const Mapset = {
    Grassland: 0,
    Mountains: 1,
    Desert: 2,
    Savana: 3,
    Cave: 4,
    Dungeon: 5,
    Tower: 6,
    Mine: 7,
    Hell: 8,
    Heaven: 9,
    Brunenstig: 10,
    Bigaple: 11,
    Augusta: 12,
    Bridgehead: 13,
    Mountains_Village: 14,
    Arian: 15,
    Ruined_City: 16,
    FarmHouse: 17,
    Gypsy: 18,
    Room: 19,
}

class Map {
    constructor(br) {
        this.br = br;

        this.size = {
            width: 0,
            height: 0
        }
        this.name = "";

        /**
         * @type {Number[]}
         */
        this.actorIndexes = [];

        /**
         * @type {{[key: number]: MapActorGroup}}
         */
        this.actorGroups = {};

        /**
         * @type {MapActorSingle[]}
         */
        this.actorSingles = [];

        /**
         * @type {{[key: number]: ObjectInfo}}
         */
        this.objectInfos = {};

        /**
         * @type {{[key: number]: BuildingInfo}}
         */
        this.buildingInfos = {};

        this.readData(br);
    }

    /**
     * 
     * @param {BufferReader} br 
     */
    readData(br) {
        this.fileSize = br.readUInt32LE();

        const portalAreaOffset = br.readInt32LE();
        const scenarioInfo = br.readString(0x38, "sjis");
        console.log("File:", scenarioInfo);

        const fieldAreaOffset = br.readInt32LE();
        this.size.width = br.readUInt32LE();
        this.size.height = br.readUInt32LE();

        this.name = br.readString(0x40, "sjis");;
        this.mapsetId = br.readUInt32LE();
        console.log("Mapset ID", this.mapsetId);
        const baseInfoBf1 = br.readUInt32LE();
        this.fieldType = (baseInfoBf1 & 0x0000000F) >>> 0;
        this.lastSaveIP = br.readUInt32LE();
        this.bgmIndex = br.readStructUInt16LE(30)[0];
        this.linkSecretDungeon = br.readUInt16LE();
        const baseInfoBf2 = br.readUInt16LE();
        br.readStructUInt16LE(6); // magic element resistances
        br.readStructUInt16LE(20); // monster resistances
        this.scenarioVersion = Number(scenarioInfo.substring(24, 24 + 4));
        console.log("Map Name:", this.name);
        console.log("Map Size:", this.size);

        if (this.scenarioVersion <= 6.0 && this.scenarioVersion > 5.7) {
            br.setDataEncodeTable(-1);
        }
        else if (this.scenarioVersion > 6.0) {
            const rawKey = br.readInt32LE();
            br.setDataEncodeTable(rawKey);
            console.log("RawKey:", rawKey);
            console.log("DecodeKey", br.decodeKey);
        }

        const realobjdata = br.readUInt32LE();
        // console.log("realobjdata:", realobjdata);

        const tileInfo = br.readStructUInt8(this.size.width * this.size.height * 6);
        const tileReader = new BufferReader(Buffer.from(tileInfo));
        const tileData1 = tileReader.readStructUInt16LE(this.size.width * this.size.height);
        const tileData2 = tileReader.readStructUInt16LE(this.size.width * this.size.height);
        const tileData3 = tileReader.readStructUInt16LE(this.size.width * this.size.height);
        // const tileData3 = (new Array(this.size.width * this.size.height)).fill(null).map(() => [tileReader.readUInt8(), tileReader.readUInt8()]);
        this.tileData1 = tileData1;
        this.tileData2 = tileData2;
        this.tileData3 = tileData3;

        // console.log("tileInfo", tileInfo);

        const doorListLen = br.readInt32LE();

        const doorList = [];
        for (let i = 0; i < doorListLen; i++) {
            doorList.push(br.readUInt64LE());
        }

        const blocks = br.readStructUInt8(this.size.width * this.size.height);
        for (let i = 0; i < this.size.height; i++) {
            let row = [];
            for (let j = 0; j < this.size.width; j++) {
                row.push(blocks[this.size.width * i + j]);
            }
        }

        // skip unknown
        let nextOffset = br.readInt32LE();
        br.offset = nextOffset;

        // actor indexes length
        let encryptedBytes = br.readStructUInt8(4);
        let decryptedBuffer = decodeScenarioBuffer(encryptedBytes, br.decodeKey);
        const actorIndexesLength = decryptedBuffer.readUInt32LE(0);

        encryptedBytes = br.readStructUInt8(actorIndexesLength * 2);
        decryptedBuffer = decodeScenarioBuffer(encryptedBytes, br.decodeKey);
        this.actorIndexes = (new BufferReader(decryptedBuffer)).readStructUInt16LE(actorIndexesLength);

        nextOffset = br.readInt32LE();

        // actor group info
        const actorGroupInfoStructSize = this.scenarioVersion > 5.4 ? br.readInt32LE() : 0x2C;
        for (let i = 0; i < this.actorIndexes.length; i++) {
            const actorGroupInfo = new MapActorGroup(br, actorGroupInfoStructSize, this.actorIndexes[i]);
            this.actorGroups[actorGroupInfo.internalID] = actorGroupInfo;
        }

        nextOffset = br.readInt32LE();

        // actor single info
        const actorSingleInfoLength = decodeScenarioBuffer(br.readStructUInt8(4), br.decodeKey).readUInt32LE(0);
        this.actorSingles = new Array(actorSingleInfoLength);
        for (let i = 0; i < actorSingleInfoLength; i++) {
            this.actorSingles[i] = new MapActorSingle(br);
        }

        // area info
        encryptedBytes = br.readStructUInt8(4);
        decryptedBuffer = decodeScenarioBuffer(encryptedBytes, br.decodeKey);
        const areaInfoLength = decryptedBuffer.readUInt32LE(0);
        this.areaInfos = new Array(areaInfoLength);
        for (let i = 0; i < areaInfoLength; i++) {
            this.areaInfos[i] = new AreaInfo(br, portalAreaOffset, this.scenarioVersion);
        }

        nextOffset = br.readInt32LE();

        // shop info
        br.offset = nextOffset; // skip

        const positionSpecifiedObjectCount = br.readInt32LE();
        console.log("Num of objects with absolute position specified:", positionSpecifiedObjectCount);

        br.readStructUInt8(2400); // ???

        this.positionSpecifiedObjects = new Array(positionSpecifiedObjectCount);
        for (let i = 0; i < positionSpecifiedObjectCount; i++) {
            const x = br.readUInt32LE();
            const y = br.readUInt32LE();
            const textureId = br.readUInt16LE();
            const unk_0 = br.readUInt16LE();
            this.positionSpecifiedObjects[i] = {
                point: { x, y },
                textureId
            };
        }

        const objectInfoCount = br.readUInt32LE();
        console.log("object info count", objectInfoCount);

        for (let i = 0; i < objectInfoCount; i++) {
            const objectInfo = new ObjectInfo(br);
            if (this.objectInfos[objectInfo.index]) {
                console.log("An object with the same id already exists", objectInfo, this.objectInfos[objectInfo.index]);
                // throw new Error("[Error] An object with the same id already exists");
            }
            this.objectInfos[objectInfo.index] = objectInfo;
        }

        const buildingCount = br.readUInt32LE();
        console.log("building count", buildingCount);

        for (let i = 0; i < buildingCount; i++) {
            const buildingInfo = new BuildingInfo(br);
            this.buildingInfos[buildingInfo.index] = buildingInfo;
        }
    }

    getMapsetName() {
        return getKeyByValue(Mapset, this.mapsetId);
    }
}

export const ObjectType = {
    System: 0, //システム
    Unk1: 1, //
    Door: 2, //扉
    WarpPortal: 3, //ワープポータル
    SystemArea: 4, //システム領域
    SystemMovePosition: 5, //システム転送位置
    Area: 6, //エリア
    PvPMovePosition: 7, //PvP転送位置
    OXArea_O: 8, //○×クイズ領域(○)
    OXArea_X: 9, //○×クイズ領域(×)
    Unk2: 10, // 
    TrapFloor: 11, // トラップ床
    EventObject: 12, // イベントオブジェクト
    Chest: 13, // 宝箱
    Unk3: 14, // 
    Unk4: 15, // 
    Unk5: 16, // 
    HuntingArea: 17, // 冒険家協会推奨狩場
    SystemArea2: 18, // システムエリア
    Unk6: 19, // 
    Unk7: 20, //
}

export const portalTextureInfo = {
    door: {},
    doorGrow: {},
    topGate: {},
    topRightGate: {},
    rightGate: {},
    bottomRightGate: {},
    bottomGate: {},
    bottomLeftGate: {},
    leftGate: {},
    topLeftGate: {},
}

class AreaInfo {
    constructor(br, portalAreaOffset, scenarioVersion) {
        this.br = br;
        this.portalAreaOffset = portalAreaOffset;
        this.scenarioVersion = scenarioVersion;
        this.readData(br);
    }

    get centerPos() {
        return {
            x: (this.rightDownPos.x + this.leftUpPos.x) / 2,
            y: (this.rightDownPos.y + this.leftUpPos.y) / 2
        }
    }

    /**
     * @param {BufferReader} br 
     */
    readData(br) {
        const decryptedBuf = decodeScenarioBuffer(br.readStructUInt8(0xA2), br.decodeKey);
        const baseReader = new BufferReader(decryptedBuf);

        this.index = baseReader.readUInt16LE();
        this.leftUpPos = { x: baseReader.readUInt32LE(), y: baseReader.readUInt32LE() };
        this.rightDownPos = { x: baseReader.readUInt32LE(), y: baseReader.readUInt32LE() };
        this.objectInfo = baseReader.readUInt16LE(); // ObjectType
        this.subObjectInfo = baseReader.readUInt16LE();
        this.bGate = baseReader.readUInt8();
        const flags = baseReader.readUInt8();
        this.gateDirect = (flags & 0b00000111);
        this.gateShape = (flags >> 3) & 0b00011111;
        this.moveGate = baseReader.readUInt16LE();

        const EVENT_OBJECT = 12;
        const code = this.objectInfo === EVENT_OBJECT ? "sjis" : "EUC-KR";

        this.comment1 = baseReader.readString(0x21, code);
        this.comment2 = baseReader.readString(0x67, code);
        // console.log("check areainfo comments", this.comment1, this.comment2);

        const skipPos = this.scenarioVersion > 4.4 ? br.readInt32LE() : br.readInt16LE() + 2;

        this.areaEvents = new Array(skipPos > 1 ? br.readInt16LE() : 0);
        if (this.areaEvents.length !== 0) {
            const unk = br.readUInt32LE();
            for (let i = 0; i < this.areaEvents.length; i++) {
                this.areaEvents[i] = new Event(br, 0);
            }
        }

        const myPortalStringOffset = br.readInt32LE();
        if (myPortalStringOffset === -1) {
            this.moveToFileName = null;
        } else {
            const returnPosition = br.offset;
            br.offset = myPortalStringOffset + this.portalAreaOffset; // seek from origin
            let readCount = br.readInt32LE() + 1;
            if (readCount + br.offset > br.buffer.byteLength - 1) readCount = br.buffer.byteLength - br.offset;
            this.moveToFileName = br.readString(readCount);
            br.offset = returnPosition;
        }
    }
}

class ObjectInfo {
    constructor(br) {
        this.br = br;
        this.subObjectInfos = [];

        this.readData(br);
    }

    /**
     * @param {BufferReader} br 
     */
    readData(br) {
        this.index = br.readUInt16LE();
        const unk1 = br.readUInt8(); // 0xCD (205) ??
        const unk2 = br.readUInt8(); // 0xCD (205) ??
        const unk3 = br.readUInt32LE();
        const unk4 = br.readUInt32LE();

        this.textureId = br.readUInt16LE();
        this.readSubObjects();

        this.isDrawShadow = br.readUInt16LE() === 1;
    }

    readSubObjects() {
        const subObjectBytes = this.br.readStructUInt8(48);
        const subObjectReader = new BufferReader(Buffer.from(subObjectBytes));

        for (let i = 0; i < 8; i++) {
            const textureId = subObjectReader.readUInt16LE();

            if (textureId === 0xffff) break;

            this.subObjectInfos.push({
                textureId,
                offsetX: subObjectReader.readUInt8(),
                xAnchorFlag: subObjectReader.readUInt8(),
                offsetY: subObjectReader.readUInt8(),
                yAnchorFlag: subObjectReader.readUInt8()
            });
        }
    }
}

class BuildingInfo {
    constructor(br) {
        this.br = br;
        this.parts = [];
        this.readData(br);
    }

    /**
     * @param {BufferReader} br 
     */
    readData(br) {
        this.index = br.readUInt16LE();

        const unk1 = br.readUInt8(); // 0xCD (205) ??
        const unk2 = br.readUInt8(); // 0xCD (205) ??
        const unk3 = br.readUInt32LE();
        const unk4 = br.readUInt32LE();

        this.textureId = br.readUInt16LE();

        // unknown 6 bytes 
        br.readUInt16LE();
        br.readUInt16LE();
        br.readUInt16LE();

        const parts = br.readStructUInt8(42);
        const partsReader = new BufferReader(Buffer.from(parts));

        // 42 bytes
        for (let i = 0; i < 21; i++) {
            const textureId = partsReader.readUInt16LE();

            if (textureId === 0xffff) break;

            this.parts.push(textureId);
        }

        // unknown data
        // br.readStructUInt8(22);
        br.offset += 22;
    }
}

export default Map;
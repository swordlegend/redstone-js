import { BGM_DIR } from "./Config";

const BGM_SET = [
    "01 Title-Legend of Red Stone.ogg",
    "02 Brunenstig-Old City Brunenstig.ogg",
    "03 Grassland-Echo of Wind.ogg",
    "04 Cave-Impression of Adventure.ogg",
    "05 Mountain Village-My Sweety Home.ogg",
    "06 Mountain-Teeth of the Earth.ogg",
    "07 Dungeon-Cold Spirits.ogg",
    "08 Mine-Dark Stream.ogg",
    "09 Liberation Team-Sorrow of Pure White",
    "10 Desert-Yellow Sand, Oasis, and Life.",
    "11 Dessert Village-Cactus.ogg",
    "12 Ruined City-Scar of Brick.ogg",
    "13 Savanna-Beat of Root.ogg",
    "14 Tower-Dancing Gear.ogg",
    "15 Small Town-Incongruity.ogg",
    "16 Temple-Rose Window.ogg",
]

export default class BgmPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.currentBgmIndex = null;
    }

    play(index) {
        if (this.currentBgmIndex === index) return;
        const fileName = BGM_SET[index - 1];
        this.audio.src = `${BGM_DIR}/${fileName}`;
        this.audio.volume = 0.1;
        this.audio.play();
        this.currentBgmIndex = index;
    }
}
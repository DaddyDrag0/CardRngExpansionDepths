"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/data/cards-1.json
  var cards_1_default = [{ name: "100 Men", imageAssetId: 102216148060287, rarity: 1e5, statMultiplier: 1, hpMultiplier: 100, ability: "Perseverance", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "A0-ON1", imageAssetId: 18583107734, rarity: 66666, statMultiplier: 1, hpMultiplier: 1, ability: "Friendship", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Abomination", imageAssetId: 103786369533124, rarity: 5e7, statMultiplier: 9, hpMultiplier: 1, ability: "Chimeric", weather: "Armageddon", pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Academy Student", imageAssetId: 18864759840, rarity: 3e5, statMultiplier: 1.5, hpMultiplier: 1, ability: "Railgun", weather: "Storm", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Accuser", imageAssetId: 110392793435230, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Goon Detector", weather: null, pack: "Anime", boss: false, unobtainable: true, expires: false }, { name: "Achlys", imageAssetId: 86211611736313, rarity: 7e8, statMultiplier: 2, hpMultiplier: 1, ability: "Divine Mist", weather: "Shroud", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Admiral Ice", imageAssetId: 18866204730, rarity: 75e4, statMultiplier: 1, hpMultiplier: 1, ability: "Ice Age", weather: "Snow", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "AK4-ON1", imageAssetId: 18565440501, rarity: 66666, statMultiplier: 1, hpMultiplier: 1, ability: "Friendship", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Amaterasu", imageAssetId: 104209469077486, rarity: 3e8, statMultiplier: 1.2, hpMultiplier: 1, ability: "Heavenly Ruler", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Amenhotep", imageAssetId: 88437864754378, rarity: 15e4, statMultiplier: 1, hpMultiplier: 1, ability: "Sacrifice", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Ancient Egg", imageAssetId: 135424367651122, rarity: 2e3, statMultiplier: 1, hpMultiplier: 1, ability: "Hard Boiled", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Ankylosaurus", imageAssetId: 110000143527967, rarity: 2e7, statMultiplier: 1, hpMultiplier: 1, ability: "Spikes", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Anubis", imageAssetId: 17491275108, rarity: 25e5, statMultiplier: 1, hpMultiplier: 1, ability: "Beyond The Grave", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Anubis & Hades", imageAssetId: 104426077859932, rarity: 666666666, statMultiplier: 1, hpMultiplier: 1, ability: "Gehenna", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Aphrodite", imageAssetId: 93230067174945, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Heart Legacy", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Arcane Avian", imageAssetId: 79181342020396, rarity: 5e3, statMultiplier: 1.5, hpMultiplier: 1, ability: "Blinding Flash", weather: "Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Archer", imageAssetId: 17600394326, rarity: 2, statMultiplier: 1, hpMultiplier: 1, ability: "Evasion", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Armin The Humble", imageAssetId: 17344859764, rarity: 25e6, statMultiplier: 1, hpMultiplier: 1, ability: "Modesty", weather: null, pack: null, boss: true, unobtainable: true, expires: false }, { name: "Arthur", imageAssetId: 17783899080, rarity: 500, statMultiplier: 1, hpMultiplier: 1, ability: "Last Stand", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Arthur of Excalibur", imageAssetId: 17463217108, rarity: 15e3, statMultiplier: 1, hpMultiplier: 1, ability: "True Strike", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Artoria of Excalibur", imageAssetId: 73956851627828, rarity: 25e4, statMultiplier: 1, hpMultiplier: 1, ability: "Avalon", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Assassin King", imageAssetId: 124506994365754, rarity: 15e6, statMultiplier: 1, hpMultiplier: 1, ability: "Assassinate", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Astraeus", imageAssetId: 98285077991323, rarity: 2e7, statMultiplier: 3.24669, hpMultiplier: 1, ability: "Constellar", weather: "Meteor Shower", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Azure Witch", imageAssetId: 85868011390611, rarity: 3118418147, statMultiplier: 1, hpMultiplier: 1, ability: "Moonlight Beam", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Baba Yaga", imageAssetId: 119505959232685, rarity: 2e5, statMultiplier: 8, hpMultiplier: 1, ability: "Reversal Rite", weather: "Eclipse", pack: null, boss: false, unobtainable: true, expires: false }, { name: "Baby Skeleton", imageAssetId: 17783445566, rarity: 20, statMultiplier: 1, hpMultiplier: 1, ability: "Brittle", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Bacon Hair", imageAssetId: 17437475863, rarity: 6e3, statMultiplier: 1, hpMultiplier: 1, ability: "Oppressed", weather: null, pack: "Era2", boss: true, unobtainable: false, expires: false }, { name: "Bad Boys", imageAssetId: 82946184242115, rarity: 1e6, statMultiplier: 1, hpMultiplier: 1, ability: "Cerberus", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Bakunawa", imageAssetId: 134118730762569, rarity: 2e10, statMultiplier: 1.5, hpMultiplier: 1, ability: "Eat The Moon", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Banshee", imageAssetId: 116668197113113, rarity: 7500, statMultiplier: 1, hpMultiplier: 1, ability: "Wail", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Beelzebub", imageAssetId: 17185326166, rarity: 666, statMultiplier: 1, hpMultiplier: 1, ability: "Rage", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Behemoth", imageAssetId: 123606214090171, rarity: 5e8, statMultiplier: 8, hpMultiplier: 1, ability: "Prehistoric Wrath", weather: "Blood Rain", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Bigfoot", imageAssetId: 117451701568512, rarity: 15e6, statMultiplier: 1, hpMultiplier: 1, ability: "Heard but not Seen", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Black Cat", imageAssetId: 126563497915648, rarity: 66666, statMultiplier: 1, hpMultiplier: 1, ability: "Unlucky", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Black Plague", imageAssetId: 115526805924707, rarity: 1e7, statMultiplier: 6, hpMultiplier: 1, ability: "Pandemic", weather: "Virus", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Bloody Mary", imageAssetId: 101826741532094, rarity: 15e4, statMultiplier: 8, hpMultiplier: 1, ability: "Mirror Image", weather: "Blood Rain", pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Boreas", imageAssetId: 17261316069, rarity: 15e5, statMultiplier: 1.75, hpMultiplier: 1, ability: "Northern Winds", weather: "Aurora", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Brachiosaurus", imageAssetId: 97010623442519, rarity: 71e3, statMultiplier: 1, hpMultiplier: 1, ability: "Long Reach", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Brunhilde", imageAssetId: 119932341146091, rarity: 25e4, statMultiplier: 1, hpMultiplier: 1, ability: "Judgment", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Buddha", imageAssetId: 116973082397778, rarity: 108e8, statMultiplier: 1, hpMultiplier: 1, ability: "Lotus Sutra", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Buddhist Monk", imageAssetId: 101188671725062, rarity: 9e5, statMultiplier: 1, hpMultiplier: 1, ability: "Golden Bell Shield", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "B\u011Bi F\u0101ng Xu\xE1n W\u01D4", imageAssetId: 101458618363344, rarity: 45e7, statMultiplier: 1, hpMultiplier: 1, ability: "Water Shield of Xuanwu", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Cat Lady", imageAssetId: 18864821114, rarity: 15e6, statMultiplier: 1, hpMultiplier: 1, ability: "Danger Sense", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Cave Goblin", imageAssetId: 17437475863, rarity: 6, statMultiplier: 1, hpMultiplier: 1, ability: "Dagger", weather: null, pack: null, boss: true, unobtainable: true, expires: false }, { name: "Cave Goblin & Wind Spirit", imageAssetId: 72623401052580, rarity: 3e7, statMultiplier: 1, hpMultiplier: 1, ability: "Dagger Storm", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Cave Goblin God", imageAssetId: 124425677088541, rarity: 666e6, statMultiplier: 1.2, hpMultiplier: 1, ability: "Infinite Dagger Works", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Chaos", imageAssetId: 120549019092177, rarity: 1e7, statMultiplier: 8, hpMultiplier: 1, ability: "Origin", weather: "Eclipse", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Cherub", imageAssetId: 85875775387717, rarity: 2e4, statMultiplier: 1, hpMultiplier: 1, ability: "Frail", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }];

  // src/data/cards-2.json
  var cards_2_default = [{ name: "Chronal", imageAssetId: 108154814645477, rarity: 15e9, statMultiplier: 1, hpMultiplier: 7, ability: "Lucky \u{1F921}", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Chronus The Hoarder", imageAssetId: 17855457937, rarity: 1e4, statMultiplier: 2, hpMultiplier: 1, ability: "Desire", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Chupacabra", imageAssetId: 108713957886096, rarity: 5e6, statMultiplier: 1, hpMultiplier: 1, ability: "Poke the Beast", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Community", imageAssetId: 90534996366886, rarity: 3e9, statMultiplier: 1.2, hpMultiplier: 1, ability: "Gathering", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Conqueror", imageAssetId: 130423117999240, rarity: 25e3, statMultiplier: 1, hpMultiplier: 1, ability: "Dominate", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Control Freak", imageAssetId: 131801924648369, rarity: 5e5, statMultiplier: 1, hpMultiplier: 1, ability: "Devilish", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Cosmic Pop Star", imageAssetId: 112666638596344, rarity: 1e7, statMultiplier: 3.25, hpMultiplier: 1, ability: "Stolen Spotlight", weather: "Meteor Shower", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Count Muscula", imageAssetId: 17185331766, rarity: 2e6, statMultiplier: 1, hpMultiplier: 1, ability: "Lifesteal", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Cronus", imageAssetId: 17583029959, rarity: 25e6, statMultiplier: 4, hpMultiplier: 1, ability: "Decay", weather: "Time Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Crown Prince", imageAssetId: 17261317007, rarity: 200, statMultiplier: 1, hpMultiplier: 1, ability: "Finesse", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Cthulu", imageAssetId: 133756511136876, rarity: 11e8, statMultiplier: 2, hpMultiplier: 1, ability: "Beyond Comprehension", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Cyberdon", imageAssetId: 119787552134834, rarity: 15e7, statMultiplier: 4, hpMultiplier: 1, ability: "Laser Gun", weather: "Time Storm", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Dad", imageAssetId: 17883641275, rarity: 5e7, statMultiplier: 1, hpMultiplier: 1, ability: "Whooping", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Dancer", imageAssetId: 110333523218462, rarity: 5e3, statMultiplier: 1, hpMultiplier: 1, ability: "Rapid Blows", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Darling", imageAssetId: 18864789620, rarity: 5e4, statMultiplier: 1, hpMultiplier: 1, ability: "Combatant", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Death", imageAssetId: 82608233327507, rarity: 4e9, statMultiplier: 1, hpMultiplier: 1, ability: "Doom", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Demon Hunter", imageAssetId: 18864815893, rarity: 500, statMultiplier: 1, hpMultiplier: 1, ability: "Boiling Blood", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Demonic Cultivator", imageAssetId: 92907775485255, rarity: 35e3, statMultiplier: 8, hpMultiplier: 1, ability: "Dark Qi Manipulation", weather: "Blood Rain", pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Deus Ex", imageAssetId: 17269040607, rarity: 1e7, statMultiplier: 1, hpMultiplier: 1, ability: "Transcend Time", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Dilophosaurus", imageAssetId: 82765612279555, rarity: 5e5, statMultiplier: 6, hpMultiplier: 1, ability: "Deadly Ambush", weather: "Virus", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Dionysus", imageAssetId: 85339795614898, rarity: 1e6, statMultiplier: 2, hpMultiplier: 1, ability: "Grape Juice", weather: "Rapture", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Divine Doctor", imageAssetId: 130517374164295, rarity: 25e5, statMultiplier: 1, hpMultiplier: 1, ability: "Healing Miracle", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Domain Master", imageAssetId: 100926489967787, rarity: 25e6, statMultiplier: 1, hpMultiplier: 1, ability: "Limitless", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Dr. Frankenstein", imageAssetId: 70495589220923, rarity: 35e5, statMultiplier: 1, hpMultiplier: 1, ability: "Playing God", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Dracula", imageAssetId: 99389737024636, rarity: 25e6, statMultiplier: 2, hpMultiplier: 1, ability: "First Progenitor", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "D\u014Dng F\u0101ng Q\u012Bng L\xF3ng", imageAssetId: 121630352038425, rarity: 45e7, statMultiplier: 1, hpMultiplier: 1, ability: "Azure Dragon Wrath", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Engineer", imageAssetId: 131047863634428, rarity: 35e3, statMultiplier: 1, hpMultiplier: 1, ability: "Firepower", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Epitome", imageAssetId: 17349930062, rarity: 5e7, statMultiplier: 1, hpMultiplier: 1, ability: "The End", weather: null, pack: null, boss: true, unobtainable: true, expires: false }, { name: "Fafnir", imageAssetId: 17365278067, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Decimate", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Failed Mage", imageAssetId: 18866499558, rarity: 3e6, statMultiplier: 1, hpMultiplier: 1, ability: "Explosion", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Famine", imageAssetId: 71942159768285, rarity: 2e9, statMultiplier: 1, hpMultiplier: 1, ability: "Starvation", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Flying Dutchman", imageAssetId: 75760996762467, rarity: 3e7, statMultiplier: 2, hpMultiplier: 2, ability: "Eternal Voyage", weather: "Storm", pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Forest Spirit", imageAssetId: 129996470093884, rarity: 75, statMultiplier: 1, hpMultiplier: 1, ability: "Regenerate", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Frank", imageAssetId: 131200769399825, rarity: 12e7, statMultiplier: 1.5, hpMultiplier: 1, ability: "Meow", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Frankenstein", imageAssetId: 17261317285, rarity: 35e4, statMultiplier: 1, hpMultiplier: 1, ability: "Self-Destruct", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Fresno Nightcrawler", imageAssetId: 71683453403132, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "A Pair of Two", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Frosty The Snowman", imageAssetId: 134990909534523, rarity: 500, statMultiplier: 1, hpMultiplier: 1, ability: "Imminent Doom", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Fuxi", imageAssetId: 82478494686161, rarity: 11e8, statMultiplier: 1, hpMultiplier: 1, ability: "Order of the Cosmos", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Gambler", imageAssetId: 18868146057, rarity: 7777, statMultiplier: 1, hpMultiplier: 1, ability: "Reaper's Luck", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "General Moon Zoo", imageAssetId: 17261319299, rarity: 100, statMultiplier: 1, hpMultiplier: 1, ability: "Art of War", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "George Washington", imageAssetId: 18316523567, rarity: 1776e4, statMultiplier: 1, hpMultiplier: 1, ability: "Guerilla Warfare", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Ghoul", imageAssetId: 106177792129031, rarity: 1e3, statMultiplier: 2, hpMultiplier: 1, ability: "Dirty Claw", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Gideon The Insatiable", imageAssetId: 105699407185990, rarity: 1e6, statMultiplier: 2, hpMultiplier: 1, ability: "Voracity", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Gilgamesh", imageAssetId: 17491438053, rarity: 5e7, statMultiplier: 1, hpMultiplier: 1, ability: "Stalwart", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Gingerbread Man", imageAssetId: 128865490536148, rarity: 7e4, statMultiplier: 1, hpMultiplier: 1, ability: "Run As Fast As You Can", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Glamour", imageAssetId: 79693334808220, rarity: 1e9, statMultiplier: 3, hpMultiplier: 1, ability: "Shapeshifter", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Good Boy", imageAssetId: 76766964555096, rarity: 8, statMultiplier: 1, hpMultiplier: 1, ability: "Puppy Eyes", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Gorilla", imageAssetId: 83789951398828, rarity: 1e7, statMultiplier: 1.1, hpMultiplier: 1.1, ability: "Big and Large", weather: null, pack: null, boss: false, unobtainable: false, expires: true }];

  // src/data/cards-3.json
  var cards_3_default = [{ name: "Greedy Belly", imageAssetId: 17462682605, rarity: 1e4, statMultiplier: 1, hpMultiplier: 1, ability: "Plunder", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Gunslinger", imageAssetId: 18864785064, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Disarm", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Hades", imageAssetId: 17261318454, rarity: 6666666, statMultiplier: 1, hpMultiplier: 1, ability: "The Underworld", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Hard Claws", imageAssetId: 85944572728584, rarity: 1e9, statMultiplier: 1, hpMultiplier: 1, ability: "Catastrophe", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Hathor", imageAssetId: 113239790288958, rarity: 25e6, statMultiplier: 1, hpMultiplier: 1, ability: "Eternal Devotion", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Headless Horseman", imageAssetId: 129496985923275, rarity: 1e6, statMultiplier: 2, hpMultiplier: 1, ability: "Haunt", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Heaven's Armor", imageAssetId: 17846852960, rarity: 1e6, statMultiplier: 4, hpMultiplier: 1, ability: "Invincibility", weather: "Rapture", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Heavenly Demon", imageAssetId: 96188969870741, rarity: 7e5, statMultiplier: 3, hpMultiplier: 1, ability: "Chaos Destruction", weather: "Rapture", pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Hecate", imageAssetId: 71616043744214, rarity: 3e7, statMultiplier: 8, hpMultiplier: 1, ability: "Witch's Curse", weather: "Eclipse", pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Hell's Army", imageAssetId: 17846853440, rarity: 1e6, statMultiplier: 4, hpMultiplier: 1, ability: "Hell's Curse", weather: "Rapture", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Hera", imageAssetId: 17461753890, rarity: 3845e4, statMultiplier: 1, hpMultiplier: 1, ability: "Blessing", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Hoarfrost Phoenix", imageAssetId: 17860482480, rarity: 555555, statMultiplier: 1.5, hpMultiplier: 1, ability: "Frozen Ashes", weather: "Snow", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Horus", imageAssetId: 17504099068, rarity: 75e4, statMultiplier: 1, hpMultiplier: 1, ability: "Divine Barrier", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Hunter", imageAssetId: 115272964881075, rarity: 2e3, statMultiplier: 1, hpMultiplier: 1, ability: "Patience", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Ice Queen", imageAssetId: 83758577850030, rarity: 3e4, statMultiplier: 1.5, hpMultiplier: 1, ability: "Frigid Touch", weather: "Snow", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Immortal Cultivator", imageAssetId: 135882473262918, rarity: 45e5, statMultiplier: 1, hpMultiplier: 1, ability: "Immortal Ascension", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Immortal Witch", imageAssetId: 78402790359154, rarity: 15e5, statMultiplier: 0.8, hpMultiplier: 1.5, ability: "Rejuvenate", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Inari", imageAssetId: 18584997481, rarity: 1e6, statMultiplier: 1, hpMultiplier: 1, ability: "Final Tail", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Infected Maw", imageAssetId: 133494979497907, rarity: 666e3, statMultiplier: 1, hpMultiplier: 1, ability: "Viral Breath", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Ixion", imageAssetId: 17582807651, rarity: 1e5, statMultiplier: 4, hpMultiplier: 1, ability: "Lightning Slash", weather: "Time Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Jamiy the Bald One", imageAssetId: 17763852657, rarity: 1e6, statMultiplier: 1, hpMultiplier: 1, ability: "Shiny Steal", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Jason", imageAssetId: 80078793926913, rarity: 8e8, statMultiplier: 2, hpMultiplier: 1, ability: "Chainsaw", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Jersey Devil", imageAssetId: 121349606697646, rarity: 1e7, statMultiplier: 1, hpMultiplier: 1, ability: "Terror From Above", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Ji\u0101ngsh\u012B", imageAssetId: 82540207503167, rarity: 8e5, statMultiplier: 1, hpMultiplier: 1, ability: "Feeder", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Joe", imageAssetId: 18864782301, rarity: 7e6, statMultiplier: 1, hpMultiplier: 1, ability: "The World", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Judgment Day", imageAssetId: 136840532863707, rarity: 7777777, statMultiplier: 3, hpMultiplier: 1, ability: "Armageddon", weather: "Rapture", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Juggernoid", imageAssetId: 113076587256952, rarity: 1e7, statMultiplier: 1, hpMultiplier: 1, ability: "Reflective Shell", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Julius Leader", imageAssetId: 130544780099910, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Influence", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Kid Gohan", imageAssetId: 82287472687346, rarity: 75e6, statMultiplier: 1.5, hpMultiplier: 1, ability: "Mr. Piccolo", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Kira", imageAssetId: 18864770969, rarity: 51128200, statMultiplier: 3, hpMultiplier: 1, ability: "Book of Death", weather: "Rapture", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Kitsune", imageAssetId: 18565471005, rarity: 1e4, statMultiplier: 1, hpMultiplier: 1, ability: "First Tail", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Knightmare", imageAssetId: 17844158327, rarity: 5e3, statMultiplier: 1, hpMultiplier: 1, ability: "First Blood", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Kraken", imageAssetId: 105013450079985, rarity: 7e9, statMultiplier: 1.3, hpMultiplier: 1, ability: "Sudden Demise", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Krampus", imageAssetId: 81264998041962, rarity: 2e6, statMultiplier: 8, hpMultiplier: 1, ability: "Behavioral Therapy", weather: "Blood Rain", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Kuchisake-onna", imageAssetId: 107893138861947, rarity: 555444321, statMultiplier: 1, hpMultiplier: 1, ability: "Am I Beautiful?", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Legends", imageAssetId: 93297365826533, rarity: 1e10, statMultiplier: 1.2, hpMultiplier: 1, ability: "Heroes", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Leviathan", imageAssetId: 17269039934, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Maelstrom", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Lilith The Enchantress", imageAssetId: 17271116415, rarity: 5e6, statMultiplier: 2, hpMultiplier: 1, ability: "Passion", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Loch Ness", imageAssetId: 123294787283986, rarity: 25e5, statMultiplier: 1.3, hpMultiplier: 1, ability: "Hidden in the Depths", weather: "Storm", pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Loki", imageAssetId: 92428893293934, rarity: 2e6, statMultiplier: 9, hpMultiplier: 1, ability: "God of Trickery", weather: "Armageddon", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Longmu", imageAssetId: 126531404590536, rarity: 715e6, statMultiplier: 2, hpMultiplier: 1, ability: "Draconian", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Loveland Frog", imageAssetId: 95077826592965, rarity: 5e6, statMultiplier: 2, hpMultiplier: 1, ability: "Final Stand", weather: "Shroud", pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Lucifer", imageAssetId: 17261315343, rarity: 1e3, statMultiplier: 8, hpMultiplier: 1, ability: "The Fall", weather: "Blood Rain", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Lyra", imageAssetId: 94388804518646, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Anullment", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Malakim", imageAssetId: 121393189674558, rarity: 666666e3, statMultiplier: 1, hpMultiplier: 1, ability: "Melancholy", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Malik The Sovereign", imageAssetId: 17855459107, rarity: 1e5, statMultiplier: 2, hpMultiplier: 1, ability: "Vainglory", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Mammoth", imageAssetId: 117208140241538, rarity: 1e6, statMultiplier: 1.5, hpMultiplier: 1, ability: "Stampede", weather: "Snow", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Marionette", imageAssetId: 96195175576111, rarity: 75e5, statMultiplier: 1, hpMultiplier: 1, ability: "Dance of Discord", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }];

  // src/data/cards-4.json
  var cards_4_default = [{ name: "Marrowclaw", imageAssetId: 100831891192106, rarity: 1e7, statMultiplier: 3.24669, hpMultiplier: 1, ability: "Erosion", weather: "Meteor Shower", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Martial Artist", imageAssetId: 111770087025996, rarity: 5e5, statMultiplier: 1, hpMultiplier: 1, ability: "Martial Will", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Mastermind", imageAssetId: 18872207160, rarity: 11111111, statMultiplier: 1, hpMultiplier: 1, ability: "Mind Rift", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Megalodon", imageAssetId: 125952174274177, rarity: 5e9, statMultiplier: 1, hpMultiplier: 1, ability: "Jaws", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Memories", imageAssetId: 112697905280561, rarity: 6e9, statMultiplier: 1.2, hpMultiplier: 1, ability: "Remembrance", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Meteosaurus", imageAssetId: 84724989450022, rarity: 9e6, statMultiplier: 3, hpMultiplier: 1, ability: "Extinction", weather: "Rapture", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Michael", imageAssetId: 112647707421912, rarity: 1e3, statMultiplier: 1, hpMultiplier: 1, ability: "Holy Wrath", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Michael M.", imageAssetId: 122452328661023, rarity: 6e8, statMultiplier: 2, hpMultiplier: 1, ability: "Persistent", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Milk", imageAssetId: 17883640836, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Happy Family", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Mist Spirit", imageAssetId: 104086342668128, rarity: 55e4, statMultiplier: 2, hpMultiplier: 1, ability: "Hidden Curse", weather: "Shroud", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Morpheus The Slumberer", imageAssetId: 17855459606, rarity: 2e7, statMultiplier: 2, hpMultiplier: 1, ability: "Lazy", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Mother of Beasts", imageAssetId: 104678178654866, rarity: 5e9, statMultiplier: 2, hpMultiplier: 1, ability: "Forbidden Banquet", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Mothman", imageAssetId: 126273555258886, rarity: 1e7, statMultiplier: 1, hpMultiplier: 1, ability: "Lights Way", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Mrs. Claus", imageAssetId: 87792609794061, rarity: 15e7, statMultiplier: 1, hpMultiplier: 1, ability: "Housewife's Blessing", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Mummy", imageAssetId: 18100064201, rarity: 250, statMultiplier: 1, hpMultiplier: 1, ability: "Bind", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Mutant", imageAssetId: 82353624171930, rarity: 1e7, statMultiplier: 1, hpMultiplier: 4, ability: "Mutate", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Naga", imageAssetId: 123168800440353, rarity: 1777776, statMultiplier: 1, hpMultiplier: 1, ability: "Reveal", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Nao Presence", imageAssetId: 72855985106132, rarity: 1e6, statMultiplier: 3.24669, hpMultiplier: 1, ability: "Invisibility", weather: "Meteor Shower", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Night Witch", imageAssetId: 136089714145673, rarity: 18e3, statMultiplier: 2, hpMultiplier: 1, ability: "Hex", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Ninja", imageAssetId: 91874318917141, rarity: 99, statMultiplier: 1, hpMultiplier: 1, ability: "Revenge", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Noveau Riche", imageAssetId: 84503498122200, rarity: 2e5, statMultiplier: 1, hpMultiplier: 1, ability: "Unpaid 'Interns'", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "N\xE1n F\u0101ng Zh\u016B Qu\xE8", imageAssetId: 103101227992756, rarity: 45e7, statMultiplier: 1, hpMultiplier: 1, ability: "Flames of Rebirth", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "N\xFCwa", imageAssetId: 107896195997219, rarity: 12e7, statMultiplier: 2, hpMultiplier: 1, ability: "Creation and Restoration", weather: "Aurora", pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Odin", imageAssetId: 124511006426185, rarity: 7777777, statMultiplier: 9, hpMultiplier: 1, ability: "All Father", weather: "Armageddon", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Old Man Winter", imageAssetId: 70980914904448, rarity: 1e4, statMultiplier: 1, hpMultiplier: 1, ability: "Snowscape", weather: "Snow", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Onmyoji", imageAssetId: 86117579169753, rarity: 4500, statMultiplier: 1, hpMultiplier: 1, ability: "Divination", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Ouroboros", imageAssetId: 84157192417468, rarity: 0, statMultiplier: 1, hpMultiplier: 1, ability: "Nothing", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Pandora", imageAssetId: 128620566943297, rarity: 1e6, statMultiplier: 8, hpMultiplier: 1, ability: "Pandora's Box", weather: "Eclipse", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Pangu", imageAssetId: 118381629175434, rarity: 11e9, statMultiplier: 1, hpMultiplier: 2, ability: "World Creation", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Parallax", imageAssetId: 130307664489698, rarity: 1e9, statMultiplier: 4, hpMultiplier: 1, ability: "Paradox", weather: "Time Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Pegasus", imageAssetId: 82529782314657, rarity: 1e6, statMultiplier: 3.24669, hpMultiplier: 1, ability: "Stardust Driver", weather: "Meteor Shower", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Pestilence", imageAssetId: 138382846157867, rarity: 1e9, statMultiplier: 1, hpMultiplier: 1, ability: "Plague", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Phoenix", imageAssetId: 17860481676, rarity: 555555, statMultiplier: 1, hpMultiplier: 1, ability: "Eternity", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Piccolo", imageAssetId: 90211549517672, rarity: 1e9, statMultiplier: 1.2, hpMultiplier: 1, ability: "Aura Farm", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Poison Witch", imageAssetId: 119912623912285, rarity: 25e5, statMultiplier: 1.3, hpMultiplier: 1, ability: "Dispel", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Poseidon", imageAssetId: 17185331652, rarity: 3e6, statMultiplier: 1, hpMultiplier: 1, ability: "Greater Might", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Priest", imageAssetId: 18866197503, rarity: 5e5, statMultiplier: 4, hpMultiplier: 1.3, ability: "Accelerate", weather: "Time Storm", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Pterodactylus", imageAssetId: 119894247012469, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Sky Drop", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Qilin", imageAssetId: 79573265591210, rarity: 75e5, statMultiplier: 1, hpMultiplier: 1, ability: "Purifying Fire", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Ra", imageAssetId: 17860480597, rarity: 42e6, statMultiplier: 1, hpMultiplier: 1, ability: "Outshine", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Ragon", imageAssetId: 17365334584, rarity: 1e8, statMultiplier: 1, hpMultiplier: 1, ability: "Scale Armor", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Ragon & Fafnir", imageAssetId: 103088333535202, rarity: 1e9, statMultiplier: 1, hpMultiplier: 1, ability: "Draconic Heart", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Raze The Destroyer", imageAssetId: 17855456960, rarity: 5e7, statMultiplier: 2, hpMultiplier: 1, ability: "Hatred", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Resolute Blade", imageAssetId: 101682029596112, rarity: 4e3, statMultiplier: 1, hpMultiplier: 1, ability: "Blade", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Revenant", imageAssetId: 74840833306973, rarity: 5e5, statMultiplier: 1, hpMultiplier: 1, ability: "Unforgiving", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "River Dragon", imageAssetId: 18609842068, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Sacrificial Tides", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Robin Hood", imageAssetId: 93613036828800, rarity: 5e5, statMultiplier: 1, hpMultiplier: 1, ability: "Defraud", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Rudolph", imageAssetId: 123424993619672, rarity: 35e3, statMultiplier: 1, hpMultiplier: 1, ability: "Red-Nosed Reindeer", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }];

  // src/data/cards-5.json
  var cards_5_default = [{ name: "Sabertooth Tiger", imageAssetId: 128306633059776, rarity: 5e6, statMultiplier: 1, hpMultiplier: 1, ability: "True Fang", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Sable The Envious", imageAssetId: 17271118840, rarity: 1e8, statMultiplier: 2, hpMultiplier: 1, ability: "Jealousy", weather: null, pack: null, boss: true, unobtainable: false, expires: false }, { name: "Samurai", imageAssetId: 95145698075616, rarity: 250, statMultiplier: 1, hpMultiplier: 1, ability: "Honor", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Santa Claus", imageAssetId: 108599710522941, rarity: 4e8, statMultiplier: 2, hpMultiplier: 1, ability: "Naughty or Nice?", weather: "Aurora", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Santa Claws", imageAssetId: 112948312413908, rarity: 5e8, statMultiplier: 1, hpMultiplier: 1, ability: "Naughty List", weather: "Snow", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Sarimanok", imageAssetId: 94090890779881, rarity: 2e10, statMultiplier: 1.5, hpMultiplier: 1, ability: "Into The Sun", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Sasaki Kojiro", imageAssetId: 18598306299, rarity: 25e4, statMultiplier: 1, hpMultiplier: 1, ability: "The Loser", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Savior", imageAssetId: 17261315651, rarity: 3e5, statMultiplier: 8, hpMultiplier: 1, ability: "Perfect Sacrifice", weather: "Blood Rain", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Scarecrow", imageAssetId: 128150318677145, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Spook", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Sciron", imageAssetId: 17583352267, rarity: 5e5, statMultiplier: 3.6, hpMultiplier: 1.1, ability: "Untouchable", weather: "Time Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Sea Turtle", imageAssetId: 139434979659862, rarity: 1, statMultiplier: 1, hpMultiplier: 1, ability: "Turtle Shell", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Sekhmet", imageAssetId: 133793872028638, rarity: 78e3, statMultiplier: 8, hpMultiplier: 1.7, ability: "Blood Drinker", weather: "Blood Rain", pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Seraphim", imageAssetId: 114840536278925, rarity: 1e6, statMultiplier: 1, hpMultiplier: 1, ability: "Sacred Judgment", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Serket", imageAssetId: 111506694558527, rarity: 15e6, statMultiplier: 6, hpMultiplier: 1, ability: "Protection of Gods", weather: "Virus", pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Serpent Mist", imageAssetId: 121982739730206, rarity: 3e8, statMultiplier: 2, hpMultiplier: 1, ability: "Perforating Mist", weather: "Shroud", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Set", imageAssetId: 17860481011, rarity: 17e5, statMultiplier: 8, hpMultiplier: 1, ability: "Eclipse", weather: "Eclipse", pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Shay, Heart of the Cards", imageAssetId: 128240532197474, rarity: 7777777, statMultiplier: 1, hpMultiplier: 1, ability: "Favorable Odds", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Shennong", imageAssetId: 90647320098417, rarity: 95e7, statMultiplier: 1, hpMultiplier: 1, ability: "Herbal Alchemy", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Shining Armor", imageAssetId: 17783791524, rarity: 4, statMultiplier: 1, hpMultiplier: 1, ability: "Armor", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Shu", imageAssetId: 17491274204, rarity: 15e5, statMultiplier: 1, hpMultiplier: 1.7, ability: "Restoration", weather: "Aurora", pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Shuten-d\u014Dji", imageAssetId: 105792623041871, rarity: 96139, statMultiplier: 8, hpMultiplier: 1, ability: "Decapitate", weather: "Blood Rain", pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Sh\xE9n L\xF3ng", imageAssetId: 82160568788475, rarity: 2e8, statMultiplier: 1, hpMultiplier: 1, ability: "Heavenly Might", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Siegfried", imageAssetId: 91785727905349, rarity: 2e7, statMultiplier: 1.5, hpMultiplier: 1, ability: "Dragon Slayer", weather: "Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Sisyphus", imageAssetId: 17844180729, rarity: 15e6, statMultiplier: 1, hpMultiplier: 1, ability: "Toil", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Skeleton King", imageAssetId: 17462683294, rarity: 3333e3, statMultiplier: 1, hpMultiplier: 1, ability: "Undead", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Sleep Paralysis", imageAssetId: 78250501134513, rarity: 5e8, statMultiplier: 2, hpMultiplier: 1, ability: "Perish", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Slum Dweller", imageAssetId: 104715797959661, rarity: 5e8, statMultiplier: 1, hpMultiplier: 1, ability: "Fight Dirty", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Soft Paw", imageAssetId: 96277479996521, rarity: 8e3, statMultiplier: 1, hpMultiplier: 1, ability: "Clawless", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Something Funny", imageAssetId: 17847425257, rarity: 0, statMultiplier: 1, hpMultiplier: 1, ability: "Nil", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "Sorcerer", imageAssetId: 18864793286, rarity: 100, statMultiplier: 1, hpMultiplier: 1, ability: "Black Flash", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Sphinx", imageAssetId: 17504098529, rarity: 222e3, statMultiplier: 1, hpMultiplier: 1, ability: "Quick Strike", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Star Eater", imageAssetId: 132464483744752, rarity: 8e8, statMultiplier: 1.2, hpMultiplier: 1, ability: "Cosmic Maw", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Stegosaurus", imageAssetId: 127742912458329, rarity: 35500, statMultiplier: 1, hpMultiplier: 1, ability: "Defensive Maneuver", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Stone Scientist", imageAssetId: 18864763554, rarity: 1e4, statMultiplier: 1, hpMultiplier: 1, ability: "Tonic", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Sun Wukong", imageAssetId: 17486730775, rarity: 2e9, statMultiplier: 1, hpMultiplier: 1, ability: "Monkey King's Rage", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Supreme Frank", imageAssetId: 131200769399825, rarity: 411e6, statMultiplier: 2, hpMultiplier: 1, ability: "Never Forgotten", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Surtr", imageAssetId: 72813602219713, rarity: 22222222, statMultiplier: 9, hpMultiplier: 1, ability: "Fire World", weather: "Armageddon", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Susanoo", imageAssetId: 18585135102, rarity: 34e6, statMultiplier: 0.9, hpMultiplier: 2, ability: "Upheaval", weather: "Storm", pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Tartarus", imageAssetId: 17185328311, rarity: 6666, statMultiplier: 1, hpMultiplier: 1, ability: "Berserk", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Terra's Aria", imageAssetId: 71068230544564, rarity: 1e6, statMultiplier: 3, hpMultiplier: 1, ability: "Humanity's Spirit", weather: "Rapture", pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "The Blood Countess", imageAssetId: 125536732859364, rarity: 33e5, statMultiplier: 8, hpMultiplier: 1, ability: "Blood Bath", weather: "Blood Rain", pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "The Circus", imageAssetId: 108154814645477, rarity: 1, statMultiplier: 1, hpMultiplier: 1, ability: "Cooked \u{1F3AA}", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "The Composer", imageAssetId: 134946719604820, rarity: 75e5, statMultiplier: 2, hpMultiplier: 1, ability: "Nightmare Melody", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "The Grinch", imageAssetId: 108348000800927, rarity: 1e6, statMultiplier: 8, hpMultiplier: 1, ability: "Steal Christmas", weather: "Eclipse", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "The Hanged Man", imageAssetId: 92612813240184, rarity: 1e5, statMultiplier: 2, hpMultiplier: 1, ability: "Guilt", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "The Huntsman", imageAssetId: 90718981599442, rarity: 1e5, statMultiplier: 8, hpMultiplier: 1, ability: "Heart Hunter", weather: "Blood Rain", pack: null, boss: false, unobtainable: true, expires: false }, { name: "The Jade Emperor", imageAssetId: 103020218292780, rarity: 1e7, statMultiplier: 3, hpMultiplier: 1, ability: "Absolute Sovereignty", weather: "Rapture", pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "The Rake", imageAssetId: 102301945896295, rarity: 25e8, statMultiplier: 1.3, hpMultiplier: 1, ability: "Creep", weather: null, pack: "Cryptid", boss: false, unobtainable: false, expires: false }];

  // src/data/cards-6.json
  var cards_6_default = [{ name: "Thor", imageAssetId: 81213275337823, rarity: 2e6, statMultiplier: 9, hpMultiplier: 1, ability: "God of Thunder", weather: "Armageddon", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Three Wise Men", imageAssetId: 73019594340715, rarity: 3e5, statMultiplier: 1, hpMultiplier: 1, ability: "Three Gifts", weather: null, pack: "Christmas", boss: false, unobtainable: true, expires: false }, { name: "Three-Legged Golden Crow", imageAssetId: 17261318147, rarity: 55555, statMultiplier: 1, hpMultiplier: 1, ability: "Revive", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Time Lord Stryx", imageAssetId: 101205888622080, rarity: 1e11, statMultiplier: 1.5, hpMultiplier: 1, ability: "Better Days", weather: null, pack: null, boss: true, unobtainable: false, expires: true }, { name: "Titan", imageAssetId: 17185331916, rarity: 5e5, statMultiplier: 1, hpMultiplier: 1, ability: "Super Strength", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "ToadBoiGaming", imageAssetId: 18603416384, rarity: 12e5, statMultiplier: 1, hpMultiplier: 1, ability: "Fusion... HA!", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Tornado", imageAssetId: 18864797923, rarity: 25e5, statMultiplier: 2, hpMultiplier: 1, ability: "Telekinesis", weather: "Aurora", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Toy Bear", imageAssetId: 81763197016607, rarity: 4e8, statMultiplier: 1, hpMultiplier: 1, ability: "Fluffy Aggression", weather: "Snow", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Toy Car", imageAssetId: 111365419706965, rarity: 4e8, statMultiplier: 1, hpMultiplier: 1, ability: "Speedy Progression", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Toy Jack-in-the-Box", imageAssetId: 99178653583253, rarity: 4e8, statMultiplier: 1, hpMultiplier: 1, ability: "Pop-Up Impression", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Toy Nutcracker", imageAssetId: 91702315463516, rarity: 4e8, statMultiplier: 1, hpMultiplier: 1, ability: "Shelter Obsession", weather: null, pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "Trainee", imageAssetId: 18864767825, rarity: 1e3, statMultiplier: 1, hpMultiplier: 1, ability: "Grind", weather: null, pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Triceratops", imageAssetId: 72060881406107, rarity: 1e5, statMultiplier: 1, hpMultiplier: 1, ability: "Horned Attack", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "True Incarnation", imageAssetId: 125082554436342, rarity: 1e9, statMultiplier: 1, hpMultiplier: 4, ability: "Shared Power", weather: null, pack: null, boss: false, unobtainable: true, expires: false }, { name: "True Prophet", imageAssetId: 80226125940307, rarity: 12e3, statMultiplier: 1, hpMultiplier: 1, ability: "Destiny Sight", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Tsukuyomi", imageAssetId: 18585070172, rarity: 42e6, statMultiplier: 1, hpMultiplier: 1, ability: "Full Moon", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Turkey", imageAssetId: 113698872878590, rarity: 333e6, statMultiplier: 1, hpMultiplier: 1, ability: "Gobble", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Typhon", imageAssetId: 17583142666, rarity: 5e6, statMultiplier: 4, hpMultiplier: 1, ability: "Immortal", weather: "Time Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Tyrannodon", imageAssetId: 96973848265065, rarity: 15e9, statMultiplier: 1.5, hpMultiplier: 1, ability: "Tyrannospirit", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Tyrannosaurus rex", imageAssetId: 108600242890114, rarity: 8e8, statMultiplier: 1.2, hpMultiplier: 1, ability: "Absolute Apex", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Tyranodon", imageAssetId: 96973848265065, rarity: 15e9, statMultiplier: 1.5, hpMultiplier: 1, ability: "Tyrannospirit", weather: null, pack: "Prehistoric", boss: false, unobtainable: true, expires: false }, { name: "Umbrasaur", imageAssetId: 136092241661234, rarity: 5e6, statMultiplier: 8, hpMultiplier: 1, ability: "Shadow Predator", weather: "Eclipse", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Uncle Sam", imageAssetId: 71366839132407, rarity: 3e6, statMultiplier: 1, hpMultiplier: 1, ability: "We Want YOU", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Unicorn", imageAssetId: 96157143671828, rarity: 5e6, statMultiplier: 3.24669, hpMultiplier: 1, ability: "Twilight Sparkle", weather: "Meteor Shower", pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Useless Seer", imageAssetId: 17783446335, rarity: 12, statMultiplier: 1, hpMultiplier: 1, ability: "Third Eye", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "Valentine's Specter", imageAssetId: 88255969312228, rarity: 14141414, statMultiplier: 1, hpMultiplier: 1, ability: "Death Embrace", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Vampire Lord", imageAssetId: 137762043589160, rarity: 5e5, statMultiplier: 8, hpMultiplier: 1.5, ability: "Drain Vitality", weather: "Blood Rain", pack: "Anime", boss: false, unobtainable: false, expires: false }, { name: "Velociraptor", imageAssetId: 132518665127423, rarity: 8e7, statMultiplier: 1, hpMultiplier: 1, ability: "Last Meal", weather: null, pack: "Prehistoric", boss: false, unobtainable: false, expires: false }, { name: "Vicious", imageAssetId: 108263216864525, rarity: 5e6, statMultiplier: 6, hpMultiplier: 1, ability: "Infectious", weather: "Virus", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Vizier", imageAssetId: 84135429175921, rarity: 3e4, statMultiplier: 1, hpMultiplier: 1, ability: "Outrank", weather: null, pack: "Egypt", boss: false, unobtainable: false, expires: false }, { name: "Volcano Spirit", imageAssetId: 107550627615592, rarity: 75e3, statMultiplier: 1, hpMultiplier: 1, ability: "Melt", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Walking Dead", imageAssetId: 129496985923275, rarity: 5e5, statMultiplier: 2, hpMultiplier: 1, ability: "Undying", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }, { name: "Wandering Snowman", imageAssetId: 78499497911282, rarity: 5e6, statMultiplier: 1, hpMultiplier: 1, ability: "Snowbound", weather: "Snow", pack: "Christmas", boss: false, unobtainable: false, expires: false }, { name: "War", imageAssetId: 113728448121086, rarity: 3e9, statMultiplier: 1, hpMultiplier: 1, ability: "Bloodlust", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Wendigo", imageAssetId: 110322958485576, rarity: 25e6, statMultiplier: 2, hpMultiplier: 1, ability: "Insatiable", weather: "Snow", pack: "Cryptid", boss: false, unobtainable: false, expires: false }, { name: "Wind Spirit", imageAssetId: 17271225972, rarity: 2e4, statMultiplier: 1.75, hpMultiplier: 1, ability: "Haste", weather: "Aurora", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Witch", imageAssetId: 116167581881287, rarity: 35e3, statMultiplier: 1, hpMultiplier: 1, ability: "Sap", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Wizard", imageAssetId: 17261317855, rarity: 35, statMultiplier: 1, hpMultiplier: 1, ability: "Mana Shield", weather: null, pack: null, boss: false, unobtainable: false, expires: false }, { name: "X\u012Bf\u0101ng B\xE1ih\u01D4", imageAssetId: 112187990494355, rarity: 45e7, statMultiplier: 1, hpMultiplier: 1, ability: "Fury of the White Tiger", weather: null, pack: "Immortal", boss: false, unobtainable: false, expires: false }, { name: "Yamato no Orochi", imageAssetId: 18585101129, rarity: 3e6, statMultiplier: 1, hpMultiplier: 5, ability: "Eight Heads", weather: null, pack: "Rising Sun", boss: false, unobtainable: false, expires: false }, { name: "Yeti", imageAssetId: 88774235813460, rarity: 5e8, statMultiplier: 1.5, hpMultiplier: 1.5, ability: "Frozen Wrath", weather: "Snow", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Zeus", imageAssetId: 17269040282, rarity: 1e6, statMultiplier: 1.5, hpMultiplier: 1, ability: "Lightning Strike", weather: "Storm", pack: null, boss: false, unobtainable: false, expires: false }, { name: "Zombie", imageAssetId: 76163870968867, rarity: 500, statMultiplier: 1, hpMultiplier: 1, ability: "Flesh Eater", weather: null, pack: "Halloween", boss: false, unobtainable: false, expires: false }, { name: "Zombie Dragon", imageAssetId: 73017349775622, rarity: 11e6, statMultiplier: 1.3, hpMultiplier: 1, ability: "Unholy Creature", weather: null, pack: "Era2", boss: false, unobtainable: false, expires: false }, { name: "Zombie Nurse", imageAssetId: 111221286164752, rarity: 1e4, statMultiplier: 2, hpMultiplier: 1, ability: "Undead Practitioner", weather: null, pack: "Halloween2", boss: false, unobtainable: false, expires: false }];

  // src/data/cards-7.json
  var cards_7_default = [{ name: "Fate Seamstress", imageAssetId: 81556098422773, rarity: 2e9, statMultiplier: 1.2, hpMultiplier: 1, ability: "Bind Fate", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Eclipseborn Luminant", imageAssetId: 91389584710674, rarity: 299792458, statMultiplier: 1.2, hpMultiplier: 1, ability: "Luminescent Veil", weather: null, pack: null, boss: false, unobtainable: false, expires: true }, { name: "Eonus", imageAssetId: 139426020484277, rarity: 888888888, statMultiplier: 1.2, hpMultiplier: 1, ability: "Ouroboros", weather: null, pack: null, boss: false, unobtainable: false, expires: true }];

  // src/data/cards.ts
  var cards = [
    ...cards_1_default,
    ...cards_2_default,
    ...cards_3_default,
    ...cards_4_default,
    ...cards_5_default,
    ...cards_6_default,
    ...cards_7_default
  ];
  var cards_default = cards;

  // src/data/ages.ts
  var CARD_AGES = {
    Archer: 16,
    "Shining Armor": 34,
    "Cave Goblin": 7,
    "Good Boy": 3,
    "Bad Boys": 3e3,
    "Useless Seer": 1e4,
    "Baby Skeleton": 5e4,
    Wizard: 16,
    "Forest Spirit": 300,
    "General Moon Zoo": 44,
    "Crown Prince": 20,
    Arthur: 17,
    Beelzebub: 2024,
    "Arcane Avian": 11,
    Michael: 2024,
    "Count Muscula": 702,
    "Skeleton King": 1e5,
    Knightmare: 40,
    Tartarus: 5e3,
    "Greedy Belly": 3,
    "Arthur of Excalibur": 60,
    "Ice Queen": 28,
    "Three-Legged Golden Crow": 30,
    Leviathan: 105,
    Brunhilde: 28,
    Frankenstein: 1,
    Titan: 5005,
    Phoenix: 108,
    "Hoarfrost Phoenix": 108,
    Zeus: 1e3,
    Siegfried: 25,
    Poseidon: 999,
    Hades: 999,
    "Deus Ex": 0,
    Gilgamesh: 40,
    Cronus: 2e3,
    Typhon: 500,
    Sciron: 500,
    Ixion: 21,
    "Sun Wukong": 7e3,
    Mummy: 1e3,
    Dancer: 18,
    Vizier: 26,
    "Black Cat": 4,
    Amenhotep: 30,
    Sphinx: 500,
    Horus: 700,
    Anubis: 1e4,
    Set: 46e8,
    Ra: 46e8,
    Shu: 1e4,
    Sekhmet: 5e3,
    Hera: 900,
    Dad: 46,
    Milk: 0.7,
    "Wind Spirit": 18,
    Boreas: 750,
    Lucifer: 2024,
    Savior: 2024,
    Parallax: 16,
    "Hell's Army": -5e3,
    "Heaven's Armor": -5e3,
    "Judgment Day": -5e3,
    "Chronus The Hoarder": 28,
    "Malik The Sovereign": 20,
    "Gideon The Insatiable": 11,
    "Lilith The Enchantress": 23,
    "Morpheus The Slumberer": 14,
    "Raze The Destroyer": 500,
    "Sable The Envious": 27,
    "Armin The Humble": 20,
    Epitome: -1e15,
    Fafnir: 5e3,
    Ragon: 5e3
  };
  function cardAge(name) {
    return CARD_AGES[name] ?? 1;
  }

  // src/data/auras-1.json
  var auras_1_default = [{ name: "Adventurer", imageAssetId: 18139077181, rarity: 1, type: "Stat", skillName: "Adventurer's Guild", description: "+STAT% Stats.", base: 10, perLevel: 10, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Armin Of Humility", imageAssetId: 17344859764, rarity: 2, type: "Skill", skillName: "Modesty", description: "Malik The Sovereign's ability remains until STAT% HP.", base: 30, perLevel: -10, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Army's Reinforcements", imageAssetId: 122535618133863, rarity: 75e3, type: "Stat", skillName: "Warrior's Might", description: "+STAT% Stats. +2STAT% for Swordsmen.", base: 15, perLevel: 15, boostMult: 2, boostedCards: ["Arthur", "Arthur of Excalibur", "Artoria of Excalibur", "Conqueror", "Hell's Army", "Ixion", "Knightmare", "Samurai", "Sasaki Kojiro", "Sciron", "Shining Armor", "Siegfried", "Susanoo"], unobtainable: false }, { name: "Astrologist", imageAssetId: 81372965777789, rarity: 4e4, type: "Stat", skillName: "Horoscope", description: "+STAT% Stats. +2STAT% for Meteor Shower cards.", base: 10, perLevel: 10, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Avian King", imageAssetId: 107539454366410, rarity: 75e3, type: "Stat", skillName: "Avian's Freedom", description: "+STAT% Stats. +2STAT% for birds.", base: 15, perLevel: 15, boostMult: 2, boostedCards: ["Arcane Avian", "Hoarfrost Phoenix", "N\xE1n F\u0101ng Zh\u016B Qu\xE8", "Phoenix", "Three-Legged Golden Crow", "Turkey"], unobtainable: false }, { name: "Berserker", imageAssetId: 92085999316587, rarity: 1e3, type: "Skill", skillName: "Vengeful", description: "Cards have a STAT% chance to counterattack.", base: 0, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Bruno Of Diligence", imageAssetId: 17728375276, rarity: 5, type: "Skill", skillName: "Industry", description: "Morpheus The Slumberer loses STAT% less ATK.", base: 25, perLevel: 25, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Cedric Of Charity", imageAssetId: 17728373419, rarity: 1, type: "Skill", skillName: "Benevolence", description: "Chronus The Hoarder steals STAT% instead.", base: 15, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Celeste Of Kindness", imageAssetId: 17728374046, rarity: 7, type: "Skill", skillName: "Compassion", description: "Sable The Envious gains the first STAT abilities of the sins.", base: 1, perLevel: 1, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Conundrum", imageAssetId: 17752112203, rarity: 1e7, type: "Skill", skillName: "Again", description: "Epitome's skill has a STAT% chance to repeat.", base: 25, perLevel: 25, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Cupid", imageAssetId: 108348147344446, rarity: 1e5, type: "Stat", skillName: "Harrowing Arrowing", description: "+STAT% Stats. +2STAT% for Valentines cards.", base: 20, perLevel: 15, boostMult: 2, boostedCards: ["Aphrodite", "Valentine's Specter"], unobtainable: true }, { name: "Desmond Of Despair", imageAssetId: 133126655883361, rarity: 1e6, type: "Stat", skillName: "Fatalism", description: "+STAT% Stats. +2STAT% for Seven Sins cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: ["Chronus The Hoarder", "Gideon The Insatiable", "Lilith The Enchantress", "Malik The Sovereign", "Morpheus The Slumberer", "Raze The Destroyer", "Sable The Envious"], unobtainable: false }, { name: "Dinosaur King", imageAssetId: 92579897851192, rarity: 1e6, type: "Stat", skillName: "Stamping Destruction", description: "+STAT% Stats. +2STAT% for Prehistoric Pack cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Disease", imageAssetId: 79813547274288, rarity: 555555, type: "Stat", skillName: "Sickness", description: "+STAT% Stats. +2STAT% for Virus cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Dragon King", imageAssetId: 17710819971, rarity: 75e3, type: "Stat", skillName: "Dragon's Might", description: "+STAT% Stats. +2STAT% for Dragons.", base: 15, perLevel: 15, boostMult: 2, boostedCards: ["D\u014Dng F\u0101ng Q\u012Bng L\xF3ng", "Fafnir", "Greedy Belly", "Juggernoid", "Longmu", "Parallax", "Ragon", "Ragon & Fafnir", "Raze The Destroyer", "River Dragon"], unobtainable: false }, { name: "Eclipse Chaser", imageAssetId: 92107518441457, rarity: 15e4, type: "Stat", skillName: "Photography", description: "+STAT% Stats. +2STAT% for Eclipse cards.", base: 30, perLevel: 30, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Elohim", imageAssetId: 92348160660166, rarity: 5e5, type: "Stat", skillName: "Heavenly", description: "+STAT% Stats. +2STAT% for Rapture cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "End Times", imageAssetId: 127066510514512, rarity: 12e6, type: "Skill", skillName: "Prophecy", description: "STAT% chance for an opponent's ability to fail.", base: 10, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Fate", imageAssetId: 17710826993, rarity: 5e4, type: "Skill", skillName: "Destiny", description: "STAT% chance to retry a failed ability.", base: 25, perLevel: 25, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Flame Wizard", imageAssetId: 76397266889770, rarity: 500, type: "Skill", skillName: "Fire Magic", description: "STAT% chance to inflict burn for 2 turns after attacking.", base: 0, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: false }, { name: "General Sun Tzu", imageAssetId: 17728671004, rarity: 1e3, type: "Stat", skillName: "Dynasty", description: "+STAT% HP.", base: 4, perLevel: 4, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Imp", imageAssetId: 102875885491136, rarity: 17500, type: "Stat", skillName: "Demonic Mischief", description: "+STAT% Stats. +1.8STAT% for demons.", base: 15, perLevel: 15, boostMult: 1.8, boostedCards: ["A0-ON1", "AK4-ON1", "Beelzebub", "Demonic Cultivator", "Fafnir", "Heavenly Demon", "Hell's Army", "Sable The Envious", "Shuten-d\u014Dji", "Tartarus", "Vicious"], unobtainable: false }, { name: "Iris", imageAssetId: 100852033204978, rarity: 25e3, type: "Stat", skillName: "Northern Lights", description: "+STAT% Stats. +2STAT% for Aurora cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: ["Cave Goblin & Wind Spirit"], unobtainable: false }, { name: "Jack-o'-Lantern", imageAssetId: 91156948435924, rarity: 1e5, type: "Skill", skillName: "Spooky Scary", description: "Halloween cards gain 10% stats for every halloween or undead card in your deck.", base: 10, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Jurassic World", imageAssetId: 79081324637915, rarity: 1e7, type: "Skill", skillName: "Eras Behind", description: "Prehistoric cards gain STAT% stats for every prehistoric card in your deck.", base: 10, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: false }];

  // src/data/auras-2.json
  var auras_2_default = [{ name: "Kala", imageAssetId: 18940733007, rarity: 5e4, type: "Stat", skillName: "Timeless", description: "+STAT% Stats. +2STAT% for Time Storm cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Khione", imageAssetId: 91921088295838, rarity: 1e4, type: "Stat", skillName: "Blizzard", description: "+STAT% Stats. +2STAT% for Snow cards.", base: 10, perLevel: 10, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Krug Of Temperance", imageAssetId: 17727568259, rarity: 3, type: "Skill", skillName: "Balance", description: "Gideon The Insatiable recovers by STAT% of the damage dealt.", base: 15, perLevel: 15, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Lena Of Purity", imageAssetId: 17728373678, rarity: 4, type: "Skill", skillName: "Innocence", description: "Lilith The Enchantress recovers STAT% HP after being attacked.", base: 5, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Magical Elf", imageAssetId: 89573540029017, rarity: 1e6, type: "Skill", skillName: "Christmas Magic", description: "If you have STAT or more unique 'Toys' in your deck, awaken them.", base: 4, perLevel: -1, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Metaphor", imageAssetId: 17752087690, rarity: 1e8, type: "Stat", skillName: "Parallels", description: "+STAT% Stats. +10STAT% for Epitome.", base: 0, perLevel: 0, boostMult: 10, boostedCards: ["Epitome"], unobtainable: true }, { name: "Myhts", imageAssetId: 99114440442391, rarity: 4e5, type: "Stat", skillName: "Ancient Fear", description: "+STAT% Stats. +2STAT% for Cryptid Pack cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: ["Mother of Beasts"], unobtainable: false }, { name: "Neko", imageAssetId: 101639271550852, rarity: 5e3, type: "Stat", skillName: "UwU", description: "+STAT% Stats. +2STAT% for Anime Pack cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Niflheim", imageAssetId: 116290588641328, rarity: 1e5, type: "Stat", skillName: "World of Fog", description: "+STAT% Stats. +2STAT% for Shroud cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Phantom", imageAssetId: 114316177759485, rarity: 2500, type: "Skill", skillName: "Terror", description: "Cards have a STAT% chance to stun the target.", base: 5, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Santa's Workshop", imageAssetId: 88533292609446, rarity: 1e5, type: "Skill", skillName: "Holly Jolly", description: "Christmas cards gain 10% stats for every christmas or snow card in your deck.", base: 10, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Satan", imageAssetId: 17718937225, rarity: 66666, type: "Stat", skillName: "Original Sin", description: "+STAT% Stats. +2STAT% for Blood Rain cards.", base: 50, perLevel: 50, boostMult: 2.5, boostedCards: [], unobtainable: false }, { name: "Shatbi", imageAssetId: 110536187098654, rarity: 31e3, type: "Stat", skillName: "Recordkeep", description: "+STAT% Stats. +2STAT% for Egypt cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: ["Anubis & Hades"], unobtainable: false }, { name: "Shielder", imageAssetId: 98308081367833, rarity: 50, type: "Skill", skillName: "Fortitude", description: "Reduce damage taken by STAT%.", base: 0, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Shrinemaiden", imageAssetId: 116302075502867, rarity: 12500, type: "Stat", skillName: "Reverence", description: "+STAT% Stats. +2STAT% for Rising Sun cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Skye Of Patience", imageAssetId: 17728374423, rarity: 6, type: "Skill", skillName: "Endurance", description: "Damage dealt to Raze The Destroyer is reduced by STAT% of its Max HP.", base: 5, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Something Stupid", imageAssetId: 18807634955, rarity: 1, type: "Skill", skillName: "Skill Problem", description: "Inverts the natural hierarchy.", base: 1, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Soul Guide", imageAssetId: 117211137455863, rarity: 0, type: "Skill", skillName: "Resting Place", description: "Prevent opponent's aura cards from activating.", base: 0, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: true }, { name: "Stormcaller", imageAssetId: 132832117613003, rarity: 1e4, type: "Stat", skillName: "Downpour", description: "+STAT% Stats. +2STAT% for Storm cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "Synth Human", imageAssetId: 17718937563, rarity: 1e4, type: "Skill", skillName: "Foresight", description: "Avoid damage below than STAT% of your HP. The threshold is 1.5STAT% for Time Storm cards.", base: 0, perLevel: 0, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Taoist", imageAssetId: 91112946299632, rarity: 88e3, type: "Stat", skillName: "Balance", description: "+STAT% Stats. +2STAT% for Immortal Pack cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }, { name: "The Sequel", imageAssetId: 89344353100993, rarity: 3e5, type: "Stat", skillName: "Distant Future", description: "+STAT% Stats. +2STAT% for Era 2 cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: ["Assassin King", "Cherub", "Count Muscula", "Engineer", "Hard Claws", "Hunter", "Infected Maw", "Juggernoid", "Julius Leader", "Malakim", "Noveau Riche", "Poison Witch", "Resolute Blade", "Robin Hood", "Seraphim", "Skeleton King", "Slum Dweller", "Soft Paw", "Terra's Aria", "True Prophet", "Volcano Spirit", "Zombie Dragon"], unobtainable: false }, { name: "Vampire Matron", imageAssetId: 133735679572590, rarity: 5e3, type: "Skill", skillName: "Lifeleech", description: "Enhance existing life drain abilities by 5STAT% and grant STAT% life drain to other allies.", base: 5, perLevel: 5, boostMult: null, boostedCards: [], unobtainable: false }, { name: "Yggdrasil", imageAssetId: 122089596410033, rarity: 7e5, type: "Stat", skillName: "World Tree", description: "+STAT% Stats. +2STAT% for Armageddon cards.", base: 0, perLevel: 0, boostMult: 2, boostedCards: [], unobtainable: false }];

  // src/data/auras.ts
  var auras = [...auras_1_default, ...auras_2_default];
  var auras_default = auras;

  // src/engine/auras.ts
  var AURA_RARITY_MULTIPLIERS = {
    Platinum: 10,
    Crystal: 100,
    Galaxy: 1e3
  };
  var AURA_TIERS = {
    Platinum: 1,
    Crystal: 2,
    Galaxy: 3
  };
  var CUSTOM_SKILL_VALUES = {
    Berserker: [5, 10, 15, 20],
    "Flame Wizard": [15, 25, 35, 50],
    Shielder: [2, 5, 7, 10],
    "Synth Human": [8, 10, 12, 15]
  };
  var BOOSTED_PACKS = {
    Neko: "Anime",
    Shrinemaiden: "Rising Sun",
    Shatbi: "Egypt",
    Taoist: "Immortal",
    Myhts: "Cryptid",
    "Dinosaur King": "Prehistoric"
  };
  var BOOSTED_WEATHERS = {
    Elohim: "Rapture",
    Yggdrasil: "Armageddon",
    Satan: "Blood Rain",
    "Eclipse Chaser": "Eclipse",
    Kala: "Time Storm",
    Stormcaller: "Storm",
    Iris: "Aurora",
    Niflheim: "Shroud",
    Khione: "Snow",
    Astrologist: "Meteor Shower",
    Disease: "Virus"
  };
  var TOY_CARD_NAMES = /* @__PURE__ */ new Set([
    "Toy Bear",
    "Toy Car",
    "Toy Jack-in-the-Box",
    "Toy Nutcracker"
  ]);
  function getAura(name) {
    return name ? auras_default.find((aura) => aura.name === name) : void 0;
  }
  function getAuraTier(border) {
    return border ? AURA_TIERS[border] : 0;
  }
  function getAuraRarity(aura, border) {
    return aura.rarity * (border ? AURA_RARITY_MULTIPLIERS[border] : 1);
  }
  function getStatAuraValue(aura, border) {
    const rarity = getAuraRarity(aura, border);
    return rarity > 0 ? Math.floor(Math.pow(2, Math.log10(rarity)) / 2) : 0;
  }
  function getSkillAuraValue(aura, border) {
    const tier = getAuraTier(border);
    const custom = CUSTOM_SKILL_VALUES[aura.name];
    if (custom) return custom[tier];
    return Number(aura.base || 0) + Number(aura.perLevel || 0) * tier;
  }
  function isStatAuraBoosted(aura, card) {
    if (aura.boostedCards?.includes(card.definition.name)) return true;
    const pack = BOOSTED_PACKS[aura.name];
    if (pack && card.definition.pack === pack) return true;
    const weather = BOOSTED_WEATHERS[aura.name];
    if (weather && card.definition.weather === weather) return true;
    return false;
  }
  function statAuraPercentForCard(aura, card, border) {
    const base = getStatAuraValue(aura, border);
    if (aura.name === "General Sun Tzu") return base;
    return isStatAuraBoosted(aura, card) ? base * Number(aura.boostMult || 1) : base;
  }
  function applyStatAura(team, selection) {
    const aura = getAura(selection?.auraName);
    if (!aura || aura.type !== "Stat") return {};
    const baseValue = getStatAuraValue(aura, selection?.border);
    for (const card of team) {
      const value = statAuraPercentForCard(aura, card, selection?.border);
      const multiplier = 1 + value / 100;
      card.hp *= multiplier;
      card.maxHp *= multiplier;
      if (aura.name !== "General Sun Tzu") card.damage *= multiplier;
    }
    return { aura, value: baseValue };
  }
  function applySkillAuraTeamEffects(team, selection) {
    const aura = getAura(selection?.auraName);
    if (!aura || aura.type !== "Skill") return { implemented: true };
    const value = getSkillAuraValue(aura, selection?.border);
    if (DIRECT_SKILL_BOOST_KEYS[aura.name]) {
      return { aura, value, implemented: true };
    }
    if (aura.name === "Jurassic World") {
      const prehistoricCount = team.filter((card) => card.definition.pack === "Prehistoric").length;
      const multiplier = 1 + prehistoricCount * value / 100;
      if (prehistoricCount > 0) {
        for (const card of team) {
          if (card.definition.pack !== "Prehistoric") continue;
          card.damage *= multiplier;
          card.maxHp *= multiplier;
          card.hp *= multiplier;
        }
      }
      return { aura, value, implemented: true };
    }
    if (aura.name === "Magical Elf") {
      const uniqueToys = new Set(
        team.filter((card) => TOY_CARD_NAMES.has(card.definition.name)).map((card) => card.definition.name)
      ).size;
      const awakened = uniqueToys >= value;
      for (const card of team) {
        if (!TOY_CARD_NAMES.has(card.definition.name)) continue;
        card.counters.toyCount = uniqueToys;
        if (awakened) card.flags.awakened = true;
      }
      return { aura, value, implemented: true };
    }
    return { aura, value, implemented: false };
  }
  var DIRECT_SKILL_BOOST_KEYS = {
    Fate: "fate",
    Shielder: "shielder",
    "Flame Wizard": "flameWizard",
    Phantom: "phantom",
    Berserker: "berserker",
    "Synth Human": "synthHuman",
    "End Times": "endTimes",
    "Vampire Matron": "vampireMatron"
  };
  function buildSkillAuraBoosts(selection) {
    const aura = getAura(selection?.auraName);
    if (!aura || aura.type !== "Skill") return { boosts: {}, implemented: true };
    const value = getSkillAuraValue(aura, selection?.border);
    const boosts = {
      skillAuraName: aura.name,
      skillAuraValue: value
    };
    const key = DIRECT_SKILL_BOOST_KEYS[aura.name];
    if (key) {
      ;
      boosts[key] = value;
      return { boosts, aura, implemented: true };
    }
    if (aura.name === "Jurassic World" || aura.name === "Magical Elf") {
      return { boosts, aura, implemented: true };
    }
    return { boosts, aura, implemented: false };
  }

  // src/engine/rng.ts
  var SeededRng = class {
    constructor(seed) {
      __publicField(this, "state");
      this.state = seed >>> 0 || 2654435769;
    }
    next() {
      let t = this.state += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  };

  // src/engine/stats.ts
  var BORDER_RARITY_MULTIPLIERS = {
    Platinum: 100,
    Crystal: 1e4,
    Ruby: 1e5,
    Galaxy: 1e6
  };
  function rarityWithBorders(card, borders = []) {
    return borders.reduce((rarity, border) => rarity * BORDER_RARITY_MULTIPLIERS[border], card.rarity);
  }
  function getPower(card, borders = []) {
    const rarity = card.name === "Ouroboros" ? 1e14 : rarityWithBorders(card, borders);
    if (rarity <= 0) return 0;
    return Math.pow(2, Math.log10(rarity)) * 10 * (card.statMultiplier || 1);
  }
  function getHealth(card, borders = []) {
    return getPower(card, borders) * (card.hpMultiplier || 1);
  }
  function getAttack(card, borders = []) {
    return getPower(card, borders) / 2;
  }

  // src/engine/combat-data.ts
  var UNDEAD_CARDS = /* @__PURE__ */ new Set([
    "Ghoul",
    "Dracula",
    "Walking Dead",
    "Zombie Dragon",
    "Zombie Nurse",
    "Skeleton King",
    "Vampire Lord",
    "Hades",
    "Anubis",
    "Anubis & Hades",
    "Count Muscula",
    "Baby Skeleton",
    "Frankenstein",
    "Mummy",
    "Ji\u0101ngsh\u012B",
    "Zombie",
    "Banshee",
    "Revenant",
    "Headless Horseman",
    "Bloody Mary",
    "Pestilence",
    "Famine",
    "War",
    "Death"
  ]);
  var DEMON_CARDS = /* @__PURE__ */ new Set([
    "Beelzebub",
    "Tartarus",
    "Krampus",
    "Demonic Cultivator",
    "Heavenly Demon",
    "Fafnir",
    "Vicious",
    "AK4-ON1",
    "A0-ON1",
    "Shuten-d\u014Dji",
    "Hell's Army",
    "Sable The Envious"
  ]);
  var RNG_ABILITIES = /* @__PURE__ */ new Set([
    "Evasion",
    "Blinding Flash",
    "True Strike",
    "Frigid Touch",
    "Revive",
    "Self-Destruct",
    "Eternity",
    "Frozen Ashes",
    "Dagger",
    "Guerilla Warfare",
    "Fusion... HA!",
    "Armageddon",
    "Favorable Odds",
    "Reaper's Luck",
    "Invisibility",
    "Chaos Destruction",
    "Creation and Restoration",
    "Herbal Alchemy",
    "Gambler",
    "Untouchable",
    "Divine Mist",
    "Origin",
    "Pandora's Box",
    "Naughty or Nice?",
    "Snowscape"
  ]);
  function boostedCards(auraName) {
    return new Set(auras_default.find((aura) => aura.name === auraName)?.boostedCards || []);
  }
  var DRAGON_CARDS = boostedCards("Dragon King");
  var AVIAN_CARDS = boostedCards("Avian King");
  var IMP_BOOSTED_CARDS = boostedCards("Imp");

  // src/engine/battle-v2.ts
  var OTHER_TEAM = { Allies: "Enemies", Enemies: "Allies" };
  var CARD_BY_NAME = new Map(cards_default.map((card) => [card.name, card]));
  var FULLY_SUPPORTED = /* @__PURE__ */ new Set([
    "Gathering",
    "Remembrance",
    "Am I Beautiful?",
    "Persistent",
    "Chimeric",
    "First Progenitor",
    "Undead Practitioner",
    "Big and Large",
    "Patience",
    "Blade",
    "Clawless",
    "Catastrophe",
    "Frail",
    "Fight Dirty",
    "Assassinate",
    "Humanity's Spirit",
    "Infinite Dagger Works",
    "Heart Legacy",
    "Heavenly Might",
    "Wail",
    "Doom",
    "Favorable Odds",
    "Combatant",
    "Disarm",
    "Explosion",
    "Mind Rift",
    "Evasion",
    "Armor",
    "Puppy Eyes",
    "Brittle",
    "Mana Shield",
    "Regenerate",
    "Finesse",
    "Last Stand",
    "Rage",
    "Blinding Flash",
    "Lifesteal",
    "Undead",
    "First Blood",
    "Berserk",
    "Plunder",
    "True Strike",
    "Frigid Touch",
    "Revive",
    "Maelstrom",
    "Judgment",
    "Self-Destruct",
    "Super Strength",
    "Eternity",
    "Frozen Ashes",
    "Greater Might",
    "Transcend Time",
    "Cerberus",
    "Sacrifice",
    "Untouchable",
    "The Fall",
    "Invincibility",
    "Armageddon",
    "Stardust Driver",
    "Invisibility",
    "Divine Barrier",
    "Quick Strike",
    "Rapid Blows",
    "Restoration",
    "The Loser",
    "Eight Heads",
    "Heavenly Ruler",
    "Decapitate",
    "Martial Will",
    "Moonlight Beam",
    "Feeder",
    "Absolute Sovereignty",
    "Stalwart",
    "Passion",
    "Voracity",
    "Vainglory",
    "Modesty",
    "Decimate",
    "Scale Armor",
    "Draconic Heart",
    "Prehistoric Wrath",
    "Hidden Curse",
    "Perforating Mist",
    "Turtle Shell",
    "Snowbound",
    "Shelter Obsession",
    "Fluffy Aggression",
    "Speedy Progression",
    "Behavioral Therapy",
    "Red-Nosed Reindeer",
    "Sky Drop",
    "Spikes",
    "Shadow Predator",
    "Apex Predator",
    "Extinction",
    "Aura Farm",
    "Mr. Piccolo",
    "Sudden Demise",
    "Hidden in the Depths",
    "Terror From Above",
    "God of Thunder",
    "All Father",
    "Fire World",
    "Into The Sun",
    "Eat The Moon",
    "Dirty Claw",
    "Death Embrace",
    "Blood Drinker",
    "Drain Vitality",
    "Fury of the White Tiger",
    "Defraud",
    "Unforgiving",
    "Grape Juice",
    "Perfect Sacrifice",
    "Guilt",
    "Melt",
    "Boiling Blood",
    "Run As Fast As You Can",
    "Bind",
    "Guerilla Warfare",
    "Avalon",
    "Reflective Shell",
    "Moonlight Beam",
    "Firepower",
    "Chainsaw",
    "Third Eye",
    "Influence",
    "Art of War",
    "Dominate",
    "Lightning Slash",
    "True Fang",
    "Book of Death",
    "Holy Wrath",
    "Telekinesis",
    "Unlucky",
    "Dragon Slayer",
    "Outrank",
    "Golden Bell Shield",
    "Frozen Wrath",
    "Immortal",
    "Haste",
    "Tonic",
    "Destiny Sight",
    "Eternal Devotion",
    "Unpaid 'Interns'",
    "Infectious",
    "Hell's Curse",
    "Final Tail",
    "Reaper's Luck",
    "Decay",
    "Purifying Fire",
    "Sacrificial Tides",
    "Rejuvenate",
    "Twilight Sparkle",
    "Viral Breath",
    "Herbal Alchemy",
    "Revenge",
    "Northern Winds",
    "Azure Dragon Wrath",
    "Stampede",
    "Ice Age",
    "Jaws",
    "Lightning Strike",
    "Danger Sense",
    "Defensive Maneuver",
    "First Tail",
    "Grind",
    "World Creation",
    "Melancholy",
    "The World",
    "Accelerate",
    "Black Flash",
    "Limitless",
    "Monkey King's Rage",
    "A Pair of Two",
    "Final Stand",
    "Heard but not Seen",
    "Lights Way",
    "Eclipse",
    "Friendship",
    "Fusion... HA!",
    "Divine Mist",
    "Dark Qi Manipulation",
    "Immortal Ascension",
    "Hard Boiled",
    "Tyrannospirit",
    "Absolute Apex",
    "Last Meal",
    "Stolen Spotlight",
    "Horned Attack",
    "Creep",
    "Protection of Gods",
    "Upheaval",
    "Deadly Ambush",
    "Erosion",
    "Divination",
    "Insatiable",
    "Poke the Beast",
    "Full Moon",
    "Unholy Creature",
    "The Underworld",
    "Devilish",
    "Chaos Destruction",
    "Beyond The Grave",
    "Creation and Restoration",
    "Dispel",
    "Healing Miracle",
    "Laser Gun",
    "Lotus Sutra",
    "Origin",
    "Outshine",
    "Pandemic",
    "Railgun",
    "Shiny Steal",
    "Water Shield of Xuanwu",
    "Constellar",
    "Pandora's Box",
    "ConstellarVirgo",
    "ConstellarScorpio",
    "ConstellarSagittarius",
    "ConstellarAquarius",
    "ConstellarGemini",
    "ConstellarTaurus",
    "ConstellarCancer",
    "Perseverance",
    "Oppressed",
    "Dagger Storm",
    "Desire",
    "Starvation",
    "Meow",
    "Playing God",
    "Eternal Voyage",
    "Haunt",
    "Witch's Curse",
    "Blessing",
    "Happy Family",
    "Lazy",
    "Housewife's Blessing",
    "Flames of Rebirth",
    "Paradox",
    "Hatred",
    "Naughty or Nice?",
    "Naughty List",
    "Sacred Judgment",
    "Toil",
    "Never Forgotten",
    "Steal Christmas",
    "Better Days",
    "Pop-Up Impression",
    "Gobble",
    "We Want YOU",
    "Bloodlust",
    "Flesh Eater",
    "Forbidden Banquet",
    "Cosmic Maw",
    "Hex",
    "Order of the Cosmos",
    "Honor",
    "Gehenna",
    "Beyond Comprehension",
    "Imminent Doom",
    "Dance of Discord",
    "Snowscape",
    "Plague",
    "Spook",
    "Perish",
    "Blood Bath",
    "Undying",
    "Mirror Image",
    "Long Reach",
    "Whooping",
    "Shapeshifter",
    "Heroes",
    "God of Trickery",
    "Draconian",
    "Safeguarding",
    "Mother of Dragons",
    "Reveal",
    "Jealousy",
    "Nightmare Melody",
    "Sap",
    "Bind Fate",
    "Luminescent Veil",
    "Ouroboros"
  ]);
  var BENCH_AFFECTING_UNSUPPORTED = /* @__PURE__ */ new Set();
  var CONSTELLAR_ABILITIES = [
    "ConstellarVirgo",
    "ConstellarScorpio",
    "ConstellarSagittarius",
    "ConstellarAquarius",
    "ConstellarGemini",
    "ConstellarTaurus",
    "ConstellarCancer"
  ];
  var DODGE_ABILITIES = /* @__PURE__ */ new Set([
    "Danger Sense",
    "Deadly Ambush",
    "Evasion",
    "Untouchable",
    "Guerilla Warfare",
    "The Loser",
    "Invisibility",
    "Limitless",
    "Transcend Time",
    "Snowbound",
    "Sky Drop",
    "Shadow Predator",
    "Run As Fast As You Can",
    "Heard but not Seen",
    "Lights Way"
  ]);
  var GENERAL_MOON_ZOO_ABILITY = cards_default.find((card) => card.name === "General Moon Zoo")?.ability;
  var PANDORA_ABILITY_POOL = [...new Set(
    cards_default.map((card) => card.ability).filter((name) => Boolean(name))
  )].filter(
    (name) => name !== "Pandora's Box" && name !== GENERAL_MOON_ZOO_ABILITY && FULLY_SUPPORTED.has(name)
  );
  var RANDOM_CARD_POOL = cards_default.filter(
    (card) => !card.unobtainable && card.ability !== "Pandora's Box" && card.ability !== "Constellar"
  );
  var NUWA_CREATABLE_POOL = cards_default.filter((card) => !card.expires && !card.unobtainable && card.name !== "N\xFCwa");
  function debugCard(card) {
    return {
      name: effectiveCardName(card) || card.definition.name,
      ability: ability(card),
      hp: card.hp,
      maxHp: card.maxHp,
      damage: card.damage,
      power: card.power
    };
  }
  function pushDebugEvent(runtime, event) {
    if (!runtime.captureDebug) return;
    if (runtime.debug.events.length >= 300) runtime.debug.events.shift();
    runtime.debug.events.push(event);
  }
  function definition(name) {
    return CARD_BY_NAME.get(name);
  }
  function effectiveCardName(card) {
    return card?.identityOverride ?? card?.definition.name ?? null;
  }
  function ability(card) {
    if (!card) return null;
    if (card.abilityOverride !== void 0) return card.abilityOverride ?? null;
    const name = effectiveCardName(card);
    if (!name) return null;
    if (card.identityOverride && name === "Longmu") return null;
    return definition(name)?.ability ?? card.definition.ability ?? null;
  }
  function abilityNames(card) {
    if (!card) return [];
    return [...new Set([ability(card), ...card.bonusAbilities || []].filter((name) => Boolean(name)))];
  }
  function activeBonusAbilities(card) {
    const root = card.definition.ability;
    if ((root === "Pandora's Box" || root === "Heroes") && ability(card) === root) {
      return card.bonusAbilities || [];
    }
    return [];
  }
  function withAbility(card, name, fn) {
    const previous = card.abilityOverride;
    card.abilityOverride = name;
    try {
      return fn();
    } finally {
      card.abilityOverride = previous;
    }
  }
  function randomBattleCard(runtime) {
    return RANDOM_CARD_POOL[Math.floor(runtime.rng.next() * RANDOM_CARD_POOL.length)] || cards_default[0];
  }
  function randomConstellarAbility(runtime) {
    return CONSTELLAR_ABILITIES[Math.floor(runtime.rng.next() * CONSTELLAR_ABILITIES.length)];
  }
  function resolvePandoraGainedAbility(runtime, card, name) {
    if (name === "Constellar") return randomConstellarAbility(runtime);
    if (name === "The Underworld") {
      const copied = [...runtime.state.fallen[card.team]].reverse().flatMap((fallen) => abilityNames(fallen)).find((candidate) => candidate !== "The Underworld" && candidate !== "Pandora's Box");
      if (copied) return copied;
    }
    return name;
  }
  function constellarTaurusFactor(card) {
    if (card.maxHp <= 0) return 2.5;
    return Math.min(2.5, 1 + (1 - Math.max(0, card.hp) / card.maxHp) * 1.5);
  }
  function primaryBorder(card) {
    if (card.borders.includes("Galaxy")) return "Galaxy";
    if (card.borders.includes("Ruby")) return "Ruby";
    if (card.borders.includes("Crystal")) return "Crystal";
    if (card.borders.includes("Platinum")) return "Platinum";
    return "";
  }
  function borderTier(card) {
    const border = primaryBorder(card);
    return border === "Galaxy" ? 30 : border === "Ruby" ? 25 : border === "Crystal" ? 20 : border === "Platinum" ? 10 : 0;
  }
  function toyBearAwakenedMultiplier(card, fallenToys) {
    const border = primaryBorder(card);
    const current = border === "Galaxy" ? 64 : border === "Ruby" ? 32 : border === "Crystal" ? 16 : border === "Platinum" ? 4 : 1;
    const ladder = [1, 4, 16, 32, 64];
    const start = Math.max(0, ladder.indexOf(current));
    return ladder[Math.min(ladder.length - 1, start + fallenToys)] / current;
  }
  function alive(card) {
    return Boolean(card && card.hp > 0 && !card.dead);
  }
  function boostStats(card, mult) {
    card.damage *= mult;
    card.maxHp *= mult;
    card.hp *= mult;
  }
  function stealStats(from, to, fraction) {
    const stolenDamage = Math.max(0, from.damage * fraction);
    const stolenMaxHp = Math.max(0, from.maxHp * fraction);
    const stolenHp = Math.max(0, from.hp * fraction);
    from.damage = Math.max(0, from.damage - stolenDamage);
    from.maxHp = Math.max(1, from.maxHp - stolenMaxHp);
    from.hp = Math.max(0, Math.min(from.maxHp, from.hp - stolenHp));
    to.damage += stolenDamage;
    to.maxHp += stolenMaxHp;
    to.hp += stolenHp;
  }
  function statusProtected(runtime, team) {
    return runtime.state.teams[team].some((card) => hasAbility(runtime, card, "Protection of Gods"));
  }
  function luminescentVeilHolder(runtime, team) {
    return runtime.state.teams[team].find((card) => alive(card) && hasAbility(runtime, card, "Luminescent Veil"));
  }
  function clearSkillAura(runtime, team) {
    const boosts = runtime.state.boosts[team];
    runtime.state.boosts[team] = {
      statAuraName: boosts.statAuraName,
      statAuraValue: boosts.statAuraValue,
      fossils: boosts.fossils || 0,
      composerCount: boosts.composerCount,
      composerThreshold: boosts.composerThreshold,
      noAbilities: boosts.noAbilities
    };
  }
  function randomCreatableCard(runtime) {
    return NUWA_CREATABLE_POOL[Math.floor(runtime.rng.next() * NUWA_CREATABLE_POOL.length)] || cards_default[0];
  }
  function waterShield(runtime, team, target) {
    return runtime.state.teams[team].find((card) => card !== target && hasAbility(runtime, card, "Water Shield of Xuanwu"));
  }
  function resetCombatStats(card) {
    const normalDamage = card.counters.normalDamage;
    const normalMaxHp = card.counters.normalMaxHp;
    if (normalDamage > 0) card.damage = normalDamage;
    if (normalMaxHp > 0) {
      card.maxHp = normalMaxHp;
      card.hp = Math.min(card.hp, card.maxHp);
    }
  }
  function clearStatuses(card) {
    card.status.stunned = 0;
    card.status.confused = 0;
    card.status.burn = 0;
    card.status.weakness = false;
    card.status.blind = false;
    card.counters.bleed = 0;
    card.counters.frostbite = 0;
    card.counters.poisonFlat = 0;
    card.counters.poisonPercent = 0;
    card.counters.weaknessTurns = 0;
  }
  function makePlayerCard(name, borders, index) {
    const card = definition(name);
    if (!card) return null;
    const power = getPower(card, borders);
    const hp = getHealth(card, borders);
    return {
      id: `Allies:${index}:${name}`,
      definition: card,
      team: "Allies",
      index,
      borders: [...borders],
      power,
      hp,
      maxHp: hp,
      damage: getAttack(card, borders),
      entered: false,
      dead: false,
      boss: Boolean(card.boss),
      status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
      flags: {},
      counters: {}
    };
  }
  function makeEnemyCard(enemy, index) {
    return {
      id: `Enemies:${index}:${enemy.card.name}`,
      definition: enemy.card,
      team: "Enemies",
      index,
      borders: [],
      power: enemy.power,
      hp: enemy.health,
      maxHp: enemy.health,
      damage: enemy.attack,
      entered: false,
      dead: false,
      boss: Boolean(enemy.card.boss),
      status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
      flags: {},
      counters: {}
    };
  }
  function cloneAtFraction(source, fraction, serial) {
    return {
      ...source,
      id: `${source.team}:copy:${serial}:${source.definition.name}`,
      hp: source.hp * fraction,
      maxHp: source.maxHp * fraction,
      damage: source.damage * fraction,
      power: source.power * fraction,
      entered: false,
      dead: false,
      identityOverride: void 0,
      status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
      flags: { paired: true },
      counters: { normalDamage: source.damage * fraction }
    };
  }
  function noteUnsupported(state, card) {
    for (const name of abilityNames(card)) {
      if (!FULLY_SUPPORTED.has(name)) state.unsupportedAbilities.add(name);
    }
  }
  function active(runtime, team) {
    return runtime.state.teams[team][0];
  }
  function hasAbility(runtime, card, name) {
    if (!card || card.dead || card.flags.sealed || (runtime.state.boosts[card.team].noAbilities || 0) > 0) return false;
    const opposingCard = active(runtime, OTHER_TEAM[card.team]);
    const ownName = effectiveCardName(card);
    const opposingName = effectiveCardName(opposingCard);
    let matched = abilityNames(card).includes(name);
    if (!matched && ability(card) === "Jealousy" && opposingCard && opposingName !== "Amenhotep") {
      matched = abilityNames(opposingCard).includes(name);
    }
    if (!matched) return false;
    if (opposingCard && ability(opposingCard) === "Jealousy" && ownName !== "Amenhotep") return false;
    const honorActive = [active(runtime, "Allies"), active(runtime, "Enemies")].some(
      (activeCard) => activeCard && !activeCard.dead && !activeCard.flags.sealed && abilityNames(activeCard).includes("Honor")
    );
    if (honorActive && name !== "Honor") return false;
    const enemy = runtime.state.boosts[OTHER_TEAM[card.team]];
    if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) return false;
    return true;
  }
  function resolvedAbility(runtime, card) {
    const raw = ability(card);
    if (!card || !raw) return raw;
    const opposingCard = active(runtime, OTHER_TEAM[card.team]);
    if (raw === "Jealousy" && opposingCard && effectiveCardName(opposingCard) !== "Amenhotep") {
      return ability(opposingCard);
    }
    if (opposingCard && ability(opposingCard) === "Jealousy" && effectiveCardName(card) !== "Amenhotep") return null;
    return raw;
  }
  function rand(runtime, team) {
    const activeA = runtime.state.teams.Allies[0];
    const activeE = runtime.state.teams.Enemies[0];
    if (hasAbility(runtime, activeA, "Unlucky") || hasAbility(runtime, activeE, "Unlucky")) return 0;
    if (runtime.state.teams[team][0]?.flags.noRng) return 0;
    let roll = runtime.rng.next();
    const fate = runtime.state.boosts[team].fate;
    if (fate && runtime.rng.next() < fate / 100) roll = Math.max(roll, runtime.rng.next());
    return Math.min(1, roll);
  }
  function buildBoosts(loadout, state) {
    const boosts = { Allies: { fossils: 0 }, Enemies: { fossils: 0 } };
    const skill = buildSkillAuraBoosts(loadout.abilityAura);
    boosts.Allies = { fossils: 0, ...skill.boosts };
    if (skill.aura && !skill.implemented) state.unsupportedAbilities.add(`Aura: ${skill.aura.name}`);
    return boosts;
  }
  function applyDeckPassives(team) {
    const moonZoo = team.filter((card) => card.definition.name === "General Moon Zoo").length;
    const julius = team.filter((card) => card.definition.name === "Julius Leader").length;
    const damageMult = (1 + moonZoo * 0.1) * (1 + julius * 0.2);
    if (damageMult !== 1) for (const card of team) card.damage *= damageMult;
  }
  function applyDraconianSetup(team) {
    let motherOfDragons = false;
    for (let index = 0; index < team.length; index++) {
      const card = team[index];
      if (card.definition.ability !== "Draconian") continue;
      card.abilityOverride = index === 0 ? "Safeguarding" : "Mother of Dragons";
      if (index === 0) card.status.shield = Math.max(card.status.shield, 1);
      else motherOfDragons = true;
    }
    if (motherOfDragons) {
      for (const card of team) {
        if (DRAGON_CARDS.has(card.definition.name)) card.status.shield = Math.max(card.status.shield, 2);
      }
    }
  }
  function createBattleStateV2(loadout, enemies) {
    const allies = loadout.cards.map((slot, index) => makePlayerCard(slot.cardName, slot.borders, index + 1)).filter((card) => Boolean(card));
    const enemyCards = enemies.map((enemy, index) => makeEnemyCard(enemy, index + 1));
    const state = {
      teams: { Allies: allies, Enemies: enemyCards },
      fallen: { Allies: [], Enemies: [] },
      boosts: { Allies: {}, Enemies: {} },
      turn: 0,
      moving: "Allies",
      unsupportedAbilities: /* @__PURE__ */ new Set()
    };
    applyDeckPassives(allies);
    applyDeckPassives(enemyCards);
    applyDraconianSetup(allies);
    applyDraconianSetup(enemyCards);
    const stat = applyStatAura(allies, loadout.statAura);
    const skillTeam = applySkillAuraTeamEffects(allies, loadout.abilityAura);
    state.boosts = buildBoosts(loadout, state);
    for (const team of ["Allies", "Enemies"]) {
      const composerCount = state.teams[team].filter((card) => card.definition.ability === "Nightmare Melody").length;
      if (composerCount > 0) {
        state.boosts[team].composerCount = composerCount;
        state.boosts[team].composerThreshold = 1;
      }
    }
    if (skillTeam.aura && !skillTeam.implemented) state.unsupportedAbilities.add(`Aura: ${skillTeam.aura.name}`);
    if (stat.aura) {
      state.boosts.Allies.statAuraName = stat.aura.name;
      state.boosts.Allies.statAuraValue = stat.value;
    }
    for (const card of [...allies, ...enemyCards]) {
      card.counters.normalDamage = card.damage;
      card.counters.normalMaxHp = card.maxHp;
      if (BENCH_AFFECTING_UNSUPPORTED.has(ability(card) || "")) noteUnsupported(state, card);
    }
    return state;
  }
  function resolveConstellarArts(runtime) {
    for (const team of ["Allies", "Enemies"]) {
      for (const card of runtime.state.teams[team]) {
        if (card.definition.ability === "Constellar" && !card.abilityOverride) {
          card.abilityOverride = randomConstellarAbility(runtime);
        }
      }
      const astraeusCount = runtime.state.teams[team].filter((card) => card.definition.name === "Astraeus").length;
      for (const card of runtime.state.teams[team]) {
        if (ability(card) === "ConstellarGemini" && !card.flags.constellarGeminiApplied) {
          card.flags.constellarGeminiApplied = true;
          boostStats(card, 1 + astraeusCount * 0.5);
        }
      }
    }
  }
  function performEntryAttack(runtime, card, mult = 1, allEnemies = false) {
    const enemyTeam = OTHER_TEAM[card.team];
    const first = active(runtime, enemyTeam);
    if (!first || !alive(card)) return;
    const dealt = dealDamage(runtime, card, first, mult);
    if (allEnemies && dealt > 0) {
      for (const target of runtime.state.teams[enemyTeam].slice(1)) target.hp -= Math.min(target.hp, dealt);
    }
    resolveDeaths(runtime);
  }
  function onEntry(runtime, card) {
    if (card.entered || !alive(card)) return;
    card.entered = true;
    noteUnsupported(runtime.state, card);
    const enemyTeam = OTHER_TEAM[card.team];
    const enemy = active(runtime, enemyTeam);
    if (!enemy) return;
    if (enemy !== card && hasAbility(runtime, enemy, "Desire")) stealStats(card, enemy, 0.1);
    if (enemy !== card && hasAbility(runtime, enemy, "Cosmic Maw")) stealStats(card, enemy, 0.2);
    if (enemy !== card && enemy.flags.awakened && hasAbility(runtime, enemy, "Pop-Up Impression") && !statusProtected(runtime, card.team)) {
      card.status.confused = Math.max(card.status.confused, enemy.counters.toyCount || 1);
    }
    let name = resolvedAbility(runtime, card);
    if (!name || !hasAbility(runtime, card, name)) return;
    if (name === "Pandora's Box" && !card.flags.pandoraRolled) {
      card.flags.pandoraRolled = true;
      const chosen = [];
      let attempts = 0;
      while (chosen.length < 2 && attempts++ < 100 && PANDORA_ABILITY_POOL.length) {
        const raw = PANDORA_ABILITY_POOL[Math.floor(runtime.rng.next() * PANDORA_ABILITY_POOL.length)];
        const gained = resolvePandoraGainedAbility(runtime, card, raw);
        if (gained !== "Pandora's Box" && !chosen.includes(gained)) chosen.push(gained);
      }
      card.bonusAbilities = chosen;
      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: runtime.state.turn,
        type: "ability",
        team: card.team,
        card: effectiveCardName(card) || card.definition.name,
        detail: `Pandora's Box rolled: ${chosen.join(" + ") || "No abilities"}`,
        hp: card.hp,
        maxHp: card.maxHp,
        damage: card.damage
      });
      for (const gained of chosen) {
        withAbility(card, gained, () => {
          card.entered = false;
          onEntry(runtime, card);
        });
      }
      card.entered = true;
      return;
    }
    if (name === "Heroes") {
      const chosen = runtime.state.fallen[card.team].slice(0, 2).filter((fallen) => fallen.definition.name !== card.definition.name && fallen.definition.name !== "Legends").map((fallen) => fallen.definition.ability).filter((gained) => Boolean(gained));
      if (chosen.length) card.bonusAbilities = [...new Set(chosen)];
      for (const gained of activeBonusAbilities(card)) {
        withAbility(card, gained, () => {
          card.entered = false;
          onEntry(runtime, card);
        });
      }
      card.entered = true;
      return;
    }
    if (name === "Constellar") {
      card.abilityOverride = randomConstellarAbility(runtime);
      name = ability(card);
      if (name === "ConstellarGemini" && !card.flags.constellarGeminiApplied) {
        card.flags.constellarGeminiApplied = true;
        const count = runtime.state.teams[card.team].filter((ally) => ally.definition.name === "Astraeus").length;
        boostStats(card, 1 + count * 0.5);
      }
      card.entered = false;
      onEntry(runtime, card);
      return;
    }
    if (name === "The Underworld") {
      const copied = [...runtime.state.fallen[card.team]].reverse().map((fallen) => ability(fallen)).find((candidate) => candidate && candidate !== "The Underworld");
      if (copied) {
        card.abilityOverride = copied;
        card.entered = false;
        onEntry(runtime, card);
        return;
      }
    }
    switch (name) {
      case "Bind Fate": {
        const firstTwo = runtime.state.teams[enemyTeam].filter(alive).slice(0, 2);
        if (firstTwo.length === 2) {
          const pair = runtime.state.turn * 1e3 + Math.max(1, card.index);
          firstTwo[0].counters.bindFatePair = pair;
          firstTwo[1].counters.bindFatePair = pair;
        }
        break;
      }
      case "Ouroboros": {
        if (!card.flags.ouroborosActive) {
          let stolenDamage = 0;
          let stolenMaxHp = 0;
          let stolenHp = 0;
          for (const teamName of ["Allies", "Enemies"]) {
            for (const other of runtime.state.teams[teamName]) {
              if (other === card || !alive(other)) continue;
              const oldDamage = other.damage;
              const oldMaxHp = other.maxHp;
              const oldHp = other.hp;
              other.damage = Math.max(0, oldDamage * 0.95);
              other.maxHp = Math.max(1, oldMaxHp * 0.95);
              other.hp = Math.max(0, Math.min(other.maxHp, oldHp * 0.95));
              stolenDamage += oldDamage - other.damage;
              stolenMaxHp += oldMaxHp - other.maxHp;
              stolenHp += oldHp - other.hp;
            }
          }
          card.damage += stolenDamage;
          card.maxHp += stolenMaxHp;
          card.hp += stolenHp;
          card.counters.ouroborosBonusDamage = stolenDamage;
          card.counters.ouroborosBonusMaxHp = stolenMaxHp;
          card.counters.ouroborosBonusHp = stolenHp;
          card.counters.ouroborosTurns = 3;
          card.flags.ouroborosActive = true;
        }
        break;
      }
      case "Perseverance":
        if (!card.flags.perseveranceBoosted) {
          card.flags.perseveranceBoosted = true;
          card.maxHp *= 100;
          card.hp *= 100;
        }
        break;
      case "ConstellarVirgo":
        card.counters.hpShield = (card.counters.hpShield || 0) + card.maxHp * 2;
        break;
      case "ConstellarGemini":
        if (!card.flags.constellarGeminiApplied) {
          card.flags.constellarGeminiApplied = true;
          const count = runtime.state.teams[card.team].filter((ally) => ally.definition.name === "Astraeus").length;
          boostStats(card, 1 + count * 0.5);
        }
        break;
      case "Gathering": {
        const count = runtime.state.teams[card.team].length + runtime.state.fallen[card.team].length;
        card.damage *= Math.pow(1.5, count);
        break;
      }
      case "Remembrance": {
        const count = runtime.state.fallen[card.team].length;
        if (count) boostStats(card, Math.pow(1.5, count));
        break;
      }
      case "Friendship": {
        const unique = new Set(
          [...runtime.state.teams[card.team], ...runtime.state.fallen[card.team]].filter((ally) => ability(ally) === "Friendship").map((ally) => ally.definition.name)
        ).size;
        if (unique > 0) boostStats(card, 1 + unique * 0.4);
        break;
      }
      case "Humanity's Spirit": {
        const count = runtime.state.fallen[card.team].length;
        if (count) boostStats(card, Math.pow(1.5, count));
        break;
      }
      case "Perforating Mist": {
        const fallenDamage = runtime.state.fallen[card.team].reduce((sum, fallen) => sum + fallen.damage, 0);
        if (fallenDamage > 0) card.damage += fallenDamage;
        break;
      }
      case "Beyond Comprehension":
        if (!statusProtected(runtime, enemy.team)) {
          enemy.flags.eternalConfusion = true;
          enemy.status.confused = Math.max(enemy.status.confused, 1);
        }
        break;
      case "Dance of Discord": {
        const deck = runtime.state.teams[enemyTeam];
        if (deck.length >= 2) {
          const firstIndex = Math.floor(runtime.rng.next() * deck.length);
          let secondIndex = Math.floor(runtime.rng.next() * (deck.length - 1));
          if (secondIndex >= firstIndex) secondIndex += 1;
          const first = deck[firstIndex];
          const second = deck[secondIndex];
          [first.damage, second.damage] = [second.damage, first.damage];
          [first.maxHp, second.maxHp] = [second.maxHp, first.maxHp];
          [first.hp, second.hp] = [Math.min(second.hp, second.maxHp), Math.min(first.hp, first.maxHp)];
          boostStats(first, 0.85);
          boostStats(second, 0.85);
          [deck[firstIndex], deck[secondIndex]] = [deck[secondIndex], deck[firstIndex]];
        }
        break;
      }
      case "Snowscape": {
        if (statusProtected(runtime, enemy.team)) break;
        const roll = Math.floor(rand(runtime, card.team) * 3);
        if (roll <= 0) enemy.counters.frostbite = Math.max(enemy.counters.frostbite || 0, 3);
        else if (roll === 1) {
          enemy.flags.slowed = true;
          enemy.counters.slowTurns = Math.max(enemy.counters.slowTurns || 0, 3);
          enemy.counters.slowed = 0;
        } else enemy.status.stunned = Math.max(enemy.status.stunned, 3);
        break;
      }
      case "Spook":
        if (AVIAN_CARDS.has(enemy.definition.name) && !statusProtected(runtime, enemy.team)) {
          enemy.status.confused = Math.max(enemy.status.confused, 3);
        }
        break;
      case "Perish":
        if (!statusProtected(runtime, enemy.team)) enemy.status.stunned = Math.max(enemy.status.stunned, 1);
        card.counters.perishTurns = 3;
        break;
      case "Desire":
        break;
      case "Cosmic Maw":
        stealStats(enemy, card, 0.2);
        break;
      case "Sap":
        if (rand(runtime, card.team) > 1 - card.damage / enemy.damage) {
          card.damage += enemy.damage * 0.5;
          enemy.damage *= 0.5;
        }
        break;
      case "Haunt": {
        const damageLoss = card.damage * 0.35;
        const hpLoss = card.maxHp * 0.35;
        enemy.damage = Math.max(0, enemy.damage - damageLoss);
        enemy.maxHp = Math.max(1, enemy.maxHp - hpLoss);
        enemy.hp = Math.max(0, Math.min(enemy.maxHp, enemy.hp - hpLoss));
        break;
      }
      case "Hex":
        enemy.flags.noRng = true;
        break;
      case "Order of the Cosmos":
        runtime.state.boosts[enemyTeam].noAbilities = 3;
        break;
      case "Mind Rift":
        if (card.damage > enemy.damage / 4) enemy.status.confused = 3;
        break;
      case "Am I Beautiful?":
        enemy.status.confused = 2;
        break;
      case "God of Trickery": {
        const randomCard = randomBattleCard(runtime);
        enemy.identityOverride = randomCard.name;
        enemy.abilityOverride = void 0;
        card.identityOverride = enemy.definition.name;
        card.abilityOverride = void 0;
        break;
      }
      case "Fire World":
        for (const target of runtime.state.teams[enemyTeam]) target.status.burn = 100;
        break;
      case "Book of Death":
        enemy.counters.death = 2;
        break;
      case "Erosion":
        if (rand(runtime, card.team) < 0.5) clearSkillAura(runtime, enemyTeam);
        break;
      case "Divination":
        card.counters.divinationMoves = 5;
        break;
      case "Creation and Restoration": {
        const createdDefinition = randomCreatableCard(runtime);
        const created = {
          ...card,
          id: `${card.team}:created:${runtime.state.turn}:${createdDefinition.name}`,
          definition: createdDefinition,
          index: runtime.state.teams[card.team].length + 1,
          borders: [],
          // OG server source rebuilds the spawned card from Nüwa's raw Power, not Nüwa's
          // current aura/battle-modified HP/ATK and not the spawned card's HP multiplier.
          hp: Math.ceil(card.power),
          maxHp: Math.ceil(card.power),
          damage: Math.ceil(card.power / 2),
          power: card.power,
          entered: false,
          dead: false,
          identityOverride: void 0,
          abilityOverride: void 0,
          bonusAbilities: void 0,
          status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
          flags: {},
          counters: { normalDamage: Math.ceil(card.power / 2), normalMaxHp: Math.ceil(card.power) }
        };
        runtime.state.teams[card.team].push(created);
        pushDebugEvent(runtime, {
          turn: runtime.state.turn,
          type: "spawn",
          team: card.team,
          card: createdDefinition.name,
          detail: "Creation and Restoration: N\xFCwa created " + createdDefinition.name + " at raw Power " + Math.ceil(card.power),
          hp: created.hp,
          maxHp: created.maxHp,
          damage: created.damage
        });
        break;
      }
      case "Dispel":
        resetCombatStats(enemy);
        break;
      case "Pandemic":
        for (const target of runtime.state.teams[enemyTeam]) {
          if (statusProtected(runtime, target.team)) continue;
          target.counters.poisonPercent = Math.min(target.counters.poisonPercent || 0, -0.075);
          target.counters.poisonTurns = Math.max(target.counters.poisonTurns || 0, 2);
        }
        break;
      case "Divine Mist":
        if (rand(runtime, card.team) < 0.7) {
          const hp = getHealth(enemy.definition, []);
          enemy.power = getPower(enemy.definition, []);
          enemy.damage = getAttack(enemy.definition, []);
          enemy.maxHp = hp;
          enemy.hp = hp;
        }
        break;
      case "Chimeric":
        boostStats(card, 4);
        break;
      case "Puppy Eyes":
        enemy.damage *= 0.85;
        break;
      case "Catastrophe":
        enemy.damage *= 0.6;
        break;
      case "Clawless":
        enemy.hp -= enemy.maxHp * 0.15;
        break;
      case "Cerberus":
        enemy.damage *= 0.7;
        break;
      case "Infectious":
        enemy.damage *= enemy.boss ? 0.85 : 0.5;
        enemy.hp *= enemy.boss ? 0.85 : 0.5;
        break;
      case "Dragon Slayer":
        card.damage *= 1.75;
        break;
      case "Greater Might":
        boostStats(card, 1.4);
        break;
      case "Heavenly Might":
        boostStats(card, 1.65);
        break;
      case "Combatant":
        boostStats(card, 1.2);
        break;
      case "Sacrifice":
        card.damage *= 2;
        card.hp /= 2;
        break;
      case "Super Strength":
        card.damage *= 1.25;
        card.maxHp *= 1.25;
        card.hp = card.maxHp;
        break;
      case "Immortal":
        card.maxHp *= 3.5;
        card.hp *= 3.5;
        break;
      case "Fury of the White Tiger":
        card.damage *= 3;
        break;
      case "Tyrannospirit": {
        const fossils = runtime.state.boosts[card.team].fossils || 0;
        if (fossils > 0) card.damage *= Math.pow(1.5, fossils);
        break;
      }
      case "Turtle Shell":
        card.maxHp = 3e4;
        card.hp = 3e4;
        break;
      case "Happy Family": {
        const dads = runtime.state.teams[card.team].filter((ally) => ally !== card && ally.definition.name === "Dad" && alive(ally));
        for (const dad of dads) {
          dad.damage += card.damage;
          dad.maxHp += card.maxHp;
          dad.hp += Math.max(0, card.hp);
        }
        card.hp = 0;
        resolveDeaths(runtime);
        break;
      }
      case "Pop-Up Impression":
        if (!statusProtected(runtime, enemy.team)) {
          const turns = card.flags.awakened ? card.counters.toyCount || 1 : 2;
          enemy.status.confused = Math.max(enemy.status.confused, turns);
        }
        break;
      case "Naughty List":
        for (const ally of runtime.state.teams[card.team]) {
          if (!alive(ally)) continue;
          boostStats(ally, 1.5);
          ally.flags.naughtyListDrain = true;
        }
        break;
      case "Toil":
        boostStats(card, 2);
        break;
      case "Bloodlust":
        card.counters.bloodlustBase = card.damage;
        card.damage += card.damage;
        card.flags.bloodlustFirstTurn = true;
        break;
      case "Fluffy Aggression":
        if (card.flags.awakened) {
          const fallenToys = new Set(
            runtime.state.fallen[card.team].filter((fallen) => TOY_CARD_NAMES.has(fallen.definition.name)).map((fallen) => fallen.definition.name)
          ).size;
          card.damage *= toyBearAwakenedMultiplier(card, fallenToys);
        } else card.damage *= 2;
        break;
      case "Speedy Progression":
        card.counters.attacks = (card.counters.attacks || 0) + (card.flags.awakened ? card.counters.toyCount || 1 : 3);
        break;
      case "Red-Nosed Reindeer":
        if (!statusProtected(runtime, enemy.team)) enemy.status.blind = true;
        break;
      case "Behavioral Therapy":
        enemy.flags.slowed = true;
        enemy.counters.slowed = 0;
        break;
      case "Stampede":
        card.counters.attacks = (card.counters.attacks || 0) + 1;
        enemy.status.stunned = Math.max(1, enemy.status.stunned);
        break;
      case "Ice Age":
        enemy.flags.slowed = true;
        enemy.counters.slowed = 0;
        break;
      case "Hell's Curse":
        enemy.flags.sealed = true;
        enemy.hp /= 2;
        break;
      case "Northern Winds": {
        dealDamage(runtime, card, enemy);
        card.damage += enemy.damage * 0.25;
        enemy.damage *= 0.75;
        resolveDeaths(runtime);
        if (alive(enemy) && hasAbility(runtime, enemy, "Hatred") && alive(card)) {
          dealDamage(runtime, enemy, card, 0.5);
          resolveDeaths(runtime);
        }
        break;
      }
      case "Azure Dragon Wrath":
        dealDamage(runtime, card, enemy, 1.5, true);
        resolveDeaths(runtime);
        if (alive(enemy) && hasAbility(runtime, enemy, "Hatred") && alive(card)) {
          dealDamage(runtime, enemy, card, 0.5);
          resolveDeaths(runtime);
        }
        break;
      case "Revenge":
        if (runtime.state.fallen[card.team].length > 0) {
          dealDamage(runtime, card, enemy, 2);
          resolveDeaths(runtime);
        }
        break;
      case "Stolen Spotlight": {
        const deck = runtime.state.teams[card.team];
        const behind = deck[1];
        if (behind && behind !== card) {
          card.damage += behind.damage;
          card.maxHp += behind.maxHp;
          card.hp += Math.max(0, behind.hp);
          deck.splice(1, 1);
          behind.dead = true;
        }
        break;
      }
      case "A Pair of Two":
        if (!card.flags.paired) {
          card.flags.paired = true;
          const deck = runtime.state.teams[card.team];
          deck.push(cloneAtFraction(card, 0.35, deck.length + 1));
          deck.push(cloneAtFraction(card, 0.35, deck.length + 1));
        }
        break;
      case "Terror From Above": {
        const deck = runtime.state.teams[enemyTeam];
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(runtime.rng.next() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        break;
      }
      case "Sudden Demise": {
        const hits = 1 + Math.floor(runtime.rng.next() * 8);
        const hitDamage = card.damage * 0.1;
        for (let hit = 0; hit < hits; hit++) {
          for (const target of runtime.state.teams[enemyTeam]) target.hp -= Math.min(target.hp, hitDamage);
        }
        resolveDeaths(runtime);
        break;
      }
      case "First Blood":
        performEntryAttack(runtime, card, 0.5);
        break;
      case "Deadly Ambush": {
        const first = active(runtime, enemyTeam);
        if (first) {
          dealDamage(runtime, card, first);
          const current = active(runtime, enemyTeam);
          if (current && !statusProtected(runtime, current.team)) current.counters.poisonPercent = -0.15;
          resolveDeaths(runtime);
        }
        break;
      }
      case "Horned Attack": {
        const first = active(runtime, enemyTeam);
        if (first) {
          const hpBefore = first.hp;
          const dealt = dealDamage(runtime, card, first);
          resolveDeaths(runtime);
          if (dealt > hpBefore && first.hp <= 0) {
            const next = active(runtime, enemyTeam);
            if (next) next.hp -= Math.min(next.hp, dealt - hpBefore);
            resolveDeaths(runtime);
          }
        }
        break;
      }
      case "Fight Dirty":
      case "Quick Strike":
      case "Heart Hunter":
        performEntryAttack(runtime, card, 1);
        if (name === "Heart Hunter" && active(runtime, enemyTeam)) active(runtime, enemyTeam).counters.bleed = 100;
        break;
      case "Sacred Judgment": {
        const targets = [...runtime.state.teams[enemyTeam]];
        for (const target of targets) {
          if (!alive(card) || !alive(target)) continue;
          dealDamage(runtime, card, target);
          resolveDeaths(runtime);
        }
        break;
      }
      case "Stardust Driver":
        performEntryAttack(runtime, card, 2.5);
        break;
    }
  }
  function offensive(runtime, attacker, target, initial) {
    if (activeBonusAbilities(attacker).length) {
      let result = { damage: initial, bypass: false, special: false };
      for (const gained of activeBonusAbilities(attacker)) {
        const next = withAbility(attacker, gained, () => offensive(runtime, attacker, target, result.damage));
        result = { damage: next.damage, bypass: result.bypass || next.bypass, special: result.special || next.special };
      }
      return result;
    }
    const name = resolvedAbility(runtime, attacker);
    let damage = initial;
    let bypass = false;
    if (!name || !hasAbility(runtime, attacker, name)) return { damage, bypass, special: false };
    let special = false;
    if ([
      "True Strike",
      "Maelstrom",
      "Judgment",
      "Armageddon",
      "Draconic Heart",
      "Explosion",
      "Telekinesis",
      "Favorable Odds",
      "Vainglory",
      "Modesty",
      "Decapitate",
      "Martial Will",
      "Dominate",
      "Decimate",
      "Prehistoric Wrath",
      "Big and Large",
      "Blade",
      "Defraud",
      "Assassinate",
      "Sky Drop",
      "Shadow Predator",
      "Apex Predator",
      "Infinite Dagger Works",
      "Extinction",
      "God of Thunder",
      "Fire World",
      "Moonlight Beam",
      "Dirty Claw",
      "Heart Hunter",
      "Chainsaw",
      "Firepower",
      "Rapid Blows",
      "Behavioral Therapy",
      "Holy Wrath",
      "Unlucky",
      "Dragon Slayer",
      "Frozen Wrath",
      "Absolute Apex",
      "Dark Qi Manipulation",
      "Chaos Destruction",
      "ConstellarTaurus",
      "ConstellarSagittarius",
      "Whooping"
    ].includes(name)) special = true;
    switch (name) {
      case "True Strike":
        if (rand(runtime, attacker.team) > 0.5) damage *= 2;
        break;
      case "Absolute Apex":
        damage *= 1.5;
        break;
      case "Whooping":
        if (cardAge(attacker.definition.name) > cardAge(target.definition.name)) damage *= 2;
        break;
      case "ConstellarTaurus":
        damage *= constellarTaurusFactor(attacker);
        break;
      case "Chaos Destruction":
        if (attacker.flags.chaosTriple) {
          damage *= 3;
          attacker.flags.chaosTriple = false;
        }
        ;
        break;
      case "Dark Qi Manipulation":
        if (attacker.flags.awakened) damage *= 2;
        break;
      case "Monkey King's Rage":
        if (attacker.hp / attacker.maxHp <= 0.5 && !attacker.flags.transformed) {
          attacker.flags.transformed = true;
          attacker.maxHp *= 2;
          attacker.hp *= 2;
          damage *= 2;
        }
        break;
      case "Reaper's Luck": {
        const changes = [-0.1, 0.15, 0.3];
        const roll = rand(runtime, attacker.team);
        const change = changes[Math.max(0, Math.min(2, Math.ceil(roll * 3) - 1))];
        const ratio = attacker.maxHp > 0 ? attacker.hp / attacker.maxHp : 0;
        attacker.maxHp *= 1 + change;
        attacker.hp = ratio * attacker.maxHp;
        attacker.damage *= 1 + change;
        break;
      }
      case "Holy Wrath":
        if (UNDEAD_CARDS.has(target.definition.name)) damage *= 2;
        break;
      case "Unlucky":
        if (target.definition.ability && RNG_ABILITIES.has(target.definition.ability)) damage *= 2;
        break;
      case "Maelstrom":
        attacker.counters.maelstrom = (attacker.counters.maelstrom || 0) % 2 + 1;
        if (attacker.counters.maelstrom === 1) damage *= 2;
        break;
      case "Judgment":
        damage += (attacker.maxHp - attacker.hp) * 0.7;
        break;
      case "Armageddon":
        if (rand(runtime, attacker.team) > 0.5) damage = Number.POSITIVE_INFINITY;
        break;
      case "Draconic Heart":
        damage *= 3;
        attacker.damage *= 0.9;
        attacker.hp *= 0.9;
        attacker.maxHp *= 0.9;
        break;
      case "Explosion":
        damage *= 3;
        attacker.status.stunned = Math.max(1, attacker.status.stunned);
        break;
      case "Telekinesis":
        attacker.counters.telekinesis = (attacker.counters.telekinesis || 0) % 2 + 1;
        damage *= attacker.counters.telekinesis === 1 ? 2 : 4;
        break;
      case "Dragon Slayer":
        if (DRAGON_CARDS.has(target.definition.name)) damage *= 2;
        break;
      case "Frozen Wrath":
        if (!statusProtected(runtime, target.team)) target.counters.frostbite = Math.max(target.counters.frostbite || 0, 2);
        break;
      case "Favorable Odds":
        damage *= Math.max(1, Math.ceil(rand(runtime, attacker.team) * 5));
        break;
      case "Vainglory":
        if (attacker.hp / attacker.maxHp > 0.5) damage *= 1.5;
        break;
      case "Modesty":
        damage *= 0.7;
        break;
      case "Decapitate":
        damage *= 2;
        break;
      case "Martial Will": {
        const ah = attacker.counters.martialHits || 0;
        const th = target.counters.martialHits || 0;
        if (ah > 0 && th > 0) damage *= Math.pow(1.5, ah);
        else if (ah === 0 && th > 0) target.counters.martialHits = 0;
        attacker.counters.martialHits = ah + 1;
        target.counters.martialHits = (target.counters.martialHits || 0) + 1;
        break;
      }
      case "Decimate":
        damage *= 3;
        attacker.damage *= 0.7;
        break;
      case "Prehistoric Wrath":
        if (target.hp / target.maxHp <= 0.5) damage *= 2;
        break;
      case "Big and Large":
        if (attacker.hp / attacker.maxHp > 0.25) damage *= 3;
        break;
      case "Blade":
        damage += attacker.maxHp * 0.15;
        attacker.maxHp *= 0.85;
        attacker.hp = Math.min(attacker.hp, attacker.maxHp);
        break;
      case "Defraud":
        damage = target.hp * 0.5;
        break;
      case "Assassinate":
        if (target.hp / target.maxHp <= 0.25) damage = target.maxHp;
        break;
      case "Sky Drop":
        damage *= 1.5;
        break;
      case "Shadow Predator":
        if (attacker.flags.double) {
          damage *= 2;
          attacker.flags.double = false;
        }
        break;
      case "Apex Predator":
        damage *= 1.5;
        break;
      case "Infinite Dagger Works":
        damage *= 2;
        break;
      case "Extinction":
        damage *= 10;
        attacker.hp = 0;
        break;
      case "God of Thunder":
        attacker.counters.thunder = (attacker.counters.thunder || 0) % 2 + 1;
        if (attacker.counters.thunder === 1) damage *= 2.5;
        bypass = true;
        break;
      case "Fire World":
        attacker.counters.fireWorld = (attacker.counters.fireWorld || 0) % 2 + 1;
        if (attacker.counters.fireWorld === 1) damage *= 4;
        break;
      case "Moonlight Beam":
        if (!attacker.flags.moonlightUsed) {
          attacker.flags.moonlightUsed = true;
          damage *= 5;
        }
        break;
      case "Dirty Claw":
        target.counters.poisonPercent = -0.15;
        target.status.weakness = true;
        target.counters.weaknessTurns = 100;
        break;
      case "Undead Practitioner":
        target.counters.bleed = 100;
        break;
      case "Heart Hunter":
        if ((target.counters.bleed || 0) > 0) damage *= 3;
        break;
      case "Chainsaw":
        damage *= 0.5;
        break;
      case "Firepower":
        damage *= 0.25;
        break;
      case "Rapid Blows":
        damage *= 0.5;
        break;
      case "Speedy Progression":
        damage /= 3;
        break;
      case "Behavioral Therapy":
        target.counters.bleed = (target.counters.bleed || 0) + 1;
        break;
    }
    if (name === "Dominate" && borderTier(attacker) > borderTier(target)) damage *= 2;
    if (name === "Lightning Slash") {
      damage *= 1.5;
      bypass = true;
    }
    if (name === "Limitless" || name === "True Fang") bypass = true;
    return { damage, bypass, special };
  }
  function defensive(runtime, attacker, target, initial) {
    if (activeBonusAbilities(target).length) {
      let damage2 = initial;
      for (const gained of activeBonusAbilities(target)) {
        damage2 = withAbility(target, gained, () => defensive(runtime, attacker, target, damage2));
      }
      return damage2;
    }
    const name = resolvedAbility(runtime, target);
    let damage = initial;
    if (!name || !hasAbility(runtime, target, name)) return damage;
    switch (name) {
      case "ConstellarTaurus":
        damage /= constellarTaurusFactor(target);
        break;
      case "ConstellarCancer": {
        const threshold = target.counters.cancerThreshold || 1;
        if (threshold > 0 && damage < target.maxHp * threshold) {
          damage = 0;
          target.counters.cancerThreshold = Math.max(0, threshold - 0.15);
        }
        break;
      }
      case "Danger Sense":
      case "Deadly Ambush":
        if (!target.flags.dangerSense && damage > target.hp) {
          target.flags.dangerSense = true;
          damage = 0;
          const deck = runtime.state.teams[target.team];
          const index = deck.indexOf(target);
          if (index >= 0 && deck[index + 1]) {
            deck[index] = deck[index + 1];
            deck[index + 1] = target;
          }
        }
        break;
      case "Evasion":
        if (rand(runtime, target.team) > 0.9) damage = 0;
        break;
      case "Finesse":
        if (damage < target.maxHp * 0.3) damage = 0;
        break;
      case "Last Stand":
        if (damage >= target.hp && !target.flags.lastStand) {
          damage = target.hp - 1;
          target.flags.lastStand = true;
        }
        break;
      case "Armor":
        damage = Math.max(0, damage - target.maxHp * 0.1);
        break;
      case "Dragon Slayer":
        if (DRAGON_CARDS.has(attacker.definition.name)) damage *= 0.5;
        break;
      case "Outrank":
        if (rarityWithBorders(attacker.definition, attacker.borders) < rarityWithBorders(target.definition, target.borders)) damage *= 0.5;
        break;
      case "Golden Bell Shield":
        if (DEMON_CARDS.has(attacker.definition.name) || IMP_BOOSTED_CARDS.has(attacker.definition.name)) damage /= 3;
        break;
      case "Frozen Wrath":
        if ((attacker.counters.frostbite || 0) > 0) damage *= 0.5;
        break;
      case "Brittle":
        damage *= 2;
        break;
      case "Mana Shield":
        if (!target.flags.manaShield && damage < target.hp) {
          damage = 0;
          target.flags.manaShield = true;
        }
        break;
      case "Vainglory":
        if (target.hp / target.maxHp > 0.5) damage *= 0.7;
        break;
      case "Modesty":
        damage *= 1.3;
        break;
      case "Scale Armor":
        damage = Math.max(0, damage - target.maxHp * 0.15) / 2;
        break;
      case "Stalwart":
        if (damage > target.maxHp / 3 && target.hp > target.maxHp / 3) damage = target.maxHp / 3;
        break;
      case "Divine Barrier":
        if (!target.flags.divineBarrier) {
          damage = 0;
          target.flags.divineBarrier = true;
        }
        break;
      case "Untouchable":
        if (rand(runtime, target.team) > Math.pow(damage / target.maxHp, 2)) damage = 0;
        break;
      case "Guerilla Warfare":
        if (rand(runtime, target.team) > 0.6) {
          damage = 0;
          target.damage *= 1.2;
        }
        break;
      case "The Loser":
        if (!target.flags.loser && damage > target.hp) {
          damage = 0;
          target.flags.loser = true;
          target.damage *= 2;
        }
        break;
      case "Invisibility":
        if (rand(runtime, target.team) > 0.4) damage = 0;
        break;
      case "Limitless":
        if (!target.flags.limitless) {
          damage = 0;
          target.flags.limitless = true;
        }
        break;
      case "Heavenly Ruler":
        target.counters.heavenly = ((target.counters.heavenly || 0) + 1) % 2;
        if (target.counters.heavenly === 0) damage *= -0.8;
        break;
      case "Absolute Sovereignty":
        damage *= 0.65;
        break;
      case "Draconic Heart":
        damage /= 3;
        break;
      case "Invincibility":
        damage *= 0.25;
        break;
      case "Hidden Curse": {
        const maxes = target.counters.hiddenCurse || 0;
        const afflicted = attacker.status.weakness || attacker.status.burn > 0 || attacker.status.confused > 0 || attacker.status.stunned > 0 || attacker.status.blind || (attacker.counters.bleed || 0) > 0 || Boolean(attacker.counters.poisonFlat || attacker.counters.poisonPercent);
        if (maxes <= 5 && afflicted) {
          damage = 0;
          target.counters.hiddenCurse = maxes + 1;
        }
        break;
      }
      case "Transcend Time":
        target.counters.transcend = ((target.counters.transcend || 0) + 1) % 2;
        if (target.counters.transcend === 1) damage = 0;
        break;
      case "Snowbound":
        if (target.status.stunned > 0 || target.flags.dodge) {
          damage = 0;
          target.flags.dodge = false;
        }
        ;
        break;
      case "Shelter Obsession": {
        const cap = target.flags.awakened ? target.maxHp / 4 : target.maxHp / 2;
        if (damage > cap && target.hp > cap) damage = cap;
        break;
      }
      case "Big and Large":
        if (target.hp / target.maxHp > 0.25) damage *= 0.5;
        break;
      case "Frail":
        damage *= 2;
        break;
      case "Humanity's Spirit":
        if (target.hp / target.maxHp < 0.25) damage *= 0.5;
        break;
      case "Perforating Mist":
        damage *= 1.5;
        break;
      case "Reflective Shell": {
        const abilityDamage = damage - attacker.damage;
        if (abilityDamage > 0) {
          const reflected = Math.min(target.damage * 8, abilityDamage * 0.25);
          damage -= reflected;
          attacker.hp -= reflected;
        }
        break;
      }
      case "Sky Drop":
        if (!target.counters.drop || target.counters.drop % 2 !== 0) damage = 0;
        break;
      case "Spikes":
        damage *= 0.75;
        attacker.counters.bleed = 2;
        break;
      case "Shadow Predator":
        if (rand(runtime, target.team) > 0.6) {
          damage = 0;
          target.flags.double = true;
        }
        break;
      case "Apex Predator":
        damage *= 0.5;
        break;
      case "Absolute Apex":
        damage *= 0.5;
        break;
      case "Immortal Ascension":
        if (target.flags.awakened) damage *= 0.5;
        break;
      case "Final Tail":
        damage = 0;
        break;
      case "Persistent": {
        const persistence = target.counters.persistence || 0;
        if (damage >= target.hp && persistence < 2) {
          damage = target.hp - 1;
          target.counters.persistence = persistence + 1;
        }
        break;
      }
      case "Run As Fast As You Can":
        target.counters.runFast = ((target.counters.runFast || 0) + 1) % 2;
        if (target.counters.runFast === 0) {
          damage = 0;
          target.counters.attacks = (target.counters.attacks || 0) + 1;
        }
        break;
      case "Bind":
        attacker.damage *= 0.9;
        break;
      case "Avalon":
        if (damage < target.damage * 0.75) damage = 0;
        break;
      case "Heard but not Seen": {
        const dodge = Math.min(0.5, 0.2 + (target.counters.heardHits || 0) * 0.1);
        if (rand(runtime, target.team) < dodge) damage = 0;
        else target.counters.heardHits = (target.counters.heardHits || 0) + 1;
        break;
      }
      case "Lights Way":
        if (!target.flags.lightsWay && damage >= target.hp) {
          target.flags.lightsWay = true;
          damage = 0;
          target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5);
        }
        break;
    }
    if (name === "Dominate" && borderTier(target) > borderTier(attacker)) damage /= 2;
    if (initial > 0 && damage === 0 && DODGE_ABILITIES.has(name)) target.flags.evadedThisHit = true;
    return damage;
  }
  function tryRevive(runtime, attacker, target) {
    if (target.hp > 0) return false;
    if (activeBonusAbilities(target).length) {
      for (const gained of activeBonusAbilities(target)) {
        const revived = withAbility(target, gained, () => tryRevive(runtime, attacker, target));
        if (revived) return true;
      }
      return false;
    }
    const name = resolvedAbility(runtime, target);
    if (!name) return false;
    if (name === "Revive" && !target.flags.revived && rand(runtime, target.team) > 0.5) {
      target.flags.revived = true;
      target.hp = target.maxHp * 0.5;
      return true;
    }
    if (name === "Eternity" && !target.flags.revived && rand(runtime, target.team) > 0.5) {
      target.flags.revived = true;
      target.hp = target.maxHp;
      return true;
    }
    if (name === "Frozen Ashes" && !target.flags.revived && rand(runtime, target.team) > 0.5) {
      target.flags.revived = true;
      target.hp = target.maxHp;
      attacker.status.stunned = Math.max(1, attacker.status.stunned);
      return true;
    }
    if (name === "Unpaid 'Interns'" && (target.counters.interns || 0) < 2) {
      target.counters.interns = (target.counters.interns || 0) + 1;
      target.hp = target.maxHp;
      return true;
    }
    if (name === "Flames of Rebirth" && !target.flags.revived) {
      target.flags.revived = true;
      target.hp = target.maxHp * 0.5;
      target.damage *= 2;
      attacker.status.burn = 2;
      return true;
    }
    return false;
  }
  function targetRetro(runtime, attacker, target, damage) {
    if (activeBonusAbilities(target).length) {
      for (const gained of activeBonusAbilities(target)) {
        withAbility(target, gained, () => targetRetro(runtime, attacker, target, damage));
      }
      return;
    }
    const name = resolvedAbility(runtime, target);
    if (!name || !hasAbility(runtime, target, name)) return;
    switch (name) {
      case "Restoration":
        if (target.hp > 0) target.hp += damage * 0.7;
        break;
      case "Rage":
        if (target.hp > 0) target.damage *= 1.25;
        break;
      case "Undead":
        if (target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.25);
        break;
      case "Passion":
        attacker.counters.passion = (attacker.counters.passion || 0) + 1;
        if (attacker.counters.passion <= 3) attacker.damage *= 0.65;
        break;
      case "Eight Heads":
        target.damage *= 0.875;
        target.hp *= 0.875;
        break;
      case "Wail":
        if (target.hp < target.maxHp / 2 && !target.flags.wail) {
          target.flags.wail = true;
          attacker.status.stunned = Math.max(1, attacker.status.stunned);
        }
        break;
      case "Fury of the White Tiger":
        target.damage = Math.max(0, target.damage - damage);
        break;
      case "The Fall": {
        const reflected = attacker.definition.name === "Marrowclaw" ? Math.min(Math.max(0, attacker.hp - 1), damage) : Math.min(attacker.hp, damage);
        attacker.hp -= reflected;
        break;
      }
      case "Self-Destruct":
      case "Death Embrace":
        if (target.hp <= 0 && rand(runtime, target.team) > 0.5) {
          const reflected = attacker.definition.name === "Marrowclaw" ? Math.min(Math.max(0, attacker.hp - 1), target.maxHp) : Math.min(attacker.hp, target.maxHp);
          attacker.hp -= reflected;
        }
        break;
      case "Undead Practitioner":
        if (target.hp > 0 && !target.flags.undeadPractitioner && target.hp <= target.maxHp / 2) {
          target.hp += target.maxHp * 0.5;
          target.flags.undeadPractitioner = true;
        }
        break;
      case "Guilt":
        if (target.hp <= 0) attacker.flags.hanged = true;
        break;
      case "Into The Sun":
        if (target.hp / target.maxHp < 0.33) {
          target.hp = 0;
          attacker.hp = 0;
        }
        ;
        break;
      case "Frigid Touch":
        if (damage > 0 && rand(runtime, attacker.team) >= 0.5) target.status.stunned = Math.max(1, target.status.stunned);
        break;
      case "Blinding Flash":
        if (rand(runtime, attacker.team) > 0.7) attacker.flags.extraTurn = true;
        break;
      case "Grape Juice": {
        const reflected = attacker.definition.name === "Marrowclaw" ? Math.min(Math.max(0, attacker.hp - 1), target.damage / 2) : Math.min(attacker.hp, target.damage / 2);
        attacker.hp -= reflected;
        break;
      }
      case "Perfect Sacrifice":
        if (target.hp <= 0) {
          const reflected = attacker.definition.name === "Marrowclaw" ? Math.min(Math.max(0, attacker.hp - 1), target.maxHp) : Math.min(attacker.hp, target.maxHp);
          attacker.hp -= reflected;
          for (const ally of runtime.state.teams[target.team]) boostStats(ally, 1.2);
        }
        break;
      case "Plague":
        if (damage > 0 && attacker !== target && !statusProtected(runtime, attacker.team)) {
          attacker.counters.poisonFlat = Math.max(attacker.counters.poisonFlat || 0, target.damage);
          attacker.counters.poisonTurns = Math.max(attacker.counters.poisonTurns || 0, 2);
        }
        break;
      case "Steal Christmas":
        if (damage > 0 && attacker !== target && !target.flags.stealChristmasUsed) {
          target.flags.stealChristmasUsed = true;
          const stolenHp = Math.max(0, attacker.hp * 0.2);
          const stolenDamage = Math.max(0, attacker.damage * 0.2);
          target.damage += stolenDamage;
          target.hp += stolenHp;
          attacker.hp = Math.max(0, attacker.hp - stolenHp);
          attacker.damage = Math.max(0, attacker.damage - stolenDamage);
        }
        break;
      case "Shelter Obsession":
        if (damage > 0 && target.flags.awakened) {
          const seen = /* @__PURE__ */ new Set();
          const toyDeck = [...runtime.state.teams[target.team], ...runtime.state.fallen[target.team]];
          for (const toy of toyDeck) {
            if (!TOY_CARD_NAMES.has(toy.definition.name) || seen.has(toy.definition.name)) continue;
            seen.add(toy.definition.name);
            boostStats(toy, 1.1);
          }
        }
        break;
      case "Poke the Beast":
        if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2);
        break;
      case "Last Meal":
        if (damage > 0) {
          const fossils = runtime.state.boosts[target.team].fossils || 0;
          attacker.counters.death = Math.max(2, 5 - fossils);
        }
        break;
      case "Boiling Blood":
        if (!statusProtected(runtime, attacker.team)) attacker.status.burn = 3;
        break;
      case "Melt":
        if (!statusProtected(runtime, attacker.team)) attacker.status.burn += 5;
        break;
    }
  }
  function lifestealFraction(runtime, attacker, base) {
    const vamp = runtime.state.boosts[attacker.team].vampireMatron;
    return vamp ? base * (100 + vamp * 5) / 100 : base;
  }
  function attackerRetro(runtime, attacker, target, damage) {
    if (activeBonusAbilities(attacker).length) {
      let didRegen2 = false;
      for (const gained of activeBonusAbilities(attacker)) {
        didRegen2 = withAbility(attacker, gained, () => attackerRetro(runtime, attacker, target, damage)) || didRegen2;
      }
      return didRegen2;
    }
    const name = resolvedAbility(runtime, attacker);
    let didRegen = false;
    if (!name || !hasAbility(runtime, attacker, name)) return didRegen;
    switch (name) {
      case "ConstellarScorpio":
        if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage);
        break;
      case "Plague":
        if (damage > 0 && !statusProtected(runtime, target.team)) {
          target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage);
          target.counters.poisonTurns = Math.max(target.counters.poisonTurns || 0, 2);
        }
        break;
      case "Undying":
        if (target.hp <= 0 && attacker.flags.undyingActive) attacker.counters.undyingTurns = (attacker.counters.undyingTurns || 0) + 1;
        break;
      case "Witch's Curse":
        if (damage > 0 && !attacker.flags.witchCurseStolen) {
          const stolen = ability(target);
          if (stolen && stolen !== "Witch's Curse") {
            attacker.flags.witchCurseStolen = true;
            attacker.abilityOverride = stolen;
          }
        }
        break;
      case "Flesh Eater":
        if (damage > 0) {
          const gain = damage * 0.25;
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + gain);
          attacker.damage += gain;
        }
        break;
      case "Gobble":
        if (target.hp <= 0 && target !== attacker) {
          attacker.damage += target.damage * 0.5;
          attacker.maxHp += target.maxHp * 0.5;
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + target.maxHp * 0.5 + attacker.maxHp * 0.3);
        }
        break;
      case "Playing God":
        if (target.hp <= 0 && target !== attacker) {
          const frankenstein = definition("Frankenstein");
          if (frankenstein) {
            const created = {
              ...attacker,
              id: `${attacker.team}:frankenstein:${runtime.state.turn}:${runtime.state.teams[attacker.team].length}`,
              definition: frankenstein,
              index: runtime.state.teams[attacker.team].length + 1,
              hp: attacker.maxHp,
              maxHp: attacker.maxHp,
              damage: attacker.damage,
              entered: false,
              dead: false,
              identityOverride: void 0,
              abilityOverride: void 0,
              bonusAbilities: void 0,
              status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
              flags: {},
              counters: { normalDamage: attacker.damage, normalMaxHp: attacker.maxHp }
            };
            runtime.state.teams[attacker.team].push(created);
          }
        }
        break;
      case "Forbidden Banquet":
        if (target.hp <= 0 && !attacker.flags.banquetStolen) {
          const stolen = ability(target);
          if (stolen && stolen !== "Forbidden Banquet") {
            attacker.flags.banquetStolen = true;
            attacker.abilityOverride = stolen;
          }
        }
        break;
      case "Regenerate":
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2);
        didRegen = true;
        break;
      case "Plunder":
        if (target.hp <= 0 && target !== attacker) {
          attacker.damage += target.damage * 0.3;
          attacker.maxHp += target.maxHp * 0.3;
          attacker.hp += target.maxHp * 0.3;
        }
        break;
      case "Voracity":
        if (target.hp <= 0) {
          attacker.damage *= 1.2;
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2);
        }
        ;
        break;
      case "Blood Drinker":
      case "Lifesteal": {
        const heal = damage * lifestealFraction(runtime, attacker, 0.5);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        didRegen = true;
        break;
      }
      case "Drain Vitality": {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * lifestealFraction(runtime, attacker, 1));
        didRegen = true;
        const stolen = Math.min(target.damage, damage);
        attacker.damage += stolen;
        target.damage -= stolen;
        break;
      }
      case "Unholy Creature":
        if (!statusProtected(runtime, target.team)) target.counters.poisonPercent = -0.15;
        break;
      case "Insatiable": {
        const unholySurvives = hasAbility(runtime, target, "Unholy Creature") && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0);
        const undyingSurvives = hasAbility(runtime, target, "Undying") && (!target.flags.undyingActive || (target.counters.undyingTurns || 0) > 0);
        const paradoxSurvives = hasAbility(runtime, target, "Paradox") && !target.flags.paradox;
        if (target.hp <= 0 && target !== attacker && !unholySurvives && !undyingSurvives && !paradoxSurvives) {
          attacker.damage += target.damage * 0.3;
          attacker.maxHp += target.maxHp * 0.3;
          attacker.hp += target.maxHp * 0.3;
          attacker.flags.insatiableAttack = true;
        }
        break;
      }
      case "Devilish":
        if (target.hp <= 0 && target !== attacker) {
          const converted = {
            ...target,
            id: `${attacker.team}:devilish:${runtime.state.turn}:${target.definition.name}`,
            team: attacker.team,
            index: runtime.state.teams[attacker.team].length + 1,
            hp: target.maxHp,
            entered: false,
            dead: false,
            status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
            flags: {},
            counters: { normalDamage: target.damage }
          };
          runtime.state.teams[attacker.team].push(converted);
        }
        break;
      case "Eclipse":
        if (damage > 0) target.flags.sealed = true;
        break;
      case "Dark Qi Manipulation":
        if (attacker.flags.awakened) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * 0.3);
          didRegen = true;
          if (target.hp <= 0) boostStats(attacker, 1.5);
        }
        break;
      case "Immortal Ascension":
        if (attacker.flags.awakened && target.hp <= 0) boostStats(attacker, 1.5);
        break;
      case "Doom":
        if (!hasAbility(runtime, target, "Erosion") && target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) {
          target.hp = 0;
          target.flags.sealed = true;
        }
        ;
        break;
      case "Decapitate": {
        const unholySurvives = hasAbility(runtime, target, "Unholy Creature") && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0);
        if (target.hp <= 0 && !unholySurvives) attacker.flags.extraTurn = true;
        break;
      }
      case "Fury of the White Tiger":
        if (target.hp <= 0) {
          attacker.damage *= 1.35;
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35);
        }
        ;
        break;
      case "Feeder":
        if (target.hp <= 0) attacker.hp = attacker.maxHp;
        break;
      case "Defraud":
        attacker.hp -= attacker.maxHp / 4;
        break;
      case "Fight Dirty":
        target.damage = Math.floor(target.damage * 0.7);
        break;
      case "Unforgiving":
        target.maxHp = Math.max(1, target.maxHp - damage);
        target.hp = Math.min(target.hp, target.maxHp);
        break;
      case "Eat The Moon":
        if (!hasAbility(runtime, target, "Erosion") && target.hp / target.maxHp < 0.33) target.hp = 0;
        break;
      case "Death Embrace":
        if (!hasAbility(runtime, target, "Erosion") && target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) target.hp = 0;
        break;
      case "Prehistoric Wrath":
        if (target.hp <= 0) attacker.damage *= 2;
        break;
    }
    return didRegen;
  }
  function resolveAuraFarm(runtime, target, incoming) {
    if (incoming < target.hp) return { target, damage: incoming };
    const deck = runtime.state.teams[target.team];
    const piccolo = deck[1];
    if (!piccolo || piccolo.definition.name !== "Piccolo" || piccolo.flags.farmed) return { target, damage: incoming };
    piccolo.flags.farmed = true;
    deck[0] = piccolo;
    deck[1] = target;
    boostStats(piccolo, 2);
    if (target.definition.name === "Kid Gohan") boostStats(piccolo, 1.5);
    return { target: piccolo, damage: 0 };
  }
  function dealDamage(runtime, attacker, originalTarget, mult = 1, bypass = false) {
    let target = originalTarget;
    const confused = attacker.status.confused > 0 || attacker.flags.eternalConfusion;
    const confusionSelfHit = confused && runtime.rng.next() < 0.5;
    if (confusionSelfHit) target = attacker;
    if (attacker.status.confused > 0 && !attacker.flags.eternalConfusion) attacker.status.confused -= 1;
    if (confusionSelfHit) {
      const observer = active(runtime, OTHER_TEAM[attacker.team]);
      if (observer && hasAbility(runtime, observer, "Beyond Comprehension")) boostStats(observer, 1.5);
    }
    const frostbiteActiveOnAttack = (target.counters.frostbite || 0) > 0 && !statusProtected(runtime, target.team);
    let damage = attacker.damage * mult;
    if (hasAbility(runtime, attacker, "Jaws")) damage += target.damage;
    if (attacker.status.burn > 0) damage *= 0.85;
    const off = offensive(runtime, attacker, target, damage);
    damage = off.damage;
    bypass = bypass || off.bypass;
    if (attacker.status.blind && rand(runtime, attacker.team) > 0.4) damage = 0;
    if (!off.special && hasAbility(runtime, target, "All Father") && damage > 0) {
      damage = 0;
      target.hp -= target.maxHp / 5;
    }
    if (statusProtected(runtime, target.team)) clearStatuses(target);
    if (target.status.weakness) damage *= 1.3;
    target.flags.evadedThisHit = false;
    const beforeDefense = damage;
    if (!bypass && target.flags.eternalDevotion) {
      target.flags.eternalDevotion = false;
      damage = 0;
    } else if (!bypass && target.flags.dodgeLethal) {
      target.flags.dodgeLethal = false;
      damage = 0;
    } else if (!bypass) {
      const veilHolder = luminescentVeilHolder(runtime, target.team);
      const successfulEvades = target.counters.luminescentEvades || 0;
      if (veilHolder && successfulEvades < 2) {
        const chance = Math.max(0.2, 0.4 - successfulEvades * 0.1);
        if (rand(runtime, target.team) < chance) {
          target.counters.luminescentEvades = successfulEvades + 1;
          target.flags.evadedThisHit = true;
          const baseDamage = veilHolder.counters.normalDamage || veilHolder.damage;
          const currentGain = veilHolder.counters.luminescentVeilGain || 0;
          const room = Math.max(0, baseDamage * 2 - currentGain);
          const gain = Math.min(room, Math.max(0, beforeDefense) * 0.1);
          if (gain > 0) {
            veilHolder.damage += gain;
            veilHolder.counters.luminescentVeilGain = currentGain + gain;
          }
          damage = 0;
        } else damage = defensive(runtime, attacker, target, damage);
      } else damage = defensive(runtime, attacker, target, damage);
    }
    if (!bypass && target.flags.evadedThisHit && hasAbility(runtime, attacker, "ConstellarSagittarius")) damage = beforeDefense * 2;
    const shielder = runtime.state.boosts[target.team].shielder;
    if (shielder) damage *= (100 - shielder) / 100;
    let threshold = runtime.state.boosts[target.team].synthHuman;
    if (threshold && target.definition.weather === "Time Storm") threshold *= 1.5;
    if (threshold && damage < target.maxHp * threshold / 100) damage = 0;
    if (target.status.shield > 0 && damage > 0) {
      target.status.shield -= 1;
      damage = 0;
    }
    if (damage < 0) damage = Math.max(-(target.maxHp - target.hp), damage);
    damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp;
    if ((target.counters.hpShield || 0) > 0 && damage > 0) {
      const absorbed = Math.min(target.counters.hpShield, damage);
      target.counters.hpShield -= absorbed;
      damage -= absorbed;
    }
    const xuanwu = damage > 0 ? waterShield(runtime, target.team, target) : void 0;
    if (xuanwu) {
      const redirected = Math.ceil(damage * 0.5);
      damage -= redirected;
      xuanwu.hp -= Math.min(xuanwu.hp, redirected);
    }
    const farm = resolveAuraFarm(runtime, target, damage);
    target = farm.target;
    damage = farm.damage;
    const targetDeck = runtime.state.teams[target.team];
    const longReachTarget = hasAbility(runtime, attacker, "Long Reach") && targetDeck[0] === target ? targetDeck[1] : void 0;
    const hpTarget = longReachTarget || target;
    const appliedHpDamage = Math.min(hpTarget.hp, damage);
    hpTarget.hp -= appliedHpDamage;
    if (appliedHpDamage > 0 && (hpTarget.counters.bindFatePair || 0) > 0) {
      const pair = hpTarget.counters.bindFatePair;
      const partner = runtime.state.teams[hpTarget.team].find(
        (candidate) => candidate !== hpTarget && alive(candidate) && candidate.counters.bindFatePair === pair
      );
      if (partner) partner.hp -= Math.min(partner.hp, appliedHpDamage);
    }
    if (longReachTarget && longReachTarget.hp <= 0) {
      const index = targetDeck.indexOf(longReachTarget);
      if (index > 0) {
        targetDeck.splice(index, 1);
        longReachTarget.dead = true;
        runtime.state.fallen[longReachTarget.team].push(longReachTarget);
      }
    }
    if (frostbiteActiveOnAttack && target.hp > 0 && runtime.rng.next() < 0.5) {
      target.hp -= Math.min(target.hp, target.maxHp * 0.2);
    }
    if (hasAbility(runtime, active(runtime, OTHER_TEAM[attacker.team]), "Am I Beautiful?")) {
      if (target.team === attacker.team) target.damage *= 0.8;
      else target.status.confused += 1;
    }
    if ((hasAbility(runtime, target, "Meow") || hasAbility(runtime, target, "Never Forgotten")) && damage > 0) {
      target.counters.damageTaken = Math.min(target.maxHp, (target.counters.damageTaken || 0) + damage);
    }
    if (hasAbility(runtime, attacker, "Disarm") && damage > 0) target.damage = Math.max(0, target.damage - damage * 0.4);
    if (hasAbility(runtime, attacker, "Shiny Steal") && damage > 0 && target !== attacker) {
      const stolenDamage = target.damage * 0.1;
      const stolenHp = target.maxHp * 0.1;
      target.damage = Math.max(0, target.damage - stolenDamage);
      target.maxHp = Math.max(1, target.maxHp - stolenHp);
      target.hp = Math.min(target.hp, target.maxHp);
      attacker.damage += stolenDamage;
      attacker.maxHp += stolenHp;
      attacker.hp += stolenHp;
    }
    const flame = runtime.state.boosts[attacker.team].flameWizard;
    if (!statusProtected(runtime, target.team) && flame && damage > 0 && runtime.rng.next() * 100 < flame) target.status.burn = 2;
    const phantom = runtime.state.boosts[attacker.team].phantom;
    if (!statusProtected(runtime, target.team) && phantom && damage > 0 && runtime.rng.next() * 100 < phantom) target.status.stunned = Math.max(1, target.status.stunned);
    if (hasAbility(runtime, target, "Chimeric") && target.hp > 0 && target.hp <= target.maxHp / 2 && !target.flags.chimericFaded) {
      target.flags.chimericFaded = true;
      target.maxHp /= 4;
      target.hp /= 4;
      target.damage /= 4;
    }
    targetRetro(runtime, attacker, target, damage);
    const didRegen = attackerRetro(runtime, attacker, target, damage);
    if (hasAbility(runtime, target, "Reveal") && !target.flags.revealed && target.hp > 0 && target.hp / target.maxHp < 0.65) {
      target.flags.revealed = true;
      target.hp = target.maxHp;
    }
    const vamp = runtime.state.boosts[attacker.team].vampireMatron;
    if (damage > 0 && vamp && !didRegen && alive(attacker)) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * vamp / 100);
    }
    if (target.hp <= 0) tryRevive(runtime, attacker, target);
    if (hasAbility(runtime, attacker, "Infinite Dagger Works") && rand(runtime, attacker.team) > 0.5) attacker.flags.extraTurn = true;
    return damage;
  }
  function applyOnDeath(runtime, dead, opponent, skipOpponentPassives = false) {
    const team = dead.team;
    const deck = runtime.state.teams[team];
    const next = deck[0];
    const name = resolvedAbility(runtime, dead);
    if (!skipOpponentPassives) {
      if (opponent && alive(opponent) && hasAbility(runtime, opponent, "Prehistoric Wrath")) opponent.damage *= 2;
      if (opponent && alive(opponent) && hasAbility(runtime, opponent, "All Father")) for (const card of runtime.state.teams[opponent.team]) boostStats(card, 1.25);
    }
    if (dead.flags.suppressOnDeath) return;
    if (activeBonusAbilities(dead).length) {
      for (const gained of activeBonusAbilities(dead)) {
        withAbility(dead, gained, () => applyOnDeath(runtime, dead, opponent, true));
      }
      return;
    }
    if (name === "Nightmare Melody" && runtime.state.boosts[team].composerCount) {
      runtime.state.boosts[team].composerCount = Math.max(0, (runtime.state.boosts[team].composerCount || 0) - 1);
    }
    if (name === "Hard Boiled") runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3;
    if (name === "Extinction") runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2;
    if (name === "Imminent Doom" && opponent && alive(opponent) && !statusProtected(runtime, opponent.team)) {
      opponent.counters.frostbite = Math.max(opponent.counters.frostbite || 0, 2);
    }
    if (name === "Gehenna") {
      const reviveCount = runtime.state.fallen[OTHER_TEAM[team]].length;
      const candidates = runtime.state.fallen[team].filter((fallen) => fallen !== dead).slice().reverse().slice(0, reviveCount);
      const sourceDamage = (dead.counters.normalDamage || dead.damage) * 0.75;
      const sourceHp = (dead.counters.normalMaxHp || dead.maxHp) * 0.75;
      for (const ally of candidates) {
        const fallenIndex = runtime.state.fallen[team].indexOf(ally);
        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1);
        ally.dead = false;
        ally.damage = sourceDamage;
        ally.maxHp = sourceHp;
        ally.hp = sourceHp;
        ally.entered = false;
        ally.counters.normalDamage = sourceDamage;
        ally.counters.normalMaxHp = sourceHp;
        runtime.state.teams[team].push(ally);
      }
    }
    if (!next || !name) return;
    if (name === "Blessing") {
      next.damage += dead.damage / 2;
      next.maxHp += dead.maxHp / 2;
      next.hp += dead.maxHp / 2;
    }
    if (name === "Meow") next.damage += (dead.counters.damageTaken || 0) * 1.5;
    if (name === "Never Forgotten") {
      const gain = (dead.counters.damageTaken || 0) * 1.25;
      for (const ally of runtime.state.teams[team]) if (alive(ally)) ally.damage += gain;
    }
    if (name === "We Want YOU") {
      next.damage *= 5;
      next.flags.diesAfterAttack = true;
    }
    if (name === "Better Days") {
      const revive = runtime.state.fallen[team].filter((fallen) => fallen !== dead);
      for (const ally of revive) {
        const index = runtime.state.fallen[team].indexOf(ally);
        if (index >= 0) runtime.state.fallen[team].splice(index, 1);
        ally.dead = false;
        ally.hp = ally.maxHp;
        ally.entered = false;
        runtime.state.teams[team].push(ally);
      }
    }
    if (name === "Heart Legacy") {
      next.maxHp += dead.maxHp;
      next.hp += dead.maxHp;
    }
    if (name === "Tonic") boostStats(next, 1.2);
    if (name === "Fusion... HA!" && rand(runtime, team) > 0.5) {
      next.damage += dead.damage * 0.5;
      next.maxHp += dead.maxHp * 0.5;
      next.hp += dead.maxHp * 0.5;
    }
    if (name === "Destiny Sight") next.flags.dodgeLethal = true;
    if (name === "Housewife's Blessing") {
      boostStats(next, 2);
      next.status.stunned = 2;
    }
    if (name === "Eternal Devotion") next.flags.eternalDevotion = true;
    if (name === "Final Stand") {
      next.damage += dead.damage * 0.25;
      next.maxHp += dead.maxHp * 0.25;
      next.hp += dead.maxHp * 0.25;
      next.status.shield += 1;
    }
  }
  function resolveDeaths(runtime) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const team of ["Allies", "Enemies"]) {
        const deck = runtime.state.teams[team];
        const card = deck[0];
        if (!card || card.hp > 0) continue;
        if (hasAbility(runtime, card, "Undying")) {
          if (!card.flags.undyingActive) {
            card.flags.undyingActive = true;
            card.counters.undyingTurns = 1;
            card.hp = 1;
            changed = true;
            continue;
          }
          if ((card.counters.undyingTurns || 0) > 0) {
            card.hp = 1;
            changed = true;
            continue;
          }
        }
        if (hasAbility(runtime, card, "Unholy Creature")) {
          if (!card.flags.unholyActive) {
            card.flags.unholyActive = true;
            card.counters.unholyTurns = 2;
            card.counters.unholyActivatedTurn = runtime.state.turn;
            card.counters.unholyLastTick = runtime.state.turn;
            card.hp = 1;
            changed = true;
            continue;
          }
          if ((card.counters.unholyTurns || 0) > 0) {
            card.hp = 1;
            changed = true;
            continue;
          }
        }
        if (hasAbility(runtime, card, "Paradox") && !card.flags.paradox) {
          card.flags.paradox = true;
          card.hp = 1;
          const opp = active(runtime, OTHER_TEAM[team]);
          if (opp) opp.hp = 0;
          changed = true;
          continue;
        }
        const canBeyondTheGrave = hasAbility(runtime, card, "Beyond The Grave") && !card.flags.beyondGraveRevived;
        deck.shift();
        runtime.deathEpoch += 1;
        card.hp = 0;
        card.dead = true;
        runtime.state.fallen[team].push(card);
        if (runtime.captureDebug) pushDebugEvent(runtime, {
          turn: runtime.state.turn,
          type: "death",
          team,
          card: effectiveCardName(card) || card.definition.name,
          detail: "Card defeated",
          hp: 0,
          maxHp: card.maxHp,
          damage: card.damage
        });
        if (!card.flags.mirrorImageReturned) {
          for (let index = runtime.state.fallen[team].length - 1; index >= 0; index--) {
            const mirror = runtime.state.fallen[team][index];
            if (mirror === card || mirror.flags.sealed || !abilityNames(mirror).includes("Mirror Image")) continue;
            if (rand(runtime, team) <= 0.5) continue;
            mirror.flags.mirrorImageReturned = true;
            mirror.dead = false;
            mirror.hp = mirror.maxHp;
            mirror.entered = false;
            runtime.state.fallen[team].splice(index, 1);
            deck.unshift(mirror);
          }
        }
        const opponent = active(runtime, OTHER_TEAM[team]);
        applyOnDeath(runtime, card, opponent);
        if (canBeyondTheGrave) {
          const baseMaxHp = card.power * (card.definition.hpMultiplier || 1);
          const baseDamage = card.power / 2;
          const fallenIndex = runtime.state.fallen[team].indexOf(card);
          if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1);
          const revived = {
            ...card,
            id: `${card.id}:btg`,
            hp: baseMaxHp / 2,
            maxHp: baseMaxHp,
            damage: baseDamage,
            entered: false,
            dead: false,
            identityOverride: void 0,
            abilityOverride: void 0,
            bonusAbilities: void 0,
            status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
            flags: { beyondGraveRevived: true },
            counters: { normalDamage: baseDamage, normalMaxHp: baseMaxHp }
          };
          runtime.state.teams[team].push(revived);
          if (runtime.captureDebug) pushDebugEvent(runtime, {
            turn: runtime.state.turn,
            type: "revive",
            team,
            card: revived.definition.name,
            detail: "Beyond The Grave: one self-revive at half BASE HP; battle/aura stat changes reset",
            hp: revived.hp,
            maxHp: revived.maxHp,
            damage: revived.damage
          });
        }
        changed = true;
      }
    }
  }
  function statusStart(runtime, attacker, target) {
    if (statusProtected(runtime, attacker.team)) clearStatuses(attacker);
    if (hasAbility(runtime, target, "Lightning Strike") && alive(target) && alive(attacker)) {
      dealDamage(runtime, target, attacker, 0.75);
    }
    const poisonPercent = attacker.counters.poisonPercent || 0;
    const poisonFlat = attacker.counters.poisonFlat || 0;
    if (poisonPercent) attacker.hp = Math.max(0, attacker.hp + poisonPercent * attacker.maxHp);
    else if (poisonFlat) attacker.hp = Math.max(0, attacker.hp - poisonFlat);
    if (attacker.flags.hanged) attacker.hp -= attacker.maxHp * 0.25;
    if (hasAbility(runtime, target, "Decay")) attacker.damage *= 0.75;
    if (hasAbility(runtime, target, "Starvation")) boostStats(attacker, 0.75);
    if (hasAbility(runtime, target, "Purifying Fire")) attacker.hp *= 0.7;
    if (hasAbility(runtime, attacker, "Sacrificial Tides")) target.hp -= target.maxHp * 0.2;
  }
  function tickGlobalUnholyCreature(runtime) {
    for (const team of ["Allies", "Enemies"]) {
      for (const card of runtime.state.teams[team]) {
        if (!card.flags.unholyActive) continue;
        const activated = card.counters.unholyActivatedTurn || 0;
        const lastTick = card.counters.unholyLastTick || activated;
        if (runtime.state.turn <= activated || lastTick >= runtime.state.turn) continue;
        card.counters.unholyLastTick = runtime.state.turn;
        card.counters.unholyTurns = Math.max(0, (card.counters.unholyTurns || 0) - 1);
        if ((card.counters.unholyTurns || 0) <= 0) card.hp = 0;
      }
    }
  }
  function tickOuroborosDecay(attacker) {
    if (!attacker.flags.ouroborosActive) return;
    attacker.counters.ouroborosTurns = Math.max(0, (attacker.counters.ouroborosTurns || 0) - 1);
    if ((attacker.counters.ouroborosTurns || 0) > 0) return;
    const damageBonus = attacker.counters.ouroborosBonusDamage || 0;
    const maxHpBonus = attacker.counters.ouroborosBonusMaxHp || 0;
    const hpBonus = attacker.counters.ouroborosBonusHp || 0;
    attacker.damage = Math.max(0, attacker.damage - damageBonus);
    attacker.maxHp = Math.max(1, attacker.maxHp - maxHpBonus);
    attacker.hp = Math.max(0, Math.min(attacker.maxHp, attacker.hp - hpBonus));
    attacker.counters.ouroborosBonusDamage = 0;
    attacker.counters.ouroborosBonusMaxHp = 0;
    attacker.counters.ouroborosBonusHp = 0;
    attacker.flags.ouroborosActive = false;
  }
  function statusEnd(runtime, attacker) {
    tickOuroborosDecay(attacker);
    if (statusProtected(runtime, attacker.team)) {
      clearStatuses(attacker);
      if (hasAbility(runtime, attacker, "Final Tail")) {
        attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1;
        if (attacker.counters.finalTail >= 3) attacker.hp = 0;
      }
      if (attacker.flags.undyingActive) {
        attacker.counters.undyingTurns = Math.max(0, (attacker.counters.undyingTurns || 0) - 1);
        if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0;
      }
      return;
    }
    if (attacker.status.burn > 0) {
      attacker.hp -= attacker.maxHp * 0.1;
      attacker.status.burn -= 1;
    }
    if ((attacker.counters.bleed || 0) > 0) {
      attacker.hp -= attacker.maxHp * 0.15;
      attacker.counters.bleed -= 1;
    }
    if ((attacker.counters.poisonTurns || 0) > 0) {
      attacker.counters.poisonTurns -= 1;
      if (attacker.counters.poisonTurns <= 0) {
        attacker.counters.poisonPercent = 0;
        attacker.counters.poisonFlat = 0;
      }
    }
    if ((attacker.counters.frostbite || 0) > 0) attacker.counters.frostbite -= 1;
    if ((attacker.counters.death || 0) > 0 && !hasAbility(runtime, attacker, "Erosion")) {
      attacker.counters.death -= 1;
      if (attacker.counters.death <= 0) attacker.hp = 0;
    }
    if (hasAbility(runtime, attacker, "Final Tail")) {
      attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1;
      if (attacker.counters.finalTail >= 3) attacker.hp = 0;
    }
    if (attacker.flags.undyingActive) {
      attacker.counters.undyingTurns = Math.max(0, (attacker.counters.undyingTurns || 0) - 1);
      if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0;
    }
    if (attacker.status.weakness && (attacker.counters.weaknessTurns || 0) > 0) {
      attacker.counters.weaknessTurns -= 1;
      if (attacker.counters.weaknessTurns <= 0) attacker.status.weakness = false;
    }
  }
  function prepareTurn(runtime, attacker) {
    const composer = runtime.state.boosts[attacker.team];
    if ((composer.composerCount || 0) > 0) {
      composer.composerThreshold = Math.max(0.6, (composer.composerThreshold ?? 1) - 0.1);
      const target = active(runtime, OTHER_TEAM[attacker.team]);
      if (target && rand(runtime, attacker.team) > composer.composerThreshold) target.status.confused = 2;
    }
    if (hasAbility(runtime, attacker, "Perish") && (attacker.counters.perishTurns || 0) > 0) {
      attacker.counters.perishTurns -= 1;
      if (attacker.counters.perishTurns <= 0) {
        const target = active(runtime, OTHER_TEAM[attacker.team]);
        attacker.hp = 0;
        if (target) target.hp = 0;
        return;
      }
    }
    if (attacker.flags.naughtyListDrain) boostStats(attacker, 0.9);
    if (hasAbility(runtime, attacker, "Toil")) boostStats(attacker, 0.85);
    if (hasAbility(runtime, attacker, "Bloodlust")) {
      if (attacker.flags.bloodlustFirstTurn) attacker.flags.bloodlustFirstTurn = false;
      else attacker.damage += attacker.counters.bloodlustBase || 0;
    }
    if (hasAbility(runtime, attacker, "ConstellarAquarius")) {
      if (attacker.hp < attacker.maxHp / 2) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.3);
      else attacker.maxHp *= 1.25;
    }
    if (hasAbility(runtime, attacker, "Full Moon")) {
      attacker.counters.fullMoon = (attacker.counters.fullMoon || 0) + 1;
      if (attacker.counters.fullMoon % 2 === 0) {
        const target = active(runtime, OTHER_TEAM[attacker.team]);
        if (target && alive(target)) dealDamage(runtime, target, target);
      }
    }
    if (hasAbility(runtime, attacker, "Dark Qi Manipulation") && !attacker.flags.awakened) {
      attacker.counters.ascension = (attacker.counters.ascension || 0) + 1;
      if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3);
      else attacker.flags.awakened = true;
    }
    if (hasAbility(runtime, attacker, "Immortal Ascension") && !attacker.flags.awakened) {
      attacker.counters.ascension = (attacker.counters.ascension || 0) + 1;
      if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3);
      else attacker.flags.awakened = true;
    }
    if (hasAbility(runtime, attacker, "Upheaval")) {
      attacker.counters.upheaval = (attacker.counters.upheaval || 0) + 1;
      if (attacker.counters.upheaval % 3 == 0) {
        attacker.damage *= 2;
        const target = active(runtime, OTHER_TEAM[attacker.team]);
        if (target && !statusProtected(runtime, target.team)) target.status.stunned = Math.max(1, target.status.stunned);
      }
    }
    if (hasAbility(runtime, attacker, "First Tail") && (attacker.counters.tail || 0) < 9) {
      attacker.counters.tail = (attacker.counters.tail || 0) + 1;
      boostStats(attacker, 1.2);
    }
    if (hasAbility(runtime, attacker, "Shapeshifter") || attacker.flags.shapeshifterActive) {
      attacker.flags.shapeshifterActive = true;
      const shape = randomBattleCard(runtime);
      attacker.identityOverride = shape.name;
      attacker.abilityOverride = void 0;
      attacker.entered = false;
    }
    if (hasAbility(runtime, attacker, "Grind")) {
      attacker.counters.grind = (attacker.counters.grind || 0) + 1;
      if (attacker.counters.grind <= 5) boostStats(attacker, 1.1);
    }
    if (hasAbility(runtime, attacker, "Patience")) boostStats(attacker, 1.3);
    if (hasAbility(runtime, attacker, "Safeguarding")) {
      for (const dragon of runtime.state.teams[attacker.team].slice(1)) {
        if (!DRAGON_CARDS.has(dragon.definition.name)) continue;
        dragon.damage *= 1.2;
        dragon.maxHp *= 1.2;
        dragon.hp = dragon.maxHp;
      }
    }
    if (hasAbility(runtime, attacker, "Absolute Sovereignty")) for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1);
    if (hasAbility(runtime, attacker, "World Creation")) {
      attacker.counters.worldCreation = (attacker.counters.worldCreation || 0) + 1;
      if (attacker.counters.worldCreation % 3 === 0) boostStats(attacker, 2);
    }
    if (hasAbility(runtime, attacker, "Persistent")) {
      const normal = attacker.counters.normalDamage || attacker.damage;
      if (attacker.damage < normal) attacker.damage = normal;
    }
    if (hasAbility(runtime, attacker, "Sky Drop")) attacker.counters.drop = (attacker.counters.drop || 0) + 1;
    if (hasAbility(runtime, attacker, "Snowbound")) {
      attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1;
      if (attacker.counters.snowbound % 2 === 0) attacker.status.stunned = Math.max(1, attacker.status.stunned);
    }
    if (hasAbility(runtime, attacker, "Defensive Maneuver")) {
      attacker.counters.defensiveManeuver = (attacker.counters.defensiveManeuver || 0) + 1;
      if (attacker.counters.defensiveManeuver % 2 === 0) attacker.status.shield += 1;
    }
  }
  function beforeAttack(runtime, attacker) {
    const target = active(runtime, OTHER_TEAM[attacker.team]);
    if (target && hasAbility(runtime, attacker, "Blood Bath")) {
      const stolen = Math.max(0, target.hp * 0.25);
      target.hp -= stolen;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + stolen);
    }
    if (hasAbility(runtime, attacker, "Lazy")) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.damage * 2);
      attacker.damage *= 0.9;
    }
    if (target && hasAbility(runtime, attacker, "Forbidden Banquet")) stealStats(target, attacker, 0.15);
    if (hasAbility(runtime, attacker, "Rejuvenate")) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35);
    if (hasAbility(runtime, attacker, "First Progenitor")) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1);
    if (hasAbility(runtime, attacker, "Twilight Sparkle") && rand(runtime, attacker.team) > 0.6) attacker.hp = attacker.maxHp;
    if (target && hasAbility(runtime, attacker, "Viral Breath")) target.hp -= target.maxHp * 0.25;
    if (hasAbility(runtime, attacker, "Herbal Alchemy")) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2);
      if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3;
    }
    if (hasAbility(runtime, attacker, "Combatant")) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1);
  }
  function attackCount(runtime, attacker) {
    const bonus = attacker.counters.attacks || 0;
    let base = 1;
    if (hasAbility(runtime, attacker, "Rapid Blows")) base = Math.max(base, 3);
    if (hasAbility(runtime, attacker, "Chainsaw")) base = Math.max(base, 8);
    if (hasAbility(runtime, attacker, "Firepower")) base = Math.max(base, 5);
    if (hasAbility(runtime, attacker, "Behavioral Therapy")) base = Math.max(base, 2);
    return { count: base + bonus, mult: 1 };
  }
  function canNormalAttack(runtime, attacker) {
    if (hasAbility(runtime, attacker, "Dagger Storm") || hasAbility(runtime, attacker, "Naughty or Nice?") || hasAbility(runtime, attacker, "Meow") || hasAbility(runtime, attacker, "Never Forgotten") || hasAbility(runtime, attacker, "Origin") || hasAbility(runtime, attacker, "Laser Gun") || hasAbility(runtime, attacker, "Lotus Sutra")) return false;
    if (hasAbility(runtime, attacker, "Sky Drop")) return Boolean(attacker.counters.drop && attacker.counters.drop % 2 === 0);
    return true;
  }
  function doLotusSutra(runtime, attacker) {
    const fallen = runtime.state.fallen[attacker.team];
    const deadAlly = attacker.flags.lotusReviveUsed ? void 0 : [...fallen].reverse().find((card) => card !== attacker);
    if (deadAlly) {
      attacker.flags.lotusReviveUsed = true;
      const index = fallen.indexOf(deadAlly);
      if (index >= 0) fallen.splice(index, 1);
      deadAlly.dead = false;
      deadAlly.hp = deadAlly.maxHp * 0.5;
      deadAlly.entered = false;
      runtime.state.teams[attacker.team].push(deadAlly);
      return;
    }
    const allies = runtime.state.teams[attacker.team].filter((card) => card !== attacker && alive(card));
    const target = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!target) return;
    target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5);
    if (target.hp >= target.maxHp) {
      const deck = runtime.state.teams[attacker.team];
      const index = deck.indexOf(attacker);
      if (index >= 0 && deck.length > 1) {
        deck.splice(index, 1);
        deck.push(attacker);
      }
    }
  }
  function doOrigin(runtime, attacker) {
    const enemyTeam = OTHER_TEAM[attacker.team];
    for (let hit = 0; hit < 4; hit++) {
      const deck = runtime.state.teams[enemyTeam].filter(alive);
      if (!deck.length || !alive(attacker)) break;
      const target = deck[Math.floor(runtime.rng.next() * deck.length)];
      dealDamage(runtime, attacker, target, 0.5);
      resolveDeaths(runtime);
    }
  }
  function doLaserGun(runtime, attacker) {
    if (!attacker.flags.laserCharged) {
      attacker.flags.laserCharged = true;
      return;
    }
    attacker.flags.laserCharged = false;
    const enemyTeam = OTHER_TEAM[attacker.team];
    const targets = Math.min(3, (runtime.state.boosts[attacker.team].fossils || 0) + 1);
    for (const target of runtime.state.teams[enemyTeam].slice(0, targets)) {
      if (!alive(attacker) || !alive(target)) continue;
      dealDamage(runtime, attacker, target, 0.75);
    }
    resolveDeaths(runtime);
  }
  function applyCollateralAfterHit(runtime, attacker, target, dealt) {
    if (dealt <= 0) return;
    const enemyTeam = OTHER_TEAM[attacker.team];
    if (hasAbility(runtime, attacker, "Railgun")) {
      const splash = Math.ceil(dealt * 0.3);
      for (const enemy of runtime.state.teams[enemyTeam]) {
        if (enemy.hp > 0) enemy.hp -= Math.min(enemy.hp, splash);
      }
    }
    if (hasAbility(runtime, attacker, "Outshine")) {
      const deck = runtime.state.teams[enemyTeam];
      const index = deck.indexOf(target);
      const next = index >= 0 ? deck[index + 1] : deck[1];
      if (next && next.hp > 0) {
        const before = next.hp;
        next.hp -= Math.min(next.hp, dealt);
        if (before > 0 && next.hp <= 0) next.flags.suppressOnDeath = true;
      }
    }
  }
  function processTeamTurnAbilities(runtime, movedTeam, movedCard) {
    const defendingTeam = OTHER_TEAM[movedTeam];
    const dispel = active(runtime, defendingTeam);
    if (dispel && alive(dispel) && hasAbility(runtime, dispel, "Dispel") && alive(movedCard)) {
      const drained = movedCard.damage * 0.2;
      movedCard.damage = Math.max(0, movedCard.damage - drained);
      dispel.hp = Math.min(dispel.maxHp, dispel.hp + drained);
    }
    for (const healer of runtime.state.teams[movedTeam]) {
      if (!alive(healer) || !hasAbility(runtime, healer, "Healing Miracle") || healer === movedCard) continue;
      healer.counters.healingMiracle = (healer.counters.healingMiracle || 0) + 1;
      if (healer.counters.healingMiracle >= 3) {
        healer.counters.healingMiracle = 0;
        healer.hp = Math.min(healer.maxHp, healer.hp + healer.maxHp);
      }
    }
  }
  function doDaggerStorm(runtime, attacker) {
    const enemyTeam = OTHER_TEAM[attacker.team];
    for (const mult of [0.5, 1, 2]) {
      const target = active(runtime, enemyTeam);
      if (!target || !alive(attacker)) break;
      dealDamage(runtime, attacker, target, mult);
      resolveDeaths(runtime);
    }
  }
  function doNaughtyOrNice(runtime, attacker) {
    const target = active(runtime, OTHER_TEAM[attacker.team]);
    if (!target || !alive(attacker)) return;
    if (rand(runtime, attacker.team) < 0.8) {
      dealDamage(runtime, attacker, target, 4);
      resolveDeaths(runtime);
    } else {
      target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5);
    }
  }
  function doTurn(runtime, attacker) {
    const enemyTeam = OTHER_TEAM[attacker.team];
    let target = active(runtime, enemyTeam);
    if (!target || !alive(attacker)) return;
    prepareTurn(runtime, attacker);
    resolveDeaths(runtime);
    if (!alive(attacker)) return;
    target = active(runtime, enemyTeam);
    if (!target) return;
    statusStart(runtime, attacker, target);
    resolveDeaths(runtime);
    if (!alive(attacker)) return;
    target = active(runtime, enemyTeam);
    if (!target) return;
    beforeAttack(runtime, attacker);
    if (hasAbility(runtime, attacker, "Lotus Sutra")) doLotusSutra(runtime, attacker);
    else if (hasAbility(runtime, attacker, "Origin")) doOrigin(runtime, attacker);
    else if (hasAbility(runtime, attacker, "Laser Gun")) doLaserGun(runtime, attacker);
    else if (hasAbility(runtime, attacker, "Dagger Storm")) doDaggerStorm(runtime, attacker);
    else if (hasAbility(runtime, attacker, "Naughty or Nice?")) doNaughtyOrNice(runtime, attacker);
    if (hasAbility(runtime, attacker, "Chaos Destruction") && rand(runtime, attacker.team) > 0.5) {
      const deck = runtime.state.teams[enemyTeam];
      if (deck.length > 1) {
        const swapIndex = 1 + Math.floor(runtime.rng.next() * (deck.length - 1));
        [deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]];
        target = deck[0];
        onEntry(runtime, target);
        resolveDeaths(runtime);
      }
      attacker.flags.chaosTriple = true;
    }
    if (canNormalAttack(runtime, attacker)) {
      const { count } = attackCount(runtime, attacker);
      for (let i = 0; i < count; i++) {
        target = active(runtime, enemyTeam);
        if (!target || !alive(attacker)) break;
        const dealt = dealDamage(runtime, attacker, target);
        applyCollateralAfterHit(runtime, attacker, target, dealt);
        resolveDeaths(runtime);
        let insatiableChainCount = 0;
        while (attacker.flags.insatiableAttack && alive(attacker) && active(runtime, enemyTeam)) {
          if (++insatiableChainCount > 64) {
            attacker.flags.insatiableAttack = false;
            if (runtime.captureDebug) pushDebugEvent(runtime, {
              turn: runtime.state.turn,
              type: "stall",
              team: attacker.team,
              card: effectiveCardName(attacker) || attacker.definition.name,
              detail: "Insatiable same-turn chain stopped at safety limit",
              hp: attacker.hp,
              maxHp: attacker.maxHp,
              damage: attacker.damage
            });
            break;
          }
          attacker.flags.insatiableAttack = false;
          dealDamage(runtime, attacker, active(runtime, enemyTeam));
          resolveDeaths(runtime);
        }
        if (hasAbility(runtime, attacker, "Black Flash") && alive(attacker) && target.hp > 0) {
          dealDamage(runtime, attacker, target, 0.5, true);
        }
        resolveDeaths(runtime);
      }
    }
    const creepTarget = active(runtime, enemyTeam);
    if (creepTarget && alive(attacker)) {
      for (const creep of runtime.state.teams[attacker.team].slice(1)) {
        if (hasAbility(runtime, creep, "Creep") && alive(creep) && active(runtime, enemyTeam)) {
          dealDamage(runtime, creep, active(runtime, enemyTeam), 0.25);
          resolveDeaths(runtime);
        }
      }
    }
    const currentTarget = active(runtime, enemyTeam);
    if (currentTarget && alive(currentTarget) && alive(attacker)) {
      const berserker = runtime.state.boosts[currentTarget.team].berserker;
      const shouldCounter = berserker && runtime.rng.next() * 100 < berserker || hasAbility(runtime, currentTarget, "Hatred") || hasAbility(runtime, currentTarget, "Perseverance") || hasAbility(runtime, currentTarget, "Spikes") || hasAbility(runtime, currentTarget, "Blood Drinker") || hasAbility(runtime, currentTarget, "Stolen Spotlight") || hasAbility(runtime, currentTarget, "Poke the Beast") || hasAbility(runtime, currentTarget, "Absolute Apex") && (runtime.state.boosts[currentTarget.team].fossils || 0) > 2;
      if (shouldCounter) dealDamage(runtime, currentTarget, attacker, hasAbility(runtime, currentTarget, "Perseverance") ? 0.1 : 1);
    }
    if (hasAbility(runtime, attacker, "Martial Will") && alive(attacker)) attacker.damage *= 1.3;
    if (hasAbility(runtime, attacker, "Eternal Voyage") && alive(attacker)) {
      const deck = runtime.state.teams[attacker.team];
      const selfIndex = deck.indexOf(attacker);
      const choices = deck.map((_, index) => index).filter((index) => index !== selfIndex);
      if (selfIndex >= 0 && choices.length) {
        const swapIndex = choices[Math.floor(runtime.rng.next() * choices.length)];
        [deck[selfIndex], deck[swapIndex]] = [deck[swapIndex], deck[selfIndex]];
      }
    }
    if (attacker.flags.diesAfterAttack && alive(attacker)) attacker.hp = 0;
    statusEnd(runtime, attacker);
    processTeamTurnAbilities(runtime, attacker.team, attacker);
    resolveDeaths(runtime);
    const lock = runtime.state.boosts[attacker.team].noAbilities || 0;
    if (lock > 0) runtime.state.boosts[attacker.team].noAbilities = lock > 1 ? lock - 1 : void 0;
  }
  function processDivination(runtime) {
    const allCards = [
      ...runtime.state.teams.Allies,
      ...runtime.state.fallen.Allies,
      ...runtime.state.teams.Enemies,
      ...runtime.state.fallen.Enemies
    ];
    for (const card of allCards) {
      if (!hasAbility(runtime, card, "Divination") || card.flags.divinationFired) continue;
      const moves = card.counters.divinationMoves || 0;
      if (moves <= 0) continue;
      card.counters.divinationMoves = moves - 1;
      if (card.counters.divinationMoves <= 0) {
        card.flags.divinationFired = true;
        const target = active(runtime, OTHER_TEAM[card.team]);
        if (target) {
          dealDamage(runtime, card, target, 3, true);
          resolveDeaths(runtime);
        }
      }
    }
  }
  function growHiddenInDepths(runtime, moving) {
    if (moving !== "Allies") return;
    const deck = runtime.state.teams.Allies;
    for (let index = 1; index < deck.length; index++) {
      const card = deck[index];
      if (hasAbility(runtime, card, "Hidden in the Depths")) {
        card.damage *= 1.1;
        card.maxHp *= 1.1;
        card.hp *= 1.1;
      }
    }
  }
  function scheduleExtraTurns(runtime, attacker) {
    let extra = attacker.flags.extraTurn;
    attacker.flags.extraTurn = false;
    if (!attacker.flags.onBonusTurn) {
      let count = 0;
      if (hasAbility(runtime, attacker, "Berserk") && attacker.hp / attacker.maxHp < 0.5) count += 1;
      if (hasAbility(runtime, attacker, "Melancholy") && attacker.hp / attacker.maxHp > 0.5) count += 2;
      if (hasAbility(runtime, attacker, "Haste")) count += 1;
      if (hasAbility(runtime, attacker, "First Progenitor")) count += 1;
      if (hasAbility(runtime, attacker, "The World")) {
        if (attacker.flags.worldCooldown) attacker.flags.worldCooldown = false;
        else {
          count += 2;
          attacker.flags.worldCooldown = true;
        }
      }
      if (hasAbility(runtime, attacker, "Accelerate")) {
        attacker.counters.turnsPerTurn = (attacker.counters.turnsPerTurn || 0) + 1;
        count += attacker.counters.turnsPerTurn;
      }
      if (count > 0) attacker.counters.extraTurns = count;
    }
    if ((attacker.counters.extraTurns || 0) > 0) {
      attacker.counters.extraTurns -= 1;
      attacker.flags.onBonusTurn = true;
      extra = true;
    } else attacker.flags.onBonusTurn = false;
    return extra;
  }
  function simulateBattleV2(loadout, enemies, seed = 1, maxTurns = 2e3, markTurnCap = false, captureDebug = false, onProgress) {
    const state = createBattleStateV2(loadout, enemies);
    const debug = {
      initialAllies: [],
      initialEnemies: [],
      finalAllies: [],
      finalEnemies: [],
      events: [],
      forcedStallResolutions: 0,
      statAura: loadout.statAura ? { name: loadout.statAura.auraName, border: loadout.statAura.border || null, value: state.boosts.Allies.statAuraValue } : void 0,
      abilityAura: loadout.abilityAura ? { name: loadout.abilityAura.auraName, border: loadout.abilityAura.border || null, value: state.boosts.Allies.skillAuraValue } : void 0
    };
    const runtime = { state, rng: new SeededRng(seed), debug, captureDebug, deathEpoch: 0 };
    resolveConstellarArts(runtime);
    if (captureDebug) {
      debug.initialAllies = state.teams.Allies.map(debugCard);
      debug.initialEnemies = state.teams.Enemies.map(debugCard);
    }
    let turnsWithoutDeaths = 0;
    let lastDeathEpoch = runtime.deathEpoch;
    let turnLimitReached = false;
    while (state.teams.Allies.length && state.teams.Enemies.length && state.turn < maxTurns) {
      state.turn += 1;
      if (state.turn % 5 === 0) onProgress?.(state.turn);
      tickGlobalUnholyCreature(runtime);
      resolveDeaths(runtime);
      let attacker = active(runtime, state.moving);
      let defender = active(runtime, OTHER_TEAM[state.moving]);
      if (!attacker || !defender) break;
      onEntry(runtime, attacker);
      defender = active(runtime, OTHER_TEAM[state.moving]);
      if (defender) onEntry(runtime, defender);
      resolveDeaths(runtime);
      attacker = active(runtime, state.moving);
      defender = active(runtime, OTHER_TEAM[state.moving]);
      if (!attacker || !defender) break;
      if (runtime.deathEpoch !== lastDeathEpoch) {
        turnsWithoutDeaths = 0;
        lastDeathEpoch = runtime.deathEpoch;
      }
      turnsWithoutDeaths += 1;
      if (turnsWithoutDeaths >= 150) {
        debug.forcedStallResolutions += 1;
        if (runtime.captureDebug) pushDebugEvent(runtime, {
          turn: state.turn,
          type: "stall",
          team: state.moving,
          card: effectiveCardName(attacker) || attacker.definition.name,
          detail: `Expansion 150-turn no-progress resolution vs ${effectiveCardName(defender) || defender.definition.name}: both active cards defeated`,
          hp: attacker.hp,
          maxHp: attacker.maxHp,
          damage: attacker.damage
        });
        attacker.hp = 0;
        defender.hp = 0;
        resolveDeaths(runtime);
        continue;
      }
      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: state.turn,
        type: "turn",
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: `vs ${effectiveCardName(defender) || defender.definition.name} | attacker ${Math.ceil(attacker.hp)}/${Math.ceil(attacker.maxHp)} HP ${Math.ceil(attacker.damage)} ATK | defender ${Math.ceil(defender.hp)}/${Math.ceil(defender.maxHp)} HP ${Math.ceil(defender.damage)} ATK`,
        hp: attacker.hp,
        maxHp: attacker.maxHp,
        damage: attacker.damage
      });
      doTurn(runtime, attacker);
      processDivination(runtime);
      growHiddenInDepths(runtime, state.moving);
      resolveDeaths(runtime);
      if (!state.teams.Allies.length || !state.teams.Enemies.length) break;
      const stillActive = active(runtime, state.moving);
      const extra = stillActive === attacker && alive(attacker) ? scheduleExtraTurns(runtime, attacker) : false;
      if (!extra) {
        const nextTeam = OTHER_TEAM[state.moving];
        const next = active(runtime, nextTeam);
        if (next && statusProtected(runtime, nextTeam)) clearStatuses(next);
        if (next && next.status.stunned > 0) {
          next.status.stunned -= 1;
        } else if (next && next.flags.slowed) {
          next.counters.slowed = (next.counters.slowed || 0) + 1;
          if ((next.counters.slowTurns || 0) > 0) {
            next.counters.slowTurns -= 1;
            if (next.counters.slowTurns <= 0) next.flags.slowed = false;
          }
          if (next.counters.slowed % 2 === 0) state.moving = nextTeam;
        } else {
          state.moving = nextTeam;
        }
      }
    }
    if (markTurnCap && state.turn >= maxTurns && state.teams.Allies.length && state.teams.Enemies.length) {
      state.unsupportedAbilities.add("Battle turn cap reached");
    }
    const winner = state.teams.Allies.length ? state.teams.Enemies.length ? "Draw" : "Allies" : state.teams.Enemies.length ? "Enemies" : "Draw";
    const unsupportedAbilities = [...state.unsupportedAbilities].sort();
    if (captureDebug) {
      debug.finalAllies = state.teams.Allies.map(debugCard);
      debug.finalEnemies = state.teams.Enemies.map(debugCard);
    }
    return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, turnLimitReached, debug: captureDebug ? debug : void 0 };
  }

  // src/engine/tower.ts
  var DIFFICULTY_ID = {
    Normal: 1,
    Hard: 2,
    Extreme: 3,
    Hell: 5,
    Impossible: 6
  };
  var CARD_BY_NAME2 = new Map(cards_default.map((card) => [card.name, card]));
  function towerStagePower(floor, difficulty) {
    const stage = Math.max(1, Math.floor(floor));
    const stageValue = 6e3 + Math.pow(stage, 3) * 50;
    const difficultyId = DIFFICULTY_ID[difficulty];
    return Math.ceil(2 * Math.sqrt(stageValue / 2) * Math.pow(4, difficultyId - 1));
  }
  function buildTowerEnemies(enemyNames, floor, difficulty) {
    if (enemyNames.length !== 4) throw new Error("Tower battles require exactly four enemies.");
    const power = towerStagePower(floor, difficulty);
    return enemyNames.map((name) => {
      const card = CARD_BY_NAME2.get(name);
      if (!card) throw new Error(`Unknown Tower enemy: ${name}`);
      const preserveHpMultiplier = difficulty === "Normal" || difficulty === "Impossible";
      const health = Math.ceil(power * (preserveHpMultiplier ? card.hpMultiplier || 1 : 1));
      return {
        card,
        power,
        attack: Math.ceil(power / 2),
        health
      };
    });
  }
  function simulateTowerBatch(loadout, enemyNames, floor, difficulty, runs = 1e3, seed = 1, onProgress) {
    const total = Math.min(1e4, Math.max(1, Math.floor(runs)));
    const enemies = buildTowerEnemies(enemyNames, floor, difficulty);
    const seedRng = new SeededRng(seed || 1);
    const unsupported = /* @__PURE__ */ new Set();
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalTurns = 0;
    let minTurns = Number.POSITIVE_INFINITY;
    let maxTurns = 0;
    for (let index = 0; index < total; index++) {
      const battleSeed = Math.floor(seedRng.next() * 2147483647) || index + 1;
      const battle = simulateBattleV2(loadout, enemies, battleSeed, 2e3, true, false);
      if (battle.winner === "Allies") wins += 1;
      else if (battle.winner === "Enemies") losses += 1;
      else draws += 1;
      totalTurns += battle.turns;
      minTurns = Math.min(minTurns, battle.turns);
      maxTurns = Math.max(maxTurns, battle.turns);
      for (const ability2 of battle.unsupportedAbilities) unsupported.add(ability2);
      if ((index + 1) % 25 === 0 || index + 1 === total) onProgress?.(index + 1, total);
    }
    return {
      runs: total,
      wins,
      losses,
      draws,
      winRate: wins / total,
      averageTurns: totalTurns / total,
      minTurns: Number.isFinite(minTurns) ? minTurns : 0,
      maxTurns,
      trusted: unsupported.size === 0,
      unsupportedAbilities: [...unsupported].sort()
    };
  }

  // src/tower-worker.ts
  self.onmessage = (event) => {
    const request = event.data;
    const started = performance.now();
    try {
      const result = simulateTowerBatch(
        request.loadout,
        request.enemyNames,
        request.floor,
        request.difficulty,
        request.runs,
        request.seed,
        (completed, total) => {
          self.postMessage({ kind: "tower-progress", id: request.id, completed, total });
        }
      );
      self.postMessage({
        id: request.id,
        kind: "tower-result",
        ok: true,
        elapsedMs: performance.now() - started,
        result
      });
    } catch (error) {
      self.postMessage({
        id: request.id,
        kind: "tower-result",
        ok: false,
        elapsedMs: performance.now() - started,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
})();
